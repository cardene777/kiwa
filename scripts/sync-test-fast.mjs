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

/** compile 済 dir を除外する glob。 位置引数が部分一致するため必ず要る。 */
export const OUT_DIR_GLOB = `**/${OUT_DIR}/**`;

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

/**
 * 値を取る flag。
 *
 * **これを知らないと flag の値を位置引数と誤認する**。 vitest は flag を file filter より
 * 前にも置けるため、 `--environment jsdom tests` の `jsdom` を path とみなす形が実際に出た
 * (#2203 r1-f1)。 値を取る flag の後ろの語は位置引数ではない、 と決めれば並びに依らない。
 */
const VALUE_FLAGS = new Set([
  '--exclude',
  '--environment',
  '--testTimeout',
  '--hookTimeout',
  '--changed',
  '--reporter',
  '--root',
  '--pool',
  '--outputFile',
  '-c',
  '--config',
]);

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
 * 変えるのは 3 点だけで、それ以外の flag (`--environment` / `--testTimeout` /
 * `--no-file-parallelism` / 既存の除外) は元の値をそのまま運ぶ。
 *
 * 1. 位置引数を compile 済 path から source path に戻す
 * 2. 除外 glob の拡張子を source 側に合わせる
 * 3. compile 済 dir を除外する glob を足す (位置引数は部分一致なので、足さないと
 *    残っている compile 済 file を拾う)
 *
 * **既に source 直走の leg はそのまま通す** = 本 script は何度掛けても同じ結果になる。
 */
export function toSourceLeg(leg) {
  const out = ['vitest', 'run'];
  const args = leg.slice(2);
  const excludes = new Set();
  let positionalSeen = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '--exclude' && args[i + 1] !== undefined) {
      const glob = toSourceGlob(args[i + 1]);
      excludes.add(glob);
      out.push('--exclude', quoteToken(glob));
      i += 1;
      continue;
    }
    if (token.startsWith('--exclude=')) {
      const glob = toSourceGlob(token.slice('--exclude='.length));
      excludes.add(glob);
      out.push(`--exclude=${quoteToken(glob)}`);
      continue;
    }
    if (VALUE_FLAGS.has(token) && args[i + 1] !== undefined) {
      out.push(quoteToken(token), quoteToken(args[i + 1]));
      i += 1;
      continue;
    }
    if (!token.startsWith('-')) {
      // 位置引数は 1 leg に複数ありうる。 すべて source 側へ戻し、 除外は最初の 1 度だけ足す。
      out.push(quoteToken(toSourcePath(token)));
      if (!positionalSeen) {
        out.push('--exclude', quoteToken(OUT_DIR_GLOB));
        excludes.add(OUT_DIR_GLOB);
        positionalSeen = true;
      }
      continue;
    }
    out.push(quoteToken(token));
  }

  if (!positionalSeen) return null;
  // 既に source 直走で、除外を自前で持っていた leg は 2 度足さない。
  return dedupeExcludes(out);
}

/** 同じ除外 glob が 2 度現れたら後ろを落とす。 */
function dedupeExcludes(tokens) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '--exclude' && tokens[i + 1] !== undefined) {
      const glob = tokens[i + 1];
      i += 1;
      if (seen.has(glob)) continue;
      seen.add(glob);
      out.push('--exclude', glob);
      continue;
    }
    out.push(token);
  }
  return out.join(' ');
}

/** その leg が compile 段 (`tsc -p <project>` / compile 済 dir の削除) か。 */
export function isCompileLeg(leg) {
  if (leg[0] === 'tsc') return true;
  if (leg[0] !== 'node') return false;
  const at = leg.indexOf('-e');
  const payload = at >= 0 ? leg[at + 1] : undefined;
  return payload !== undefined && payload.includes(OUT_DIR);
}

/**
 * `test` を source 直走の形に導出する。
 *
 * compile 段を落とし、vitest の leg を source 側に向ける。 依存 build の leg
 * (`build-deps.mjs`) は残す = compile とは別の役目で、共有依存の `dist/` を作る。
 */
export function deriveTest(testScript) {
  const legs = parseScript(testScript);
  const kept = legs.filter((leg) => !isCompileLeg(leg));
  const vitestLegs = kept.filter((leg) => leg[0] === 'vitest');
  if (vitestLegs.length === 0) return null;
  if (vitestLegs.some((leg) => leg[1] !== 'run')) return null;

  const rendered = kept.map((leg) => (leg[0] === 'vitest' ? toSourceLeg(leg) : leg.map(quoteToken).join(' ')));
  if (rendered.some((leg) => leg === null)) return null;
  return rendered.join(' && ');
}

/**
 * `test:fast` を導出する。
 *
 * `test` が既に source 直走になったので、**変更で絞る flag を足すだけ**。 compile 済 path を
 * 戻す仕事は `deriveTest` が持つ。
 */
export function deriveFast(testScript) {
  const source = deriveTest(testScript);
  if (source === null) return null;
  // **依存 build の leg は落とす** (#2202 の判断)。 `test:fast` は手元で回す絞り込みで、
  // 共有依存は既に build 済という前提に立つ。 入れると 1 回ごとに数秒の固定費が戻る。
  return parseScript(source)
    .filter((leg) => leg[0] === 'vitest')
    .map((leg) => {
      const out = ['vitest', 'run'];
      const args = leg.slice(2);
      let positionalSeen = false;
      for (let i = 0; i < args.length; i += 1) {
        const token = args[i];
        if (VALUE_FLAGS.has(token) && args[i + 1] !== undefined) {
          out.push(quoteToken(token), quoteToken(args[i + 1]));
          i += 1;
          continue;
        }
        out.push(quoteToken(token));
        if (!token.startsWith('-') && !positionalSeen) {
          out.push('--changed', CHANGED_BASE);
          positionalSeen = true;
        }
      }
      return out.join(' ');
    })
    .join(' && ');
}

/**
 * 対象の workspace dir (repo からの相対 path)。
 *
 * `packages/*` に加えて `tests/release-smoke` を含む。 同じ形の `test` を持ち、同じ固定費を
 * 払っているため、片方だけ直すと 2 つの形が並ぶ。
 */
export const EXTRA_TARGETS = ['tests/release-smoke'];

export function packageDirs(root = REPO_ROOT) {
  const base = join(root, 'packages');
  const fromPackages = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `packages/${entry.name}`)
    .filter((rel) => {
      try {
        readFileSync(join(root, rel, 'package.json'), 'utf-8');
        return true;
      } catch {
        return false;
      }
    })
    .sort();
  const extras = EXTRA_TARGETS.filter((rel) => {
    try {
      readFileSync(join(root, rel, 'package.json'), 'utf-8');
      return true;
    } catch {
      return false;
    }
  });
  return [...fromPackages, ...extras];
}

/**
 * 各 package の判定。
 *
 * `status` は 5 値。 `ok` = `test` / `test:fast` とも導出結果と一致、 `drift` = どちらかが違う、
 * `missing` = `test:fast` が無い、 `skipped` = 対象外 (`EXCLUDED` に理由あり / `test` が無い /
 * 導出が当たらない `test`)、 `orphan` = 導出できない `test` なのに `test:fast` が残っている。
 *
 * **`orphan` を `skipped` に混ぜない**。 混ぜると、 `test` を導出の当たらない形に書き換えた
 * 瞬間に、 古い `test:fast` が誰にも見られないまま残る。
 */
export function inspect(root = REPO_ROOT) {
  return packageDirs(root).map((name) => {
    const file = join(root, name, 'package.json');
    const pkg = JSON.parse(readFileSync(file, 'utf-8'));
    const test = pkg.scripts?.test;
    const actualFast = pkg.scripts?.['test:fast'];
    const excluded = EXCLUDED.get(name);
    if (excluded !== undefined) return { name, file, status: 'skipped', reason: excluded };
    if (test === undefined) return { name, file, status: 'skipped', reason: 'test script が無い' };

    const expectedTest = deriveTest(test);
    const expectedFast = deriveFast(test);
    if (expectedTest === null || expectedFast === null) {
      const reason = 'test script から導出できない (vitest run を起動していない)';
      return actualFast === undefined
        ? { name, file, status: 'skipped', reason }
        : { name, file, status: 'orphan', reason, actualFast };
    }
    if (actualFast === undefined) {
      return { name, file, status: 'missing', expectedTest, expectedFast, actualTest: test };
    }
    if (test !== expectedTest || actualFast !== expectedFast) {
      return {
        name,
        file,
        status: 'drift',
        expectedTest,
        expectedFast,
        actualTest: test,
        actualFast,
      };
    }
    return { name, file, status: 'ok', expectedTest, expectedFast };
  });
}

/** `test` を書き換え、`test:fast` を直後に置く (key の順序を保つ)。 */
function writeScripts(file, expectedTest, expectedFast) {
  const source = readFileSync(file, 'utf-8');
  const pkg = JSON.parse(source);
  const scripts = {};
  for (const [key, value] of Object.entries(pkg.scripts)) {
    if (key === 'test:fast') continue;
    scripts[key] = key === 'test' ? expectedTest : value;
    if (key === 'test') scripts['test:fast'] = expectedFast;
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
  const orphans = results.filter((r) => r.status === 'orphan');

  if (write) {
    for (const result of stale) writeScripts(result.file, result.expectedTest, result.expectedFast);
  }

  // **`--write` は置き去りを黙らせない**。 書ける形 (`missing` / `drift`) は書けば直るが、
  // `orphan` は「消してよいか」 を script が決められないため、 書いた後も 1 で終わる。
  const exit = () => (orphans.length > 0 || (!write && stale.length > 0) ? 1 : 0);

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return exit();
  }

  const counts = {};
  for (const result of results) counts[result.status] = (counts[result.status] ?? 0) + 1;
  console.log(
    `test:fast — ok ${counts.ok ?? 0} / missing ${counts.missing ?? 0} / drift ${counts.drift ?? 0} / orphan ${counts.orphan ?? 0} / skipped ${counts.skipped ?? 0}`,
  );
  for (const result of results) {
    if (result.status === 'skipped') console.log(`  skipped ${result.name} — ${result.reason}`);
  }
  for (const result of orphans) {
    console.log(`  orphan ${result.name} — ${result.reason}`);
    console.log(`    残っている値 ${result.actualFast}`);
    console.log('    どうするかは人が決める (test を戻すか、 test:fast を消す)');
  }
  for (const result of stale) {
    console.log(`  ${write ? 'wrote' : result.status} ${result.name}`);
    if (write) continue;
    if (result.actualTest !== result.expectedTest) {
      console.log(`    test 期待 ${result.expectedTest}`);
      console.log(`    test 実際 ${result.actualTest}`);
    }
    if (result.actualFast !== result.expectedFast) {
      console.log(`    test:fast 期待 ${result.expectedFast}`);
      console.log(`    test:fast 実際 ${result.actualFast ?? '(無し)'}`);
    }
  }
  return exit();
}

if (isMainModule(process.argv[1], import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
