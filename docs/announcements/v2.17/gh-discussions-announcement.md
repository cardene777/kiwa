# kiwa v2.17 released — /spec-kit skill 追加 = kiwa plugin marketplace 経由で spec-driven development dialog flow 配布開始、 npm package (programmable API) と skill (dialog) の 役割分担明確化、 systematic pattern 59 度目、 62 milestone streak、 kiwa 3 軸融合実運用完成

`/spec-kit` skill 追加 = 5 段階 dialog flow (feature 名 → AC 収集 → layer 分類 hint → classify + splitSpec → Lean verify) で 3 layer specification model (formal / runtime / human) を 対話的に生成。 v2.16 `@kiwa-lab/spec-kit` npm package と 対で、 kiwa MANIFESTO の 3 軸融合 (testing + 形式検証 + 仕様駆動開発) の 実運用経路 完成。

```bash
# Claude Code plugin marketplace 経由 kiwa plugin install 済 user は /spec-kit で dialog 起動
# 単発:
pnpm add -D @kiwa-lab/spec-kit @kiwa-lab/lean
```

[Migration v2.16 → v2.17](https://cardene777.github.io/kiwa/migrations/v2.16-to-v2.17)

> **Note** — This package was renamed to `@kiwa-lab/kaname` in v2.19 to avoid the name collision with `github/spec-kit`.
