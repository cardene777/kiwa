/**
 * Issue #237 PoC test — 4 機能を end-to-end で連続実行する。
 *
 * 検証順序:
 *   1. extension load    (resolveExtensionId が ID を返した時点で PASS)
 *   2. seed onboarding   (home screen 到達で PASS)
 *   3. anvil network 追加 (network display に Anvil Local 表示で PASS)
 *   4. connect flow      (dApp の status 表示が "connected" で PASS)
 *
 * 5 回連続 PASS で安定性 verify (`pnpm exec playwright test --repeat-each=5`)。
 */

import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import {
  addAnvilNetwork,
  ANVIL_NETWORK_NAME,
  connectDappWithMetamask,
  startMetamaskFixture,
} from './metamask-fixture-poc.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DAPP_PAGE_URL = `file://${join(__dirname, 'dapp-page.html')}`

test('Metamask extension PoC — 4 機能 end-to-end', async () => {
  const fixture = await startMetamaskFixture()

  try {
    // step 1 — extension load (resolveExtensionId 成功時点で PASS)
    expect(fixture.extensionId).toMatch(/^[a-z]{32}$/)

    // step 2 — seed onboarding (home screen 到達 verify)
    await fixture.metamaskPage.waitForURL((url) => url.toString().includes('home.html'), {
      timeout: 30_000,
    })
    // home page render を待つ (account-menu-icon は header-navbar の中で遅延 render される)
    await sleep(3_000)
    await expect(fixture.metamaskPage.getByTestId('account-menu-icon')).toBeVisible({
      timeout: 15_000,
    })

    // step 3 — anvil network 追加
    await addAnvilNetwork(fixture.metamaskPage, fixture.anvilRpcUrl)
    await expect(fixture.metamaskPage.getByTestId('network-display')).toContainText(
      ANVIL_NETWORK_NAME,
      { timeout: 15_000 },
    )

    // step 4 — connect flow
    const dappPage = await fixture.context.newPage()
    await dappPage.goto(DAPP_PAGE_URL)
    await connectDappWithMetamask(dappPage, fixture.metamaskPage, {
      connectButtonSelector: '#connect',
    })
    await expect(dappPage.locator('#status')).toHaveText('connected', { timeout: 15_000 })
  } finally {
    await sleep(500)
    await fixture.cleanup()
  }
})
