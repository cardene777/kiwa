# dapp-e2e

dapp-e2e は anvil ベースの fork chain testing に特化した headless E2E test fixture for dApps です。
Playwright と viem を組み合わせ、ブラウザ拡張なしで `window.ethereum` を inject し、
anvil の dev account を使った接続、署名、送金までを 1 つの fixture で通せます。
実 MetaMask UI の確認は別ツールに任せ、本ツールは fork chain testing と CI 安定性に集中します。
比較の考え方は [docs/COMPARISON.md](./docs/COMPARISON.md) にまとめています。

## Quickstart

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
- fork 元にしたい RPC URL がある場合は、利用側で環境変数や設定を渡す構成

## Features

- anvil を test 単位で直接 spawn し、fork chain を隔離して扱える
- `eth_requestAccounts` など 9 RPC を core が直接処理し、その他は anvil JSON-RPC へ forward する
- `viem` を peerDependency に寄せ、host project 側で version を一元管理できる
- `dappE2e.triggerEvent()` と `connect()` `disconnect()` `switchChain()` で page 側 event を制御できる
- Playwright fixture が anvil 起動、inject script、終了処理までを自動化する
- error envelope で EIP-1193 の `code` と `message` を page 境界の先まで保持できる
- CLI `init` だけで fixture import 済みの雛形を作れる

fork chain の再現性と headless 実行を優先しているため、
wallet extension の popup 操作や UI 差分の確認よりも、
dApp 側の接続フローを安定して検証したい場面に向いています。

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
