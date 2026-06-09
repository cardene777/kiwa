# Connect ボタンを test する

## Goal

dApp の `Connect Wallet` ボタンを押下 → wallet picker / 直接接続 → `useAccount` の `address` が確定するまでを E2E で検証する。

## Prerequisites

- wagmi v2 + RainbowKit v2 (または同等の wallet picker) を採用した dApp
- `data-testid="connection-status"` のような確認 element が用意されている

## Steps

### 1. fixture の準備

~~~ts
import { dappE2eTest as test, expect } from '@kiwa/core';
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

### 2. test 内で呼ぶ

~~~ts
test('connect 後 connection-status が connected', async ({ page, dappE2e }) => {
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

期待する出力。

~~~
  ✓ connect 後 connection-status が connected (3.2s)
  1 passed
~~~

## Related

- [API: dappE2eTest](../api/dapp-e2e-test.md)
- [Cookbook: User Reject 経路](./user-reject.md)
