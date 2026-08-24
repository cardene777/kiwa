// `test:fast` が完全実行と同じ範囲を集めることを固定する (Issue #2200)。
//
// `tests/release-smoke` の 2 つの script は走らせ方が違う。 `test` は `tsc` が `.vitest-dist/`
// へ吐いた `.js` を走らせ、 `test:fast` は `tests/` の `.ts` を直接走らせる。 前者は毎回全件、
// 後者は `--changed` が選んだ分だけになる。
//
// **ずれは静かに出る**。 `vitest` の位置引数は path の部分一致なので、 `vitest run tests` は
// `.vitest-dist/tests/*.test.js` にも一致する。 除外を書き忘れれば同じ test を 2 重に集め、
// 位置引数を書き間違えれば 1 件も集めない。 後者は `--changed` と併せると **exit 0 で終わる**
// (実測 = 位置引数を `tesXts` に壊し、 変更を 1 件持たせた状態で exit 0)。 「速くなった」 と
// 「走っていない」 が同じ見た目になる。
//
// そこで両 route を `vitest list` で実際に走らせ、 leg ごとに file 数 / test 数 / file 名を
// 突き合わせる。 期待値は書かない = 両 route の実測どうしを比べる。 数を書くと実物とずれる
// (`rules/quality.md § 導出可能記述は人手で書かない`)。
//
// 起動引数も書き写さず `package.json` の script から取り出す。 写すと script を直した時に
// 検査だけが古い引数を見続ける。
//
// `.vitest-dist` 側は本 file の中で scratch outDir へ compile し直す。 手元の `.vitest-dist` が
// 古いだけで落ちる形にしない = `test:fast` は compile しないので、 test file を足した直後の
// `.vitest-dist` は必ず古い。
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

interface Scripts {
  full: Leg[];
  fast: Leg[];
}

function scripts(): Scripts {
  const pkg = JSON.parse(readFileSync(resolve(PACKAGE_DIR, 'package.json'), 'utf-8')) as {
    scripts?: Record<string, string>;
  };
  const full = pkg.scripts?.['test'];
  const fast = pkg.scripts?.['test:fast'];
  if (full === undefined) throw new Error('package.json に test script が無い');
  if (fast === undefined) throw new Error('package.json に test:fast script が無い');
  return { full: parseScript(full), fast: parseScript(fast) };
}

const SCRIPTS = scripts();

/** その script の中で `vitest` を起動する leg。 */
function vitestLegs(legs: Leg[]): Leg[] {
  return legs.filter((leg) => leg[0] === 'vitest');
}

const FULL_RUNS = vitestLegs(SCRIPTS.full);
const FAST_RUNS = vitestLegs(SCRIPTS.fast);

/** 完全実行が `.vitest-dist/` を作る `tsc` の leg。 */
function compileLeg(): Leg {
  const leg = SCRIPTS.full.find((tokens) => tokens[0] === 'tsc');
  if (leg === undefined) throw new Error('test script に tsc の leg が無い');
  return leg;
}

/** `tsc -p <file>` が指す project file。 */
function compileProject(): string {
  const leg = compileLeg();
  const at = leg.indexOf('-p');
  const project = at >= 0 ? leg[at + 1] : undefined;
  if (project === undefined) throw new Error('tsc の leg が -p <project> を持たない');
  return project;
}

/** compile 済 test の置き場。 除外 pattern も retarget もここから導く。 */
function outDir(): string {
  const project = JSON.parse(readFileSync(resolve(PACKAGE_DIR, compileProject()), 'utf-8')) as {
    compilerOptions?: { outDir?: string };
  };
  const dir = project.compilerOptions?.outDir;
  if (dir === undefined) throw new Error(`${compileProject()} が outDir を持たない`);
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

/** compile 済 route の引数を scratch outDir 側へ向け直す。 */
function retarget(args: string[], scratch: string): string[] {
  return args.map((arg) =>
    arg.startsWith(`${OUT_DIR}/`) ? `${scratch}${arg.slice(OUT_DIR.length)}` : arg,
  );
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

describe('test:fast が完全実行と同じ範囲を集める (#2200)', () => {
  let source: Collected[] = [];
  let compiled: Collected[] = [];

  beforeAll(async () => {
    mkdirSync(resolve(PACKAGE_DIR, OUT_DIR), { recursive: true });
    scratchDir = mkdtempSync(resolve(PACKAGE_DIR, OUT_DIR, '.equiv-'));
    scratchRel = `${OUT_DIR}/${scratchDir.slice(scratchDir.lastIndexOf('/') + 1)}`;

    // compile と source 側の収集は互いに依存しない。 compile は完全実行と同じ leg を使い、
    // 出力先だけ差し替える。
    const [sourceResults, compiledResults] = await Promise.all([
      listRoute(FAST_RUNS, (args) => args),
      (async () => {
        await execFileAsync(
          'pnpm',
          ['exec', ...compileLeg(), '--outDir', scratchRel],
          { cwd: PACKAGE_DIR, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 },
        );
        return listRoute(FULL_RUNS, (args) => retarget(args, scratchRel));
      })(),
    ]);
    source = sourceResults;
    compiled = compiledResults;
  }, 600_000);

  afterAll(() => {
    if (scratchDir !== '') rmSync(scratchDir, { recursive: true, force: true });
  });

  it('両 script が同じ数の vitest 起動を持つ', () => {
    // leg 数が違えば、 片方にしか無い leg の中身は誰とも比べられない。 下の照合はすべて
    // leg 単位なので、 ここが最初の前提になる。
    expect(FULL_RUNS.length, '完全実行が vitest を 1 度も起動していない').toBeGreaterThan(0);
    expect(FAST_RUNS.length, 'test:fast の leg 数が完全実行と違う').toBe(FULL_RUNS.length);
  });

  it('test:fast のどの leg も compile 済 dir を除外する', () => {
    // 除外が無いと、 位置引数の部分一致で `.vitest-dist/tests/*.test.js` も集まる。 同じ test を
    // 2 度走らせるので、 落ちずに遅くなるだけになる。
    //
    // leg ごとに見る。 全 leg の除外を 1 つに畳むと、 片方の leg から除外が消えても集合は
    // 変わらない (`docs/quality/check-authoring.md` § 形 2)。
    expect(FAST_RUNS.length, 'test:fast が vitest を 1 度も起動していない').toBeGreaterThan(0);
    for (const [i, leg] of FAST_RUNS.entries()) {
      expect(excludes(leg), `test:fast の leg ${i + 1} が ${OUT_DIR} を除外していない`).toContain(
        `**/${OUT_DIR}/**`,
      );
    }
  });

  it('test:fast の base を環境変数で差し替えられる', () => {
    // 書いてある形ではなく、 sh が実際にどう展開するかで見る。 literal を照合すると
    // 「それらしい文字列がある」 ことしか判らない。
    expect(FAST_RUNS.length, 'test:fast が vitest を 1 度も起動していない').toBeGreaterThan(0);
    for (const [i, leg] of FAST_RUNS.entries()) {
      const base = flagValue(leg, '--changed');
      expect(base, `test:fast の leg ${i + 1} が --changed を渡していない`).toBeDefined();
      const expand = (value: string | undefined): string =>
        execFileSync('sh', ['-c', `printf '%s' "${base!}"`], {
          encoding: 'utf-8',
          env: value === undefined ? process.env : { ...process.env, KIWA_FAST_BASE: value },
        });
      expect(expand(undefined), `test:fast の leg ${i + 1} の既定 base が main でない`).toBe('main');
      expect(expand('probe-ref'), `test:fast の leg ${i + 1} の base を差し替えられない`).toBe(
        'probe-ref',
      );
      expect(expand(''), `test:fast の leg ${i + 1} が空の base を既定へ戻さない`).toBe('main');
    }
  });

  it('完全実行は変更で絞らない', () => {
    // `test` に `--changed` が入ると、 完全実行のつもりの run が黙って狭まる。 畳んだ値に
    // 対する否定なので、 1 leg でも持てば現れる。
    expect(FULL_RUNS.length, '完全実行が vitest を 1 度も起動していない').toBeGreaterThan(0);
    const tokens = FULL_RUNS.flat().filter((token) => token.startsWith('--changed'));
    expect(tokens, `完全実行が変更で絞っている: ${tokens.join(' ')}`).toEqual([]);
  });

  it('対応する leg が同じ timeout を使う', () => {
    // 完全実行は leg ごとに timeout を分けている (長い 1 file を別 leg に出している)。 fast 側が
    // 同じ分け方を持たないと、 その file が選ばれた回だけ別の基準で落ちる。
    expect(FAST_RUNS.length, 'test:fast が vitest を 1 度も起動していない').toBeGreaterThan(0);
    for (const [i, leg] of FAST_RUNS.entries()) {
      const full = FULL_RUNS[i];
      expect(full, `完全実行に leg ${i + 1} が無い`).toBeDefined();
      expect(
        flagValue(leg, '--testTimeout'),
        `test:fast の leg ${i + 1} の timeout が完全実行と違う`,
      ).toBe(flagValue(full!, '--testTimeout'));
    }
  });

  it('leg ごとに同じ数の file を集める', () => {
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    expect(compiled.length, 'compile 側の収集が 0 leg').toBe(source.length);
    for (const [i, one] of source.entries()) {
      expect(one.files, `source 側の leg ${i + 1} が file を 1 件も集めていない`).toBeGreaterThan(0);
      expect(one.files, `leg ${i + 1} の file 数が route 間でずれている`).toBe(compiled[i]!.files);
    }
  });

  it('leg ごとに同じ数の test を集める', () => {
    // file 数だけでは、 file を集めた上で test を 1 件も拾えていない形が通る。 tsc と esbuild は
    // 別の変換なので、 同じ file から違う数が出る余地がある。
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    for (const [i, one] of source.entries()) {
      expect(one.tests, `source 側の leg ${i + 1} が test を 1 件も集めていない`).toBeGreaterThan(0);
      expect(one.tests, `leg ${i + 1} の test 数が route 間でずれている`).toBe(compiled[i]!.tests);
    }
  });

  it('leg ごとに同じ file を集める', () => {
    // 件数が同じでも中身が入れ替わっている形を落とす。
    expect(source.length, 'source 側の収集が 0 leg').toBeGreaterThan(0);
    for (const [i, one] of source.entries()) {
      expect(one.stems, `leg ${i + 1} が route 間で違う file を集めている`).toEqual(
        compiled[i]!.stems,
      );
    }
  });

  it('test:fast の全 leg で tests/ の test file を残さず覆う', () => {
    // leg 単位の一致だけでは、 どちらの route からも漏れた file を見つけられない。 新しく足した
    // file が両 leg の間に落ちる形がこれに当たる。
    const onDisk = testFileStems();
    expect(onDisk.length, 'tests/ に test file が 1 件も無い').toBeGreaterThan(0);
    const collected = [...new Set(source.flatMap((one) => one.stems))].sort();
    expect(collected, 'test:fast が集めない test file がある').toEqual(onDisk);
  });
});
