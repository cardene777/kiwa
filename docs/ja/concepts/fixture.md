# Fixture 設計

> [🇬🇧 English](../../en/concepts/fixture.md) • [🇯🇵 日本語](./fixture.md)

## TL;DR

`dappE2eTest` は Playwright の `test` を拡張した fixture で、anvil 起動・wallet inject・接続フローを 1 つの単位で扱える形にまとめたものです。

## なぜ

dApp の E2E テストは「anvil 起動」「contract deploy」「wallet inject」「connect」「sign」「send tx」と多段で、毎回ボイラープレートを書くと flaky になります。
kiwa は core が anvil 起動 / EIP-1193 inject / Playwright fixture 化を 1 経路で提供し、ユーザーは `page` と `dappE2e` を受け取って test を書くだけにします。

## 仕組み

test を起動してから helper を呼べる状態になるまで、 以下の順に進みます。

1. Playwright の test が起動する
2. `globalSetup` または `pretest` が走る
3. `startAnvil` が anvil を起動する
4. contract を deploy し、 `.env.local` を書き出す
5. Playwright の fixture が起動する
6. `dappE2eTest` が page に inject script を流し込む
7. `window.ethereum` が EIP-1193 と EIP-6963 で公開される
8. ユーザーの test code が実行される
9. connect / sign / sendTx などを `dappE2e` helper で発行する

## account switch event 順序

`setActiveAccount()` は internal state を更新してから `accountsChanged` を page へ流すため、
wagmi の `useAccount()` から見ると「state 更新 → event 通知 → 再 render」の順で観測できます。

`setActiveAccount(1)` を呼んだときの内訳は以下の通りです。

1. test が `DappE2eApi` の `setActiveAccount(1)` を呼ぶ
2. 範囲外の index なら `-32602` で拒否する
3. fixture の `rpcContext.activeIndex.current` を `1` に更新する
4. `rpcContext.emitter` へ `accountsChanged` を emit する (Node 側の listener 向け)
5. `emitPageEvent(page, bridgeName, 'accountsChanged', [newAddress])` を await する (page 側の listener 向け)
6. inject された `window.ethereum` が page 側で event を emit する
7. wagmi が `useAccount()` を更新し、 React が再 render する

step 4 の emitter 送出は fixture が登録した転送 handler を経由して page へ届き、 step 5 の `emitPageEvent` も同じ page へ届きます。
つまり `accountsChanged` は page へ 2 回届き、 page 側の listener も 2 回起動します。
イベント回数を数える test を書く場合はこの前提で組んでください。

## Example

~~~ts
import { dappE2eTest as test, expect } from '@kiwa-lab/dapp';

const customTest = test.extend({
  // 必要に応じて wallet の private key や approval mode を override
  approvalMode: 'approve',
});

customTest('connect 後に署名できる', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();
  const sig = await dappE2e.personalSign('hello');
  expect(sig).toMatch(/^0x[0-9a-f]+$/);
});
~~~

## 関連

- [EIP-6963 Multi-Wallet](./eip-6963.md)
- [API Reference: dappE2eTest](../api/dapp-e2e-test.md)
