import { defineConfig } from 'tsup';

/**
 * `clean` は置かない。
 *
 * この package は 18 の example の `test` script から `pnpm -F @kiwa-lab/dapp build`
 * で再 build される。 `clean: true` だと build のたびに `dist/` が空になり、 その間に
 * 並列実行中の別 example が `next build` の型検査で型定義を解決できず落ちる
 * (#1724 実測 = `nextjs-lending` が `Could not find a declaration file for module
 * '@kiwa-lab/dapp'`)。 #1741 が 39 package で消した race と同じ形。
 *
 * この package は entry が 2 つで chunk を出すため、 出力 file の顔ぶれは固定でない。
 * 古い chunk が `dist/` に残り得るが、 publish の前に `release` の先頭が全 package の
 * `dist` を消すので tarball には載らない (`scripts/clean-dist.mjs`)。
 * 開発中に残っても、 entry file は毎回上書きされて現行の chunk 名だけを参照する。
 */
export default defineConfig({
  entry: ['src/index.ts', 'src/vitest.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
