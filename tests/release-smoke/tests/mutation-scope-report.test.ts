// Checks for scripts/mutation-scope-report.mjs (Issue #1944).
//
// The script answers "which implementation files sit outside `mutate`?", and the
// answer decides how much work each package needs. If the classifier miscounts,
// the plan built on it is wrong in a way nobody notices — a file that produces
// runtime values but gets filed as "type-only" simply disappears from the report.
//
// So the buckets are pinned by fixture, both directions: forms that must be
// classified as implementation, and forms that must not.
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/mutation-scope-report.mjs');

const { classifySource, parseMutateTargets } = await import(pathToFileURL(SCRIPT).href);

describe('classifySource — 実行時の値を持つ形', () => {
  const cases: Array<[string, string]> = [
    ['関数を公開する', 'export function run() { return 1; }'],
    ['クラスを公開する', 'export class Runner {}'],
    ['定数を公開する', 'export const LIMIT = 10;'],
    ['列挙を公開する', 'export enum Mode { A, B }'],
    ['非同期関数を公開する', 'export async function run() {}'],
    [
      '型と実装が混ざる',
      `export interface Opts { a: string }
       export function run(o: Opts) { return o.a; }`,
    ],
    [
      '再輸出と実装が混ざる',
      `export * from './other.js';
       export const VERSION = '1';`,
    ],
    [
      '1 文で複数を公開する',
      'export const a = 1, b = 2;',
    ],
    // 以下 4 形は宣言に export が付かない / 宣言そのものが無い。 宣言側だけを
    // 見ていると実装が再輸出や型のみに落ち、対象外として集計から消える。
    [
      '宣言と公開を分けて書く',
      `function run() {}
       export { run };`,
    ],
    ['既定として関数を公開する', 'export default function run() {}'],
    [
      '既定として変数を公開する',
      `const run = () => 1;
       export default run;`,
    ],
    ['既定として即値を公開する', 'export default { run: () => 1 };'],
    [
      '公開する要素の一部だけが型',
      `function run() {}
       type X = 1;
       export { run, type X };`,
    ],
    // namespace は実行時に object を組む。 型の入れ物と同じ扱いにすると、
    // 中身の実装ごと集計から外れる。
    ['名前空間を公開する', 'export namespace Foo { export const a = 1; }'],
    ['既定として class を公開する', 'export default class Runner {}'],
    ['非同期の既定公開', 'export default async function run() {}'],
  ];

  for (const [label, source] of cases) {
    it(label, () => {
      expect(classifySource(source), label).toBe('implementation');
    });
  }
});

describe('classifySource — 実行時の値を持たない形', () => {
  it('再輸出だけなら barrel', () => {
    expect(classifySource(`export * from './a.js';\nexport { b } from './b.js';`)).toBe('barrel');
  });

  it('型の再輸出は barrel に数えない', () => {
    // `export type { X } from` は実行時に何も生まない。 barrel と数えると
    // 「再輸出だから対象外でよい」 の判断が型 file にも及ぶ。
    expect(classifySource(`export type { X } from './types.js';`)).toBe('type-only');
  });

  it('型と interface だけなら type-only', () => {
    expect(
      classifySource(`export interface A { x: number }
       export type B = A | null;`),
    ).toBe('type-only');
  });

  it('公開しない実装は対象に数えない', () => {
    // 外から呼べない helper だけの file は、公開経路から到達しない。
    expect(classifySource('function internal() { return 1; }')).toBe('type-only');
  });

  it('空 file は type-only', () => {
    expect(classifySource('')).toBe('type-only');
  });

  it('公開する要素が全て型なら type-only', () => {
    // `export { type X }` は実行時に何も公開しない。 要素を数えずに
    // 1 件と扱うと、型だけの file が実装として集計に入る。
    expect(
      classifySource(`type X = 1;
       export { type X };`),
    ).toBe('type-only');
  });

  it('型だけを名前で公開する形も type-only', () => {
    expect(
      classifySource(`type X = 1;
       export type { X };`),
    ).toBe('type-only');
  });

  it('宣言だけの名前空間は実行時に何も生まない', () => {
    expect(classifySource('declare module "x" { const a: number; }')).toBe('type-only');
  });

  // declare が付く形は型の宣言でしかない。 公開の形 (function / const / class) ごとに
  // 個別対応していると漏れるため、3 形すべてを固定する。
  const declareForms: Array<[string, string]> = [
    ['関数', 'export declare function run(): void;'],
    ['定数', 'export declare const A: number;'],
    ['クラス', 'export declare class C {}'],
  ];
  for (const [label, source] of declareForms) {
    it(`declare つきの${label}は実行時に何も生まない`, () => {
      expect(classifySource(source), label).toBe('type-only');
    });
  }
});

describe('classifySource — 読めない file', () => {
  it('構文が壊れていたら分類せずに止まる', () => {
    // 出力が空になるため、そのまま数えると「値を持たない file」 と同じ結果になる。
    // 壊れていることは報告すべき事実で、集計から静かに消してよいものではない。
    expect(() => classifySource('export function run( {', 'broken.ts')).toThrow(/cannot parse/);
  });

  it('停止時にどの file かを示す', () => {
    expect(() => classifySource('const = ;', 'packages/x/src/y.ts')).toThrow(
      /packages\/x\/src\/y\.ts/,
    );
  });
});

describe('reportForPackage — mutate に載っているが変異する値が無い file', () => {
  it('集計から落とさず別枠で報告する', async () => {
    const { reportForPackage } = await import(pathToFileURL(SCRIPT).href);
    // a11y は index.js を mutate に並べているが、その中身は再輸出だけ。
    // covered にも uncovered にも入れないと、一覧の 2 件目が黙って消える。
    const report = reportForPackage('a11y');

    expect(report.listedWithoutValue.map((e: { file: string }) => e.file)).toContain('index.ts');
    expect(report.covered.map((e: { file: string }) => e.file)).not.toContain('index.ts');
    expect(report.uncovered.map((e: { file: string }) => e.file)).not.toContain('index.ts');
  });

  it('config が指す file が消えていれば別枠で報告する', async () => {
    const { reportForPackage } = await import(pathToFileURL(SCRIPT).href);
    // 現状は全 config が実在する file を指す。 空であることを固定しておくと、
    // 将来 file を消して config を直し忘れた時にこの枠へ現れる。
    for (const pkg of ['a11y', 'core', 'cli']) {
      expect(reportForPackage(pkg).listedButMissing, pkg).toEqual([]);
    }
  });
});

describe('parseMutateTargets', () => {
  it('配列の要素を src 相対の .ts として読む', () => {
    const config = `export default {
      mutate: [
        '.vitest-dist/src/audit.js',
        '.vitest-dist/src/commands/init.js',
      ],
      thresholds: { high: 80 },
    };`;
    expect(parseMutateTargets(config)).toEqual(['audit.ts', 'commands/init.ts']);
  });

  it('mutate を持たない config は空を返す', () => {
    expect(parseMutateTargets('export default { thresholds: { high: 80 } };')).toEqual([]);
  });

  it('空配列は空を返す', () => {
    expect(parseMutateTargets('export default { mutate: [] };')).toEqual([]);
  });
});

describe('scripts/mutation-scope-report.mjs', () => {
  it('実 repo に対して集計を出す', async () => {
    const { stdout } = await execFileAsync('node', [SCRIPT], { cwd: REPO_ROOT });

    expect(stdout).toContain('implementation:');
    expect(stdout).toContain('barrel + type-only:');
    // 集計行が package ごとに出る。 1 つも出ないなら config を読めていない。
    expect(stdout.split('\n').filter((l) => /^[a-z0-9-]+\s+\d+ \/ \d+f/.test(l).valueOf()).length)
      .toBeGreaterThan(15);
  });

  it('--list は 1 package の対象外 file を行数つきで並べる', async () => {
    const { stdout } = await execFileAsync('node', [SCRIPT, '--list', 'auth'], { cwd: REPO_ROOT });

    expect(stdout).toMatch(/^# auth — outside mutate \(\d+ files, \d+ lines\)/);
    // 行数 + path の形が続く。
    expect(stdout).toMatch(/\n\s+\d+ {2}\S+\.ts/);
  });

  it('--list は mutate の無駄な指定も同じ画面に出す', async () => {
    // package を広げる人が見るのはこの画面。 集計の最終行にしか出ないと、
    // 自分の config に載っている死んだ指定に気付けない。
    const { stdout } = await execFileAsync('node', [SCRIPT, '--list', 'a11y'], { cwd: REPO_ROOT });

    expect(stdout).toContain('# named in mutate but holds no runtime value');
    expect(stdout).toMatch(/index\.ts \(barrel\)/);
  });

  it('知らない package を渡すと 2 で終わる', async () => {
    let exitCode = 0;
    let stderr = '';
    try {
      await execFileAsync('node', [SCRIPT, '--list', 'no-such-package'], { cwd: REPO_ROOT });
    } catch (error: unknown) {
      const err = error as { code?: number; stderr?: string };
      exitCode = err.code ?? 0;
      stderr = err.stderr ?? '';
    }
    expect(exitCode).toBe(2);
    expect(stderr).toContain('unknown package');
  });

  it('import しても集計を実行しない', async () => {
    // 分類器を検査から使うため、読み込むだけで走らないことを固定する。
    // 走ると検査のたびに 400 file を解析し、出力も混ざる。
    const { stdout } = await execFileAsync(
      'node',
      ['-e', `import(${JSON.stringify(pathToFileURL(SCRIPT).href)}).then(() => {})`],
      { cwd: REPO_ROOT },
    );
    expect(stdout).toBe('');
  });
});
