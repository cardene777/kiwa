# ウォレット接続の拒否 UI を検証する

このガイドでは、接続要求をユーザーが拒否したときの UI を E2E テストで再現します。`dappE2e` は approval mode と connect rejection を個別に設定できます。

## 拒否を有効にする

`setApprovalMode("reject")` は、署名、チェーン切替、トランザクション送信などの承認対象操作を拒否します。`eth_requestAccounts` も拒否するには、追加で `setRejectConnect(true)` を設定します。既定では `eth_requestAccounts` は reject mode 中でも成功します。

```ts
import { expect } from "@playwright/test";
import { dappE2eTest as test } from "@kiwa-lab/dapp";

test("接続拒否をアプリが表示できる", async ({ page, dappE2e }) => {
  await page.goto("/");
  await dappE2e.setApprovalMode("reject");
  await dappE2e.setRejectConnect(true);

  const result = await page.evaluate(async () => {
    const provider = (window as typeof window & {
      ethereum?: { request: (request: { method: string }) => Promise<unknown> };
    }).ethereum;

    try {
      await provider?.request({ method: "eth_requestAccounts" });
      return { rejected: false };
    } catch (error) {
      const rpcError = error as { code?: number; message?: string };
      return { rejected: true, code: rpcError.code, message: rpcError.message };
    }
  });

  await dappE2e.waitForRpcIdle();
  expect(result.rejected).toBe(true);
  expect(result.code).toBe(4001);
});
```

実際のアプリでは `page.evaluate()` の代わりに接続ボタンをクリックし、エラー表示を assertion してください。上の例は、fixture が返す EIP-1193 エラーの契約を最小化して示しています。

## 既定の挙動に戻す

同一テスト内で以降の承認を通す場合は、approval mode を `approve` に戻します。

```ts
await dappE2e.setApprovalMode("approve");
```

`setRejectConnect(false)` で connect rejection だけを無効にできます。`eth_accounts` は `setRejectConnect(true)` と reject mode の組み合わせでも読み取り要求としてアカウントを返します。

## 他の拒否フロー

`setApprovalMode("reject")` は `personal_sign`、`eth_signTypedData_v4`、`wallet_switchEthereumChain`、`eth_sendTransaction` にも EIP-1193 code `4001` を返します。ERC-20 `approve` をトークン単位で制御するには、`setApprovalModeForToken(tokenAddress, { mode, limit? })` を使用できます。

根拠となる実装: [`fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts)、[`rpc-handlers.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/rpc-handlers.ts)、[`approval-mode.test.ts`](https://github.com/cardene777/kiwa/blob/main/packages/dapp/tests/approval-mode.test.ts)。
