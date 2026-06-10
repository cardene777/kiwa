import { test, expect } from '@playwright/test';

/**
 * 7 tests covering the Level B scope from docs/MOCK-DESIGN.md:
 *
 *   T-WC-001 URI generation
 *   T-WC-002 pair
 *   T-WC-003 approve
 *   T-WC-004 personal_sign
 *   T-WC-005 eth_sendTransaction
 *   T-WC-006 disconnect
 *   T-WC-007 timeout
 *
 * The tests drive the UI rather than calling the mock client directly so the
 * spec also exercises the integration path a real dApp would use.
 */

test.describe('WalletConnect v2 (Level B mock)', () => {
  test('T-WC-001 generates a wc: URI with topic + symKey when the user clicks Connect', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('status')).toHaveText('disconnected');
    await page.getByTestId('connect-button').click();

    const uri = await page.getByTestId('uri').textContent({ timeout: 5_000 });
    expect(uri).toMatch(/^wc:pairing-[0-9a-f]+@2\?relay-protocol=irn&symKey=symkey-[0-9a-f]+$/);
  });

  test('T-WC-002 hands the URI to the wallet side and reaches the pairing state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('connect-button').click();

    // The status transitions disconnected -> pairing -> connected as the
    // wallet-side mock receives the proposal and auto-approves.
    await expect(page.getByTestId('status')).toHaveText('connected', { timeout: 5_000 });
  });

  test('T-WC-003 approves the proposal and exposes the session topic / account / chainId', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('connect-button').click();
    await expect(page.getByTestId('status')).toHaveText('connected', { timeout: 5_000 });

    await expect(page.getByTestId('session-topic')).toContainText('topic: session-');
    await expect(page.getByTestId('session-account')).toContainText('account: eip155:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    await expect(page.getByTestId('session-chain')).toContainText('chainId: 31337');
  });

  test('T-WC-004 routes personal_sign through the active session', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('connect-button').click();
    await expect(page.getByTestId('status')).toHaveText('connected', { timeout: 5_000 });

    await page.getByTestId('sign-button').click();
    const sig = await page.getByTestId('signature').textContent({ timeout: 5_000 });
    expect(sig).toMatch(/^0xmocksig-[0-9a-f]+$/);
  });

  test('T-WC-005 routes eth_sendTransaction through the active session', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('connect-button').click();
    await expect(page.getByTestId('status')).toHaveText('connected', { timeout: 5_000 });

    await page.getByTestId('send-tx-button').click();
    const hash = await page.getByTestId('tx-hash').textContent({ timeout: 5_000 });
    expect(hash).toMatch(/^0xmocktx-[0-9a-f]{8}$/);
  });

  test('T-WC-006 disconnect tears down the session and resets the UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('connect-button').click();
    await expect(page.getByTestId('status')).toHaveText('connected', { timeout: 5_000 });

    await page.getByTestId('disconnect-button').click();
    await expect(page.getByTestId('status')).toHaveText('disconnected');
    await expect(page.getByTestId('session-topic')).toHaveCount(0);
    await expect(page.getByTestId('uri')).toHaveCount(0);
  });

  test('T-WC-007 surfaces PROPOSAL_EXPIRED when the wallet side never approves', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('timeout-button').click();

    // Pairing UI is shown immediately, then the approval promise rejects after
    // approvalTimeoutMs has elapsed (500ms in the page component).
    await expect(page.getByTestId('uri')).toBeVisible({ timeout: 1_000 });
    await expect(page.getByTestId('error-message')).toHaveText('PROPOSAL_EXPIRED', { timeout: 5_000 });
  });
});
