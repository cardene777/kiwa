# kiwa v2.0 released — brand shortening rename (`@kiwa-test/*` → `@kiwa-lab/*`)、 全 41 package major bump + deprecated re-export 6 ヶ月 window

## Summary

kiwa v2.0 is out。 **pure rename milestone** で 全 41 kiwa package の scope を `@kiwa-test/*` から `@kiwa-lab/*` に一斉変更、 全 package v2.0.0 に major bump。 API 変更 0、 shape 契約 preserving、 backward compat 絶対維持 (deprecated re-export 6 ヶ月 window、 2026-07-08 → 2027-01-08)。 Lean 形式検証 統合は v2.0 に含めず 別ライブラリで 独立展開予定、 kiwa brand は testing 特化のまま維持。

## Why rename

- `@kiwa-test/*` は 「テスト特化」 を暗示、 v2.0+ で Lean 形式検証 + spec 生成など scope 拡張時に mismatch (Lean は別ライブラリで扱う)
- `@kiwa-lab/*` に短縮することで package name も シンプル化 (`@kiwa-lab/core` vs `@kiwa-test/core`)
- 45 milestone streak + depth-5 pattern 3 例目確定 + depth-6 pattern 2 例目確定 candidate の compound 資産 は kiwa brand で 継承
- 5 PR 例外拡張 (rename milestone のみ 4 PR rhythm 一時休止、 v2.1 以降 復帰)

## Install (new consumers)

```bash
pnpm add -D @kiwa-lab/core@^2.0
# 全 41 package が @kiwa-lab/{name} で publish 済
```

## Migrate (existing consumers)

### Option A — 即時 migrate (recommended)

```bash
# 全 @kiwa-test/{name} を @kiwa-lab/{name} に置換
grep -rl "@kiwa-test/" . | xargs sed -i '' 's|@kiwa-test/|@kiwa-lab/|g'

# lock file 再生成
pnpm install
```

### Option B — 6 ヶ月 grace period (2027-01-08 まで)

@kiwa-test/* v2.0.0 は **deprecated thin re-export shim** として publish 済み、 6 ヶ月間 は 既存 consumer は そのまま 動作 (import 時 に console.warn 出力)。 2027-01-08 以降 は npm deprecate tag で 完全 廃止。

## v2.0 5 PR 例外拡張 の詳細

- **v2.0-0** = migration plan doc
- **v2.0-1** = 49 package 一斉 rename (1424 file、 900+ 参照)
- **v2.0-2** = docs 全 rewrite (docs 配下 827 file)
- **v2.0-3** = release-smoke test + SOP 追随
- **v2.0-4** = 本 milestone = publish (@kiwa-lab/* v2.0.0 一斉 + @kiwa-test/* deprecated re-export)

## Backward compat guarantee

- v1.67 (@kiwa-test/* v0.x-v1.x) API 変更 0
- @kiwa-lab/* v2.0.0 の shape 契約 は @kiwa-test/* v1.67 と 完全一致
- pure rename、 挙動 / shape / semantics 変更 0

## What's next

- v2.1 以降 = 4 PR rhythm 復帰、 各 pair の depth-6 実運用継続 or 別 pair の depth-5 拡張
- Lean 形式検証 は 別ライブラリ (別 repo) で 独立展開予定
- 46 milestone streak 継続 (v1.23-v2.0)

## Migration guide

[v2.0 rename plan](https://cardene777.github.io/kiwa/migrations/v2.0-rename-plan)
