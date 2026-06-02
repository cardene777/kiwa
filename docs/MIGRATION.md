# Migration guide

本ドキュメントは dapp-e2e の version 更新時に互換性の差分を確認したい利用者向けです。
v0.x 系は public API を整えながら進める段階のため、minor 更新でも破壊的変更が入る可能性があります。
各 release で影響範囲を短く追えるよう、この file を移行の窓口にします。

## version 方針

v0.x では strict semver よりも API の収束を優先します。
そのため、互換性に影響する変更は patch ではなく minor へ寄せ、
README と関連 docs を同じ PR で更新する運用を前提にします。
v1.0.0 以降は strict semver に切り替え、breaking change は major のみで扱います。

### この file を更新するタイミング

- `@dapp-e2e/core` の API shape が変わるとき
- CLI の scaffold 内容が変わるとき
- Quickstart の手順が変わるとき
- 既存 test code の書き換えが必要になるとき

## v0.0.x → v0.1.0

v0.1.0 は dapp-e2e の最初の public release です。
そのため、既存利用者向けの移行作業は実質ありません。

- **新規**: `@dapp-e2e/core`
  Playwright fixture、injector script、anvil lifecycle、9 RPC、4 event を提供します。
- **新規**: `@dapp-e2e/cli`
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
- [GitHub Releases](https://github.com/cardene777/dapp-e2e/releases)
- [Issue tracker](https://github.com/cardene777/dapp-e2e/issues)
