import { defineConfig } from 'vitest/config';

// この example の test は DOM を要する (`@testing-library/react` の `render`)。
//
// 宣言を `package.json` の `test` script (`--environment jsdom`) だけに置くと、
// **別経路から vitest を起動したツールが node 環境で走らせて全件失敗する**。
// `/kiwa-observe` の Step 0 が `--root` だけを渡して起動した時に実測で 16 件全滅し、
// dashboard が pass rate 0.0% を「観測結果」 として報告した。
//
// 環境は project の性質なので、起動側の引数ではなく config に置く。
// `package.json` 側の `--environment jsdom` は CLI 引数が config に優先するため
// 挙動を変えない (残しても外しても同じ結果になる)。
//
// **`exclude` はここに書かない**。 この example の `test` script は
// `tsc` が吐いた `.vitest-dist/tests` を名指しで走らせるため、
// config で `.vitest-dist` を除くと自分の test を 1 件も見つけられなくなる
// (`No test files found, exiting with code 1` を実測)。
// build 出力の二重収集は、外から起動する側 (`/kiwa-observe` の Step 0) が
// `--exclude` で除く。
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
