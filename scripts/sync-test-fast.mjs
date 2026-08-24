#!/usr/bin/env node
// `packages/*` の `test:fast` を、その package 自身の `test` から導出する (Issue #2202)。
//
// `test` は毎回 package の全 test を走らせる。 1 file 直した時も同じ本数が走るため、
// 変更に関係する分だけを走らせる経路を各 package に置く。 形は `tests/release-smoke` が
// #2201 で入れたものと同じで、 source を直接走らせて vitest の `--changed` で絞る。
//
// **26 個を人手で書かない**。 flag は package ごとに違い (`--environment jsdom` /
// `--testTimeout 15000` / `--no-file-parallelism` / leg 2 本)、 書き写すと `test` を直した
// 時に `test:fast` だけが古い flag のまま残る
// (`rules/quality.md § 導出可能記述は人手で書かない`)。 本 script が唯一の導出元で、
// `tests/release-smoke/tests/test-fast-sync.test.ts` が drift を落とす。
//
// 使い方
//   node scripts/sync-test-fast.mjs           # drift を報告する (書かない、 drift で exit 1)
//   node scripts/sync-test-fast.mjs --write   # package.json に書く
//   node scripts/sync-test-fast.mjs --json    # 判定結果を JSON で出す
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMainModule } from './lib/is-main-module.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..');

/** compile 済 test の置き場。 `tsconfig.vitest.json` の `outDir` と同じ値。 */
export const OUT_DIR = '.vitest-dist';

/** 既定の比較先。 `KIWA_FAST_BASE` で差し替える。 */
export const CHANGED_BASE = '${KIWA_FAST_BASE:-main}';

/**
 * source 直走が通らない package と、その理由。
 *
 * **空の Map を「対象外なし」 の意味で放置しない**。 「確かめて通った」 と「まだ確かめて
 * いない」 が同じ形になると、 通らない package に壊れた `test:fast` を配ることになる。
 * 外す時は実起動の結果を理由に書く。
 */
export const EXCLUDED = new Map([]);

/**
 * 理由が空の対象外を返す。
 *
 * **`EXCLUDED` が空でも識別力を持たせるため関数にしてある**。 実 Map を直接見る検査は、
 * 中身が 0 件の間ずっと空集合どうしを比べて通る = 判定が壊れても気付けない
 * (`docs/quality/check-authoring.md` § 形 1)。 検査は fixture を渡して両方向を見る。
 */
export function blankReasons(excluded = EXCLUDED) {
  return [...excluded.entries()]
    .filter(([, reason]) => typeof reason !== 'string' || reason.trim().length === 0)
    .map(([name]) => name);
}

/**
 * script を `&&` で leg に切り、各 leg を語に分ける。
 *
 * 引用符の内側では切らない。 実 shell がそこを区切りとして読まないため、切ると
 * `--exclude` に渡す glob が 2 語に割れる。
 */
export function parseScript(script) {
  const legs = [];
  let tokens = [];
  let current = '';
  let started = false;
  let quote = null;

  const endToken = () => {
    if (started) tokens.push(current);
    current = '';
    started = false;
  };

  for (let i = 0; i < script.length; i += 1) {
    const ch = script[i];
    if (quote !== null) {
      if (ch === quote) quote = null;
      else current += ch;
      started = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      continue;
    }
    if (ch === '&' && script[i + 1] === '&') {
      endToken();
      legs.push(tokens);
      tokens = [];
      i += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      endToken();
      continue;
    }
    current += ch;
    started = true;
  }
  endToken();
  if (tokens.length > 0) legs.push(tokens);
  return legs;
}

/** 語に空白か glob 文字があれば単引用符で囲む。 */
function quoteToken(token) {
  return /[\s*?[\]]/.test(token) ? `'${token}'` : token;
}

/** compile 済 path を source の path に戻す。 */
export function toSourcePath(token) {
  const withoutOut = token.startsWith(`${OUT_DIR}/`) ? token.slice(OUT_DIR.length + 1) : token;
  return withoutOut.replace(/\.test\.js$/, '.test.ts');
}

/** 除外 glob の拡張子を source 側に合わせる。 */
export function toSourceGlob(glob) {
  return glob.replace(/\.test\.js$/, '.test.ts');
}

/**
 * `vitest run <args>` の 1 leg を source 直走の形に移す。
 *
 * 変えるのは 4 点だけで、それ以外の flag (`--environment` / `--testTimeout` /
 * `--no-file-parallelism` / 既存の除外) は `test` の値をそのまま運ぶ。
 *
 * 1. 位置引数を compile 済 path から source path に戻す
 * 2. 除外 glob の拡張子を source 側に合わせる
 * 3. `--changed <base>` を足す
 * 4. compile 済 dir を除外する glob を足す (位置引数は部分一致なので、足さないと
 *    compile 済 file を 2 重に集める)
 */
export function toFastLeg(leg) {
  const out = ['vitest', 'run'];
  const args = leg.slice(2);
  let positionalSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '--exclude' && args[i + 1] !== undefined) {
      out.push('--exclude', quoteToken(toSourceGlob(args[i + 1])));
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude=')) {
      out.push(`--exclude=${quoteToken(toSourceGlob(token.slice('--exclude='.length)))}`);
      continue;
    }
    if (!token.startsWith('-') && !positionalSeen) {
      out.push(quoteToken(toSourcePath(token)));
      out.push('--changed', CHANGED_BASE);
      out.push('--exclude', quoteToken(`**/${OUT_DIR}/**`));
      positionalSeen = true;
      continue;
    }
    out.push(quoteToken(token));
  }

  if (!positionalSeen) throw new Error(`vitest の leg に位置引数が無い: ${leg.join(' ')}`);
  return out.join(' ');
}

/**
 * その package の `test` から `test:fast` を導出する。
 *
 * vitest を起動しない `test` (Foundry / Playwright 等) は `null` を返す = 導出しない。
 */
export function deriveFast(testScript) {
  const legs = parseScript(testScript).filter((leg) => leg[0] === 'vitest');
  if (legs.length === 0) return null;
  if (legs.some((leg) => leg[1] !== 'run')) return null;
  return legs.map(toFastLeg).join(' && ');
}

/** `packages/*` のうち package.json を持つもの。 */
export function packageDirs(root = REPO_ROOT) {
  const base = join(root, 'packages');
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        readFileSync(join(base, name, 'package.json'), 'utf-8');
        return true;
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * 各 package の判定。
 *
 * `status` は 4 値。 `ok` = 導出結果と一致、 `drift` = 中身が違う、 `missing` = 未設定、
 * `skipped` = 対象外 (`EXCLUDED` に理由あり / `test` が vitest を起動しない / `test` が無い)。
 */
export function inspect(root = REPO_ROOT) {
  return packageDirs(root).map((name) => {
    const file = join(root, 'packages', name, 'package.json');
    const pkg = JSON.parse(readFileSync(file, 'utf-8'));
    const test = pkg.scripts?.test;
    const excluded = EXCLUDED.get(name);
    if (excluded !== undefined) return { name, file, status: 'skipped', reason: excluded };
    if (test === undefined) return { name, file, status: 'skipped', reason: 'test script が無い' };

    const expected = deriveFast(test);
    if (expected === null) {
      return { name, file, status: 'skipped', reason: 'test script が vitest run を起動しない' };
    }
    const actual = pkg.scripts?.['test:fast'];
    if (actual === undefined) return { name, file, status: 'missing', expected };
    if (actual !== expected) return { name, file, status: 'drift', expected, actual };
    return { name, file, status: 'ok', expected };
  });
}

/** `test` の直後に `test:fast` を置く (key の順序を保つ)。 */
function writeFast(file, expected) {
  const source = readFileSync(file, 'utf-8');
  const pkg = JSON.parse(source);
  const scripts = {};
  for (const [key, value] of Object.entries(pkg.scripts)) {
    if (key === 'test:fast') continue;
    scripts[key] = value;
    if (key === 'test') scripts['test:fast'] = expected;
  }
  pkg.scripts = scripts;
  const trailing = source.endsWith('\n') ? '\n' : '';
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}${trailing}`);
}

function main(argv) {
  const write = argv.includes('--write');
  const asJson = argv.includes('--json');
  const results = inspect();
  const stale = results.filter((r) => r.status === 'missing' || r.status === 'drift');

  if (write) {
    for (const result of stale) writeFast(result.file, result.expected);
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return write || stale.length === 0 ? 0 : 1;
  }

  const counts = {};
  for (const result of results) counts[result.status] = (counts[result.status] ?? 0) + 1;
  console.log(
    `test:fast — ok ${counts.ok ?? 0} / missing ${counts.missing ?? 0} / drift ${counts.drift ?? 0} / skipped ${counts.skipped ?? 0}`,
  );
  for (const result of results) {
    if (result.status === 'skipped') console.log(`  skipped ${result.name} — ${result.reason}`);
  }
  for (const result of stale) {
    console.log(`  ${write ? 'wrote' : result.status} ${result.name}`);
    if (!write) console.log(`    期待 ${result.expected}`);
    if (!write && result.actual !== undefined) console.log(`    実際 ${result.actual}`);
  }
  return write || stale.length === 0 ? 0 : 1;
}

if (isMainModule(process.argv[1], import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
