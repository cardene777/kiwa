# kiwa のリファレンス

## 配布物

kiwa は npm の `@kiwa-lab/*` packages、Go、Python、Rust の native adapter、Claude Code plugin で構成されます。runtime package は test code から import する実装です。plugin は `.claude/skills` を配布し、Claude Code から test 設計、生成、review を実行するためのものです。plugin を入れても runtime package は自動で project dependency に追加されません。

## skill の名前

plugin 経由では skill 名の先頭に `kiwa:` が付きます。たとえば repository 内の `kiwa-design` は `/kiwa:kiwa-design`、`kiwa-review` は `/kiwa:kiwa-review` と実行します。plugin の導入、更新、namespace の扱いは [kiwa の skill を使う](../../../guides/skills) を参照してください。

## 主要な入口

`@kiwa-lab/core` は各 adapter で共有する spec parser と基盤型です。`@kiwa-lab/api`、`@kiwa-lab/ui`、`@kiwa-lab/e2e` は境界ごとの test harness です。`@kiwa-lab/kaname` と `@kiwa-lab/lean` は仕様を検証可能な形に分け、形式的な検査が必要な場合に使います。各 package の export、引数、return 値、failure condition は、個別 library の Reference を正本とします。

## 根拠

全体の skill chain と plugin の導入方法は [repository README](https://github.com/cardene777/kiwa/blob/main/README.md) にあります。plugin が配布する skill directory は [plugin manifest](https://github.com/cardene777/kiwa/blob/main/.claude-plugin/plugin.json) で確認できます。runtime package の公開 API は、各 library の Reference から source と declaration へ移動して確認してください。
