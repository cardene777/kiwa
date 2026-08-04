---
"@kiwa-lab/a11y": major
"@kiwa-lab/api": major
"@kiwa-lab/auth": major
"@kiwa-lab/cache": major
"@kiwa-lab/cli-test": major
"@kiwa-lab/data": major
"@kiwa-lab/e2e": major
"@kiwa-lab/edge": major
"@kiwa-lab/fresh": major
"@kiwa-lab/hono": major
"@kiwa-lab/kaname": major
"@kiwa-lab/nextjs": major
"@kiwa-lab/observability": major
"@kiwa-lab/orm": major
"@kiwa-lab/queue": major
"@kiwa-lab/solidjs": major
"@kiwa-lab/solidstart": major
"@kiwa-lab/ui": major
"@kiwa-lab/visual": major
---

`peerDependencies.vitest` の対応範囲を `^2` から `^3.2.6` に上げる。

vitest に CRITICAL の勧告 (`GHSA-5xrq-8626-4rwp`、Vitest UI サーバー経由の任意ファイル読み取りと実行) があり、修正版は `>=3.2.6` である。
2.1.9 は 2 系の最終版なので、2 系のままでは解消できない。

下限を `^3` ではなく `^3.2.6` にしているのは、`^3` が脆弱な 3.0.0 から 3.2.5 も許容するためである。
公開している範囲なので、利用者が 3.1 系を使っていても適合と判定されてしまう。

**利用者への影響。**
上記 29 package を vitest 2 系または 3.2.5 以前のプロジェクトで使っている場合、peer の解決が外れる。
3.2.6 以上へ上げてから追随してほしい。

repo 内の 226 個の package.json も同時に上げた。

**確認した範囲。**

`packages/*` の 71 package で `pnpm -r --no-bail --filter='./packages/*' test` を移行前後で走らせ、package 単位で突き合わせた。
差が出たのは `packages/e2e` の 1 package だけで、vitest 2 が 69 件通過、vitest 3 が 67 件通過と 2 件失敗である。
合計は vitest 2 が 11,817 件通過、vitest 3 が 11,815 件通過と 2 件失敗になる。

この 2 件は Playwright のフック待ち時間超過で、同じ 2 件が移行前の vitest 2 の実行でも 1 回落ちている。
`packages/e2e` を単独で走らせると 2 回とも 69 件すべて通過する。
移行に固有の失敗とは判定しなかったが、原因は特定できていない。

網羅率の経路は `packages/core` と `packages/perf-harness` の 2 件で `test:cov` を走らせて rc 0 を確認した。
どちらも node 環境の形で、`test:cov` を持つ 69 package のうち jsdom 環境・並列制御・個別の待ち時間指定を含む経路は確認していない。
変異試験の経路は `packages/core` の `stryker run --dryRunOnly` 1 件で rc 0 を確認した。

**確認していない範囲。**

`examples/*` の 153 package と `tests/release-smoke` は通過数の比較対象に含めていない。
`test:perf` が使う 180 個の `vitest.perf.config.ts` も実行していない。

**非互換について。**

71 package の通常テストでは、現在使っている API と設定の範囲で非互換を観測しなかった。
この repo の通常テストは `vitest run` の素の起動ではなく、対象ディレクトリ・`--environment`・事前の `tsc` を伴う形が中心である。
`vi.useFakeTimers` は `packages/dapp` と `packages/realtime` の 2 箇所で使っており、いずれも上記の実行に含まれて通過している。
`examples/*`・`tests/release-smoke`・`test:perf` の各経路はこの判定の対象外である。
