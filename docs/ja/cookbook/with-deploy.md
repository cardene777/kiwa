# kiwa init --with-deploy で framework 統合 boilerplate を生成する

> [🇬🇧 English](../../en/cookbook/with-deploy.md) • [🇯🇵 日本語](./with-deploy.md)

## Goal

既存 Foundry project を持つ dApp で、 `pnpm test` の前段で anvil 起動 + `forge build` + `forge create` + `.env.local` 書き込みを自動化する boilerplate を `kiwa init --with-deploy <foundry-path>` で 1 コマンド生成する。 `nextjs-wagmi-rainbow` example が同じ構成の reference 実装。

## Prerequisites

- 既存 Foundry project (`forge build` が通る `foundry.toml` + `src/*.sol` + `out/` を持つ dir)
- 既存 Next.js (もしくは Vite) project + `playwright.config.ts`
- Foundry の `anvil` / `forge` が PATH 上
- `pnpm install` 済 + `pnpm exec playwright install chromium` 済

## Steps

### 1. boilerplate 生成

```bash
# Foundry project が ../contract にある場合
pnpm dlx @kiwa-test/cli init --with-deploy ../contract
```

生成される file。

| File | 役割 |
|---|---|
| `tests/prepare-env.ts` | anvil 起動 → `forge build` → `forge create` → `.env.local` 書き込みを担う関数 |
| `tests/global-setup.ts` | Playwright globalSetup から `prepareEnv()` を呼出して anvil + contract を準備 |
| `tests/global-teardown.ts` | Playwright globalTeardown で anvil 停止 + pidfile cleanup |
| `tests/fixture.ts` | `dappE2eTest` を extend し `_anvilHandle` を globalSetup の anvil に向け直す |

### 2. template の placeholder 置換

`tests/prepare-env.ts` の冒頭定数を自分の contract に合わせて編集する。

```ts
const FOUNDRY_PATH = '../contract';            // CLI 引数で置換済 (確認するだけ)
const CONTRACT_NAME = 'YourContract';          // ← deploy したい contract 名に変更
const CONTRACT_ARGS: unknown[] = [];           // ← constructor 引数 (例 [recipient, 1000n])
const ENV_VAR_NAME = 'NEXT_PUBLIC_CONTRACT_ADDRESS';  // ← dApp 側が読む env 変数名に変更
const ANVIL_PORT = 8545;                       // ← 衝突を避けたい場合のみ変更
```

CONTRACT_NAME は `forge build` で生成される `out/<CONTRACT_NAME>.sol/<CONTRACT_NAME>.json` を読むため、 contract source の file 名と contract 名が一致する想定。 別名なら abiPath の組み立てを直接書き換える。

### 3. Playwright config への登録

`playwright.config.ts` に globalSetup / globalTeardown を登録する。

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  testDir: './tests',
  // ... 既存設定
});
```

### 4. spec から fixture を import

通常 `@kiwa-test/core` の `dappE2eTest` をそのまま使うところを、 globalSetup 起動済 anvil を共有するため `tests/fixture.ts` 経由に切り替える。

```ts
import { test, expect } from './fixture';

test('mint flow', async ({ page, dappE2e }) => {
  // CONTRACT_ADDRESS は process.env.NEXT_PUBLIC_CONTRACT_ADDRESS から読める
  await page.goto('/');
  // ...
});
```

### 5. 実走

```bash
pnpm test
```

中で起こること。

1. `globalSetup` が `prepareEnv()` を呼出 → anvil 起動 + `forge build` + `forge create` + `.env.local` 書き込み
2. Playwright が dev server (Next.js / Vite) を起動 → spec を実行
3. `globalTeardown` が anvil を停止 + pidfile cleanup

## 詰まりやすい点

- **`forge build` が失敗する** — `FOUNDRY_PATH` が間違っている / Foundry project の `foundry.toml` が無効 / `lib/forge-std` が missing。 まず `cd <foundry-path> && forge build` を直接実行して通るか確認。
- **`.env.local` の既存 entry が消える** — `prepareEnv()` は同じ `ENV_VAR_NAME` 行のみ filter + 書き換えるため、 他の env は保持される。 ただし `.env.local` が複雑な場合は事前に backup を取る。
- **port 8545 が衝突** — 既存 anvil / Ganache / 他 dev server が同 port を使用中。 `ANVIL_PORT` を別の値に変更するか、 既存 process を停止。
- **CONTRACT_NAME と source file 名が違う** — `out/<CONTRACT_NAME>.sol/<CONTRACT_NAME>.json` が見つからない。 abiPath 組み立て箇所を直接書き換えるか、 source file を rename。

## reference 実装

`examples/nextjs-wagmi-rainbow` は本 cookbook の 4 file をそのまま実装した動く reference。 内部 `tests/prepare-env.ts` で `MintNft` を deploy し、 `NEXT_PUBLIC_MINT_NFT_ADDRESS` を Next.js dApp に渡している。

詳細は [examples/nextjs-wagmi-rainbow/README.ja.md](../../../examples/nextjs-wagmi-rainbow/README.ja.md)。

## 関連

- [Quickstart](../quickstart.md) — 最初の 5 分 (`pnpm dlx @kiwa-test/cli init` 単独版)
- [Examples Walkthrough](../examples/walkthrough.md) — Stage 4 (nextjs-wagmi-rainbow) で本 boilerplate を実走
- [接続ボタン test](./connect-button.md) — boilerplate 経由で接続フローを test
- [Token approve flow](./token-approve-flow.md) — deploy 後の approve 経路
