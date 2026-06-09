# Fixture Composition

## TL;DR

`dappE2eTest.extend()` を薄い結合層として使い、global setup が作った deploy 結果、
wallet option、app 固有 helper を 1 つの fixture にまとめます。
deploy 時の state は setup script 側、page 実行中の state は fixture 側に寄せると安定します。

## なぜ

spec ごとに anvil 起動、contract deploy、wallet inject を個別に書くと、
初期化順序がずれて flaky になりやすくなります。
fixture composition にすると「一度だけ準備するもの」と「test ごとに切り替えるもの」を分離でき、
spec は `page` と typed helper だけを見れば済みます。

## 1. `test.extend()` で custom fixture を足す

`dappE2eTest` は最初から `page` / `wallet` / `dappE2e` / `anvilPort` を持っています。
app 側ではその上に `contracts`、`factory`、`customWallet` のような fixture を追加します。

~~~ts
import { dappE2eTest } from '@kiwa/core';

type AppFixtures = {
  customWallet: { connectAs(index: number): Promise<void> };
};

export const test = dappE2eTest.extend<AppFixtures>({
  customWallet: async ({ dappE2e }, use) => {
    await use({
      async connectAs(index) {
        await dappE2e.setActiveAccount!(index);
        await dappE2e.connect();
      },
    });
  },
});
~~~

## 2. global setup と custom fixture を分担する

`globalSetup` や `webServer.command` 前段の `prepare-env.ts` では、
anvil 起動、contract deploy、`.env` / `.context/*.env` への書き出しのような
「test 全体で共有する準備」を担当させます。

`fixture.ts` 側はその出力を読むだけにとどめ、固定 port の anvil を再利用しつつ
page への inject と wallet state の切替だけを担当させると責務が明確です。
deploy を毎 test でやり直さないため、起動時間も短くなります。

## 3. contract factory pattern で deploy 順序を閉じ込める

constructor 引数に別 contract address が必要な場合は、
fixture の中で deploy 順序を 1 つの factory に閉じ込めます。
たとえば `Token` を deploy して receipt を待ってから `Vault(tokenAddress)` を deploy し、
最後に `{ token, vault }` を 1 オブジェクトで `use()` へ渡します。

この順序を fixture に寄せておくと、spec 側が未 deploy の address を誤って使う余地が減ります。

## 4. `fixture.ts` の型推論で気を付ける点

- `dappE2eTest.extend<{ customWallet: CustomWallet; contracts: Contracts }>(...)` のように generic を明示すると、spec 側で `any` に落ちません
- `test` は `tests/fixture.ts` から export し、各 spec ではその symbol を import します。spec ごとに `extend()` を作り直すと型と初期化順序が散ります
- `test.use({ wallets: [...] } as never)` や internal fixture override は `fixture.ts` に閉じ込めます。Playwright option 型の都合で cast が必要でも、custom fixture 自体の型推論は generic 側で守れます

## 5. 完全 example

~~~ts
import { dappE2eTest } from '@kiwa/core';

type AppFixtures = {
  customWallet: { connectAs(index: number): Promise<void> };
};

export const test = dappE2eTest.extend<AppFixtures>({
  customWallet: async ({ dappE2e }, use) => {
    await use({
      async connectAs(index) {
        await dappE2e.setActiveAccount!(index);
        await dappE2e.connect();
      },
    });
  },
});

test('treasury account can open the vault page', async ({ page, customWallet }) => {
  await page.goto('/');
  await customWallet.connectAs(1);
  await page.getByRole('button', { name: /vault/i }).click();
});
~~~

## 関連

- [Fixture 設計](./fixture.md)
- [API Reference: dappE2eTest](../api/dapp-e2e-test.md)
