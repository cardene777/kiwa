# User reject 経路を test する

## Goal

`personal_sign` / `eth_sendTransaction` を user が拒否した場合 (EIP-1193 code 4001) の UX を test する。

## Steps

### 1. setApprovalMode で reject に切替

~~~ts
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('signMessage を reject すると error message が表示', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  await dappE2e.setApprovalMode('reject');

  await page.getByRole('button', { name: /sign/i }).click();

  await expect(page.getByTestId('error')).toContainText(/user rejected|4001/i);
});
~~~

### 2. test 終了前に approval mode を戻す

~~~ts
  await dappE2e.setApprovalMode('auto'); // 後続 test に reject 状態が引きずらないよう
~~~

## Verify

- `code 4001` を含む error object が dApp 側で catch される
- UI が `User rejected` メッセージを表示する
- 取引が実行されない (`useReadContract` で balance が変わらない)

## Related

- [RPC Handling Concepts](../concepts/rpc-handling.md)
- [RPC.md (Reference)](../../RPC.md)
