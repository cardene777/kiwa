/**
 * Metamask extension fixture (PoC).
 *
 * 提供する 4 機能 (Issue #237 scope):
 *   1. extension load    — launchPersistentContext + --load-extension で chromium に Metamask を inject
 *   2. seed onboarding   — 12-word seed + password 設定 → import 完了
 *   3. network 追加      — Settings → Networks → Add Network → anvil chainId 切替
 *   4. connect flow      — dApp page で ConnectButton click → Metamask popup detect → Approve
 *
 * selector は MetaMask v13.34.0 の testId を基準にする (dappwright 実装を参考)。
 * 動作環境は macOS GUI chromium (`headless: false` 必須、 Playwright 制約)。
 */

import { chromium, type BrowserContext, type Page } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import { downloadMetamask } from './download-metamask.js'

export const ANVIL_TEST_SEED =
  'test test test test test test test test test test test junk'
export const POC_PASSWORD = 'KiwaPocPassword1!'
export const ANVIL_CHAIN_ID = 31337
export const ANVIL_NETWORK_NAME = 'Anvil Local'
export const ANVIL_SYMBOL = 'ETH'

export interface MetamaskFixture {
  context: BrowserContext
  extensionId: string
  metamaskPage: Page
  anvil: ChildProcess
  anvilRpcUrl: string
  cleanup: () => Promise<void>
}

function pickAnvilPort(): number {
  // 既存 anvil との衝突回避のため 28000-29000 範囲で randomize
  return 28000 + Math.floor(Math.random() * 1000)
}

/**
 * anvil を起動し、 Metamask extension を load した chromium context を返す。
 * caller は cleanup() を必ず呼ぶ (anvil 停止 + context close + tmpdir 削除)。
 */
export async function startMetamaskFixture(): Promise<MetamaskFixture> {
  const extensionPath = await downloadMetamask()
  const userDataDir = await mkdtemp(join(tmpdir(), 'kiwa-mm-poc-'))
  await writeEnglishLocalePref(userDataDir)

  const anvilPort = pickAnvilPort()
  const anvilRpcUrl = `http://127.0.0.1:${anvilPort}`
  const anvil = startAnvil(anvilPort)
  await waitForAnvilReady(anvilRpcUrl)

  const headlessNew = process.env.KIWA_POC_HEADLESS === '1'

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
      // KIWA_POC_HEADLESS=1 のとき chromium new headless — MV3 extension load + window 非表示
      // 既定 (false) は GUI headful — MetaMask の sidePanel API が headless mode で undefined になり
      // onboarding-complete-done 後の navigation dispatch が止まる事象を回避するため。
      ...(headlessNew ? ['--headless=new'] : []),
      // 英語 UI を強制 (MetaMask testId は安定だが button text は locale 依存)
      '--lang=en-US',
      // GUI 表示時は画面外に移動して開発者の邪魔を最小化
      ...(headlessNew ? [] : ['--window-position=-2400,-2400']),
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
  const metamaskPage = await openOnboarding(context, extensionId)
  await completeOnboarding(metamaskPage)

  return {
    context,
    extensionId,
    metamaskPage,
    anvil,
    anvilRpcUrl,
    cleanup: async () => {
      await context.close().catch(() => undefined)
      anvil.kill('SIGTERM')
      await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined)
    },
  }
}

/**
 * chromium の locale を英語に強制する Preferences を userDataDir に書き込む。
 * MetaMask UI は host locale を継承する (macOS 日本語環境では日本語 UI に変わり
 * text-based selector が壊れるため、 英語に固定する)。
 */
async function writeEnglishLocalePref(userDataDir: string): Promise<void> {
  const prefDir = join(userDataDir, 'Default')
  await mkdir(prefDir, { recursive: true })
  const pref = {
    intl: { accept_languages: 'en', selected_languages: 'en' },
  }
  await writeFile(join(prefDir, 'Preferences'), JSON.stringify(pref))
}

function startAnvil(port: number): ChildProcess {
  const proc = spawn(
    'anvil',
    [
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--chain-id',
      String(ANVIL_CHAIN_ID),
      '--mnemonic',
      ANVIL_TEST_SEED,
      '--silent',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  proc.on('error', (err) => console.error('[anvil] error', err))
  return proc
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
    } catch {
      // anvil 起動中、 retry
    }
    await sleep(250)
  }
  throw new Error('[metamask-poc] anvil did not respond within timeout')
}

/**
 * Metamask extension の ID は manifest hash に依存するため、 起動後に service worker URL から抽出する。
 */
async function resolveExtensionId(context: BrowserContext, timeoutMs = 10_000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const workers = context.serviceWorkers()
    for (const worker of workers) {
      const url = worker.url() // chrome-extension://<id>/background.js
      const match = url.match(/^chrome-extension:\/\/([a-z]+)\//)
      if (match) return match[1]!
    }
    await sleep(100)
  }
  throw new Error('[metamask-poc] failed to resolve extension id (no service worker detected)')
}

async function openOnboarding(context: BrowserContext, extensionId: string): Promise<Page> {
  const url = `chrome-extension://${extensionId}/home.html#onboarding/welcome`
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  return page
}

/**
 * Metamask 初回 onboarding (SRP import 経路) を完走する。
 * v13.34.0 importSRPOnboardingFlow (test/e2e/page-objects/flows/onboarding.flow.ts) と一致。
 *
 * 経路:
 *   welcome → onboarding-import-wallet → srp → password → passkey-skip → metrics → home
 */
async function completeOnboarding(page: Page): Promise<void> {
  const debug = process.env.KIWA_POC_DEBUG === '1'
  const debugDir = join(process.cwd(), 'test-results-debug')
  if (debug) {
    await mkdir(debugDir, { recursive: true }).catch(() => undefined)
  }
  const shot = async (label: string) => {
    if (!debug) return
    await page
      .screenshot({ path: join(debugDir, `debug-onboarding-${label}.png`), fullPage: true })
      .catch(() => undefined)
  }

  await shot('00-welcome')

  // welcome — import-wallet 押下
  await page.getByTestId('onboarding-import-wallet').click()

  // import 方式選択 page (v13.34.0 socialLogin enabled) — SRP 経路を選ぶ
  await page.getByTestId('onboarding-import-with-srp-button').click({ timeout: 10_000 })
  await shot('01-srp')

  // srp page — 12 word fill → confirm
  await fillSeedPhrase(page, ANVIL_TEST_SEED)
  await page.getByTestId('import-srp-confirm').click()
  await shot('02-password')

  // password page — create-password 入力 + terms agree + submit
  await page.getByTestId('create-password-new-input').fill(POC_PASSWORD)
  await page.getByTestId('create-password-confirm-input').fill(POC_PASSWORD)
  await page.getByTestId('create-password-terms').click()
  await page.getByTestId('create-password-submit').click()
  await shot('03-passkey')

  // passkey page — skip (import 経路では setup-passkey が出るため maybe-later 押下)
  await page
    .getByTestId('passkey-maybe-later-button')
    .click({ timeout: 15_000 })
    .catch(() => undefined)
  await shot('04-metametrics')

  // metametrics page — i-agree (data collection 全 skip)
  await page
    .getByTestId('metametrics-i-agree')
    .click({ timeout: 15_000 })
    .catch(() => undefined)
  await shot('05-wallet-ready')

  // onboarding complete page (Wallet is ready) — robot 表示後は Open wallet が disabled になる build。
  // dappwright 経路と同じ「manage-default-settings → back」 を 1 度通って enable に切替える。
  await openAndBackDefaultSettings(page)
  await shot('06-after-default-settings')

  await waitAndClickDone(page)
  await shot('07-after-done')

  await dismissOptionalPopups(page)
  await shot('08-after-popups')
}

/**
 * onboarding 完了画面で manage-default-settings を 1 度 open → 全 category を back で戻す。
 * dappwright と同じ pattern (v13.34.0 で「Open wallet」 が disabled の状態を解除するための副作用)。
 *
 * 経路: manage-default-settings → category-item-General → category-back-button →
 *       privacy-settings-back-button → 元の画面で done が enabled に変わる。
 */
async function openAndBackDefaultSettings(page: Page): Promise<void> {
  // metametrics 直後は manage-default-settings の render に時間がかかる。
  // visible を最大 15s 待ってから判定する。
  const manage = page.getByTestId('manage-default-settings')
  const visible = await manage.isVisible({ timeout: 15_000 }).catch(() => false)
  if (!visible) return

  await manage.click()
  await sleep(1500)

  // privacy-settings screen が表示される。すぐ back-button で戻れば
  // wallet-ready 画面 の Open wallet が enable に切替わる (副作用 toggle なし)
  await page
    .getByTestId('privacy-settings-back-button')
    .click({ timeout: 10_000 })
    .catch(() => undefined)
  await sleep(1500)
}

/**
 * onboarding-complete-done を確実に押下する。
 * v13.34.0 では done 押下後に追加の wizard (Pin extension / Solana 等) が複数枚出る可能性があり、
 * `onboarding-complete-done` testid が残っている限り click を継続して home まで進める。
 */
async function waitAndClickDone(page: Page, maxAttempts = 8): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const done = page.getByTestId('onboarding-complete-done')
    const visible = await done.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!visible) return

    // wallet-ready 画面の Open wallet button は `disabled = H && q` で render される。
    // (H=Pin-extension-wizard 表示 mode、 q=loading state)
    // Pin extension wizard は automation 環境では永続表示されるため H は false に戻らず、
    // 結果として button が disabled のままになる事象がある (kiwa Issue #237 PoC で観測)。
    //
    // 対策:
    //   1) disabled=true なら React 内部 disabled prop を強制 false にして click を試す
    //   2) click 後 home.html まで遷移待ち
    //   3) 遷移しなければ次の iteration で再試行 (max 8 回)
    const disabled = await done.isDisabled().catch(() => false)
    if (disabled) {
      await done
        .evaluate((el) => {
          (el as HTMLButtonElement).disabled = false
          el.removeAttribute('disabled')
          el.removeAttribute('aria-disabled')
        })
        .catch(() => undefined)
      await sleep(200)
    }

    await done.click({ force: true }).catch(() => undefined)

    // click 後 home (suffix なし) に遷移待ち
    const reached = await page
      .waitForURL(
        (url) => {
          const s = url.toString()
          return s.includes('home.html') && !/#onboarding/.test(s)
        },
        { timeout: 10_000 },
      )
      .then(() => true)
      .catch(() => false)
    if (reached) return

    await sleep(1500)
  }
}

async function fillSeedPhrase(page: Page, seed: string): Promise<void> {
  const words = seed.trim().split(/\s+/)
  // v13.34.0 srp page: paste 用 textarea (`srp-input-import__srp-note`) と
  // 個別 input (`import-srp__srp-word-{i}`) のどちらかが現れる。
  // paste 用が visible なら `pressSequentially` で React の onChange を確実に発火させる。
  const pasteInput = page.getByTestId('srp-input-import__srp-note')
  if (await pasteInput.isVisible().catch(() => false)) {
    await pasteInput.click()
    await pasteInput.pressSequentially(seed, { delay: 20 })
    return
  }
  for (let i = 0; i < words.length; i++) {
    const input = page.getByTestId(`import-srp__srp-word-${i}`)
    await input.click()
    await input.pressSequentially(words[i]!, { delay: 20 })
  }
}

async function dismissOptionalPopups(page: Page): Promise<void> {
  for (const testId of ['popover-close', 'not-now-button']) {
    const locator = page.getByTestId(testId)
    if (await locator.isVisible().catch(() => false)) {
      await locator.click().catch(() => undefined)
    }
  }
}

/**
 * Settings → Networks → Add Network 経路で anvil network を追加して切替える。
 */
export async function addAnvilNetwork(page: Page, rpcUrl: string): Promise<void> {
  await page.bringToFront()
  await page.goto(`${pageBaseUrl(page)}#settings/networks`, { waitUntil: 'domcontentloaded' }).catch(async () => {
    // hash route 直 jump が効かない MM version では UI 経由
    await openNetworkSettingsViaUI(page)
  })

  await page.getByRole('button', { name: 'Add a custom network' }).click()
  await page.getByTestId('network-form-network-name').fill(ANVIL_NETWORK_NAME)

  await page.getByTestId('test-add-rpc-drop-down').click()
  await page.getByRole('button', { name: 'Add RPC URL' }).click()
  await page.getByTestId('rpc-url-input-test').fill(rpcUrl)
  await page.getByRole('button', { name: 'Add URL' }).click()

  await page.getByTestId('network-form-chain-id').fill(String(ANVIL_CHAIN_ID))
  await page.getByTestId('network-form-ticker-input').fill(ANVIL_SYMBOL)

  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByTestId('modal-header-close-button').click().catch(() => undefined)

  await switchToAnvilNetwork(page)
}

function pageBaseUrl(page: Page): string {
  const url = new URL(page.url())
  return `${url.origin}${url.pathname}`
}

async function openNetworkSettingsViaUI(page: Page): Promise<void> {
  await page.getByTestId('account-options-menu-button').click()
  await page.getByTestId('global-menu-settings').click()
  await page.getByRole('link', { name: 'Networks' }).click()
}

async function switchToAnvilNetwork(page: Page): Promise<void> {
  await page.getByTestId('network-display').click().catch(async () => {
    // 別 UI 経路: header の network selector
    await page.getByRole('button', { name: /network/i }).first().click()
  })
  await page.getByText(ANVIL_NETWORK_NAME, { exact: false }).first().click()
}

/**
 * dApp page で connect button を click し、 Metamask popup を Approve する。
 */
export async function connectDappWithMetamask(
  dappPage: Page,
  metamaskPage: Page,
  opts: { connectButtonSelector?: string } = {},
): Promise<void> {
  await dappPage.bringToFront()
  const connectSelector = opts.connectButtonSelector ?? 'button:has-text("Connect")'

  const context = dappPage.context()
  const popupPromise = context.waitForEvent('page', { timeout: 10_000 })

  await dappPage.locator(connectSelector).first().click()
  const popup = await popupPromise

  await popup.waitForLoadState('domcontentloaded')
  await popup.getByTestId('page-container-footer-next').click()
  await popup.waitForEvent('close', { timeout: 10_000 }).catch(() => undefined)

  // approve permission popup (chain switch / sign 等)
  await metamaskPage.bringToFront()
}
