---
title: "kiwa v2.0 リリース — brand shortening rename (`@kiwa-test/*` → `@kiwa/*`、 全 41 package major bump + deprecated re-export 6 ヶ月 window、 46 milestone streak 継続)"
emoji: "🌱"
type: "tech"
topics: ["testing", "vitest", "kiwa", "monorepo", "npm"]
published: false
---

# kiwa v2.0 リリース — brand shortening rename

## Summary

**pure rename milestone** で 全 41 kiwa package の scope を `@kiwa-test/*` から `@kiwa/*` に一斉変更、 全 package v2.0.0 に major bump。 API 変更 0、 shape 契約 preserving、 backward compat 絶対維持 (deprecated re-export 6 ヶ月 window、 2026-07-08 → 2027-01-08)。 Lean 形式検証 統合は v2.0 に含めず 別ライブラリで 独立展開予定、 kiwa brand は testing 特化のまま維持。

## Why rename

| 理由 | 説明 |
|---|---|
| brand mismatch | `@kiwa-test/*` は 「テスト特化」 を暗示、 v2.0+ 拡張時 に mismatch |
| Lean integration | Lean 形式検証 は 別ライブラリ で 独立展開、 kiwa 本体 は testing 特化 維持 |
| shorter name | `@kiwa/core` vs `@kiwa-test/core`、 4 文字 節約 |
| compound assets | 45 milestone streak + depth-5 3 例目確定 + depth-6 2 例目確定 candidate は kiwa brand で 継承 |

## 5 PR 例外拡張

- **v2.0-0** = migration plan doc (#1303)
- **v2.0-1** = 49 package 一斉 rename (1424 file、 900+ 参照、 #1304)
- **v2.0-2** = docs 全 rewrite (827 file、 #1305)
- **v2.0-3** = release-smoke SOP 追随 (#1306)
- **v2.0-4** = 本 milestone = publish (@kiwa/* v2.0.0 一斉 + @kiwa-test/* deprecated re-export)

## Install (new consumers)

```bash
pnpm add -D @kiwa/core@^2.0
```

## Migration (existing consumers)

### Option A — 即時 migrate (推奨)

```bash
grep -rl "@kiwa-test/" . | xargs sed -i '' 's|@kiwa-test/|@kiwa/|g'
pnpm install
```

### Option B — 6 ヶ月 grace period (2027-01-08 まで)

@kiwa-test/* v2.0.0 は **deprecated thin re-export shim** として publish 済み、 6 ヶ月間 は 既存 consumer は そのまま 動作 (import 時 に console.warn 出力)。 2027-01-08 以降 は npm deprecate tag で 完全 廃止。

## Backward compat guarantee

- v1.67 (@kiwa-test/* v0.x-v1.x) API 変更 0
- @kiwa/* v2.0.0 の shape 契約 は @kiwa-test/* v1.67 と 完全一致
- pure rename、 挙動 / shape / semantics 変更 0

## v2.0 完遂 signal

- **46 milestone streak** (v1.23-v2.0) = kiwa 史上最長記録更新継続
- **5 PR 例外拡張** = rename milestone のみ 4 PR rhythm 一時休止、 v2.1 以降 復帰
- **900+ 参照 の 一斉 rename** = pure sed 置換 + workspace resolution + backward compat verify
- **深化 pattern 保持** = depth-5 3 例目 + depth-6 2 例目 candidate は kiwa brand で 継承

## Migration guide

[v2.0 rename plan](https://cardene777.github.io/kiwa/migrations/v2.0-rename-plan)

## What's next

- v2.1+ = 4 PR rhythm 復帰、 depth-6 実運用継続 or 別 pair の depth-5 拡張
- Lean 形式検証 は 別ライブラリ (別 repo) で 独立展開予定
- 46 milestone streak 継続
