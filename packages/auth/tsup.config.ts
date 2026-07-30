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
 * entry を増やして chunk が出る構成に変えるなら、 この前提が崩れるので
 * `tests/release-smoke/tests/tsup-clean-race.test.ts` の一覧から外して clean を戻す。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  external: ['next-auth', 'lucia', 'better-auth', '@clerk/backend', 'auth0', 'vitest'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
