# Contract 群の test を skill で作って実走する手順 (Foundry + Hardhat)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

自分の dApp project の **contracts/ 配下に複数 contract が並ぶのが標準**。 本手順では `examples/nft-marketplace` (2 contract: `MarketNft.sol` + `SimpleMarketplace.sol`) を題材に、 kiwa の 2-skill chain (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat`) で **contract 群の test を一括生成 → 実走** する手順を歩く。 単一 contract dApp (例 mint-nft) は本手順の特殊ケースとして同じ flow で動く。

## test に含めるもの / 含めないもの

| 含める | 含めない |
|---|---|
| 各 contract の function / event / error (正常系 / 異常系 / 境界値 / fuzz / invariant / 権限 / security 等 10 観点) | フロントエンド (UI) の操作 → `tests/docs/run-dapp-e2e-tests.ja.md` |
| **複数 contract の連携 scenario** (例 NFT mint → marketplace に list → buy → royalty 分配) は **主体 contract の test file の中に setUp で関連 contract を deploy して書く** | 視覚 regression / a11y |
| 例外的に大規模な cross-cutting flow (3+ contract をまたぐ governance 等) は別 file (`test/CrossFlow.t.sol`) を追加 (任意) | |

**連携 scenario を別 file (Integration.t.sol) に分けるのは Foundry/Hardhat の一般慣習ではない**。 主体 contract の test file 内で setUp で関連 contract を deploy し、 同 file 内で scenario test を書く方が標準的 (nft-marketplace 完成形 fixtures もこの構造)。

## kiwa skill の役割分担

| Layer | skill | 担当 | 入力 | 出力 |
|---|---|---|---|---|
| Layer 1 | `/kiwa-design` | **test 仕様書を生成** (機能仕様 → 9 column test case 表) | `contracts/` dir 全体 + 機能仕様 (PRD / docstring) | `.context/spec/contract/test-spec-{module}.md` |
| Layer 2 | `/kiwa-forge` | Layer 1 の test 仕様書を **Foundry test code に変換** | Layer 1 spec + 対象 contract | `test/*.t.sol` (contract ごと 1 file、 連携 scenario も同 file) + `forge test` |
| Layer 2 | `/kiwa-hardhat` | 同じ test 仕様書を **Hardhat test code に変換** | 同上 | `hardhat-test/*.test.cjs` + `hardhat test` + coverage |

**重要 — ユーザーは機能仕様 (PRD) のみ用意、 test 仕様書は kiwa-design が生成**。

## 全体図 (複数 contract の場合)

```mermaid
graph LR
    A["contracts/<br/>複数 .sol"] --> B["/kiwa-design --input contracts/"]
    B --> C[".context/spec/contract/<br/>test-spec-MODULE.md<br/>連携 scenario 含む"]
    C --> D["/kiwa-forge --module MODULE"]
    C --> E["/kiwa-hardhat --module MODULE"]
    D --> F["test/Contract1.t.sol<br/>test/Contract2.t.sol<br/>各 file 内に setUp で関連 contract deploy + scenario test"]
    E --> G["hardhat-test/Contract1.test.cjs<br/>hardhat-test/Contract2.test.cjs"]
    F --> H["forge test で全 contract 一括実走"]
    G --> I["hardhat test で全 contract 一括実走"]
```

## 前提イメージ — 自分の dApp project の構成

```text
my-defi-app/                            ← Terminal で cd して claude を起動する dir
├─ contracts/
│  ├─ MyToken.sol
│  ├─ MyStaking.sol
│  └─ MyGovernance.sol                 ← /kiwa-design の --input は contracts/ dir
├─ docs/PRD.md (or 設計書)              ← (任意) /kiwa-design に補助情報として渡す
├─ foundry.toml
├─ hardhat.config.cjs
├─ package.json
├─ lib/forge-std/
└─ (test/ や hardhat-test/ はまだ無い)
```

nft-marketplace の場合:

```text
examples/nft-marketplace/
├─ contracts/
│  ├─ MarketNft.sol            (ERC721 + 売買 metadata)
│  └─ SimpleMarketplace.sol    (listing / buy / cancel — MarketNft を escrow)
├─ ...
```

## Step 0 — 前提環境

```bash
# 1. dApp project dir に移動 (nft-marketplace の場合)
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# 2. monorepo root で依存 install
cd /Users/cardene/Desktop/projects/kiwa && pnpm install
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# 3. Foundry が PATH 上
forge --version
anvil --version

# 4. Node.js 22+ (Hardhat 用)
node --version
```

## Step 1 — test dir が空 or 未存在であることを確認

```bash
pwd    # examples/nft-marketplace
ls test 2>&1            # "No such file" or 空
ls hardhat-test 2>&1    # "No such file" or 空
grep -E "^(test|hardhat-test)/" .gitignore   # gitignored であること
```

## Step 2 — その dir で Claude Code を起動

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
claude
```

## Step 3 — Layer 1: `/kiwa-design` で test 仕様書を生成 (contracts/ dir を渡す)

claude prompt で以下を叩く。

```text
/kiwa-design --layer contract --module nft-marketplace --input contracts/

機能仕様 (PRD 代わり):
- MarketNft: ERC721、 owner が mint 可能、 metadata に price / royalty 含む
- SimpleMarketplace: NFT を list / buy / cancel する、 royalty を deployer に送る、 listing 中の NFT は transfer 禁止
- 連携 scenario: SimpleMarketplace.list() は IMarketNft.transferFrom() で NFT を escrow、 buy() で買い手に転送
- 失敗 mode: 二重 list / cancel 後の buy / royalty 計算 overflow / listing 中の直接 transfer
```

引数の意味。

- `--layer contract` — 出力 path を `.context/spec/contract/` に分岐
- `--module nft-marketplace` — 出力 file 名のキー
- `--input contracts/` — **dir 指定** で複数 contract を一括 parse させる

skill が以下を実施 (期待挙動)。

- `contracts/` 配下の `.sol` 全件を Read
- 各 contract の function / event / error を grep 抽出
- contract 間の依存 (例 `SimpleMarketplace.sol` が `IMarketNft` interface 経由で `MarketNft.sol` を参照) を整理
- prompt 内 「連携 scenario」 を test ケースに変換し、 主体 contract (例 `SimpleMarketplace`) の test 仕様の中に含める
- 9 section + 9 column 表で test 仕様書を Write

出力 — `.context/spec/contract/test-spec-nft-marketplace.md`。

```bash
# 別 Terminal で確認
cat .context/spec/contract/test-spec-nft-marketplace.md | head -100
```

確認ポイント:

- 両 contract (`MarketNft.sol` + `SimpleMarketplace.sol`) の function / event / error が「対象機能」 section に列挙されている
- 連携 scenario (mint → list → buy 等) が `SimpleMarketplace` 側のテストケースに含まれている
- 連携 scenario の「前提条件」 column に「MarketNft deployed and approved」等の multi-contract setup が記述

### `/kiwa-design` が複数 contract をうまく扱えない場合の fallback

現 skill 仕様の挙動は dir 渡しで全件 parse される **想定** だが、 実挙動を試した結果に応じて以下の fallback がある。

| 結果 | fallback |
|---|---|
| dir 指定で 2 contract parse OK | 本手順のまま、 1 spec に集約 |
| dir 指定で片方しか parse されない | 各 contract ごとに module を分けて起動 (下記参照) |
| dir 指定でエラー | 各 contract ごとに module を分けて起動 |

contract ごとに module を分ける場合:

```text
/kiwa-design --layer contract --module market-nft --input contracts/MarketNft.sol
/kiwa-design --layer contract --module simple-marketplace --input contracts/SimpleMarketplace.sol
```

出力は 2 file (`test-spec-market-nft.md` + `test-spec-simple-marketplace.md`) に分かれる。 連携 scenario は `simple-marketplace` 側 (主体 contract) に書く。

## Step 4 — Layer 2 (Foundry): `/kiwa-forge` で `.t.sol` を生成

```text
/kiwa-forge --module nft-marketplace --gas-report
```

(Step 3 で contract ごとに module を分けた場合は `/kiwa-forge --module market-nft` + `/kiwa-forge --module simple-marketplace` を順次叩く)

skill が `.context/spec/contract/test-spec-nft-marketplace.md` を Read し、 「対象機能」 section の各 contract について `test/{Contract}.t.sol` を Write。 期待出力:

```text
test/
├── MarketNft.t.sol          ← MarketNft の function / event / error 単体 test
└── SimpleMarketplace.t.sol  ← SimpleMarketplace 単体 + 連携 scenario (setUp で MarketNft も deploy + approve)
```

連携 scenario は `SimpleMarketplace.t.sol` 内に以下のような構造で variant される。

```solidity
contract SimpleMarketplaceTest is Test {
    MarketNft public nft;
    SimpleMarketplace public market;
    address public seller = address(0x1);
    address public buyer = address(0x2);

    function setUp() public {
        // 連携 setup — 関連 contract も deploy + link
        nft = new MarketNft();
        market = new SimpleMarketplace(address(nft));
        // 初期 mint + approve (scenario test 用の baseline state)
        vm.prank(seller);
        nft.mint(seller, 1);
        vm.prank(seller);
        nft.setApprovalForAll(address(market), true);
    }

    // 単体 test (SimpleMarketplace.list の正常系)
    function test_List_HappyPath() public { ... }

    // 連携 scenario (mint → list → buy)
    function test_Scenario_MintListBuy_End2End() public {
        vm.prank(seller);
        market.list(1, 1 ether);
        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buy{value: 1 ether}(1);
        assertEq(nft.ownerOf(1), buyer);
    }

    // 連携 scenario (listing 中の直接 transfer は revert)
    function test_Scenario_DirectTransferDuringListing_Reverts() public { ... }
}
```

完了すると claude が contract ごとに test 件数 / PASS 数 / coverage を報告。

### macOS で panic する場合

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
FOUNDRY_OFFLINE=true forge test
```

## Step 5 — Layer 2 (Hardhat): `/kiwa-hardhat` で `.test.cjs` を生成

```text
/kiwa-hardhat --module nft-marketplace --gas-report
```

期待出力:

```text
hardhat-test/
├── MarketNft.test.cjs
└── SimpleMarketplace.test.cjs   ← 連携 scenario も同 file 内
```

## Step 6 — 全 test を一括実走 (flaky 検査込み)

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# Foundry 全 contract 一括 (forge test は test/ 配下を全件実行)
FOUNDRY_OFFLINE=true forge test
# 期待: 各 contract test (単体 + 連携 scenario) が PASS、 合計 N passed, 0 failed

# Hardhat 全 contract 一括 (4 round で flaky 検査)
cd /Users/cardene/Desktop/projects/kiwa
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm -F examples-nft-marketplace test:hardhat 2>&1 | grep -E "passing|failing"
done
# 期待: 各 round N passing, failing 0
```

4 round 全て `failing 0` で合格。

### 特定 contract だけ実走

```bash
# Foundry — file 指定
FOUNDRY_OFFLINE=true forge test --match-path test/MarketNft.t.sol

# Hardhat — file 指定
pnpm -F examples-nft-marketplace exec hardhat test hardhat-test/MarketNft.test.cjs --config hardhat.config.cjs
```

### 連携 scenario だけ実走

```bash
# Foundry — test 関数名で filter
FOUNDRY_OFFLINE=true forge test --match-test "test_Scenario_"

# Hardhat — describe / it block 名で grep
pnpm -F examples-nft-marketplace exec hardhat test --grep "Scenario"
```

## Step 7 — Coverage 評価 (threshold 確認)

```bash
# Foundry — 全 contract 一括 coverage
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
FOUNDRY_OFFLINE=true forge coverage --report summary

# Hardhat — 全 contract 一括 coverage
cd /Users/cardene/Desktop/projects/kiwa
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

期待 threshold:

| metric | threshold |
|---|---|
| Lines | 90% |
| Statements | 90% |
| Branches | 80% |
| Functions | 90% |

連携 scenario test を含むので、 単体のみより branch coverage が上がる (contract A → B → C の分岐が cover される)。

未達なら `.context/spec/contract/test-spec-nft-marketplace.md` の「不足している仕様」 section に未 cover 箇所を bullet で追記し、 Step 4 / Step 5 を再起動。

## Step 8 — 完成形 fixtures との diff 比較 (答え合わせ)

`tests/fixtures/nft-marketplace/` には完成形 reference が **将来** 置かれる予定 (現在 Issue #218 で実装中)。 fixtures 化済の例として `tests/fixtures/mint-nft/` を参照。

```bash
cd /Users/cardene/Desktop/projects/kiwa

# 例 (mint-nft の場合の diff、 nft-marketplace は #218 完了後に同様)
diff -r examples/mint-nft/test tests/fixtures/mint-nft/contract-test 2>&1 | head -30
```

完成形と完全一致は期待しない。 重要なのは。

- 全 contract の function / event / error が test 対象に含まれている
- 連携 scenario が主体 contract test file に含まれている
- 全 test PASS (Step 6 で確認済)
- coverage が threshold 以上 (Step 7 で確認済)

## 単一 contract dApp の場合 (mint-nft 等)

本手順は複数 contract が default だが、 単一 contract dApp (mint-nft = 1 contract のみ) でも同じ flow で動く。

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/mint-nft
claude
```

```text
/kiwa-design --layer contract --module mint-nft --input contracts/
/kiwa-forge --module mint-nft
/kiwa-hardhat --module mint-nft
```

出力 file は 1 つ (`test/MintNft.t.sol` + `hardhat-test/MintNft.test.cjs`)。 連携 scenario は 1 contract のみなので発生しない。

## 例外的な cross-cutting flow (3+ contract 横断、 任意)

大規模 DeFi protocol で 3+ contract をまたぐ複雑 flow (例 token mint → staking deposit → governance vote → reward claim) を test したい場合、 別 file `test/CrossFlow.t.sol` (Foundry) や `hardhat-test/CrossFlow.test.cjs` (Hardhat) を追加するパターンもある。 ただし dApp の多くは「主体 contract test file 内の連携 scenario」 で十分。

別 file を作る判断基準:
- 3+ contract をまたぐ
- 主体 contract が決められない (どの contract の test に属するか不明確)
- scenario が大量 (10+ 件) で 1 file が肥大化する

別 file を追加する場合は `/kiwa-design --module cross-flow` で別 module として spec を生成し、 同じ flow で `/kiwa-forge --module cross-flow` を回す。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Layer 1 spec が未生成` で `/kiwa-forge` が停止 | Step 3 の `/kiwa-design` を skip した | Step 3 を先に実行 |
| `/kiwa-design --input contracts/` で片方の contract しか parse されない | 現 skill が dir 渡し未対応の可能性 | Step 3 の fallback (contract ごと module 分割) を使う |
| `Attempted to create a NULL object` panic (Foundry) | macOS system_configuration バグ | `FOUNDRY_OFFLINE=true forge test` |
| `forge-std/Test.sol` not found | lib/forge-std submodule 未取得 | `git submodule update --init` |
| Hardhat `Cannot find module` | pnpm install 未実行 | monorepo root で `pnpm install` |
| 1 round だけ failing (flaky) | 時間依存 / state リーク | `setUp` で snapshot / `time.increaseTo` を fixture 化 |
| coverage threshold 未達 | uncovered branch | Layer 1 spec の「不足している仕様」に追記 → Step 4/5 再起動 |
| 連携 scenario test が setUp 失敗 | constructor 引数の順序 / address 渡し漏れ | 生成 .t.sol の `setUp()` を Read、 contract のコンストラクタ仕様と突き合わせて修正 |
| skill が「既存 test あり」で skip | `.gitignore` 未設定 | Step 1 確認、 `git rm --cached` で staging から外す |

## 関連 docs

- dApp e2e test (UI 起点): `tests/docs/run-dapp-e2e-tests.ja.md`
- 完成形 reference (mint-nft): `tests/fixtures/mint-nft/README.md`
- skill chain tutorial (4 skill 連携): `tests/docs/skill-chain-tutorial.ja.md`
- retrofit walkthrough (token-gating 題材): `tests/docs/retrofit-existing-dapp.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
