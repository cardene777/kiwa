# @kiwa-lab/cli

## 2.0.2

### Patch Changes

`kiwa init` が生成する project が型検査を通らなかった。 2 つの欠陥。

#### 1. `tsconfig.json` が、 `init` が書いた file を対象にしない

```
$ npx @kiwa-lab/cli@2.0.1 init
$ npm install && npx tsc --noEmit -p tsconfig.json
error TS18003: No inputs were found in config file 'tsconfig.json'.
  Specified 'include' paths were '["tests/**/*.ts"]'.
```

template の `include` は `tests/**/*.ts` だけを指す。 `init` が必ず書く `e2e/connect.spec.ts` と `playwright.config.ts` は、 既定でも `--with-deploy` でも対象外だった。 既定 mode では対象 file が 0 件になる。

`include` を `["e2e/**/*.ts", "tests/**/*.ts", "playwright.config.ts"]` に修正した。 `T-INIT-111` が「`init` が書いた `.ts` file を `include` が全部拾う」 を両 mode で検査する。 literal と比べず、 書かれた file 一覧と glob を突き合わせる。

#### 2. `prepare-env.ts` が存在しない引数で `deployContract` を呼ぶ

`include` を広げたことで、 この template が初めて型検査を受けた。

```
tests/prepare-env.ts(42,5): error TS2353: Object literal may only specify known
properties, and 'rpcUrl' does not exist in type 'DeployContractOptions<Abi>'.
```

`deployContract` は `{ account, wallet, publicClient, abi, bytecode, args }` を取る。 template は `{ rpcUrl, privateKey, abiPath, args }` を渡していた。 旧 API の形で、 いつ変わったのかは記録に無い。 名前は export され続けていたので、 「import 先が実在するか」 の検査では捕まらない。

template を現行 API に書き直した。 forge の artifact から `abi` と `bytecode.object` を読み、 `viem` の wallet / public client を組んで渡す。

`T-INIT-103` が `DeployContractOptions` の key と template が渡す key を突き合わせる。 `rpcUrl` を戻すと落ちる。

#### 確認

build した `init` を空 dir で実行し、 `npm install` の後に `tsc --noEmit` を走らせた。 既定 mode と `--with-deploy` の両方で exit 0。

## 2.0.1

### Patch Changes

`kiwa init` が生成する project が install できなかった。 2 つの欠陥。

#### 1. 生成される `package.json` が存在しない版を要求する

```
$ npx @kiwa-lab/cli init
$ npm install
npm error code ETARGET
npm error notarget No matching version found for @kiwa-lab/dapp@^0.1.0.
```

v2.0 の一斉改名で `@kiwa-lab/dapp` は `2.0.0` に上がったが、 `init` が書き込む範囲は `^0.1.0` のまま据え置かれた。 `^0.1.0` はどの公開版とも一致しない。

`packages/cli` 自身の test は `'^0.1.0'` を literal で assert していた。 欠陥を、 それを捕まえるはずの test が固定していた。

範囲を `^2.0.0` に修正し、 test は `packages/dapp/package.json` の版が範囲を満たすことを検査する形に変えた (`T-INIT-053`)。 literal を繰り返さない。 `packages/dapp` を上げても、 範囲を戻しても落ちる。

#### 2. 生成される spec が存在しない package を import する

`src/templates/` の 3 枚が `@kiwa-test/dapp` を import していた。 v2.13 で離れた npm scope で、 生成される `package.json` は `@kiwa-lab/dapp` を宣言する。

template dir を拡張子を問わず走査する test を追加した (`T-INIT-101` / `T-INIT-102`)。 `.tpl` を見逃した拡張子 filter が原因だった。

#### 確認

build した `init` を空 dir で実行し、 `npm install` を空の cache で走らせた。 exit 0、 生成物の 3 import (`@playwright/test` / `@kiwa-lab/dapp` / `viem`) がすべて解決する。

## 1.0.1

### Patch Changes

- 32a6c10: 📦 11 packages initial v1.0.x npm publish (改名後初回)。

  PR #476 で `@kiwa-lab/core` ↔ `@kiwa-lab/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

  本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

  ## 影響範囲

  - 旧 `@kiwa-lab/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
  - 旧 `@kiwa-lab/spec` は廃止 (`@kiwa-lab/core` に統合)
  - 新 `@kiwa-lab/dapp` (404 → v1.0.1 として初公開)
  - 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
  - v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

  ## 確認方法

  ```bash
  npm view @kiwa-lab/core version    # → 1.0.1
  npm view @kiwa-lab/dapp version    # → 1.0.1 (新規公開)
  npm view @kiwa-lab/e2e version     # → 1.0.1
  npm view @kiwa-lab/a11y version    # → 1.0.1
  npm view @kiwa-lab/visual version  # → 1.0.1
  ```

## 0.3.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.

## 0.3.0

### Minor Changes

- 465a82b: v6 完全版 — spec → test 自動変換 + 実 Chromium UI mode + E2E adapter + watch daemon + 統合 PoC

  ## 新規

  ### @kiwa-lab/e2e v0.1.0 (新設)

  - `setupE2eEnv({ app | staticHtml, browser, initialPath })` ... 実 HTTP server を free port で起動 + Playwright (chromium/firefox/webkit) headless で navigate
  - `BrowserPageHandle` / `BrowserLocator` / `startServer` を export
  - @playwright/test を optional peer dep

  ### @kiwa-lab/ui browser mode (minor)

  - `setupBrowserComponentEnv({ ui, browser, headless })` ... React 要素を SSR renderToStaticMarkup + Playwright 実 Chromium に load
  - 既存 jsdom 経路は変更なし
  - @playwright/test を optional peer dep に追加

  ### @kiwa-lab/cli (minor)

  - `kiwa spec-to-test --in {spec.md} --out {test.ts} [--layer {layer}]` ... markdown 9 column を実 vitest test code に変換 (api / ui / data / cli 全 layer 対応)
  - `kiwa run --watch [--layer L]...` ... 複数 layer を並列 vitest watch daemon として spawn (default unit api ui、 --dry-run で plan 確認)

  ## PoC

  - `examples/full-stack-poc/` 新設 ... Todo + REST API 1 つで unit / integration / ui / e2e / observability 5 layer 全 PASS、 実 Chromium 含む

## 0.2.0

### Minor Changes

- dacbc69: v0.2.0 — vitest helper / anvil state load / anvil pool / transport timeout

  新規 helper と API を追加した minor release。
  既存 API の後方互換は完全維持、 追加機能のみ。

  ## 新規機能

  ### @kiwa-lab/dapp

  - `setupTestEnv` / `withAnvil` ... vitest test 内で mock 経路 (anvil 不起動) と 実 anvil 経路 (clean / state-load) を同 API で切替 (#350)
  - `StartAnvilOptions.loadState` / `dumpState` ... anvil の `--load-state` / `--dump-state` flag を透過、 deploy + setup を 1 回だけ実行して state.json を一括コピペ可能 (#350)
  - `createAnvilPool` / `AnvilPool` / `AnvilLease` ... N 個事前 spawn + borrow / release lease API + `anvil_reset` 再利用で 0 ms 取得 (#354)
  - `setupTestEnv({ pool })` ... pool 経由経路の opt-in、 `anvil` option と排他 (#354)
  - `TxBroadcastCtx.transportTimeoutMs` / `transportRetryCount` ... viem http transport の timeout / retry を制御、 fail-fast (#356)

  ### @kiwa-lab/cli

  - `kiwa anvil seed <script> --out <path>` ... seed script で deploy + setup を 1 回実行 → anvil 終了時に `--dump-state` で chain 状態を一括書出する CLI sub-command (#350)

  ## 高速化

  - anvil ready polling 100 ms → 25 ms に短縮、 clean 起動が 107.7 ms → 32.3 ms (70 % 短縮、 #354)
  - anvil pool 経由の borrow + release が 0 ms (#354)
  - test file 並列実行 (`--no-file-parallelism` 撤去、 #354)
  - `startAnvilCluster` を `Promise.allSettled` で並列 spawn 化 (#356)
  - `sendTransaction` の transport timeout を明示化、 invalid-port test が 2.1 s → 200 ms (#356)
  - 結果として `pnpm -C packages/core test` の実行時間は 9.47 s → 2.67 s (72 % 短縮)

  ## 関連 PR

  - #350 vitest helper + anvil state load + seed CLI
  - #352 skill SSOT (kiwa-vitest / kiwa-api) 追記
  - #354 anvil 起動高速化 + test 並列化 + anvil pool
  - #356 tx transport timeout + cluster 並列 spawn
  - #357 release 準備 (本 PR)

## 0.1.2

### Patch Changes

- c856f93: README の v7 promo gif (10fps / 800px / 4.5-4.7MB、 npm camo 5MB 制限内) と 3 経路 brand statement (`@kiwa-lab/forge` + `@kiwa-lab/dapp` + 手書き) 言及を npm registry に届けるための patch bump。 code 変更なし、 README の同期目的のみ。

  詳細は PR #326 (v7 fix commit e401595) を参照。

## 0.1.1

### Patch Changes

- a713753: 公式 logo を packages/{core,cli}/README header に追加して npm package page で表示できるようにした。

  assets/kiwa-logo.png を repo に配置し、 packages/{core,cli}/README.{md,ja.md} の冒頭に `<p align="center">` で中央寄せ logo を挿入。 npm package page は repo の相対 path を解決できないため、 raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png の絶対 URL で参照する。 logo は黒緑 2 色で「際 (boundary)」 を体現するキャラクター design、 brand identity を確立する目的の patch release。 機能 / API 変更なし。

## 0.1.0

### Minor Changes

- 40dc74b: `@kiwa-lab/cli` の `init` 命令に 4 option (`--testDir <path>` / `--config-suffix <name>` / `--script-key <key>` / `--with-deploy <foundry-path>`) を追加 (#150 / #154)。
  既存 Playwright 構成を持つ project への共存導入と、Foundry boilerplate (`tests/prepare-env.ts` / `global-setup.ts` / `global-teardown.ts` / `fixture.ts`) の自動生成が可能になった。
  `@kiwa-lab/dapp` の `RpcContext` に opt-in `rejectConnect` flag を追加し、 `setApprovalMode('reject')` 時に `eth_requestAccounts` を EIP-1193 code 4001 で reject 可能に (#156)。 `eth_accounts` は read-only として従来挙動を維持し下位互換を保つ。 `WalletApi` / `DappE2eApi` に `setRejectConnect(enabled)` setter を expose。
- 4104571: Issue #4 — Changesets + GitHub Actions CI (node 20/22 matrix) + npm publish provenance による v0.1.0 publish 基盤を確立。
  各 package に publishConfig (access public + provenance true) + repository + license MIT + keywords を追加し、`.npmignore` と `files: ["dist"]` で公開 tarball を dist のみに限定。
  本 changeset は次回 release.yml 起動時の version PR に集約され、v0.0.0 → v0.1.0 bump の起点となる (実 publish は NPM_TOKEN 配布後)。
