# Migration guide (日本語)

> [🇬🇧 English](./MIGRATION.md) • [🇯🇵 日本語](./MIGRATION.ja.md)

## 🎨 Rebrand notice (2026-06): dapp-e2e → kiwa

本プロジェクトは `dapp-e2e` から **`kiwa`** (際) にリブランドしました。
「際」(きわ) = 境界 / 限界 / 端 → 境界値テストの本質を体現する名前です。
旧名から来た利用者向けに以下の対応表で移行できます。

### 旧 → 新 対応表

| 種別 | 旧名 | 新名 |
|---|---|---|
| npm package (fixture) | `@dapp-e2e/core` | `@kiwa-test/core` |
| npm package (CLI) | `@dapp-e2e/cli` | `@kiwa-test/cli` |
| CLI bin | `dapp-e2e` | `kiwa` |
| init command | `pnpm dlx @dapp-e2e/cli init` | `pnpm dlx @kiwa-test/cli init` |
| import fixture | `import { dappE2eTest } from '@dapp-e2e/core'` | `import { dappE2eTest } from '@kiwa-test/core'` (関数名は維持) |
| GitHub repo | `cardene777/dapp-e2e` | `cardene777/kiwa` (旧 URL は自動 redirect) |
| Claude Code skill 名 | `test-design` / `contract-test-foundry` / `contract-test-hardhat` / `dapp-e2e-test` | `kiwa-design` / `kiwa-forge` / `kiwa-hardhat` / `kiwa-play` |

### 機械的な置換手順

```bash
# package.json の依存を一括置換
sed -i.bak 's|@dapp-e2e/|@kiwa-test/|g' package.json && rm package.json.bak
pnpm install
```

import 文 / CLI 呼び出しも同様に `@dapp-e2e/` を `@kiwa-test/` に置換するだけで動きます。
API シグネチャ (関数名 `dappE2eTest` / option key / event name) は **一切変更していません**。 名前空間 prefix だけが変わります。

### npm publish 状況

- `@dapp-e2e/*` は npm に **未公開のまま** (registry 404)、 deprecate の必要なし
- `@kiwa-test/*` は v0.1.0 で初版公開済 (changesets + GitHub Actions provenance、 2026-06-10、 https://www.npmjs.com/package/@kiwa-test/core / https://www.npmjs.com/package/@kiwa-test/cli)

### GitHub URL の自動 redirect

`https://github.com/cardene777/dapp-e2e/*` への URL は GitHub が自動で `https://github.com/cardene777/kiwa/*` へ redirect します。 既存の PR / Issue 番号 (#1〜#186) は そのまま新 URL でも有効です。

---

## Version 互換性ガイド

本ドキュメントは kiwa の version 更新時に互換性の差分を確認したい利用者向けです。
v0.x 系は public API を整えながら進める段階のため、minor 更新でも破壊的変更が入る可能性があります。
各 release で影響範囲を短く追えるよう、この file を移行の窓口にします。

## version 方針

v0.x では strict semver よりも API の収束を優先します。
そのため、互換性に影響する変更は patch ではなく minor へ寄せ、
README と関連 docs を同じ PR で更新する運用を前提にします。
v1.0.0 以降は strict semver に切り替え、breaking change は major のみで扱います。

### この file を更新するタイミング

- `@kiwa-test/core` の API shape が変わるとき
- CLI の scaffold 内容が変わるとき
- Quickstart の手順が変わるとき
- 既存 test code の書き換えが必要になるとき

## v0.0.x → v0.1.0

v0.1.0 は kiwa の最初の public release です。
そのため、既存利用者向けの移行作業は実質ありません。

- **新規**: `@kiwa-test/core`
  Playwright fixture、injector script、anvil lifecycle、9 RPC、4 event を提供します。
- **新規**: `@kiwa-test/cli`
  `init` と `doctor` を提供し、最小構成の scaffold を作れます。
- **workspace 構成**: `packages/core` `packages/cli` `examples/basic-connect`
- **依存方針**: `viem` と `@playwright/test` を peer / dev dependency 前提で扱います

既存 code の置き換え手順はありません。
これから導入する場合は [README.md](../README.md) の Quickstart を起点にしてください。

## 将来 entry の書き方

breaking change を入れるときは、新しい entry をこの section より上へ追加します。

```markdown
## v0.X.y → v0.Y.0

- 何が変わったかを 1-3 行で要約する
- 影響する package や API を列挙する
- before / after の code 例が必要なら追加する
- 関連 PR や release への link を置く
```

### 書き方の目安

- entry は「何が壊れるか」を最初に書く
- 代替 API があるなら同じ節に並べる
- README だけでは足りない差分を優先して残す
- 追記だけで済む変更は COMPARISON や RPC docs に寄せる

## 関連

- [README.md](../README.md)
- [RELEASING.md](./RELEASING.md)
- [GitHub Releases](https://github.com/cardene777/kiwa/releases)
- [Issue tracker](https://github.com/cardene777/kiwa/issues)
