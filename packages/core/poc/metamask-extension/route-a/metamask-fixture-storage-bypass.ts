/**
 * Route A — chrome.storage 直書きで MetaMask onboarding を bypass する fixture。
 *
 * 重要: 必ず `_headless-guard.ts` を import すること。 chromium.launchPersistentContext を
 * monkey-patch して `--headless=new` + 画面外配置を強制 (ユーザーの画面前面化を防ぐ)。
 */

import '../_headless-guard.js'

import { chromium, type BrowserContext, type Page } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXTENSION_STORAGE_DIR = resolve(__dirname, '..', 'extension-storage')

export const ANVIL_TEST_SEED =
  'test test test test test test test test test test test junk'
export const POC_PASSWORD = 'KiwaPocPassword1!'
export const ANVIL_CHAIN_ID = 31337
export const ANVIL_NETWORK_NAME = 'Anvil Local'

export interface StorageBypassFixture {
  context: BrowserContext
  extensionId: string
  metamaskPage: Page
  anvil: ChildProcess
  anvilRpcUrl: string
  homeReached: boolean
  cleanup: () => Promise<void>
}

function pickAnvilPort(): number {
  // Route A 専用 28200-28299 範囲で randomize (他 Route と衝突回避)
  return 28200 + Math.floor(Math.random() * 100)
}

function startAnvil(port: number): ChildProcess {
  return spawn(
    'anvil',
    [
      '--host', '127.0.0.1',
      '--port', String(port),
      '--chain-id', String(ANVIL_CHAIN_ID),
      '--mnemonic', ANVIL_TEST_SEED,
      '--silent',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
}

async function waitForAnvilReady(rpcUrl: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      })
      if (res.ok) {
        const json = (await res.json()) as { result?: string }
        if (json.result) return
      }
    } catch {}
    await sleep(250)
  }
  throw new Error('[route-a] anvil did not respond within timeout')
}

async function resolveExtensionId(context: BrowserContext, timeoutMs = 10_000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const workers = context.serviceWorkers()
    for (const worker of workers) {
      const match = worker.url().match(/^chrome-extension:\/\/([a-z]+)\//)
      if (match) return match[1]!
    }
    await sleep(100)
  }
  throw new Error('[route-a] failed to resolve extension id (no service worker)')
}

/**
 * service worker context で chrome.storage.local に MetaMask の onboarding 完了 state を直書きする。
 * これにより wallet-ready 画面 / Pin extension wizard を経由せず home.html に直接到達できる。
 *
 * MetaMask の state は KeyValueStore (chrome.storage.local の `data` キー) に persistence される。
 * OnboardingController.completedOnboarding = true を最小限の state 同居で書き込む。
 */
async function writeOnboardingCompletedState(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  // service worker を取得 (background service worker = MV3 manifest_version)
  const workers = context.serviceWorkers()
  const worker = workers.find((w) => w.url().includes(extensionId))
  if (!worker) {
    throw new Error('[route-a] no service worker for extension')
  }

  // chrome.storage.local の `data` キーに OnboardingController.completedOnboarding=true を merge
  // 既存の state を読んで OnboardingController フィールドだけ上書きする (他 controller の初期 state は保つ)
  await worker.evaluate(async () => {
    // @ts-expect-error chrome is global in service worker
    const stored = await chrome.storage.local.get('data')
    const data = stored?.data ?? {}
    data.OnboardingController = {
      ...(data.OnboardingController ?? {}),
      completedOnboarding: true,
      seedPhraseBackedUp: true,
      firstTimeFlowType: 'import',
    }
    // PreferencesController に user 設定を確保
    data.PreferencesController = {
      ...(data.PreferencesController ?? {}),
      identities: {
        '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': {
          address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
          name: 'Account 1',
        },
      },
      selectedAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    }
    // AppStateController を first-run done 状態に
    data.AppStateController = {
      ...(data.AppStateController ?? {}),
      hasBeenUnlocked: true,
      showWelcomeScreen: false,
    }
    // KeyringController に最小 vault placeholder (locked 状態でも home に到達できる)
    data.KeyringController = {
      ...(data.KeyringController ?? {}),
      vault: '{"placeholder":"route-a-bypass"}',
      isUnlocked: false,
    }
    // @ts-expect-error chrome is global in service worker
    await chrome.storage.local.set({ data })
  })
}

async function navigateToHome(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage()
  // home.html (onboarding suffix なし) に直接 navigate
  await page.goto(`chrome-extension://${extensionId}/home.html`, {
    waitUntil: 'domcontentloaded',
  })
  return page
}

export async function startMetamaskStorageBypassFixture(): Promise<StorageBypassFixture> {
  const userDataDir = await mkdtemp(join(tmpdir(), 'kiwa-mm-route-a-'))

  // chromium locale を英語に固定 (MetaMask UI が host locale を継承するため)
  const prefDir = join(userDataDir, 'Default')
  await mkdir(prefDir, { recursive: true })
  await writeFile(
    join(prefDir, 'Preferences'),
    JSON.stringify({ intl: { accept_languages: 'en', selected_languages: 'en' } }),
  )

  const anvilPort = pickAnvilPort()
  const anvilRpcUrl = `http://127.0.0.1:${anvilPort}`
  const anvil = startAnvil(anvilPort)
  await waitForAnvilReady(anvilRpcUrl)

  // _headless-guard.ts が monkey-patch して --headless=new + 画面外配置を強制する
  const context = await chromium.launchPersistentContext(userDataDir, {
    args: [
      `--disable-extensions-except=${EXTENSION_STORAGE_DIR}`,
      `--load-extension=${EXTENSION_STORAGE_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=en-US',
    ],
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    env: {
      ...process.env,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
    },
  })

  const extensionId = await resolveExtensionId(context)
  await writeOnboardingCompletedState(context, extensionId)

  const metamaskPage = await navigateToHome(context, extensionId)

  // home 到達確認: account-menu-icon が visible になるまで待つ
  let homeReached = false
  try {
    await metamaskPage.waitForURL(
      (url) => url.toString().includes('home.html') && !url.toString().includes('onboarding'),
      { timeout: 15_000 },
    )
    homeReached = true
  } catch {
    // navigation 失敗 → onboarding に飛ばされた可能性
    homeReached = false
  }

  return {
    context,
    extensionId,
    metamaskPage,
    anvil,
    anvilRpcUrl,
    homeReached,
    cleanup: async () => {
      await context.close().catch(() => undefined)
      anvil.kill('SIGTERM')
      await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined)
    },
  }
}
