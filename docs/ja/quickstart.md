# Quickstart

dapp-e2e で最初の E2E test を 5 分で動かします。

## 前提条件

- Node.js 20+
- pnpm 9+
- Foundry (`anvil` / `forge` が PATH から実行できる状態)
- Playwright が利用できる環境

## インストール

新規プロジェクトのセットアップ。

~~~bash
pnpm dlx @dapp-e2e/cli init
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
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('dApp が接続できる', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected');
});
~~~

## 次に読む

- [Concepts](./concepts/README.md) — fixture / EIP-6963 / RPC handling の仕組み
- [Cookbook](./cookbook/README.md) — 接続ボタン test / 時間操作 / multi-wallet
- [API Reference](./api/README.md) — `dappE2eTest` / `startAnvil` / `waitForChainState`
