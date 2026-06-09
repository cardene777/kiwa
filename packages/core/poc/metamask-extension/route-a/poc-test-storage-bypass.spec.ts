import '../_headless-guard.js'

import { expect, test } from '@playwright/test'

import { startMetamaskStorageBypassFixture } from './metamask-fixture-storage-bypass.js'

test('Route A - MetaMask onboarding bypass via chrome.storage write', async () => {
  const fixture = await startMetamaskStorageBypassFixture()

  try {
    // 機能 1: extension load (resolveExtensionId 成功時点で PASS)
    expect(fixture.extensionId).toMatch(/^[a-z]{32}$/)

    // 機能 2: home 到達 (onboarding を bypass して home.html に直接)
    expect(fixture.homeReached).toBeTruthy()
    expect(fixture.metamaskPage.url()).toMatch(/home\.html/)
    expect(fixture.metamaskPage.url()).not.toMatch(/onboarding/)
  } finally {
    await fixture.cleanup()
  }
})
