# dApp e2e test を skill で作って実走する手順 (UI 起点、 フロント画面操作のみ test)

> 🇯🇵 日本語のみ (英語版は本手順をローカルで検証した後に追加予定)

dApp の e2e test は **フロントエンド (UI) 起点**。 ユーザーが画面で操作可能な箇所だけを test 対象にし、 「画面に出ているボタン / form / 表示要素」 → 「裏で wallet / contract に何が起きるか」 → 「画面更新 / error 表示」 の往復を検証する。

⚠️ **重要 — 何を test しないか**

- フロントから呼ばれない contract function (admin only / internal helper / owner 移管) は test 対象外 → これらは `tests/docs/run-contract-unit-tests.ja.md` (contract unit test) で cover
- contract 間連携 scenario (token mint → stake → vote の chain) は test 対象外 → `tests/docs/run-contract-integration-tests.ja.md` (contract integration test) で cover
- 視覚 regression (色 / レイアウト) は範囲外 (別途 visual regression tool で test)

**dApp e2e は「ユーザーが画面でできる操作」だけが対象**。

## kiwa skill の役割分担

| Layer | skill | 担当 | 入力 | 出力 |
|---|---|---|---|---|
| Layer 1 | `/kiwa-design` | **e2e test 仕様書を生成** (UI / UX flow → 9 column test case 表) | `app/` (UI code) + 機能仕様 (PRD / 画面設計書) | `.context/spec/e2e/test-spec-{feature}.md` |
| Layer 2 | `/kiwa-play` | Layer 1 の test 仕様書を **Playwright spec に変換** | spec + `app/` + `@kiwa/core` fixture | `tests/*.spec.ts` + helper + `playwright test` 実走 |

**`/kiwa-design` への入力は `app/` (UI code) が起点、 contract code ではない**。 UI から呼ばれる contract 機能のみが skill によって test 対象に含まれる。

## dApp e2e で test すべき観点

UI 起点で考えると test 対象は以下に絞られる。

| 観点 | 例 |
|---|---|
| 画面表示 (初期 state) | 「mint ページを開くと button が表示」「wallet 未接続時に Connect ボタンが出る」 |
| wallet 接続 / 切替 | 「Connect 押下で wallet popup」「切断後に Connect ボタンに戻る」「別 account に切替で残高表示が更新」 |
| chain 切替 | 「Polygon 選択時に network 表示が更新」「未対応 chain で warning 表示」 |
| form 入力 → validation | 「mint 数量 0 で button disabled」「上限超過で error 表示」 |
| button click → tx 署名 | 「Mint 押下で wallet 署名 popup → 承認で tx 送信」 |
| tx 実行 → 画面更新 | 「tx confirmed 後 balance が +1」「Transfer event が UI list に追加」 |
| tx 失敗 → error 表示 | 「revert 時 error toast 表示」「user reject 時 popup 閉じる」 |
| multi-tab / multi-account | 「タブ A で mint → タブ B の balance も更新」 (subscription 経路がある場合) |
| loading state | 「tx 送信中 button が spinner 表示」「成功後 元 state に戻る」 |
| 表示計算 (front 側) | 「balance × price = total 表示が正しく計算」 (contract には触らない、 表示計算のみ) |

**フロントから呼ばれない contract function は test しない** — admin function / pause / owner 移管 / internal helper 等は contract unit test 側で cover。

## 全体図

```mermaid
graph LR
    A[app/ UI code] --> B["/kiwa-design --layer e2e<br/>--input app/"]
    B --> C[.context/spec/e2e/<br/>test-spec-{feature}.md]
    C --> D["/kiwa-play --mode new<br/>--rounds 4"]
    D --> E[tests/{feature}.spec.ts<br/>+ helper file]
    E --> F[playwright test で実走]
    F --> G[fixtures と diff 比較]
```

## 前提イメージ — dApp project の構成

```text
my-dapp-frontend/                       ← cd して claude 起動
├─ app/
│  ├─ page.tsx                         ← Home / 主要操作画面
│  ├─ mint/page.tsx                    ← mint 画面 (例)
│  ├─ stake/page.tsx                   ← staking 画面 (例)
│  └─ components/
│     ├─ ConnectButton.tsx             ← wallet 接続
│     └─ MintForm.tsx                  ← mint form
├─ contracts/MyToken.sol               ← (e2e の input には含めない、 contract test の対象)
├─ docs/PRD.md (or 画面設計書)         ← UX flow / 画面仕様
├─ playwright.config.ts
├─ package.json
└─ (tests/ はまだ無い)
```

nft-marketplace の場合:

```text
examples/nft-marketplace/
├─ app/page.tsx           ← マーケットプレイス UI (list 表示 / buy button)
├─ contracts/             ← (e2e 入力には含めない)
└─ ...
```

mint-nft の場合は `app/page.tsx` 1 file + inline HTML fixture。

## Step 0 — 前提環境

```bash
# 1. dApp project dir に移動 (nft-marketplace の場合)
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# 2. monorepo root で依存 install
cd /Users/cardene/Desktop/projects/kiwa && pnpm install
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# 3. @kiwa/core を build (e2e fixture が使う)
cd /Users/cardene/Desktop/projects/kiwa && pnpm -F @kiwa/core build
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace

# 4. Foundry (anvil) が PATH 上 — e2e は anvil 経由で contract を deploy する
anvil --version

# 5. Node.js 22+
node --version

# 6. Playwright chromium を install
pnpm exec playwright install chromium
```

## Step 1 — tests/ dir が空 (or 未存在) であることを確認

```bash
pwd    # examples/nft-marketplace
ls tests 2>&1            # "No such file" or 空
grep -E "^tests/" .gitignore   # gitignored であること
```

## Step 2 — Claude Code 起動

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/nft-marketplace
claude
```

## Step 3 — Layer 1: `/kiwa-design` で e2e 仕様書を生成 (UI 起点)

claude prompt で以下を叩く。

```text
/kiwa-design --layer e2e --module marketplace --input app/

UX flow:
- ユーザーが marketplace を開く → listing 一覧表示
- listing カードを click → 詳細表示
- Buy 押下 → wallet 署名 → tx 送信 → 成功で listing から消える
- Connect ボタン → wallet 接続 → account address 表示
- 未接続時に Buy ボタンが disabled

画面要素 (data-testid):
- listing-card / buy-button / connect-button / account-display

機能仕様 (PRD): tests/fixtures/nft-marketplace/README.md (将来) または下記要約
- marketplace は SimpleMarketplace.list() で登録された NFT の一覧を表示
- buy は SimpleMarketplace.buy(listingId) を叩き、 royalty 分配を含む tx を送信
- error 表示: revert reason を toast で表示
```

引数の意味。

- `--layer e2e` — 出力 path を `.context/spec/e2e/` に分岐
- `--module marketplace` — 機能単位 (画面 / UX flow の単位、 contract 単位ではない)
- `--input app/` — **UI code を起点に渡す** (contract は含めない)

skill が以下を実施 (期待挙動)。

- `app/` 配下を Read して `<button>` / `<form>` / `<input>` / `data-testid` を grep
- UI から呼ばれている wagmi hook (`useReadContract` / `useWriteContract`) を逆引きして対象 contract function を特定
- prompt 内の UX flow を test ケースに変換
- contract function のうち UI から呼ばれないものは **test 対象外** として明示 (「対象機能」section に「UI 露出 function のみ」と注記)
- 9 column 表で test 仕様書を Write、 「期待結果」column は **UI 表示 / wallet state / 画面遷移** を中心に記述

出力 — `.context/spec/e2e/test-spec-marketplace.md`。

```bash
cat .context/spec/e2e/test-spec-marketplace.md | head -100
```

「対象機能」section に **画面 / UX flow** が列挙されていること、 contract function は UI 経由のもののみが対象になっていることを確認。

## Step 4 — Layer 2: `/kiwa-play --mode new` で spec を生成

```text
/kiwa-play --mode new --rounds 4
```

skill が以下を実施。

- Step 3 で生成した `.context/spec/e2e/test-spec-marketplace.md` を Read
- `app/` を再度 Read して UI 要素 selector (`data-testid` / `role`) を確定
- 各 test ケースを Playwright + `@kiwa/core` fixture (anvil 自動起動 / wallet inject / 必要 contract のみ deploy) に変換
- `tests/marketplace.spec.ts` を Write
- `tests/prepare-env.ts` / `tests/fixture.ts` / `tests/global-setup.ts` 等 helper を生成 (必要 contract を deploy する logic 込み)
- `--rounds 4` で 4 round 連続実走して flaky 0 検証

完了すると claude が test 件数 / PASS 数 / 4 round 結果を報告。

## Step 5 — 生成 spec を手動実走 (flaky 検査込み)

```bash
cd /Users/cardene/Desktop/projects/kiwa

# 単発
pnpm -F examples-nft-marketplace test
# 期待: N passed (XX.Xs)

# 4 round 連続で flaky 検査
for r in 1 2 3 4; do
  echo "=== Round $r ==="
  pnpm -F examples-nft-marketplace test 2>&1 | tail -3
done
```

### headed mode で見ながら実走 (debug 用)

```bash
pnpm -F examples-nft-marketplace exec playwright test --headed
```

### specific test だけ実走

```bash
pnpm -F examples-nft-marketplace exec playwright test --grep "Buy"
pnpm -F examples-nft-marketplace exec playwright test tests/marketplace.spec.ts:120
```

## Step 6 — 完成形 fixtures との diff 比較

```bash
cd /Users/cardene/Desktop/projects/kiwa
diff -r examples/nft-marketplace/tests tests/fixtures/nft-marketplace/e2e-test 2>&1 | head -30
```

完成形と完全一致は期待しない。 重要なのは。

- UI から操作可能な全 flow が cover されている
- 全 test PASS / 4 round 連続 PASS

## 単一画面 dApp の場合 (mint-nft 等)

`examples/mint-nft` のような単一画面 dApp も同じ flow で動く。

```bash
cd /Users/cardene/Desktop/projects/kiwa/examples/mint-nft
claude
```

```text
/kiwa-design --layer e2e --module mint --input app/

UX flow:
- ユーザーが mint ページを開く → Connect 押下で wallet 接続
- Mint 押下 → wallet 署名 → tx 送信 → 成功で balance 表示 +1
- royaltyInfo 表示確認 (deployer + 5%)
- MAX_SUPPLY 到達後の mint 試行 → revert toast 表示
```

```text
/kiwa-play --mode new --rounds 4
```

出力 `tests/mint.spec.ts` 1 file (画面が 1 つだけのため)。

## 複数画面 dApp の場合 (大規模 dApp)

```text
my-large-dapp/app/
├─ page.tsx        ← Home
├─ mint/           ← mint 画面
├─ stake/          ← staking 画面
├─ governance/     ← 投票画面
└─ profile/        ← user profile
```

画面ごとに `--module` を分けて skill chain を回す。

```bash
# 各画面ごとに spec + test 生成
for feature in mint stake governance profile; do
  # claude 内で順次:
  # /kiwa-design --layer e2e --module $feature --input app/$feature/
  # /kiwa-play --mode new --rounds 4
  echo "Run e2e skill chain for $feature"
done
```

画面横断 flow (例 mint → stake → vote の連続 UX) は別 module `--module cross-feature-flow` で扱う。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `Layer 1 spec が未生成` で `/kiwa-play` が停止 | Step 3 の `/kiwa-design` を skip | Step 3 を先に |
| `Executable doesn't exist at .../chrome-headless-shell` | Playwright chromium 未 install | `pnpm exec playwright install chromium` |
| `ReferenceError: require is not defined` | package.json に `"type": "module"` 欠落 | package.json に追加 |
| `Cannot find module '@kiwa/core'` | `@kiwa/core` build 未実行 | monorepo root で `pnpm -F @kiwa/core build` |
| anvil port 衝突 (`EADDRINUSE: 8545`) | 別 anvil daemon 稼働中 | `pkill -f anvil` |
| Playwright timeout (test hang) | UI selector ミス / anvil tx 滞留 | `--debug` で inspector 起動 + `page.pause()` |
| 1 round だけ failing | timing 依存 / state リーク | `test.describe.serial` / fixture で `beforeEach` で state reset |
| `Error: connect ECONNREFUSED 127.0.0.1:8545` | anvil 未起動 (`prepare-env.ts` 失敗) | `node --import tsx tests/prepare-env.ts` 単独実行で error 確認 |
| 不要な contract function が test 対象に含まれる | UI から呼ばれないものまで kiwa-design が拾った | Step 3 prompt で「UI 露出 function のみ」を明示、 または spec の「対象機能」 section を手で削る |
| UI 起点なのに contract test と被る | `--layer e2e` を `--layer contract` と混同 | layer 引数を確認、 e2e 用は `.context/spec/e2e/` 配下に出る |

## 自分の dApp project で使うときの注意

機能仕様 (PRD / 画面設計書) を `/kiwa-design` の prompt 内で参照させると spec 品質が上がる。 e2e に必要な情報は以下:

- UX flow (画面遷移 / button click / form 入力 / 結果表示)
- 画面要素一覧 (data-testid / button label / form field 名)
- error 表示 patterns (revert 時 / user reject 時 / network 失敗時)
- wallet 接続前提 (connect 必須画面 / optional 画面)
- multi-tab / multi-account 想定の有無
- loading state の見せ方 (spinner / disabled button / overlay)

## 関連 docs

- contract unit test (各 contract 単独): `tests/docs/run-contract-unit-tests.ja.md`
- contract integration test (複数 contract 連携): `tests/docs/run-contract-integration-tests.ja.md`
- skill chain tutorial (4 skill 連携): `tests/docs/skill-chain-tutorial.ja.md`
- retrofit walkthrough (token-gating 題材): `tests/docs/retrofit-existing-dapp.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md`
- Layer 2 Playwright skill: `.claude/skills/kiwa-play/SKILL.md`
- `@kiwa/core` fixture 仕様: `packages/core/src/fixture.ts`
