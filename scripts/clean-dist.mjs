#!/usr/bin/env node
/**
 * publish する前に各 package の `dist` を消す。
 *
 * `tsup` の `clean` は 39 package で外してある (#1741)。 build のたびに `dist/` が
 * 空になる瞬間があり、 並列に走る別 package の `tsc` が型定義を解決できず落ちる
 * ためで、 外したこと自体は build 中の race を消す。
 *
 * だが「古い生成物を消す」 という clean のもう 1 つの役目まで消える。 全 package が
 * `files: ["dist"]` を持ち、 `dist/` の中身がそのまま npm tarball に入るため、
 * 過去に `tsc -p` が書いた file や、 clean があった頃の chunk が残っていると、
 * それも publish される。 build が上書きするのは build が書く file だけで、
 * `dist/` 全体ではない。
 *
 * build 中の race は「同時に走る他の package」 が居るから起きる。 publish は
 * その前に 1 度だけ走る単独の step なので、 ここで消しても race は起きない。
 *
 * 呼出は root の `release` script の先頭。 `pnpm release` 以外では走らない。
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

if (!existsSync(PACKAGES_DIR)) {
  console.error(`clean-dist: ${PACKAGES_DIR} が無い`);
  process.exit(1);
}

/**
 * `packages/` の下から出ないことを確かめる。 name に `..` が来る経路は無いが、
 * 消す対象なので念のため。
 *
 * 文字列の前方一致で区切りに `/` を直書きすると、 区切りが `\` の環境で常に
 * 偽になり、 1 件も消さないまま publish に進む (fail-open)。 区切りに依らない
 * `relative` で判定する。
 */
function insidePackages(dist) {
  const rel = relative(PACKAGES_DIR, dist);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

let removed = 0;
for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dist = join(PACKAGES_DIR, entry.name, 'dist');
  if (!insidePackages(dist)) continue;
  if (!existsSync(dist)) continue;
  // 消せない file (`chflags uchg` 等) があると `force: true` でも例外になる。
  // 握り潰すと「消した」 ことにして publish に進むので、 そのまま落とす。
  // `release` は `&&` で繋がっているため後続の publish に到達しない。
  rmSync(dist, { recursive: true, force: true });
  removed += 1;
}

console.log(`clean-dist: ${removed} 件の dist を消した`);
