# kiwa v2.0 x-thread (日本語)

## Tweet 1

kiwa v2.0 リリース — **brand shortening rename**。 全 41 kiwa package の scope を `@kiwa-test/*` から `@kiwa/*` に一斉変更、 全 package を v2.0.0 に major bump。 API 変更 0、 shape 契約 preserving、 backward compat 絶対維持 (deprecated re-export 6 ヶ月 window、 2026-07-08 → 2027-01-08)。

## Tweet 2

pure rename milestone、 5 PR 例外拡張 (rename milestone のみ 4 PR rhythm 一時休止、 v2.1 以降 復帰)。 1424 file + 900+ 参照 の 一斉 rename、 packages + workspace internal dep + docs + dogfood + tests 全 追随、 semantic 変更 0。

## Tweet 3

新規 consumer は `pnpm add -D @kiwa/core@^2.0`。 既存 consumer は 即時 sed 置換 or 6 ヶ月 grace period (@kiwa-test/* v2.0.0 は deprecated shim として @kiwa/* を re-export、 console.warn 出力)。

## Tweet 4

rename 理由 = `@kiwa-test/*` は 「テスト特化」 を暗示、 v2.0+ 拡張時に mismatch。 `@kiwa/*` は 短縮 + brand 統一。 45 milestone streak + depth-5 3 例目確定 + depth-6 2 例目確定 candidate の compound 資産 は kiwa brand で 継承。

Lean 形式検証 統合は 別ライブラリ で 独立展開予定、 kiwa 本体 は testing 特化 維持。

migration: https://cardene777.github.io/kiwa/migrations/v2.0-rename-plan

#kiwa #v2 #rename #testing #vitest
