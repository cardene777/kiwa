#!/usr/bin/env node
/**
 * publish する前に `packages/*/dist` を消す。
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
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

if (!existsSync(PACKAGES_DIR)) {
  console.error(`clean-dist: ${PACKAGES_DIR} が無い`);
  process.exit(1);
}

let removed = 0;
for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dist = join(PACKAGES_DIR, entry.name, 'dist');
  // `packages/` の下から出ないことを確かめる。 name に `..` が来る経路は無いが、
  // 消す対象なので念のため。
  if (!resolve(dist).startsWith(`${resolve(PACKAGES_DIR)}/`)) continue;
  if (!existsSync(dist)) continue;
  rmSync(dist, { recursive: true, force: true });
  removed += 1;
}

console.log(`clean-dist: ${removed} 件の dist を消した`);
