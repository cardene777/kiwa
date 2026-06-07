# Contract test 実走手順 (Foundry + Hardhat)

> [🇬🇧 English](./run-contract-tests.md) • [🇯🇵 日本語](./run-contract-tests.ja.md)

`examples/mint-nft` の ERC721 contract (`MintNft.sol`) を題材に、 Foundry と Hardhat の 2 経路で contract test を実走する手順。 2 つの動線を持つ。

- **動線 A — 完成形 reference を実走**: `tests/fixtures/mint-nft/` の完成形 test suite を pnpm 経由で走らせ、 期待件数 (Foundry 27/27 + Hardhat 24/24) と挙動を確認する
- **動線 B — retrofit walkthrough を 0 から歩く**: `examples/mint-nft/` を空 dir 状態から `/kiwa-design` → `/kiwa-forge` → `/kiwa-hardhat` の skill chain で test を再生成し、 fixtures 完成形と diff 比較する

## 前提条件

repo root で以下が揃っていること。

```bash
# 1. 依存 install
pnpm install

# 2. Foundry が PATH 上 (forge / anvil)
forge --version    # forge x.y.z
anvil --version    # anvil x.y.z

# 3. Node.js 22+ (Hardhat 用)
node --version     # v22.x.x
```

Foundry 未 install の場合は [foundry.paradigm.xyz](https://foundry.paradigm.xyz) の install 手順を実行。

## 動線 A — 完成形 reference を実走

`tests/fixtures/mint-nft/` は独立 pnpm workspace で、 examples 側に影響せず完結する。

### A-1. Foundry test を実走 (27/27 期待)

```bash
pnpm --dir tests/fixtures/mint-nft test:foundry
```

期待出力末尾。

```text
Ran 1 test suite in XXms: 27 tests passed, 0 failed, 0 skipped (27 total tests)
```

**重要 — macOS で panic する場合の対処**。 `Attempted to create a NULL object` panic が出たら、 Foundry の system_configuration バグ (4byte / openchain signature lookup 経路) に当たっている。 fixtures 側 package.json は `FOUNDRY_OFFLINE=true forge test` を script として持つので通常は問題ないが、 直接 `forge test` を叩いて panic した場合は以下を使う。

```bash
FOUNDRY_OFFLINE=true forge test
```

### A-2. Hardhat test を実走 (24/24 期待、 flaky 検査用に 4 round)

```bash
# 単発
pnpm --dir tests/fixtures/mint-nft test:hardhat

# 4 round 連続 (flaky 0 検査)
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm --dir tests/fixtures/mint-nft test:hardhat 2>&1 | grep -E "passing|failing"
done
```

期待出力 (各 round)。

```text
  24 passing (XXXms)
```

4 round 全て `24 passing` で `failing 0` ならば flaky 0。

### A-3. Hardhat coverage を測定 (任意)

```bash
pnpm --dir tests/fixtures/mint-nft test:hardhat:coverage
```

期待 coverage (PR #185 で達成済の基準)。

| metric | threshold | mint-nft 実測 |
|---|---|---|
| Lines | 90% | 97.70% |
| Statements | 90% | 94.57% |
| Branches | 80% | 83.33% |
| Functions | 90% | 95.24% |

## 動線 B — retrofit walkthrough を 0 から歩く

`examples/mint-nft/{test,hardhat-test}/` は `.gitignore` 対象で git clone 直後は空。 skill chain で test を再生成し、 fixtures 完成形と挙動を比較する。

### B-1. 作業台が空であることを確認

```bash
ls examples/mint-nft/test 2>/dev/null              # 空 or no such directory
ls examples/mint-nft/hardhat-test 2>/dev/null      # 空 or no such directory
git status --short examples/mint-nft/              # 上記 dir は untracked / gitignored
```

### B-2. Layer 1 — 仕様書を生成

```text
/kiwa-design --layer contract --module mint-nft --input examples/mint-nft/contracts/MintNft.sol
```

出力 — `.context/spec/contract/test-spec-mint-nft.md`。 9 column 表で観点 + ケース ID + 入力 + 期待結果が並ぶ。

### B-3. Layer 2 (Foundry) — `/kiwa-forge` で .t.sol を生成

```text
/kiwa-forge --module mint-nft --gas-report
```

skill が以下を実施。

- `.context/spec/contract/test-spec-mint-nft.md` を Read
- 10 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ) を Foundry helper (`vm.prank` / `vm.expectRevert` / `vm.warp` / fuzz / invariant) に変換
- `examples/mint-nft/test/MintNft.t.sol` を Write
- `forge build` + `forge test --gas-report` で動作確認

### B-4. Layer 2 (Hardhat) — `/kiwa-hardhat` で .test.cjs を生成

```text
/kiwa-hardhat --module mint-nft --gas-report
```

skill が以下を実施。

- 同 `.context/spec/contract/test-spec-mint-nft.md` を Read
- 10 観点を chai matchers + `fast-check` + `hardhat-toolbox` に変換
- `examples/mint-nft/hardhat-test/MintNft.test.cjs` を Write
- `npx hardhat test --config hardhat.config.cjs` で動作確認

### B-5. 生成 test を実走

```bash
# Foundry (FOUNDRY_OFFLINE=true は環境次第で必要)
cd examples/mint-nft && FOUNDRY_OFFLINE=true forge test

# Hardhat
pnpm -F examples-mint-nft test:hardhat
```

### B-6. fixtures 完成形と diff 比較

```bash
# Foundry test の diff
diff -r examples/mint-nft/test tests/fixtures/mint-nft/contract-test

# Hardhat test の diff
diff -r examples/mint-nft/hardhat-test tests/fixtures/mint-nft/hardhat-test
```

完成形と完全一致するとは限らない (skill が生成する test の order / 命名は run ごとにブレる)。 重要なのは。

- 観点 1-10 が全て cover されている
- 全 test PASS する
- coverage が threshold (Lines 90% / Branches 80% / Funcs 90%) を満たす

### B-7. coverage 評価

```bash
# Foundry
cd examples/mint-nft && FOUNDRY_OFFLINE=true forge coverage --report summary

# Hardhat
pnpm -F examples-mint-nft test:hardhat:coverage
```

未達なら `.context/spec/contract/test-spec-mint-nft.md` の「不足している仕様」section に未 cover error path / event / 観点を bullet で追記し、 `/kiwa-forge` or `/kiwa-hardhat` を再起動して追加 test を生成する。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Attempted to create a NULL object` panic (Foundry) | macOS system_configuration バグ | `FOUNDRY_OFFLINE=true forge test` で signature lookup を skip |
| `forge-std/Test.sol` not found | lib/forge-std submodule 未取得 | `cd examples/mint-nft && git submodule update --init` |
| Hardhat `Cannot find module` | pnpm install 未実行 or workspace 認識失敗 | repo root で `pnpm install` 再実行 |
| Hardhat 4 round 中 1 round だけ failing | flaky test (時間依存 / 並行依存) | 該当 test の `vm.warp` / `time.increaseTo` を `setUp` で fixture 化 |
| coverage が 80% に届かない | uncovered branch | `solidity-coverage` の output で `I = if-path-not-taken` マーク箇所を確認し、 else 側 / revert path の test を追加 |

## 関連 docs

- 完成形 reference の出自と provenance: `tests/fixtures/mint-nft/README.md`
- retrofit walkthrough 全体 flow (token-gating 題材): `tests/docs/retrofit-existing-dapp.ja.md`
- skill chain tutorial: `tests/docs/skill-chain-tutorial.ja.md`
- dApp e2e test 手順: `tests/docs/run-dapp-e2e-tests.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
