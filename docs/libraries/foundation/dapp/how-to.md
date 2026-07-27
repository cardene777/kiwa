# wallet の分岐を画面で検証する

wallet E2E では、helper が呼ばれたことではなく、provider の結果を受けた画面が期待どおりに変わったことを確認します。接続拒否、未登録 chain、複数 injected wallet は、dApp 側でエラー処理や選択 UI が分かれる代表的な境界です。

この例では、`Connect` を押すとアプリが `eth_requestAccounts` を送る画面を対象にします。利用者が接続を拒否したときは `Connection rejected` を表示し、`Switch to Base` により `wallet_switchEthereumChain` を送った結果、未登録 chain なら `Add this network first` を表示するものとします。wallet の選択結果は `data-testid="selected-wallet"` に名前を表示します。実際の文言と locator はアプリに合わせて置き換えてください。大切なのは、RPC request の発行だけで終わらせず、その結果を利用者にどう見せるかまで assertion することです。

次の内容全体を `tests/wallet-flows.spec.ts` に保存します。三つの scenario は同じ fixture 設定、import、後始末を共有します。断片を組み合わせる必要はありません。

```ts
import { expect } from "@playwright/test";
import {
  ANVIL_DEFAULT_PRIVATE_KEYS,
  dappE2eTest as test,
} from "@kiwa-lab/dapp";

test.use({
  wallets: [
    {
      name: "Alpha",
      rdns: "io.alpha",
      icon: "data:image/svg+xml,alpha",
      privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0],
    },
    {
      name: "Beta",
      rdns: "io.beta",
      icon: "data:image/svg+xml,beta",
      privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[1],
    },
  ],
});

test("connection rejection is shown after a connect request", async ({ page, dappE2e }) => {
  await page.goto("/");
  await dappE2e.setApprovalMode("reject");
  await dappE2e.setRejectConnect(true);

  await page.getByRole("button", { name: "Connect" }).click();
  await dappE2e.waitForRpcIdle();

  await expect(page.getByText("Connection rejected")).toBeVisible();
});

test("unknown chain is handled before switching", async ({ page, dappE2e }) => {
  await page.goto("/");
  await dappE2e.setChainRegistry([{ chainId: "0x7a69", chainName: "Anvil" }]);

  await page.getByRole("button", { name: "Switch to Base" }).click();
  await dappE2e.waitForRpcIdle();

  await expect(page.getByText("Add this network first")).toBeVisible();
});

test("a selected provider connects", async ({ page, dappE2e }) => {
  await page.goto("/");
  const beta = dappE2e.wallets?.["io.beta"];
  if (!beta) throw new Error("Beta wallet was not configured");

  await beta.connect();
  await dappE2e.waitForRpcIdle();

  await expect(page.getByTestId("selected-wallet")).toHaveText("Beta");
});
```

## 失敗を正しく解釈する

接続拒否を再現するには `setApprovalMode("reject")` と `setRejectConnect(true)` の両方が必要です。前者だけでは、互換性のため `eth_requestAccounts` は拒否されません。成功した test は、アプリが EIP-1193 error code `4001` を握りつぶさず、利用者に拒否を知らせる経路を固定します。表示が違う場合は、request 完了前に assertion していないか、アプリが `4001` を別の文言に変換していないかを確認します。

chain registry を設定した状態で、登録していない chain に切り替えると provider は code `4902` を返します。この test は `wallet_addEthereumChain` を案内するアプリの分岐を確認するものです。registry を設定しない既定 fixture では、下位互換のため switch は許可されます。実 wallet の popup や network 追加の可否は wallet ごとに異なるため、staging で別に検証してください。

複数 wallet の `rdns` は英数字、`.`、`-` による一意な reverse-DNS 名にします。無効な private key、非 data URI の icon、重複した `rdns` は fixture 初期化時に失敗します。これは画面 assertion の失敗ではなく wallet configuration の誤りです。`waitForRpcIdle()` は page の provider request と描画を待つため、button click や provider 操作の後、UI assertion の前に置きます。

## 実行する

```bash
pnpm exec playwright test tests/wallet-flows.spec.ts
```

fixture が起動した Anvil は test 終了時に停止します。test 内で別途 process、fork、subscription を作った場合だけは、`try` と `finally` または独自 fixture で停止します。実 wallet extension、WalletConnect relay、外部 RPC はこの fixture の対象外です。ここでは provider 契約と dApp の反応を高速かつ再現可能に固定します。
