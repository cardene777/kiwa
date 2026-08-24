// compile を挟んでも集める範囲が変わらないことを固定する (Issue #2200 / #2204)。
//
// #2204 で `test` から compile 段を外し、 source を直接走らせる形にした。 compile 済 file を
// 走らせる経路は消えていない = `test:cov` / `test:mutation` / `test:taxonomy` が今も自前で
// `tsc` を掛けて `.vitest-dist/` を走らせる。
//
// **つまり 2 つの経路が並んだまま分かれた**。 開発者が回すのは source 側、 coverage と変異
// 試験が測るのは compile 側で、 集める範囲がずれると **測っている対象と走らせている対象が
// 別物になる**。 どちらも緑に見えるので、 ずれても気付けない。
//
// そこで同じ起動形を 2 通り (source のまま / scratch に compile して) 走らせ、 leg ごとに
// file 数 / test 数 / file 名を突き合わせる。 期待値は書かない = 両者の実測どうしを比べる。
//
// 起動引数は `package.json` の `test` から取り出す。 写すと script を直した時に検査だけが
// 古い引数を見続ける。
//
// `vitest list --filesOnly` は使わない。 実測で root が repo root に解決され、 位置引数
// `tests` に一致する file を 4129 件 (`.claude/` 配下 2359 件を含む) 集める。 `run` と収集
// 経路が違うため同値性の材料にならない。
import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const PACKAGE_DIR = resolve(REPO_ROOT, 'tests/release-smoke');

/** script 1 本を `&&` で切り、 各 leg を語に分けたもの。 */
type Leg = string[];

/**
 * script を leg の列に切る。
 *
 * 引用符の内側では `&&` でも空白でも切らない。 実 shell がそこを区切りとして読まないため、
 * 切ると `--exclude` に渡す glob が 2 語に割れる。
 */
function parseScript(script: string): Leg[] {
  const legs: Leg[] = [];
  let tokens: string[] = [];
  let current = '';
  let started = false;
  let quote: string | null = null;

  const endToken = (): void => {
    if (started) tokens.push(current);
    current = '';
    started = false;
  };

  for (let i = 0; i < script.length; i += 1) {
    const ch = script[i]!;
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

/** `test` の leg 列。 source 側の起動形はここから取る。 */
function testLegs(): Leg[] {
  const pkg = JSON.parse(readFileSync(resolve(PACKAGE_DIR, 'package.json'), 'utf-8')) as {
    scripts?: Record<string, string>;
  };
  const test = pkg.scripts?.['test'];
  if (test === undefined) throw new Error('package.json に test script が無い');
  return parseScript(test);
}

const SCRIPT_LEGS = testLegs();

/** その script の中で `vitest` を起動する leg。 */
function vitestLegs(legs: Leg[]): Leg[] {
  return legs.filter((leg) => leg[0] === 'vitest');
}

const SOURCE_RUNS = vitestLegs(SCRIPT_LEGS);

/**
 * compile 側の経路が使う TypeScript project。
 *
 * `scripts/package-mutation.mjs` の `TS_PROJECT` と `scripts/kiwa-taxonomy-run.mjs` が同じ名前を
 * 使う。 3 箇所で共有する repo の約束なので、 ここでも同じ名前を見る。 実在しなければ落ちる。
 */
const COMPILE_PROJECT = 'tsconfig.vitest.json';

/** compile 済 test の置き場。 project の `outDir` から取る。 */
function outDir(): string {
  const project = JSON.parse(readFileSync(resolve(PACKAGE_DIR, COMPILE_PROJECT), 'utf-8')) as {
    compilerOptions?: { outDir?: string };
  };
  const dir = project.compilerOptions?.outDir;
  if (dir === undefined) throw new Error(`${COMPILE_PROJECT} が outDir を持たない`);
  return dir;
}

const OUT_DIR = outDir();

/** leg が渡す `--exclude` の値。 */
function excludes(leg: Leg): string[] {
  const found: string[] = [];
  for (let i = 0; i < leg.length; i += 1) {
    const token = leg[i]!;
    if (token === '--exclude' && leg[i + 1] !== undefined) found.push(leg[i + 1]!);
    else if (token.startsWith('--exclude=')) found.push(token.slice('--exclude='.length));
  }
  return found;
}

/** leg が渡す flag の値 (`--flag v` / `--flag=v` の両形)。 */
function flagValue(leg: Leg, flag: string): string | undefined {
  for (let i = 0; i < leg.length; i += 1) {
    const token = leg[i]!;
    if (token === flag) return leg[i + 1];
    if (token.startsWith(`${flag}=`)) return token.slice(flag.length + 1);
  }
  return undefined;
}

/**
 * `vitest run <args>` を `vitest list` の引数へ移す。
 *
 * `--changed` は外す。 固定したいのは「どの file を集める route か」 であって、 変更が
 * どれを選ぶかではない (それは vitest 側の責務)。 外さないと手元の変更で結果が動く。
 */
function listArgs(leg: Leg): string[] {
  const args = leg.slice(1);
  if (args[0] !== 'run') throw new Error(`vitest の leg が run で始まっていない: ${leg.join(' ')}`);
  const out: string[] = [];
  for (let i = 1; i < args.length; i += 1) {
    const token = args[i]!;
    if (token === '--changed') {
      i += 1;
      continue;
    }
    if (token.startsWith('--changed=')) continue;
    out.push(token);
  }
  return out;
}

/**
 * source 側の引数を、 scratch に compile した側へ向け直す。
 *
 * 位置引数 (`tests` / `tests/x.test.ts`) を `<scratch>/tests` 配下の `.js` に写す。 除外 glob も
 * 同じく `.ts` から `.js` に合わせる = 合わせないと、 除外したはずの file が compile 側にだけ
 * 残って件数がずれる。
 */
function toCompiled(args: string[], scratch: string): string[] {
  const out: string[] = [];
  let positionalSeen = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === '--exclude' && args[i + 1] !== undefined) {
      const glob = args[i + 1]!;
      i += 1;
      // compile 先は `<outDir>/` 配下に掘るので、 source 側が持つ「compile 済 dir を除外」 を
      // そのまま運ぶと **compile 側が 0 件になる** (実測で 82 対 0 になった)。
      if (glob === `**/${OUT_DIR}/**`) continue;
      out.push('--exclude', glob.replace(/\.test\.ts$/, '.test.js'));
      continue;
    }
    if (!arg.startsWith('-') && !positionalSeen) {
      out.push(`${scratch}/${arg.replace(/\.test\.ts$/, '.test.js')}`);
      positionalSeen = true;
      continue;
    }
    out.push(arg);
  }
  return out;
}

interface Collected {
  /** 拡張子を落とした file 名。 route 間で `.ts` と `.js` が違うため名前で比べる。 */
  stems: string[];
  files: number;
  tests: number;
}

const TEST_SUFFIX = /\.test\.[cm]?[jt]sx?$/;

function stem(file: string): string {
  return file.slice(file.lastIndexOf('/') + 1).replace(TEST_SUFFIX, '');
}

let scratchDir = '';
let scratchRel = '';
let listCount = 0;

async function list(args: string[]): Promise<Collected> {
  listCount += 1;
  const outFile = join(scratchDir, `list-${listCount}.json`);
  await execFileAsync('pnpm', ['exec', 'vitest', 'list', `--json=${outFile}`, ...args], {
    cwd: PACKAGE_DIR,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const rows = JSON.parse(readFileSync(outFile, 'utf-8')) as { file: string }[];
  const files = [...new Set(rows.map((row) => row.file))];
  return { stems: files.map(stem).sort(), files: files.length, tests: rows.length };
}

/** leg を順に走らせる。 route 内で並べると同じ機械で vitest が 3 本以上動く。 */
async function listRoute(legs: Leg[], transform: (args: string[]) => string[]): Promise<Collected[]> {
  const out: Collected[] = [];
  for (const leg of legs) out.push(await list(transform(listArgs(leg))));
  return out;
}

/** `tests/` 配下の test file 名 (再帰)。 */
function testFileStems(): string[] {
  const found: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (TEST_SUFFIX.test(entry.name)) found.push(stem(entry.name));
    }
  };
  visit(resolve(PACKAGE_DIR, 'tests'));
  return found.sort();
}

describe('compile を挟んでも集める範囲が変わらない (#2200 / #2204)', () => {
  let source: Collected[] = [];
  let compiled: Collected[] = [];

  beforeAll(async () => {
    mkdirSync(resolve(PACKAGE_DIR, OUT_DIR), { recursive: true });
    scratchDir = mkdtempSync(resolve(PACKAGE_DIR, OUT_DIR, '.equiv-'));
    scratchRel = `${OUT_DIR}/${scratchDir.slice(scratchDir.lastIndexOf('/') + 1)}`;

    // compile と source 側の収集は互いに依存しない。 compile 先は scratch に閉じるので、
    // `test:cov` 等が使う `.vitest-dist/tests` を踏まない。
    const [sourceResults, compiledResults] = await Promise.all([
      listRoute(SOURCE_RUNS, (args) => args),
      (async () => {
        try {
          await execFileAsync(
            'pnpm',
            ['exec', 'tsc', '-p', COMPILE_PROJECT, '--outDir', scratchRel],
            { cwd: PACKAGE_DIR, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 },
          );
        } catch (error) {
          // **理由を捨てない**。 `Command failed` だけだと、 型エラーなのか出力先の衝突なのか
          // 環境の問題なのかが読めず、 次の一手が決まらない
          // (`rules/quality.md § 失敗の記録は理由か在り処を持つ`)。
          const failure = error as { stdout?: string; stderr?: string };
          const detail = `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trim();
          throw new Error(`compile に失敗した (outDir=${scratchRel})\n${detail || '(出力なし)'}`);
        }
        return listRoute(SOURCE_RUNS, (args) => toCompiled(args, scratchRel));
      })(),
    ]);
    source = sourceResults;
    compiled = compiledResults;
  }, 600_000);

  afterAll(() => {
    if (scratchDir !== '') rmSync(scratchDir, { recursive: true, force: true });
  });

  it('source 側の起動が 1 つ以上ある', () => {
    // 以下の照合はすべて leg 単位なので、 leg が 0 本だと空集合どうしを比べて必ず通る。
    expect(SOURCE_RUNS.length, 'test が vitest を 1 度も起動していない').toBeGreaterThan(0);
  });

  it('test が compile 済 dir を除外する', () => {
    // `test` は compile しなくなったが、 手元には前の compile の残骸が残っている。 位置引数は
    // path の部分一致なので、 除外しないと `.vitest-dist/tests/*.test.js` を拾って 2 重に走る。
    //
    // leg ごとに見る。 全 leg の除外を 1 つに畳むと、 片方の leg から除外が消えても集合は
    // 変わらない (`docs/quality/check-authoring.md` § 形 2)。
    for (const [i, leg] of SOURCE_RUNS.entries()) {
      expect(excludes(leg), `test の leg ${i + 1} が ${OUT_DIR} を除外していない`).toContain(
        `**/${OUT_DIR}/**`,
      );
    }
  });

  it('test は変更で絞らない', () => {
    // `test` に `--changed` が入ると、 完全実行のつもりの run が黙って狭まる。 畳んだ値に
    // 対する否定なので、 1 leg でも持てば現れる。
    expect(SOURCE_RUNS.length, 'test が vitest を 1 度も起動していない').toBeGreaterThan(0);
    const tokens = SOURCE_RUNS.flat().filter((token) => token.startsWith('--changed'));
    expect(tokens, `test が変更で絞っている: ${tokens.join(' ')}`).toEqual([]);
  });

  it('leg ごとに同じ数の file を集める', () => {
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    expect(compiled.length, 'compile 側の収集が 0 leg').toBe(source.length);
    for (const [i, one] of source.entries()) {
      expect(one.files, `source 側の leg ${i + 1} が file を 1 件も集めていない`).toBeGreaterThan(0);
      expect(one.files, `leg ${i + 1} の file 数が経路間でずれている`).toBe(compiled[i]!.files);
    }
  });

  it('leg ごとに同じ数の test を集める', () => {
    // file 数だけでは、 file を集めた上で test を 1 件も拾えていない形が通る。 tsc と esbuild は
    // 別の変換なので、 同じ file から違う数が出る余地がある。
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    for (const [i, one] of source.entries()) {
      expect(one.tests, `source 側の leg ${i + 1} が test を 1 件も集めていない`).toBeGreaterThan(0);
      expect(one.tests, `leg ${i + 1} の test 数が経路間でずれている`).toBe(compiled[i]!.tests);
    }
  });

  it('leg ごとに同じ file を集める', () => {
    // 件数が同じでも中身が入れ替わっている形を落とす。
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    for (const [i, one] of source.entries()) {
      expect(one.stems, `leg ${i + 1} が経路間で違う file を集めている`).toEqual(compiled[i]!.stems);
    }
  });

  it('全 leg で tests/ の test file を残さず覆う', () => {
    // leg 単位の一致だけでは、 どちらの経路からも漏れた file を見つけられない。 新しく足した
    // file が 2 leg の間に落ちる形がこれに当たる。
    const onDisk = testFileStems();
    expect(onDisk.length, 'tests/ に test file が 1 件も無い').toBeGreaterThan(0);
    const collected = [...new Set(source.flatMap((one) => one.stems))].sort();
    expect(collected, 'test が集めない test file がある').toEqual(onDisk);
  });
});
