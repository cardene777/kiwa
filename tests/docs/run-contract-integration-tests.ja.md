# Contract integration test を skill で作って実走する手順 (複数 contract 連携 flow)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

複数 contract が連携する dApp で、 **contract 間の scenario / state 遷移 / 失敗 rollback** を test する手順。 unit test (各 contract の function 単位) と別 layer として扱う。

例えば DeFi protocol で 「token を mint → staking で stake → reward を claim」 という 3 contract をまたぐ flow は **1 contract の unit test では検証不能**。 mint 後の balance が staking 側 contract から正しく見えるか、 reward 計算が token transfer 順序に依存しないか、 等を integration test で検証する。

## unit test との違い

| 観点 | unit test (`run-contract-unit-tests.ja.md`) | integration test (本 docs) |
|---|---|---|
| 対象 | 各 contract の function / event / error 単独 | 複数 contract をまたぐ scenario |
| deploy | `setUp()` で 1 contract のみ deploy | `setUp()` で関連 contract 全件 deploy + 初期 link |
| test 命名 | `test_{Function}_HappyPath` | `test_Scenario_{Flow}_End2End` |
| 観点 | 10 観点 (正常系 / 異常系 / 境界値 / fuzz / invariant / 権限 / security 等) | state 遷移 / 失敗 rollback / 順序依存 / 連携 |
| 失敗時の意味 | 該当 contract の bug | contract 間の **連携仕様** の bug (例 interface mismatch / 順序前提崩れ) |

## 全体図

```mermaid
graph LR
    A[contracts/ 複数 .sol] --> B["/kiwa-design --layer integration<br/>--module {feature}-flow<br/>--input contracts/"]
    B --> C[.context/spec/integration/<br/>test-spec-{feature}-flow.md]
    C --> D["/kiwa-forge --module {feature}-flow"]
    C --> E["/kiwa-hardhat --module {feature}-flow"]
    D --> F[test/{Feature}Flow.t.sol<br/>= multi-contract scenario]
    E --> G[hardhat-test/{Feature}Flow.test.cjs]
    F --> H[forge test で scenario 実走]
    G --> I[hardhat test で scenario 実走]
```

## 前提イメージ — 連携が発生する dApp の構成

```text
my-defi-app/                            ← cd して claude 起動
├─ contracts/
│  ├─ MyToken.sol         ← ERC20
│  ├─ MyStaking.sol       ← MyToken を stake、 reward を mint
│  └─ MyGovernance.sol    ← stake 量で voting power
├─ docs/PRD.md            ← scenario / state 遷移仕様
└─ test/ hardhat-test/    ← unit test と integration test が並ぶ
   ├─ MyToken.t.sol       ← unit (run-contract-unit-tests)
   ├─ MyStaking.t.sol     ← unit
   ├─ MyGovernance.t.sol  ← unit
   └─ StakingFlow.t.sol   ← integration (本 docs で生成)
```

nft-marketplace の場合:

```text
examples/nft-marketplace/contracts/
├─ MarketNft.sol         ← ERC721
└─ SimpleMarketplace.sol ← MarketNft を escrow / sell / cancel
```

integration scenario 例 — 「mint NFT → list on marketplace → buy → royalty 分配 → cancel listing → re-list」

## Step 0 — 前提環境

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
cd /Users/cardene/Desktop/projects/kiwa && pnpm install
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
forge --version
node --version
```

## Step 1 — unit test が先に生成済であることを確認 (推奨)

integration test は unit test の上位 layer。 unit test が PASS していないと integration test の失敗原因切り分けが困難。

```bash
# unit test が test/ に存在
ls test/*.t.sol 2>&1
# 既存なら一旦 PASS 確認
FOUNDRY_OFFLINE=true forge test 2>&1 | tail -3
```

unit test 未生成なら `tests/docs/run-contract-unit-tests.ja.md` を先に歩いて unit test を作る。

## Step 2 — Claude Code 起動

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
claude
```

## Step 3 — Layer 1: `/kiwa-design --layer integration` で integration 仕様書を生成

claude prompt で以下を叩く。

```text
/kiwa-design --layer integration --module marketplace-flow --input contracts/

scenario として以下を test 仕様書に含めてください:
1. mint NFT → list on marketplace → buyer が buy → seller balance + royalty が deployer に届く
2. mint NFT → list → cancel → 再 list → buy
3. mint NFT → list → 別 buyer が同 NFT を duplicate buy 試行 → 2 番目は revert
4. mint NFT → list → seller が NFT を直接 transfer 試行 → revert (escrow 中)
5. mint NFT → list → buyer が異 chain で buy 試行 → revert (chain mismatch)
```

引数の意味。

- `--layer integration` — 出力 path を `.context/spec/integration/` に分岐 (unit と別 dir)
- `--module marketplace-flow` — 機能単位 (contract 単位ではなく **scenario 群の単位**)
- `--input contracts/` — 連携する contract 全件を skill に渡す
- scenario の列挙 — prompt 内に具体 flow を書いて skill に伝える (PRD に書いてあれば prompt 内で参照)

skill が以下を実施 (期待挙動)。

- `contracts/` 配下の `.sol` 全件を Read
- 各 contract の function / event を整理し、 **contract 間で呼び出される function を抽出** (例 `SimpleMarketplace.list()` が `MarketNft.transferFrom()` を呼ぶ)
- prompt 内 scenario を test ケースに変換 (9 column 表で 1 scenario = 1 行以上)
- 「対象機能」section に「連携 contract = MarketNft + SimpleMarketplace」「scenario = 5 種」と明示

出力 — `.context/spec/integration/test-spec-marketplace-flow.md`。

```bash
cat .context/spec/integration/test-spec-marketplace-flow.md | head -100
```

「テストケース一覧」9 column 表に各 scenario の TC が並んでいること、 「前提条件」column に「MarketNft + SimpleMarketplace deployed and linked」等の multi-contract setup が記述されていることを確認。

## Step 4 — Layer 2 (Foundry): `/kiwa-forge` で integration `.t.sol` を生成

```text
/kiwa-forge --module marketplace-flow --gas-report
```

(注 — Layer 2 skill が `--layer integration` 経由の spec を読めるかは現 skill 仕様次第。 もし `.context/spec/contract/` のみ読む実装なら、 spec file を手で `cp` するか skill 修正が必要)

skill が以下を実施。

- `.context/spec/integration/test-spec-marketplace-flow.md` を Read
- `setUp()` で 関連 contract 全件 deploy + link (例 `SimpleMarketplace` constructor に `MarketNft.address` を渡す)
- 各 scenario を `test_Scenario_{Flow}_End2End()` 関数として variant
- `test/MarketplaceFlow.t.sol` を Write
- `forge test --gas-report` で実行

期待出力:

```text
test/
├── MarketNft.t.sol           ← unit (run-contract-unit-tests で生成)
├── SimpleMarketplace.t.sol   ← unit
└── MarketplaceFlow.t.sol     ← integration (本 step で生成)
```

## Step 5 — Layer 2 (Hardhat): `/kiwa-hardhat` で integration `.test.cjs` を生成

```text
/kiwa-hardhat --module marketplace-flow --gas-report
```

期待出力:

```text
hardhat-test/
├── MarketNft.test.cjs
├── SimpleMarketplace.test.cjs
└── MarketplaceFlow.test.cjs
```

## Step 6 — 全 test (unit + integration) を一括実走

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# Foundry — unit + integration 一括
FOUNDRY_OFFLINE=true forge test
# 期待: unit M passed + integration N passed, 0 failed

# Hardhat — unit + integration 一括 (4 round flaky 検査)
cd /Users/cardene/Desktop/projects/kiwa
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm -F examples-nft-marketplace test:hardhat 2>&1 | grep -E "passing|failing"
done
```

### integration test だけ実走

```bash
# Foundry
FOUNDRY_OFFLINE=true forge test --match-path test/MarketplaceFlow.t.sol

# Hardhat
pnpm -F examples-nft-marketplace exec hardhat test hardhat-test/MarketplaceFlow.test.cjs --config hardhat.config.cjs
```

## Step 7 — Coverage 評価

integration test を加えると branch coverage が上がる (unit で cover しきれない「contract A → B → C」分岐が cover される)。

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
FOUNDRY_OFFLINE=true forge coverage --report summary

cd /Users/cardene/Desktop/projects/kiwa
pnpm -F examples-nft-marketplace test:hardhat:coverage
```

unit + integration 合算で threshold (Lines 90% / Stmts 90% / Branches 80% / Funcs 90%) を満たすこと。

## 典型 integration scenario の観点

| 観点 | 例 | test 設計のポイント |
|---|---|---|
| 順序依存 | mint → list → buy の順序を入れ替えると revert | 順序ごとに test 関数を分ける、 `vm.expectRevert` で各順序の失敗 mode を明示 |
| state 遷移 | NFT が `Owned → Listed → Sold` を辿る | state machine 図を `setUp` コメントに書き、 各 state 間 transition を 1 test = 1 transition で test |
| 失敗 rollback | buy 中に royalty 送金失敗 → 全 tx rollback | `vm.expectRevert` で全体 revert を assert、 deploy 後 state が初期に戻ることを確認 |
| 連携契約 (interface) | `SimpleMarketplace` が `IMarketNft.transferFrom()` を呼ぶ | interface 経由呼び出しの mock を `MockMarketNft` で差し替えて assert |
| 認可境界 | seller のみ cancel 可能 | 他 address からの cancel 試行 → revert |
| 並行 scenario (同一 NFT への複数 list 試行) | 2 user が同時 list → 1 件成功 1 件 revert | `vm.startPrank` で user 切替、 順序での結果差を assert |
| reentrancy | buy の royalty 送金時に攻撃 contract が再 entry | `ReentrancyAttacker` を別 contract で deploy、 `nonReentrant` modifier の動作を assert |

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Layer 1 spec が未生成` で `/kiwa-forge` が停止 | Step 3 の `/kiwa-design --layer integration` を skip した | Step 3 を先に |
| `/kiwa-forge` が `.context/spec/integration/` を読まない | skill が `.context/spec/contract/` のみ Read する実装 | spec file を手で `cp .context/spec/integration/test-spec-X.md .context/spec/contract/test-spec-X.md` するか、 skill 修正 |
| setUp で deploy 失敗 (Address conflict / invalid interface) | constructor 引数の順序 / address 渡し漏れ | 生成 .t.sol の `setUp()` を Read、 contract のコンストラクタ仕様と突き合わせて修正 (Step 3 spec の「前提条件」を確認) |
| scenario test が flaky | tx ordering の前提崩れ | `vm.warp` / `vm.roll` で block 時刻を固定、 setUp で snapshot |
| coverage が unit と integration で重複カウントされない | `forge coverage` が file 単位の集計 | 想定挙動、 unit + integration の合算で threshold を見る |
| integration 失敗の原因が unit か interface か切り分け不可 | unit test PASS を先に確認していない | Step 1 の unit test PASS を先に確保 |

## 関連 docs

- contract unit test (各 contract 単独): `tests/docs/run-contract-unit-tests.ja.md`
- dApp e2e test (UI 起点): `tests/docs/run-dapp-e2e-tests.ja.md`
- skill chain tutorial (4 skill 連携): `tests/docs/skill-chain-tutorial.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
