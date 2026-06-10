# Quickstart

> [🇬🇧 English](../en/quickstart.md) • [🇯🇵 日本語](./quickstart.md)

kiwa で最初の E2E test を 5 分で動かします。

## 必須前提チェックリスト

> 必須前提:
> - `anvil --version` が成功すること。Foundry を install し、`anvil` を PATH から実行できる状態にします
> - Node.js 20+ を使うこと。基準は repo の `package.json` `engines.node` です (`.nvmrc` を併用する運用ならそちらも合わせます)
> - pnpm 10+ を使うこと
> - `pnpm exec playwright install chromium` で Chromium binary を取得済みであること。sandbox 環境では省略できません
> - `lsof` が PATH にあること。port 検出が必要な環境では、Linux なら `apt-get install lsof` または `apk add lsof` で追加します

### よくあるエラー

- `tsx: command not found` — `pnpm install` が未実行か、依存関係が壊れています。lockfile に合わせて install をやり直します
- `anvil: command not found` — Foundry 未導入か PATH 未設定です。`anvil --version` が通るまで修正します
- `EADDRINUSE: address already in use 127.0.0.1:8545` — 既存 anvil / dev server が同じ port を使っています。不要な process を止めるか port を変更します
- `browserType.launch: Executable doesn't exist` — Playwright の Chromium binary が未導入です。`pnpm exec playwright install chromium` を実行します
- `lsof: command not found` — port 検出 helper が失敗します。Linux distro に応じて `apt-get install lsof` または `apk add lsof` を実行します

## 前提条件

- Node.js 20+
- pnpm 10+
- Foundry (`anvil` / `forge` が PATH から実行できる状態)
- Playwright が利用できる環境

## インストール

新規プロジェクトのセットアップ。

~~~bash
pnpm dlx @kiwa-test/cli init
pnpm install
pnpm exec playwright install chromium
~~~

`init` は以下を生成します。

- `e2e/connect.spec.ts` — `window.ethereum` の接続・署名・送金を確認する最小 spec
- `playwright.config.ts` — headless Chromium 設定
- `package.json` の `scripts.test:e2e` と `devDependencies` を必要に応じて追記

## 最初の test 実行

~~~bash
pnpm exec playwright test
~~~

期待する出力。

~~~
Running 1 test using 1 worker
  ✓ e2e/connect.spec.ts:5:1 › connects and signs message
  1 passed (3.2s)
~~~

## 自作 test の最小例

~~~ts
import { dappE2eTest as test, expect } from '@kiwa-test/core';

test('dApp が接続できる', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

## 既存 Foundry project と統合したい場合

`init --with-deploy` で anvil 起動 + `forge build` + `forge create` + `.env.local` 書き込みの 4 file boilerplate を一括生成できる。

~~~bash
pnpm dlx @kiwa-test/cli init --with-deploy ../contract
~~~

詳細手順 (placeholder 置換 / Playwright config 登録 / 詰まりポイント) と reference 実装は [Cookbook: kiwa init --with-deploy](./cookbook/with-deploy.md) を参照。

## 次に読む

- [Examples](./examples/README.md) — 試したい機能から逆引きで example を選ぶ
- [Concepts](./concepts/README.md) — fixture / EIP-6963 / RPC handling の仕組み
- [Cookbook](./cookbook/README.md) — 接続ボタン test / 時間操作 / multi-wallet / `--with-deploy` の使い方
- [API Reference](./api/README.md) — `dappE2eTest` / `startAnvil` / `waitForChainState`
