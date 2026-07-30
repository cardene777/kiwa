import { defineConfig } from 'tsup';

/**
 * `clean` は置かない。
 *
 * この package は他 package の `test` script から `pnpm -F <name> build` で
 * 再 build される (169 package が共有依存を inline build する)。 `clean: true` だと
 * build のたびに `dist/` が数百 ms 空になり、 その間に並列実行中の別 package が
 * `tsc` で型定義を解決できず落ちる (#1741 実測 = `packages/api` が TS7016 から
 * 連鎖して 12 件の型エラー)。
 *
 * entry が 1 つで出力 file の集合が固定 (index.{js,cjs,d.ts,d.cts} + map) のため、
 * 毎回すべて上書きされる = clean が無くても古い生成物は残らない。
 * clean を外しても窓が完全に消えるわけではない。 tsup は temp file + rename では
 * なく最終 path へ直接書くため、 上書き中の部分的な内容を読む窓は残る。 消えるのは
 * 「file が存在しない」 窓 (build 全体の長さ = 数百 ms) で、 残るのは 1 file の write が
 * 完了するまでの窓。 完全に無くすには書込側を atomic にする必要がある。
 *
 * 出力の顔ぶれが変わる変更 (entry 追加 / format 削減 / outExtension 変更 / 相対
 * dynamic import 追加) をしたら前提が崩れる。 その時は
 * `tests/release-smoke/tests/tsup-clean-race.test.ts` の FIXED_OUTPUT_TARGETS から
 * この package を外し、 CLEAN_REQUIRED_TARGETS に移して clean を戻す。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  external: ['vitest'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
