# @kiwa-test/core

## 0.1.2

### Patch Changes

- c856f93: README の v7 promo gif (10fps / 800px / 4.5-4.7MB、 npm camo 5MB 制限内) と 3 経路 brand statement (`@kiwa-test/forge` + `@kiwa-test/core` + 手書き) 言及を npm registry に届けるための patch bump。 code 変更なし、 README の同期目的のみ。

  詳細は PR #326 (v7 fix commit e401595) を参照。

## 0.1.1

### Patch Changes

- a713753: 公式 logo を packages/{core,cli}/README header に追加して npm package page で表示できるようにした。

  assets/kiwa-logo.png を repo に配置し、 packages/{core,cli}/README.{md,ja.md} の冒頭に `<p align="center">` で中央寄せ logo を挿入。 npm package page は repo の相対 path を解決できないため、 raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-logo.png の絶対 URL で参照する。 logo は黒緑 2 色で「際 (boundary)」 を体現するキャラクター design、 brand identity を確立する目的の patch release。 機能 / API 変更なし。

## 0.1.0

### Minor Changes

- 40dc74b: `@kiwa-test/cli` の `init` 命令に 4 option (`--testDir <path>` / `--config-suffix <name>` / `--script-key <key>` / `--with-deploy <foundry-path>`) を追加 (#150 / #154)。
  既存 Playwright 構成を持つ project への共存導入と、Foundry boilerplate (`tests/prepare-env.ts` / `global-setup.ts` / `global-teardown.ts` / `fixture.ts`) の自動生成が可能になった。
  `@kiwa-test/core` の `RpcContext` に opt-in `rejectConnect` flag を追加し、 `setApprovalMode('reject')` 時に `eth_requestAccounts` を EIP-1193 code 4001 で reject 可能に (#156)。 `eth_accounts` は read-only として従来挙動を維持し下位互換を保つ。 `WalletApi` / `DappE2eApi` に `setRejectConnect(enabled)` setter を expose。
- 4104571: Issue #4 — Changesets + GitHub Actions CI (node 20/22 matrix) + npm publish provenance による v0.1.0 publish 基盤を確立。
  各 package に publishConfig (access public + provenance true) + repository + license MIT + keywords を追加し、`.npmignore` と `files: ["dist"]` で公開 tarball を dist のみに限定。
  本 changeset は次回 release.yml 起動時の version PR に集約され、v0.0.0 → v0.1.0 bump の起点となる (実 publish は NPM_TOKEN 配布後)。
- 40dc74b: Phase F-1 第 1 弾として `/kiwa-hardhat` skill の動作実証範囲を 1 example (mint-nft) から 3 example に拡張 (#187)。
  `examples/defi-swap` と `examples/nextjs-token-gating` に Hardhat 最小構成 (`hardhat.config.cjs` + `hardhat-test/*.test.cjs`) を追加し、 Foundry .t.sol と並立する Hardhat 経路を実証。
  両 example で 4 round 連続 PASS (flaky 0) と coverage 80%+ (defi-swap Stmts/Funcs/Lines 100% + Branch 87.5%、 token-gating Lines/Funcs 100% + Branch 88.89%) を達成。
- 40dc74b: Phase F-1 第 2 弾として `/kiwa-hardhat` skill の動作実証範囲を 3 example から 4 example に拡張 (#197)。
  最も複雑な market 系 contract (listing + offer + royalty payout + offer invalidation) を持つ `examples/nft-marketplace` に Hardhat 構成を追加し、 MarketNft (ERC721 + ERC2981) 21 件 + SimpleMarketplace 30 件を観点 6 系統で網羅。
  4 round 連続 PASS (flaky 0) + coverage Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25% で全 metric 80%+ を達成し、 F-1 (mint-nft / defi-swap / token-gating / nft-marketplace 4 例 Hardhat 並立) を完遂。
