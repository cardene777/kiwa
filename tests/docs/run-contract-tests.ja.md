# Contract 群の test を skill で作って実走する手順 (Foundry + Hardhat)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

`examples/nft-marketplace` (2 contract: `MarketNft.sol` + `SimpleMarketplace.sol`) で contract test を 0 から生成 → 実走 → 完成形 fixtures と diff 比較するまでの手順。

## Step 0 — 前提環境 (+ 途中まで進めた場合のリセット)

kiwa repo を clone した root で実行。

```bash
pnpm install && forge --version && anvil --version && node --version
```

途中まで進めて再 run したい場合のリセット (生成済 test / spec / cache を全削除)。 cwd がどこでも動く。

```bash
ROOT=$(git rev-parse --show-toplevel) && rm -rf "$ROOT/examples/nft-marketplace"/{test,hardhat-test,forge-out,hardhat-cache,hardhat-artifacts,cache,coverage,coverage.json} "$ROOT/.context/spec/contract/test-spec-nft-marketplace.md"
```

## Step 1 — 対象 dApp dir に移動 + test dir が空であることを確認

```bash
cd examples/nft-marketplace && ls test hardhat-test 2>&1
# 期待: "No such file" or 空
```

## Step 2 — その dir で Claude Code を起動

```bash
claude
```

## Step 3 — `/kiwa-design` で test 仕様書を生成

claude prompt で叩く。

```text
/kiwa-design --layer contract --module nft-marketplace --input contracts/
```

出力: `.context/spec/contract/test-spec-nft-marketplace.md` (両 contract の function / event / error + 連携 scenario が 9 column 表で生成)。

## Step 4 — `/kiwa-forge` で Foundry test を生成

```text
/kiwa-forge --module nft-marketplace --gas-report
```

出力:

```
test/
├── MarketNft.t.sol
└── SimpleMarketplace.t.sol   (連携 scenario は setUp で MarketNft も deploy して同 file 内に含む)
```

## Step 5 — `/kiwa-hardhat` で Hardhat test を生成

```text
/kiwa-hardhat --module nft-marketplace --gas-report
```

出力:

```
hardhat-test/
├── MarketNft.test.cjs
└── SimpleMarketplace.test.cjs
```

## Step 6 — 全 test を実走 (flaky 検査込み)

claude を抜けて (Ctrl+D) repo root で実行。

```bash
# Foundry — 全 contract 一括
(cd examples/nft-marketplace && FOUNDRY_OFFLINE=true forge test)

# Hardhat — 4 round 連続 (flaky 0 検査)
for r in 1 2 3 4; do echo "=== Round $r ==="; pnpm -F examples-nft-marketplace test:hardhat 2>&1 | grep -E "passing|failing"; done
```

全 round `failing 0` で合格。

## Step 7 — Coverage 評価 (未達なら loop)

```bash
# Foundry
(cd examples/nft-marketplace && FOUNDRY_OFFLINE=true forge coverage --report summary)

# Hardhat
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

目標: **production target (contracts/ 配下) で 100% 到達 or 「これ以上不可能」 が確定するまで loop**。 終了条件 2 つのいずれか。

1. production target 全 4 metric (Lines / Statements / Branches / Functions) が 100% 到達
2. 残 uncovered が unreachable branch / defensive code / 外部依存 (block.timestamp 等 test 再現不能) で 「test 追加不可能」 と判定済

未達 (1 でも 2 でもない) なら:

```text
claude を再起動して uncovered 箇所を /kiwa-design spec に追記 → /kiwa-forge --module nft-marketplace を再実行 → 再 coverage
```

これを 100% or 不可能判定 まで loop。 連続 2 round で coverage delta 0 なら「停滞」とみなし手動 review。

> 注 — Total 値 (test / mock 含む) が 100% 未達でも production target 100% なら PASS。 test/helper/mock は分母対象外。 詳細解釈は次 Step (Step 8) の coverage report を参照。

> 注 — auto loop (skill が自動で uncovered 抽出 → 分類 → test 追加 → 再 coverage) と coverage report 自動生成 (4 section format で `tests/reports/contract/coverage-report-{module}.md` に Write) は [Issue #222](https://github.com/cardene777/kiwa/issues/222) で skill 拡張予定。 拡張完了後は本 Step 7 + Step 8 が自動化される。 それまでは上記手動 loop + 次 Step の手動 report 参照。

## Step 8 — Coverage report 確認 (skill 拡張後は自動生成)

skill 拡張 #222 完了後、 Step 7 完了時に以下が自動生成される。

```
tests/reports/contract/coverage-report-nft-marketplace.md
```

4 section 構造:

| section | 内容 |
|---|---|
| 1. 判定サマリ | production target / Total の 2 列で 4 metric を表示 + ✅PASS / ❌FAIL 判定 |
| 2. file 別内訳 | production / test 自身 / mock helper の カテゴリ列 + threshold 対象列 |
| 3. 未到達 line 分類 | 削除候補 / defensive / 外部依存 / 計測除外 / 真の未踏 の 5 分類 + 理由 |
| 4. Layer 1 spec 書き戻し提案 | 実装段で追加した test / 発見した知見を spec に反映する提案 (skill は spec 自体は書き換えない) |

拡張完了までは上記 section を手動で作成して `tests/reports/contract/` 配下に保存する運用 (任意)。

## Step 9 — 完成形 fixtures と diff 比較

> ⚠️ **重要 — nft-marketplace の fixtures は未実装** ([Issue #218](https://github.com/cardene777/kiwa/issues/218) で予定)。 本 step は `tests/fixtures/nft-marketplace/` が存在する前提だが、 現状は #218 完了まで実行不可。 動作確認したい場合は fixtures が揃っている mint-nft で代替実行 (下記参照)。

#218 完了後の想定コマンド (cwd 問わず動く)。

```bash
ROOT=$(git rev-parse --show-toplevel) && diff -r "$ROOT/examples/nft-marketplace/test" "$ROOT/tests/fixtures/nft-marketplace/contract-test" 2>&1 | head -30
ROOT=$(git rev-parse --show-toplevel) && diff -r "$ROOT/examples/nft-marketplace/hardhat-test" "$ROOT/tests/fixtures/nft-marketplace/hardhat-test" 2>&1 | head -30
```

### 代替 — mint-nft で diff 比較を試したい場合

fixtures が既に存在する mint-nft (#215 完了済) で diff 動作確認:

```bash
ROOT=$(git rev-parse --show-toplevel) && diff -r "$ROOT/examples/mint-nft/test" "$ROOT/tests/fixtures/mint-nft/contract-test" 2>&1 | head -30
ROOT=$(git rev-parse --show-toplevel) && diff -r "$ROOT/examples/mint-nft/hardhat-test" "$ROOT/tests/fixtures/mint-nft/hardhat-test" 2>&1 | head -30
```

完全一致は期待しない (skill 生成は run ごとにブレる)。 確認するのは 3 点:

- 全 contract の function / event / error が test に含まれる
- 全 test PASS (Step 6 で確認済)
- coverage threshold 以上 (Step 7 で確認済)

fixtures 未実装の other example (defi-swap = #216 / nextjs-token-gating = #217) も同様に当該 Issue 完了まで本 step は skip。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `Attempted to create a NULL object` panic (Foundry / macOS) | `FOUNDRY_OFFLINE=true forge test` |
| `forge-std/Test.sol` not found | `git submodule update --init` |
| Hardhat `Cannot find module` | repo root で `pnpm install` 再実行 |
| 1 round だけ failing (flaky) | 該当 test の `time.increaseTo` / `vm.warp` を `setUp` で fixture 化 |
| coverage 未達 | `.context/spec/contract/test-spec-nft-marketplace.md` の「不足している仕様」 section を確認、 Step 4 / Step 5 を再起動 |

## 関連 docs

- dApp e2e test (UI 起点): `tests/docs/run-dapp-e2e-tests.ja.md`
- 完成形 reference: `tests/fixtures/mint-nft/README.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
