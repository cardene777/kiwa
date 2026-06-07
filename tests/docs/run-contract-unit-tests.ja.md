# Contract unit test を skill で作って実走する手順 (複数 contract 対応)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

自分の dApp project の **contracts/ 配下に複数 contract が並ぶのが標準**。 本手順では `examples/nft-marketplace` (2 contract: `MarketNft.sol` + `SimpleMarketplace.sol`) を題材に、 kiwa の 2-skill chain (`/kiwa-design` → `/kiwa-forge` / `/kiwa-hardhat`) で **全 contract の unit test を一括生成 → 実走** する手順を歩く。 単一 contract dApp (例 mint-nft) は本手順の特殊ケースとして同じ flow で動く。

## kiwa skill の役割分担

| Layer | skill | 担当 | 入力 | 出力 |
|---|---|---|---|---|
| Layer 1 | `/kiwa-design` | **test 仕様書を生成** (機能仕様 → 9 column test case 表) | `contracts/` dir 全体 + 機能仕様 (PRD / docstring) | `.context/spec/contract/test-spec-{module}.md` |
| Layer 2 | `/kiwa-forge` | Layer 1 の test 仕様書を **Foundry test code に変換** | Layer 1 spec + 対象 contract | `test/*.t.sol` (contract ごと 1 file) + `forge test` |
| Layer 2 | `/kiwa-hardhat` | 同じ test 仕様書を **Hardhat test code に変換** | 同上 | `hardhat-test/*.test.cjs` + `hardhat test` + coverage |

**重要 — ユーザーは機能仕様 (PRD) のみ用意、 test 仕様書は kiwa-design が生成**。

## 全体図 (複数 contract の場合)

```mermaid
graph LR
    A[contracts/ <br/>複数 .sol] --> B["/kiwa-design --input contracts/"]
    B --> C[.context/spec/contract/<br/>test-spec-{module}.md]
    C --> D["/kiwa-forge --module {module}"]
    C --> E["/kiwa-hardhat --module {module}"]
    D --> F[test/Contract1.t.sol<br/>test/Contract2.t.sol]
    E --> G[hardhat-test/Contract1.test.cjs<br/>hardhat-test/Contract2.test.cjs]
    F --> H[forge test で全 contract 一括実走]
    G --> I[hardhat test で全 contract 一括実走]
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
│  └─ SimpleMarketplace.sol    (listing / buy / cancel)
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
```

引数の意味。

- `--layer contract` — 出力 path を `.context/spec/contract/` に分岐
- `--module nft-marketplace` — 出力 file 名のキー
- `--input contracts/` — **dir 指定** で複数 contract を一括 parse させる

skill が以下を実施 (期待挙動)。

- `contracts/` 配下の `.sol` 全件を Read
- 各 contract の function / event / error を grep 抽出
- contract 間の依存 (例 `SimpleMarketplace.sol` が `IMarketNft` interface 経由で `MarketNft.sol` を参照) を整理
- 9 section + 9 column 表で test 仕様書を Write、 「対象機能」section に **全 contract の function / event / error を列挙**

出力 — `.context/spec/contract/test-spec-nft-marketplace.md`。 中身を確認。

```bash
# 別 Terminal で確認
cat .context/spec/contract/test-spec-nft-marketplace.md | head -100
```

両 contract (`MarketNft.sol` + `SimpleMarketplace.sol`) の function / event / error が「対象機能」section に列挙されていること、 「テストケース一覧」9 column 表に両 contract のケースが並んでいることを確認。

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

出力は 2 file (`test-spec-market-nft.md` + `test-spec-simple-marketplace.md`) に分かれる。

## Step 4 — Layer 2 (Foundry): `/kiwa-forge` で `.t.sol` を生成

```text
/kiwa-forge --module nft-marketplace --gas-report
```

(Step 3 で contract ごとに module を分けた場合は `/kiwa-forge --module market-nft` + `/kiwa-forge --module simple-marketplace` を順次叩く)

skill が `.context/spec/contract/test-spec-nft-marketplace.md` を Read し、 「対象機能」section の各 contract について `test/{Contract}.t.sol` を Write。 期待出力:

```text
test/
├── MarketNft.t.sol
└── SimpleMarketplace.t.sol
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
└── SimpleMarketplace.test.cjs
```

## Step 6 — 全 contract test を一括実走 (flaky 検査込み)

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# Foundry 全 contract 一括 (forge test は test/ 配下を全件実行)
FOUNDRY_OFFLINE=true forge test
# 期待: 各 contract test が PASS、 合計 N passed, 0 failed

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

未達なら `.context/spec/contract/test-spec-nft-marketplace.md` の「不足している仕様」section に未 cover 箇所を bullet で追記し、 Step 4 / Step 5 を再起動。

## Step 8 — 完成形 fixtures との diff 比較 (答え合わせ)

`tests/fixtures/nft-marketplace/` には完成形 reference が **将来** 置かれる予定 (現在 #218 で実装中)。 fixtures 化済の例として `tests/fixtures/mint-nft/` を参照。

```bash
cd /Users/cardene/Desktop/projects/kiwa

# 例 (mint-nft の場合の diff、 nft-marketplace は #218 完了後に同様)
diff -r examples/nft-marketplace/test tests/fixtures/nft-marketplace/contract-test 2>&1 | head -30
```

完成形と完全一致は期待しない。 重要なのは。

- 全 contract の function / event / error が test 対象に含まれている
- 全 test PASS (Step 6 で確認済)
- coverage が threshold 以上 (Step 7 で確認済)
- contract 間連携 (例 `SimpleMarketplace.list()` が `MarketNft.transferFrom()` を呼ぶ flow) が test されている

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

出力 file は 1 つ (`test/MintNft.t.sol` + `hardhat-test/MintNft.test.cjs`) になる。

## 機能仕様 (PRD / 設計書) を明示的に渡したい場合

contract code だけでなく機能仕様も skill に伝えると test 仕様書の品質が上がる。

```text
/kiwa-design --layer contract --module nft-marketplace --input contracts/

機能仕様 (PRD 代わり):
- MarketNft: ERC721、 owner が mint 可能、 metadata に price / royalty 含む
- SimpleMarketplace: NFT を list / buy / cancel する、 royalty を deployer に送る、 listing 中の NFT は transfer 禁止
- 連携: SimpleMarketplace.list() は IMarketNft.transferFrom() で NFT を escrow、 buy() で買い手に転送
- 失敗 mode: 二重 list / cancel 後の buy / royalty 計算 overflow
```

自分の project の場合は `docs/PRD.md` を同様に prompt 内で参照させる。

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
| skill が「既存 test あり」で skip | `.gitignore` 未設定 | Step 1 確認、 `git rm --cached` で staging から外す |

## 関連 docs

- contract integration test (複数 contract 連携 flow): `tests/docs/run-contract-integration-tests.ja.md`
- dApp e2e test (UI 起点): `tests/docs/run-dapp-e2e-tests.ja.md`
- 完成形 reference (mint-nft): `tests/fixtures/mint-nft/README.md`
- skill chain tutorial (4 skill 連携): `tests/docs/skill-chain-tutorial.ja.md`
- retrofit walkthrough (token-gating 題材): `tests/docs/retrofit-existing-dapp.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Foundry skill: `.claude/skills/kiwa-forge/SKILL.md`
- Layer 2 Hardhat skill: `.claude/skills/kiwa-hardhat/SKILL.md`
