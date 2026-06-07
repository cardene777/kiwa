# dApp e2e test 実走手順 (Playwright + viem)

> [🇬🇧 English](./run-dapp-e2e-tests.md) • [🇯🇵 日本語](./run-dapp-e2e-tests.ja.md)

`examples/mint-nft` の ERC721 mint flow を題材に、 Playwright + viem (`@kiwa/core` fixture) で dApp e2e test を実走する手順。 2 つの動線を持つ。

- **動線 A — 完成形 reference を実走**: `tests/fixtures/mint-nft/e2e-test/mint.spec.ts` の完成形 spec を pnpm 経由で走らせ、 期待件数 (8/8) と挙動を確認する
- **動線 B — retrofit walkthrough を 0 から歩く**: `examples/mint-nft/tests/` を空 dir 状態から `/kiwa-design` + `/kiwa-play` の skill chain で spec を再生成し、 fixtures 完成形と diff 比較する

## 前提条件

repo root で以下が揃っていること。

```bash
# 1. 依存 install
pnpm install

# 2. Playwright browser を install (初回 + Playwright update 時)
pnpm --dir tests/fixtures/mint-nft exec playwright install chromium

# 3. Foundry (anvil) が PATH 上
anvil --version    # anvil x.y.z

# 4. Node.js 22+
node --version     # v22.x.x
```

`@kiwa/core` build 状態確認 (fixture が dApp test で使われる)。

```bash
pnpm -F @kiwa/core build      # packages/core を build
```

## 動線 A — 完成形 reference を実走

`tests/fixtures/mint-nft/` は独立 pnpm workspace で、 examples 側に影響せず完結する。

### A-1. Playwright test を実走 (8/8 期待)

```bash
pnpm --dir tests/fixtures/mint-nft test:e2e
```

期待出力末尾。

```text
  ✓  1 [chromium] › e2e-test/mint.spec.ts:156:3 › mint-nft e2e (ERC721 mint flow) › T-MN-001 contract deploy + connect で account 表示 (X.Xs)
  ✓  2 [chromium] › e2e-test/mint.spec.ts:165:3 › ... T-MN-002 mint で totalSupply が 1 増え、 Transfer event が emit ...
  ✓  3 [chromium] › e2e-test/mint.spec.ts:199:3 › ... T-MN-003 batchMint(addr, 3) で 3 NFT が mint され、 owner enumerate が連番になる ...
  ✓  4 [chromium] › e2e-test/mint.spec.ts:241:3 › ... T-MN-004 mint → transfer で minter balance=0 / recipient balance=1 ...
  ✓  5 [chromium] › e2e-test/mint.spec.ts:261:3 › ... T-MN-005 MAX_SUPPLY 到達後の mint は MaxSupplyReached(uint256) で revert ...
  ✓  6 [chromium] › e2e-test/mint.spec.ts:297:3 › ... T-MN-006 royaltyInfo(1, 1 ether) は deployer receiver と 5% royalty を返す ...
  ✓  7 [chromium] › e2e-test/mint.spec.ts:314:3 › ... T-MN-007 supportsInterface が ERC165 / ERC721 / ERC721Enumerable / EIP-2981 を返す ...
  ✓  8 [chromium] › e2e-test/mint.spec.ts:331:3 › ... T-MN-008 batchMint の extreme count は MaxSupplyReached(uint256) で revert ...

  8 passed (10.4s)
```

### A-2. flaky 検査 (4 round 連続実走)

```bash
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm --dir tests/fixtures/mint-nft test:e2e 2>&1 | tail -3
done
```

4 round 全て `8 passed` で failing 0 ならば flaky 0。 1 round でも failing 出たら該当 test を確認 (timing 依存 / anvil 状態リーク / port 衝突)。

### A-3. headed mode で見ながら実走 (debug 用)

```bash
pnpm --dir tests/fixtures/mint-nft exec playwright test --headed
```

chromium が立ち上がり click や入力が見える。 debug 中の test の前に `await page.pause()` を入れれば inspector が起動する。

### A-4. specific test だけ実走

```bash
# テスト名で filter
pnpm --dir tests/fixtures/mint-nft exec playwright test --grep "T-MN-002"

# file 指定
pnpm --dir tests/fixtures/mint-nft exec playwright test e2e-test/mint.spec.ts:165
```

## 動線 B — retrofit walkthrough を 0 から歩く

`examples/mint-nft/tests/` は `.gitignore` 対象で git clone 直後は空。 skill chain で spec を再生成し、 fixtures 完成形と挙動を比較する。

### B-1. 作業台が空であることを確認

```bash
ls examples/mint-nft/tests 2>/dev/null              # 空 or no such directory
git status --short examples/mint-nft/               # tests/ は untracked / gitignored
```

### B-2. Layer 1 — e2e 用仕様書を生成

```text
/kiwa-design --layer e2e --module mint-nft --input examples/mint-nft/
```

skill が以下を実施。

- `examples/mint-nft/contracts/MintNft.sol` と `app/page.tsx` (もしくは inline HTML fixture) の対応関係を抽出
- contract event と UI 表示要素の対応を整理
- 観点別 (UI 表示 / wallet 接続 / contract 呼び出し / state 反映 / error 表示) で test ケースを生成

出力 — `.context/spec/e2e/test-spec-mint-nft.md`。

### B-3. Layer 2 — `/kiwa-play` で spec を生成

```text
/kiwa-play --mode new --example mint-nft
```

skill が以下を実施。

- `.context/spec/e2e/test-spec-mint-nft.md` を Read
- 観点を Playwright + `@kiwa/core` fixture (anvil 自動起動 / wallet inject / contract deploy) に変換
- `examples/mint-nft/tests/mint.spec.ts` を Write
- `pnpm test:e2e` を 4 round 連続実走して flaky 0 検証

### B-4. 生成 spec を実走

```bash
cd examples/mint-nft && pnpm test
```

`prepare-env.ts` が anvil 起動 + contract deploy を行い、 Playwright が chromium で UI flow を実行する。

### B-5. fixtures 完成形と diff 比較

```bash
diff -r examples/mint-nft/tests tests/fixtures/mint-nft/e2e-test
```

完成形と完全一致するとは限らない (skill が生成する spec の test ID 順序や assert 文字列は run ごとにブレる)。 重要なのは。

- 完成形 8 件 (T-MN-001 〜 T-MN-008) の観点が cover されている
- 全 test PASS する
- 4 round 連続 PASS (flaky 0)

### B-6. extend mode — 既存 spec に追加 test を生成

retrofit walkthrough で既存 e2e test がある場合 (例 nextjs-token-gating)、 `/kiwa-play --mode extend` で既存 spec を **上書きせず追記** できる。

```text
/kiwa-play --mode extend --example mint-nft
```

skill が既存 8 件を「現状カバー」として認識し、 不足観点 (例: 権限 partial 検証 / multi-tab race / event re-emit) を新規 test (TC-NNN) として追記する。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Executable doesn't exist at .../chrome-headless-shell` | Playwright bundled chromium 未 install | `pnpm --dir tests/fixtures/mint-nft exec playwright install chromium` |
| `ReferenceError: require is not defined in ES module scope` | package.json に `"type": "module"` 欠落 | fixtures 側は対応済、 自前 workspace で出たら追加 |
| `Cannot find module '@kiwa/core'` | `@kiwa/core` build 未実行 | `pnpm -F @kiwa/core build` |
| anvil port 衝突 (`EADDRINUSE: 8545`) | 別の anvil daemon が稼働中 | `pkill -f anvil` or `lsof -ti :8545 \| xargs kill` |
| Playwright timeout (test がハング) | UI 要素 selector ミス / anvil tx 滞留 | `--debug` で playwright inspector を起動 + `page.pause()` で停止点設定 |
| flaky test (1 round だけ failing) | timing 依存 / state リーク | `test.describe.serial` を使う / fixture で `beforeEach` で state reset |
| `Error: connect ECONNREFUSED 127.0.0.1:8545` | anvil 未起動 (prepare-env.ts 失敗) | `node --import tsx tests/prepare-env.ts` 単独実行で error log 確認 |

## 関連 docs

- 完成形 reference の出自と provenance: `tests/fixtures/mint-nft/README.md`
- retrofit walkthrough 全体 flow (token-gating 題材): `tests/docs/retrofit-existing-dapp.ja.md`
- skill chain tutorial: `tests/docs/skill-chain-tutorial.ja.md`
- contract test 手順 (Foundry + Hardhat): `tests/docs/run-contract-tests.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- `@kiwa/core` fixture 仕様: `packages/core/src/fixture.ts`
