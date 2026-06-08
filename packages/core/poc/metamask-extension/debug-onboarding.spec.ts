/**
 * v13.34.0 onboarding flow の実 selector を探索する debug spec。
 * 各 step で screenshot + data-testid 一覧を保存する。
 */

import { test } from '@playwright/test'
import { chromium } from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

import { downloadMetamask } from './download-metamask.js'

test('debug — capture onboarding screens', async () => {
  const extensionPath = await downloadMetamask()
  const userDataDir = await mkdtemp(join(tmpdir(), 'kiwa-mm-debug-'))

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-position=10000,10000',
      '--window-size=1280,800',
    ],
    viewport: { width: 1280, height: 800 },
  })

  // wait for extension service worker → resolve id
  let extensionId = ''
  for (let i = 0; i < 50; i++) {
    const workers = context.serviceWorkers()
    for (const w of workers) {
      const match = w.url().match(/^chrome-extension:\/\/([a-z]+)\//)
      if (match) {
        extensionId = match[1]!
        break
      }
    }
    if (extensionId) break
    await sleep(200)
  }
  if (!extensionId) throw new Error('extension id not resolved')

  // onboarding を直接 open
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/home.html#onboarding/welcome`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await sleep(2000)

  await page.screenshot({ path: 'test-results/debug-01-welcome.png', fullPage: true })

  // import-wallet click → srp page を待って dump
  await page.getByTestId('onboarding-import-wallet').click()
  await sleep(2000)
  await page.screenshot({ path: 'test-results/debug-02-srp.png', fullPage: true })

  const srpLocs = await page.locator('[data-testid], input, textarea').all()
  const srpDump: Array<{ testId: string | null; tag: string; type: string | null }> = []
  for (const loc of srpLocs.slice(0, 60)) {
    const testId = await loc.getAttribute('data-testid').catch(() => null)
    const tag = (await loc.evaluate((el) => el.tagName).catch(() => 'unknown')) as string
    const type = await loc.getAttribute('type').catch(() => null)
    srpDump.push({ testId, tag, type })
  }
  writeFileSync('test-results/debug-02-srp-elements.json', JSON.stringify(srpDump, null, 2))

  // dump all testIds via locator.all (LavaMoat scuttling は evaluate を block するため)
  const locators = await page.locator('[data-testid]').all()
  const dump: Array<{ testId: string | null; text: string }> = []
  for (const loc of locators.slice(0, 80)) {
    const testId = await loc.getAttribute('data-testid').catch(() => null)
    const text = (await loc.textContent().catch(() => null))?.slice(0, 80) ?? ''
    dump.push({ testId, text })
  }
  writeFileSync('test-results/debug-01-testids.json', JSON.stringify(dump, null, 2))

  // 画面 URL も記録
  writeFileSync('test-results/debug-01-url.txt', page.url())

  await context.close()
})
