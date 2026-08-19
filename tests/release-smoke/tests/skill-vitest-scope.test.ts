import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

import { REPO_ROOT, stepFence, stepSection } from './skill-md.js';

const execFileAsync = promisify(execFile);

const SKILL = 'kiwa-observe';
const STEP_ZERO = /^### Step 0\b/m;
const STEP_ONE = /^### Step 1\b/m;

/**
 * 観測が走らせる test の範囲 (#1914)。
 *
 * `/kiwa-observe` の Step 0 は vitest を JSON で走らせる。 chain は本 skill を repo root から
 * 起動するため (`/kiwa-test` Step 5a が `--project-root examples/{example}` を渡す)、 範囲を
 * 絞らないと **monorepo 全体から test を集める**。 実測で repo root は 332 件を収集し、 その後
 * hardhat の fixture を読み込んで停止した。
 *
 * **失敗するより、 失敗しない方が危ない**。 集まるのは別 package の test なので、 dashboard の
 * Summary が観測対象ではないものの pass / fail を報告する。 #1909 で直した「表示が実態を表さない」
 * 形が別経路で戻る。
 */

/** Step 0 の bash fence。 */
function stepZeroCommand(): string {
  return stepFence(SKILL, STEP_ZERO, 'bash').trim();
}

interface Report {
  testResults: { name?: string }[];
  numTotalTests?: number;
}

/**
 * 書かれている起動形で vitest を走らせる 2 件。
 *
 * 互いに独立で、 直列に回す理由が無い (実測で 1 件 2.6-2.7 秒、 直列 5341ms)。 まとめて起動する。
 * 出力先は起動ごとに別 dir を取る = 同じ path に書くと、 並べた瞬間に片方がもう片方の結果を読む。
 */
const SCOPED_RUNS = {
  /** test を持つ project。 集まること自体も見る。 */
  withTests: 'examples/dogfood-dapp-e2e-reorg',
  /** runner が vitest でない project。 0 件で exit 0 になることを見る。 */
  withoutTests: 'examples/mint-nft',
} as const;

type RunKey = keyof typeof SCOPED_RUNS;

describe('kiwa-observe の Step 0 が観測対象に範囲を絞る', () => {
  const out = {} as Record<RunKey, Report>;

  beforeAll(async () => {
    const keys = Object.keys(SCOPED_RUNS) as RunKey[];
    const reports = await Promise.all(
      keys.map(async (key): Promise<Report> => {
        const projectRoot = SCOPED_RUNS[key];
        if (!existsSync(resolve(REPO_ROOT, projectRoot))) throw new Error(`${projectRoot} が無い`);
        const dir = mkdtempSync(resolve(tmpdir(), `kiwa-vitest-scope-${key}-`));
        try {
          const outputFile = resolve(dir, 'vitest-results.json');
          await execFileAsync(
            'pnpm',
            [
              'exec',
              'vitest',
              'run',
              '--root',
              projectRoot,
              '--passWithNoTests',
              '--reporter=json',
              `--outputFile=${outputFile}`,
            ],
            { cwd: REPO_ROOT, encoding: 'utf-8' },
          );
          return JSON.parse(readFileSync(outputFile, 'utf-8')) as Report;
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      }),
    );
    keys.forEach((key, i) => {
      out[key] = reports[i]!;
    });
  }, 300_000);

  it('vitest の起動が --root を観測対象の起点に向ける', () => {
    // 絞る先は `--project-root` と同じ値。 別の変数を書くと、 呼出側が渡した起点と収集範囲が
    // ずれる。
    const command = stepZeroCommand();
    expect(command, 'vitest を走らせていない').toContain('vitest run');
    expect(command, '--root を渡していない').toMatch(/--root\s+"\$PROJECT_ROOT"/);
  });

  it('test file が 0 件でも失敗にしない flag を渡す', () => {
    // vitest は test file が 1 件も無いと exit 1 で終わる (実測)。 runner が vitest でない layer では
    // 0 件が正常なので、 失敗にすると観測がそこで止まる。
    expect(stepZeroCommand(), '--passWithNoTests を渡していない').toContain('--passWithNoTests');
  });

  it('結果を JSON で書き出す reporter を渡す', () => {
    // Step 1 は書かれた file を `JSON.parse` する。 reporter を渡さないと **file が 1 件も
    // 書かれない** (実測 = 既定 reporter は stdout にしか出さず、 `--outputFile` は無視されて
    // exit 0 で終わる)。
    //
    // **落ちないのが問題**。 前 run の `tests/reports/vitest-results.json` が残っていれば
    // Step 1 はそれを読み、 dashboard が前回の結果を今回の観測として報告する。 Step 0 が
    // 「読み先を 1 箇所に決める」 理由そのものが崩れる。
    //
    // Step 0 の契約は 5 要素 (`vitest run` / `--root` / `--passWithNoTests` /
    // `--reporter=json` / `--outputFile`) で、 本 file は 4 要素しか照合していなかった
    // (docs/quality/check-authoring.md § 複数の要素を要求する契約では「全要素」 が最小の形)。
    expect(stepZeroCommand(), '--reporter=json を渡していない').toContain('--reporter=json');
  });

  it('出力先を --root 相対で書いている', () => {
    // `--outputFile` は `--root` から解決される。 repo root 相対で書くと
    // `$PROJECT_ROOT/$PROJECT_ROOT/tests/...` に書かれる (実測)。
    const output = /--outputFile=(\S+)/.exec(stepZeroCommand());
    expect(output, '--outputFile を渡していない').not.toBeNull();
    expect(output![1]!, '出力先が root 相対でない').toBe('tests/reports/vitest-results.json');
  });

  it('読み先が 1 つの規則で決まる', () => {
    // Step 0 が書く先と Step 1 が読む先が別々に決まると、 前 run の結果を読んで「観測した」 ことに
    // なる。 `--vitest-json` を渡した時も同じ規則で決める (Round 1 F1: 宣言は再利用と言いながら、
    // reader は固定 path を読んでいた)。
    const stepZero = stepSection(SKILL, STEP_ZERO);
    expect(stepZero, '読み先の規則を書いていない').toContain('VITEST_JSON');
    expect(stepZero, '--vitest-json を規則に含めていない').toMatch(/--vitest-json[^\n]*\n?[^\n]*その値/);
    expect(stepZero, '既定の読み先を書いていない').toContain(
      '$PROJECT_ROOT/tests/reports/vitest-results.json',
    );
    expect(stepFence(SKILL, STEP_ONE, 'ts'), 'Step 1 が規則を使わず固定 path を読んでいる').toContain(
      'readFile(VITEST_JSON,',
    );
  });

  it('test を持つ project では、 その project の test だけを集める', () => {
    // 0 件の側だけを見ると、 **1 件も集めない実装** でも通ってしまう (Round 1 F2)。 test がある
    // project で、 集まったことと、 集まった先が root の下だけであることを同時に見る。
    const projectRoot = SCOPED_RUNS.withTests;
    expect(out.withTests.testResults.length, 'test を 1 件も集めていない').toBeGreaterThan(0);
    expect(out.withTests.numTotalTests ?? 0).toBeGreaterThan(0);

    const outside = out.withTests.testResults
      .map((f) => f.name ?? '')
      .filter((name) => !name.includes(`/${projectRoot}/`));
    expect(outside, `root の外の test を集めている:\n${outside.join('\n')}`).toEqual([]);
  });

  it('runner が vitest でない layer でも非 0 で落ちない', () => {
    // #1914 の本体。 `contract` の runner は Foundry / Hardhat で、 その project に vitest の設定は
    // 無い。 **範囲を絞れば** exit 0 で record 0 件になる = 観測を止めずに、 dashboard 側が
    // 「実行結果を 1 件も受け取っていない」 と書ける (#1909)。
    //
    // 絞らない形 (repo root) はこの検査では走らせない。 332 件を集めた末に落ちるため、 走らせる
    // こと自体が高くつく。 代わりに上の静的検査が `--root` を要求する。
    expect(out.withoutTests.testResults).toEqual([]);
    expect(out.withoutTests.numTotalTests ?? 0).toBe(0);
  });
});
