# dapp-e2e

dapp-e2e は anvil をローカルで起動して使う headless な E2E test fixture for dApps です。
Playwright と viem を組み合わせ、ブラウザ拡張なしで `window.ethereum` を inject し、
anvil の dev account を使った接続、署名、送金までを 1 つの fixture で通せます。
実 MetaMask UI の確認は別ツールに任せ、本ツールは CI 上で安定して動く E2E に集中します。
比較の考え方は [docs/COMPARISON.md](./docs/COMPARISON.md) にまとめています。

## Quickstart

以下の手順は v0.1.0 が npmjs.com に publish された後に動作します。
publish 前に手元で試したい場合は、本リポジトリを clone して `pnpm install && pnpm -F @dapp-e2e/core -F @dapp-e2e/cli build` を実行し、`node packages/cli/dist/index.js init` を直接呼び出してください。

```bash
pnpm dlx @dapp-e2e/cli init
pnpm install
pnpm exec playwright test
```

`init` は `e2e/connect.spec.ts` と `playwright.config.ts` を生成します。
`package.json` が存在する場合は `scripts.test:e2e` と必要な `devDependencies` も追記します。
既存 file と衝突する場合は上書きせず停止し、`--force` を明示したときだけ置き換えます。

### 生成される最小構成

1. `e2e/connect.spec.ts`
   `window.ethereum` の接続、署名、送金を確認する Playwright spec です。
2. `playwright.config.ts`
   `./e2e` を対象にした headless Chromium 設定です。
3. `package.json` の補助更新
   既存 `package.json` があるときだけ、`test:e2e` と peer 依存に合わせた開発依存を追加します。

### 想定している前提

- Node.js 20 以上
- pnpm
- Playwright が利用できるローカルまたは CI 環境
- `anvil` (Foundry) がインストール済みで PATH から実行できる状態

## Multi-Wallet (EIP-6963)

dapp-e2e は EIP-6963 (Multi Injected Provider Discovery) に対応しており、1 page 内に複数 wallet を並走 inject できます。
wagmi v2 / RainbowKit v2 の wallet picker UI でも正しく検出されます。

### 利用例

```typescript
import { dappE2eTest } from '@dapp-e2e/core';

const test = dappE2eTest.extend({
  wallets: [
    {
      name: 'MetaMask',
      rdns: 'io.metamask',
      icon: 'data:image/svg+xml;base64,...',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    },
    {
      name: 'Rabby',
      rdns: 'io.rabby',
      icon: 'data:image/svg+xml;base64,...',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    },
  ],
});

test('multi wallet picker', async ({ page, dappE2e }) => {
  await dappE2e.wallets!['io.rabby'].connect();
});
```

`wallets` option 未指定時は単一 MetaMask 互換 wallet で動作します (既存挙動互換)。

## Features

- anvil を test 単位で直接 spawn し、ローカル chain を隔離して扱える
- `eth_requestAccounts` など 9 RPC を core が直接処理し、その他は anvil JSON-RPC へ forward する
- `viem` を peerDependency に寄せ、host project 側で version を一元管理できる
- `dappE2e.triggerEvent()` と `connect()` `disconnect()` `switchChain()` で page 側 event を制御できる
- Playwright fixture が anvil 起動、inject script、終了処理までを自動化する
- error envelope で EIP-1193 の `code` と `message` を page 境界の先まで保持できる
- CLI `init` だけで fixture import 済みの雛形を作れる

ブラウザ拡張なしで完結する headless 実行を優先しているため、
wallet extension の popup 操作や UI 差分の確認よりも、
dApp 側の接続フローを CI 上で安定して検証したい場面に向いています。

## Documentation

- [docs/RPC.md](./docs/RPC.md) — 直接処理する 9 RPC と anvil fallback の整理
- [docs/EVENTS.md](./docs/EVENTS.md) — 4 event と `triggerEvent()` の使い方
- [docs/ERRORS.md](./docs/ERRORS.md) — EIP-1193 error code と envelope 設計
- [docs/MIGRATION.md](./docs/MIGRATION.md) — v0.x 系の破壊的変更ポリシー
- [docs/COMPARISON.md](./docs/COMPARISON.md) — Synpress / wallet-mock との使い分け
- [docs/RELEASING.md](./docs/RELEASING.md) — publish 手順と provenance 設定

各ドキュメントは v0.1.0 publish 前提の最小実用ガイドです。
API の詳細は `packages/core/src` と `packages/cli/src` の実装を SSOT とし、
今後の機能追加に応じて必要な章だけを増やす方針です。

## License + Issues

- MIT License
- [Issue tracker](https://github.com/cardene777/dapp-e2e/issues)
- [Pull requests](https://github.com/cardene777/dapp-e2e/pulls)

公開前の変更や互換性の注意点は [docs/MIGRATION.md](./docs/MIGRATION.md) を参照してください。
