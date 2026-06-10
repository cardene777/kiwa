# dApp e2e test を skill で作って実走する手順 (Playwright + viem)

> [🇬🇧 English](./run-dapp-e2e-tests.md) • [🇯🇵 日本語](./run-dapp-e2e-tests.ja.md)

`examples/nextjs-token-gating` (Next.js dApp + 2 contract: `GatedContent.sol` + `GateNFT.sol`) で UI 起点の dApp e2e test を 0 から生成 → 実走するまでの手順。 UI から呼ばれない contract function (admin / internal) は対象外。

## Step 0 — 前提環境 (+ 途中まで進めた場合のリセット)

kiwa repo を clone した root で実行。

```bash
pnpm install && pnpm -F @kiwa-test/core build && anvil --version && node --version && pnpm --filter examples-nextjs-token-gating exec playwright install chromium
```

途中まで進めて再 run したい場合のリセット (生成済 spec / test / 実走結果を全削除)。 cwd がどこでも動く。

```bash
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nextjs-token-gating"/{tests,test-results,playwright-report,.next} "$ROOT/tests/spec/e2e/test-spec-token-gating.md"
```

## Step 1 — 対象 dApp dir に移動 + tests/ dir が空であることを確認

```bash
cd examples/nextjs-token-gating && ls tests 2>&1
# 期待: "No such file" or 空
```

## Step 2 — その dir で Claude Code を起動

```bash
claude
```

## Step 3 — `/kiwa-design` で e2e 仕様書を生成 (UI 起点)

claude prompt で叩く。

```text
/kiwa-design --layer e2e --module token-gating --input app/
```

出力: `tests/spec/e2e/test-spec-token-gating.md` (UI 要素 / wagmi hook 経由の contract function / UX flow を 9 column 表で生成、 UI から呼ばれない contract function は対象外)。

## Step 4 — `/kiwa-play --mode new` で Playwright spec を生成

```text
/kiwa-play --mode new --rounds 4
```

出力: `tests/token-gating.spec.ts` + `tests/prepare-env.ts` / `tests/fixture.ts` 等 helper。 skill が生成後 4 round 連続実走で flaky 0 を検証する。

## Step 5 — spec を手動実走 (flaky 検査込み)

claude を抜けて (Ctrl+D) repo root で実行。

```bash
# 単発
pnpm -F examples-nextjs-token-gating test

# 4 round 連続 flaky 検査
for r in 1 2 3 4; do echo "=== Round $r ==="; pnpm -F examples-nextjs-token-gating test 2>&1 | tail -3; done
```

全 round `failing 0` で合格。

## debug 用 — headed mode / specific test

```bash
# 画面を見ながら実走
pnpm -F examples-nextjs-token-gating exec playwright test --headed

# テスト名で filter
pnpm -F examples-nextjs-token-gating exec playwright test --grep "Grant"

# file / 行指定
pnpm -F examples-nextjs-token-gating exec playwright test tests/token-gating.spec.ts:120
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `Executable doesn't exist at .../chrome-headless-shell` | `pnpm --filter examples-nextjs-token-gating exec playwright install chromium` |
| `ReferenceError: require is not defined in ES module scope` | package.json に `"type": "module"` 追加 |
| `Cannot find module '@kiwa-test/core'` | repo root で `pnpm -F @kiwa-test/core build` |
| anvil port 衝突 (`EADDRINUSE: 8545`) | `pkill -f anvil` or `lsof -ti :8545 \| xargs kill` |
| Playwright timeout | `--debug` で inspector 起動 + spec 内に `await page.pause()` |
| 1 round だけ failing | `test.describe.serial` を使う or fixture で `beforeEach` で state reset |
| `Error: connect ECONNREFUSED 127.0.0.1:8545` | `node --import tsx tests/prepare-env.ts` 単独実行で anvil 起動 log 確認 |

## 関連 docs

- contract test (Foundry + Hardhat): `tests/docs/run-contract-tests.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- `@kiwa-test/core` fixture 仕様: `packages/core/src/fixture.ts`
