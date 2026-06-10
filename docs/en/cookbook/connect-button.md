# Test a connect button

> [🇬🇧 English](./connect-button.md) • [🇯🇵 日本語](../../ja/cookbook/connect-button.md)

## Goal

Click a dApp `Connect Wallet` button → wallet picker / direct connect → confirm `useAccount.address` is set, end-to-end.

## Prerequisites

- A dApp using wagmi v2 + RainbowKit v2 (or an equivalent wallet picker)
- A status element like `data-testid="connection-status"` for assertions

## Steps

### 1. Prepare the fixture helper

~~~ts
import { dappE2eTest as test, expect } from '@kiwa-test/core';
import type { Page } from '@playwright/test';

async function ensureConnected(page: Page) {
  const btn = page.getByRole('button', { name: /connect wallet/i });
  if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await btn.click();
    const injected = page.getByText(/browser wallet|injected/i).first();
    if (await injected.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await injected.click();
    }
  }
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
    timeout: 15_000,
  });
}
~~~

### 2. Use it inside a test

~~~ts
test('connection-status becomes connected after connect', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await ensureConnected(page);
  await dappE2e.waitForRpcIdle();

  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

## Verify

~~~bash
pnpm exec playwright test e2e/connect.spec.ts
~~~

Expected output.

~~~
  ✓ connection-status becomes connected after connect (3.2s)
  1 passed
~~~

## Related

- [API: dappE2eTest](../api/dapp-e2e-test.md)
- [Cookbook: User reject path](./user-reject.md)
