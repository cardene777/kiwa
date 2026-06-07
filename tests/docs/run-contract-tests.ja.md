# Contract 群の test を skill で作って実走する手順 (Foundry + Hardhat)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

`examples/nft-marketplace` (2 contract: `MarketNft.sol` + `SimpleMarketplace.sol`) で contract test を 0 から生成 → 実走 → 完成形 fixtures と diff 比較するまでの手順。

## Step 0 — 前提環境

kiwa repo を clone した root で実行。

```bash
pnpm install
forge --version    # Foundry
anvil --version
node --version     # 22+
```

## Step 1 — 対象 dApp dir に移動 + test dir が空であることを確認

```bash
cd examples/nft-marketplace
ls test 2>&1            # "No such file" or 空
ls hardhat-test 2>&1    # "No such file" or 空
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

claude を抜けて (Ctrl+D)、 examples/nft-marketplace dir で実行。

```bash
# Foundry — 全 contract 一括
FOUNDRY_OFFLINE=true forge test

# Hardhat — repo root に戻って 4 round 連続 (flaky 0 検査)
cd ../..
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm -F examples-nft-marketplace test:hardhat 2>&1 | grep -E "passing|failing"
done
```

全 round `failing 0` で合格。

## Step 7 — Coverage 評価 (未達なら loop)

```bash
# Foundry
cd examples/nft-marketplace
FOUNDRY_OFFLINE=true forge coverage --report summary

# Hardhat
cd ../..
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

目標: **100% 到達 or 「これ以上不可能」 が確定するまで loop**。 終了条件 2 つのいずれか。

1. 全 4 metric (Lines / Statements / Branches / Functions) が 100% 到達
2. 残 uncovered が unreachable branch / defensive code / 外部依存 (block.timestamp 等 test 再現不能) で 「test 追加不可能」 と判定済

未達 (1 でも 2 でもない) なら:

```text
claude を再起動して uncovered 箇所を /kiwa-design spec に追記 → /kiwa-forge --module nft-marketplace を再実行 → 再 coverage
```

これを 100% or 不可能判定 まで loop。 連続 2 round で coverage delta 0 なら「停滞」とみなし手動 review。

> 注 — auto loop (skill が自動で uncovered 抽出 → test 追加 → 再 coverage を無制限 loop) は [Issue #222](https://github.com/cardene777/kiwa/issues/222) で skill 拡張予定。 拡張完了後は本 Step 7 が自動化される。 それまでは上記手動 loop。

## Step 8 — 完成形 fixtures と diff 比較

```bash
diff -r examples/nft-marketplace/test tests/fixtures/nft-marketplace/contract-test 2>&1 | head -30
diff -r examples/nft-marketplace/hardhat-test tests/fixtures/nft-marketplace/hardhat-test 2>&1 | head -30
```

完全一致は期待しない (skill 生成は run ごとにブレる)。 確認するのは 3 点:

- 全 contract の function / event / error が test に含まれる
- 全 test PASS (Step 6 で確認済)
- coverage threshold 以上 (Step 7 で確認済)

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
