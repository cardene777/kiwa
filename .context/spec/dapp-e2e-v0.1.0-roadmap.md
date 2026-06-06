# spec: kiwa-v0.1.0-roadmap

## タスクサマリ

kiwa (PR #2 merge 済 MVP) を npm v0.1.0 で公開可能な品質に引き上げる。
壁打ち 20260602T134240 で確定した戦略 (anvil 特化 + viem peerDeps 維持 + Synpress 統合せず headless 路線 + EIP-6963 multi-wallet + Changesets/CI/provenance) に基づき、5 つの follow-up Issue (#4-#7 + 将来 #8) を起票して順次実装する roadmap spec。
本 spec は roadmap レベルの整理であり、各 Issue は別途 individual spec を起こす。

## 受入条件 (AC)

- AC 1 (Issue #3 完了): error 正規化 4 + lifecycle 堅牢化 4 + surface clean-up 3 = 11 finding が解消され、vitest 25 + E2E 6 + 新規 negative test 4-8 が全 PASS する
- AC 2 (Issue #4 完了): Changesets で CHANGELOG 自動化 + GH Actions node 20/22 matrix CI + `npm publish --provenance` で v0.1.0 publish 可能な状態になる
- AC 3 (Issue #5 完了): `kiwa init` がユーザー dApp プロジェクトに fixture import 済 `e2e/*.spec.ts` + `playwright.config.ts` + `package.json` script を生成する
- AC 4 (Issue #6 完了): README quickstart + `docs/` 配下に RPC list / event list / error code 一覧 / migration guide が markdown で配置される
- AC 5 (Issue #7 完了): EIP-6963 announce 対応で 1 page 内に複数 wallet (MetaMask / Rabby / Coinbase 名乗り) を並走 inject できる
- AC 6 (v0.1.0 publish): npmjs.com 上で `@kiwa/core` `@kiwa/cli` が v0.1.0 として公開され、`pnpm dlx @kiwa/cli init` が外部プロジェクトで動作する

## スコープ境界

### in (本 roadmap で対応)

| 観点 | in |
|---|---|
| Issue #3 (既存 open) | error 正規化 / lifecycle 堅牢化 / surface clean-up の 11 finding 解消 |
| Issue #4 (新規) | Changesets 導入 / CI matrix / provenance / .npmignore / publish config |
| Issue #5 (新規) | CLI `init` 実装 (template + Playwright config + scripts 生成) |
| Issue #6 (新規) | README quickstart + docs/RPC.md / docs/EVENTS.md / docs/ERRORS.md / docs/MIGRATION.md |
| Issue #7 (新規、v0.2 目玉) | EIP-6963 multi-injection announce 対応 |
| 依存方針 | viem ^2 peerDeps 維持、core runtime に zero runtime dep |
| publish 方針 | v0.x freely breaking + CHANGELOG 明記、v1.0 で strict semver |
| testing | vitest core 80%+ coverage、E2E playwright 全 wallet 経路 |

### out (本 roadmap で対応しない)

| 観点 | out |
|---|---|
| 実 MetaMask 拡張統合 (Synpress 経路) | 将来 Issue #8、Synpress 4.1.2 と棲み分け確定済み |
| WalletConnect v2 統合 | v1.0 以降 (relay 経路で E2E mock 困難) |
| vitepress / docusaurus site 化 | v1.0 以降、md + GitHub Pages で代替 |
| CLI `record` (操作録画 → test 生成) | Playwright codegen で代替可、実装しない |
| CLI `run` (ラッパー) | `pnpm exec playwright test` で代替、実装しない |
| viem 削除 + 独自実装 (RLP / signer / RPC client) | ROI なし、壁打ち論点 2 で却下 |
| 各 wallet 個別 class 化 (Rabby class / Coinbase class) | EIP-6963 で label のみ差別化、論点 4 で却下 |
| assertion DSL (`toBeMined` / `toEmit`) | 旧 Issue D 候補、本 roadmap には含まない (将来別 Issue) |
| Hardware wallet (Ledger / Trezor) | 永続的 Non-Goal |
| EIP-4337 Smart Account | 永続的 Non-Goal |
| Solidity unit test 統合 | 永続的 Non-Goal (forge test で十分) |

## 反例ケース (動かないはず・対象外)

- 反例 1: Synpress と機能を完全に重ねた実 MetaMask 拡張統合は Issue #8 (将来) であり、本 roadmap (#3〜#7) では実装されない。Synpress を peer dependency に追加する PR は reject 対象
- 反例 2: viem 以外の runtime dep を core に追加する PR は壁打ち論点 2 違反、reject 対象 (zero runtime dep 方針)
- 反例 3: CLI に `record` / `run` を実装する PR は壁打ち論点 5 違反、reject 対象 (Playwright codegen / 標準実行で代替)
- 反例 4: vitepress / docusaurus 等の専用 doc site 構築は v1.0 以降、本 roadmap では md + GitHub Pages 止まり
- 反例 5: wallet 種別ごとに別 class (e.g. `RabbyWallet`, `CoinbaseWallet`) を作る PR は論点 4 違反、EIP-6963 で label のみ差別化が正解
- 反例 6: v0.x で strict semver 運用する PR は論点 8 違反 (v0.x は freely breaking + CHANGELOG 明記が正解)

## 影響範囲 (touched file 候補)

本 roadmap は 5 Issue にまたがるため、各 Issue で個別 spec を立てて影響範囲を再算出する。
ここでは概観として roadmap 全体の touched file を列挙する。

### Issue #3 (既存、最優先) — 11 finding 解消

- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/{rpc-handlers,tx,anvil,fixture,injector-script}.ts` 修正
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/*.test.ts` 新規 negative test 追加
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/{package.json,tests/connect.spec.ts}` viem deps 移動 + negative test 追加
- `/Users/cardene/Desktop/projects/kiwa/README.md` personal_sign hex policy 明示

### Issue #4 (新規) — Changesets + CI + provenance

- `/Users/cardene/Desktop/projects/kiwa/.changeset/config.json` 新規
- `/Users/cardene/Desktop/projects/kiwa/.changeset/README.md` 新規
- `/Users/cardene/Desktop/projects/kiwa/.github/workflows/ci.yml` 新規 (node 20/22 matrix)
- `/Users/cardene/Desktop/projects/kiwa/.github/workflows/release.yml` 新規 (Changesets publish + provenance)
- `/Users/cardene/Desktop/projects/kiwa/.npmignore` 新規 (or `files` field 整備)
- `/Users/cardene/Desktop/projects/kiwa/package.json` scripts (`changeset` / `release` 追加)
- `/Users/cardene/Desktop/projects/kiwa/packages/{core,cli}/package.json` publishConfig + provenance flag
- `/Users/cardene/Desktop/projects/kiwa/CHANGELOG.md` 自動生成

### Issue #5 (新規) — CLI `init`

- `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/index.ts` argv dispatch 追加 (doctor + init)
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/commands/init.ts` 新規
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/templates/playwright.config.ts.tpl` 新規
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/src/templates/connect.spec.ts.tpl` 新規
- `/Users/cardene/Desktop/projects/kiwa/packages/cli/tests/init.test.ts` 新規

### Issue #6 (新規) — README + docs/

- `/Users/cardene/Desktop/projects/kiwa/README.md` 全面書き直し (quickstart + features + comparison)
- `/Users/cardene/Desktop/projects/kiwa/docs/RPC.md` 新規 (10 RPC + anvilProxy fallback 一覧)
- `/Users/cardene/Desktop/projects/kiwa/docs/EVENTS.md` 新規 (4 event + DappE2eApi)
- `/Users/cardene/Desktop/projects/kiwa/docs/ERRORS.md` 新規 (EIP-1193 code 一覧 + error envelope 設計)
- `/Users/cardene/Desktop/projects/kiwa/docs/MIGRATION.md` 新規 (v0.x → v0.y breaking change tracking)
- `/Users/cardene/Desktop/projects/kiwa/docs/COMPARISON.md` 新規 (Synpress / wallet-mock との比較)

### Issue #7 (新規) — EIP-6963 announce

- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/injector-script.ts` EIP-6963 announce event 追加
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/types.ts` Eip6963ProviderInfo 追加
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/fixture.ts` option で wallet info (name/icon/rdns) 受取
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/eip6963.test.ts` 新規

合計概算 — 約 35-40 file (Issue #3 で 6 file + Issue #4 で 8 file + Issue #5 で 5 file + Issue #6 で 6 file + Issue #7 で 4 file)。各 Issue 5-8 file 程度の単発 PR scope に収まる。

## 既知のリスク・前提

### 依存方針の前提

- viem ^2 は dApp エコシステム de facto (wagmi / RainbowKit / Ethers 代替の主流)、peerDeps 維持で host app の version 一元化を許容
- core runtime に viem 以外の dep を入れない (zero runtime dep)、devDeps + peerDeps 二段構成は AC 8 で機械検証可能
- 独自実装 (RLP / signer / RPC client) は viem 数千行の再実装相当で ROI なし

### Synpress / wallet-mock との棲み分け

- Synpress 4.1.2 active、実 MetaMask UI 検証は Synpress に任せる
- wallet-mock (johanneskares) は EIP-6963 + viem Account/Transport、Hardhat 寄り
- kiwa の差別化軸 = 「anvil ベース fork chain testing 特化の headless E2E fixture」、Synpress (実 wallet) / wallet-mock (mock) と補完関係
- 機能重複を避けるため、本 roadmap では実 MetaMask 統合と WalletConnect は意図的に除外

### publish 方針 (semver v0.x)

- v0.x は patch / minor で freely breaking 許容、CHANGELOG で明示
- v1.0 以降 strict semver、API 確定後
- Changesets で PR 単位 changelog 自動化、monorepo (pnpm workspace) と相性良好
- npm 2FA + `--provenance` 有効化、supply chain 安全性向上

### Issue 順序依存

- Issue #3 (error 正規化 + lifecycle) は public API contract に直結するため最優先、未対応 publish は v0.2 で breaking 必至
- Issue #4 (Changesets + CI) は #3 merge 後すぐ着手、publish 基盤を整える
- Issue #5 (CLI init) は #3 merge 後並列着手可能、CLI は public API に絡まない
- Issue #6 (README + docs/) は #3 + #5 merge 後、template path / RPC list 等が確定してから
- Issue #7 (EIP-6963) は v0.1.0 publish 後の v0.2 目玉、本 roadmap 完了の最終ステップ

### 粒度判定

本 spec の AC 数: 6 / 影響範囲 file 概算: 35-40 file / 推定実装時間: 5 Issue × 0.5-2 日 = 約 1 週間。
**判定: 赤 (分割必須)**、本 spec は roadmap として 5 Issue に分割する。各 Issue で個別 spec を起こす。

### Issue ごとの個別 spec 起票方針

本 roadmap spec は方針整理であり、各 Issue 着手前に以下を実施:

1. 着手 Issue の個別 spec を `.context/spec/issue-{N}-{slug}.md` で起こす (10-15 分)
2. AC 3-5 件 / 反例 3 件 / 影響範囲 5-8 file の単発 Issue 粒度に収める
3. `/issue-plan` で個別 Issue 起票 → `/tdd → /impl → /parallel-review → /verify → PR`

これにより各 PR が独立 merge 可能、roadmap 全体は 1 週間程度で v0.1.0 publish 到達可能。

### 後続 Issue 候補 (本 roadmap 完了後)

- Issue #8 (将来): 実 wallet 対応検討 / Synpress 連携 doc / WalletConnect v2 (v0.2 以降、要再評価)
- Issue D (旧 Issue #1 後続): assertion DSL (`expect.extend` で `toBeMined` / `toEmit` 等)、別 roadmap で扱う

## 次ステップ

1. 本 roadmap spec を `/issue-plan` で **4 件の Issue (#4 #5 #6 #7) として起票** (Issue #3 は既存)
2. Issue #3 (既存) から実装開始 → 個別 spec → TDD → PR
3. 各 Issue 完了後に v0.1.0 publish 判定 (Issue #4 完了で publish 基盤確定、Issue #3+#5+#6 完了で publish 実施)
4. v0.1.0 publish 後に Issue #7 (EIP-6963) で v0.2 リリース
