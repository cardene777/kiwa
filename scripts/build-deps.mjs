#!/usr/bin/env node
/**
 * test の前に共有依存を build する。 全体実行では 1 度も build しない。
 *
 * 各 package の `test` は先頭で `pnpm -F <deps> build` を実行して共有依存を作り直す。
 * 単独で走らせる時はこれが要る (依存の `dist/` が古いと型定義が合わない)。 だが
 * `pnpm -r test` では 171 対象がこれを行い、 1 回の run で 1036 回の build が走る。
 *
 * tsup は最終 path へ直接書くので、 1 回の build ごとに「file はあるが中身が書込
 * 途中」 の窓ができる。 並列に走る別 package の `tsc` がその瞬間に読むと
 * `TS2306: File ... is not a module` で落ちる (#1724 実測 = `packages/edge` の
 * 型定義)。 #1741 で `clean` を外して「file が存在しない」 窓は消したが、 この窓は
 * 書込側を atomic にしない限り残る。
 *
 * 全体実行では root の `test` が先に `pnpm -r build` を 1 度だけ走らせ、
 * `KIWA_DEPS_PREBUILT=1` を立てる。 その時この script は何もしない。 build の回数が
 * 1036 から 1 になるので、 窓そのものが並列実行と重ならなくなる。
 *
 * 使い方 = `node ../../scripts/build-deps.mjs @kiwa-lab/core @kiwa-lab/edge`
 */
import { spawnSync } from 'node:child_process';

if (process.env['KIWA_DEPS_PREBUILT'] === '1') process.exit(0);

const targets = process.argv.slice(2).filter((arg) => arg.length > 0);
if (targets.length === 0) process.exit(0);

const filters = targets.flatMap((name) => ['-F', name]);
const result = spawnSync('pnpm', [...filters, 'build'], { stdio: 'inherit' });
if (result.error !== undefined) {
  console.error(`build-deps: pnpm を起動できない (${result.error.message})`);
  process.exit(1);
}
process.exit(result.status ?? 1);
