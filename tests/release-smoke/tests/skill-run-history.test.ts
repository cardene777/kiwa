import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { REPO_ROOT, stepFence } from './skill-md.js';

const SKILL = 'kiwa-observe';
const STEP_ONE = /^### Step 1\b/m;

/**
 * 観測が run 履歴を持ち越すか (#1918)。
 *
 * `detectFlaky` は同じ test の run が `minRuns` (既定 3) に届いて初めて判定する。 skill が history を
 * 持ち越さない間、 run は常に 1 回で、 **flaky はどの layer でも一度も判定されたことがなかった**。
 *
 * ここでは **SKILL.md に書かれている script をそのまま実行する**。 placeholder だけを埋めて走らせ、
 * 判定が成立することを見る。 script を読み替えて別実装を検査すると、 書かれている手順が動かない
 * まま緑になる (#1908 / #1915 で 2 度踏んだ形)。
 *
 * ## 1 process にまとめる (#1920)
 *
 * 観測 26 回をそれぞれ `node` で起動していた (実測 2341ms)。 script は top-level await を持つ ESM
 * module で、 `process.exit` も `process.chdir` も使わない。 **観測ごとに別 file へ書けば、 逐次
 * `await import()` が 1 process 内で同じ回数だけ実行する** (ESM の module cache は URL 単位)。
 *
 * 書かれている script をそのまま走らせる性質は変わらない。 変わるのは process 境界だけで、 観測の
 * 状態は history file としてやり取りされるため、 process を跨ぐ必要が無い。
 *
 * **scenario の途中で失敗したら残りを走らせない**。 後続の観測は前の観測が書いた history に依存
 * するので、 続けると失敗の後始末を検査したことになる。
 */

/** 1 回の観測。 */
interface Observation {
  startTime: number | null;
  statuses: Record<string, 'passed' | 'failed'>;
  producer?: string;
  /** 同じ run に同じ testId を 2 度出す (retry / 同名 test)。 */
  repeatIds?: boolean;
  /** 同じ testId を先に別の結果で出す (retry)。 最終結果は後ろ。 */
  retryOf?: 'passed' | 'failed';
  /** この観測の直前に history を壊す。 */
  corruptHistory?: true;
}

const MODULE = 'mint-nft';
// report は vitest reporter の形なので、 layer / producer も vitest 系で揃える。
const LAYER = 'unit';
const DEFAULT_PRODUCER = 'kiwa-vitest';

/** pass する観測 1 回。 startTime は run の同一性を決めるので scenario ごとに別値を採る。 */
function pass(startTime: number | null, testId: string, extra: Partial<Observation> = {}): Observation {
  return { startTime, statuses: { [testId]: 'passed' }, ...extra };
}

/**
 * scenario ごとに独立した観測対象を持つ。
 *
 * history は module / layer / producer ごとに 1 file なので、 共有すると前の scenario の run が
 * 「最大 N 回」 に混ざる (実測で 1 件落ちた)。
 */
const SCENARIOS = {
  /** 1 / 2 回目は判定材料が足りない。 3 回目で minRuns に届く。 */
  reachesMinRuns: [pass(1000, 'T-A-001'), pass(2000, 'T-A-001'), pass(3000, 'T-A-001')],
  flakyOnceInThree: [
    pass(4000, 'T-B-001'),
    { startTime: 5000, statuses: { 'T-B-001': 'failed' as const } },
    pass(6000, 'T-B-001'),
  ],
  /** 同じ startTime = 同じ run。 2 度足すと 1 run が 2 run に化ける。 */
  sameReportTwice: [pass(7000, 'T-C-001'), pass(7000, 'T-C-001')],
  summaryCountsThisRun: [pass(10_000, 'T-E-001'), { startTime: 11_000, statuses: {} }],
  withoutStartTime: [pass(null, 'T-F-001'), pass(null, 'T-F-001')],
  repeatedTestIds: [pass(12_000, 'T-G-001', { repeatIds: true })],
  producerSplitsHistory: [
    pass(13_000, 'T-H-001', { producer: 'kiwa-forge' }),
    pass(14_000, 'T-H-001', { producer: 'kiwa-forge' }),
    pass(15_000, 'T-H-001', { producer: 'kiwa-hardhat' }),
  ],
  /** 1 run 目 = fail → pass の retry。 最終結果は pass。 */
  retryKeepsLastResult: [
    pass(17_000, 'T-J-001', { retryOf: 'failed' }),
    pass(18_000, 'T-J-001'),
    pass(19_000, 'T-J-001'),
  ],
  summaryTakesRetryPass: [pass(22_000, 'T-L-001', { retryOf: 'failed' })],
  summaryTakesRetryFail: [
    { startTime: 23_000, statuses: { 'T-M-001': 'failed' as const }, retryOf: 'passed' as const },
  ],
  writesJudgedWindow: [pass(20_000, 'T-K-001'), pass(21_000, 'T-K-001')],
  rejectsUnusableProducer: [pass(16_000, 'T-I-001', { producer: '../escape' })],
  brokenHistory: [pass(8000, 'T-D-001'), pass(9000, 'T-D-001', { corruptHistory: true })],
} satisfies Record<string, Observation[]>;

type Scenario = keyof typeof SCENARIOS;

/** vitest reporter が出す形の最小 JSON。 */
function report(o: Observation): string {
  const results = Object.entries(o.statuses).map(([id, status]) => ({
    fullName: `${id} sample`,
    status,
    duration: 1,
  }));
  const withRetry =
    o.retryOf === undefined
      ? results
      : [...results.map((r) => ({ ...r, status: o.retryOf })), ...results];
  return JSON.stringify({
    ...(o.startTime === null ? {} : { startTime: o.startTime }),
    testResults: [
      {
        testFilePath: 'tests/unit/sample.test.ts',
        assertionResults: o.repeatIds ? [...withRetry, ...withRetry] : withRetry,
      },
    ],
  });
}

function historyPath(project: string, producer: string): string {
  const key = [MODULE, LAYER, producer].filter(Boolean).join('-');
  return resolve(project, `tests/reports/observe/history-${key}.json`);
}

/** 1 scenario 分の結果。 `failures[i]` が null なら i 番目の観測は成功。 */
interface Observed {
  dashboards: (string | null)[];
  failures: (string | null)[];
}

const observed = {} as Record<Scenario, Observed>;

// script は repo の中に置く。 外に置くと import が解決しない (#1915)。
const scratch = resolve(REPO_ROOT, '.context/scratch', `kiwa-observe-history-${process.pid}`);
const projects: string[] = [];

describe('kiwa-observe が run 履歴を持ち越す', () => {
  beforeAll(() => {
    mkdirSync(scratch, { recursive: true });
    const script = stepFence(SKILL, STEP_ONE, 'ts');

    const plan = (Object.keys(SCENARIOS) as Scenario[]).map((name) => {
      const project = mkdtempSync(resolve(tmpdir(), 'kiwa-observe-history-'));
      projects.push(project);
      const steps = SCENARIOS[name].map((o: Observation, i: number) => {
        const producer = o.producer ?? DEFAULT_PRODUCER;
        const vitestJson = resolve(project, `report-${i}.json`);
        writeFileSync(vitestJson, report(o), 'utf-8');
        const out = resolve(project, `dashboard-${i}.md`);
        const scriptPath = resolve(scratch, `${name}-${i}.mjs`);
        const header = [
          `const PROJECT_ROOT = ${JSON.stringify(project)};`,
          `const VITEST_JSON = ${JSON.stringify(vitestJson)};`,
          `const SPEC_PATH = ${JSON.stringify(resolve(REPO_ROOT, 'tests/spec/contract/test-spec-mint-nft.ja.md'))};`,
          `const TEST_PATHS = [${JSON.stringify(resolve(REPO_ROOT, 'tests/fixtures/mint-nft/contract-test/MintNft.t.sol'))}];`,
          `const MODULE = ${JSON.stringify(MODULE)};`,
          `const LAYER = ${JSON.stringify(LAYER)};`,
          `const PRODUCER = ${JSON.stringify(producer)};`,
          `const OUT_PATH = ${JSON.stringify(out)};`,
          '',
        ].join('\n');
        writeFileSync(scriptPath, header + script, 'utf-8');
        return {
          script: scriptPath,
          out,
          ...(o.corruptHistory ? { corrupt: historyPath(project, producer) } : {}),
        };
      });
      return { name, steps };
    });

    const planPath = resolve(scratch, 'plan.json');
    const resultPath = resolve(scratch, 'result.json');
    writeFileSync(planPath, JSON.stringify(plan), 'utf-8');

    // 観測を 1 process で順に実行する。 file が違えば ESM は毎回評価するので、 観測の回数は
    // 変わらない。 失敗した scenario は残りを走らせず、 その旨を記録する。
    const runner = resolve(scratch, 'run.mjs');
    writeFileSync(
      runner,
      `import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const results = {};
for (const scenario of plan) {
  const failures = [];
  let aborted = false;
  for (const step of scenario.steps) {
    if (aborted) { failures.push('先行する観測が失敗したため走らせていない'); continue; }
    if (step.corrupt) writeFileSync(step.corrupt, '{ broken', 'utf8');
    try {
      await import(pathToFileURL(step.script).href);
      failures.push(null);
    } catch (err) {
      failures.push(String((err && err.message) || err));
      aborted = true;
    }
  }
  results[scenario.name] = failures;
}
writeFileSync(process.argv[3], JSON.stringify(results), 'utf8');
`,
      'utf-8',
    );
    execFileSync('node', [runner, planPath, resultPath], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const failures = JSON.parse(readFileSync(resultPath, 'utf-8')) as Record<Scenario, (string | null)[]>;
    for (const { name, steps } of plan) {
      const got = failures[name];
      // runner が scenario を飛ばした形を「観測できなかった」 として落とす。 欠けたまま進むと、
      // 下の検査が undefined を読んで別の理由で落ち、 原因が判らなくなる。
      expect(got, `${name} の結果が返っていない`).toHaveLength(steps.length);
      observed[name] = {
        failures: got,
        dashboards: steps.map((s, i) => (got[i] === null ? readFileSync(s.out, 'utf-8') : null)),
      };
    }
  }, 300_000);

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
    for (const dir of projects) rmSync(dir, { recursive: true, force: true });
  });

  /** i 番目の観測が成功していることを確かめて dashboard を返す。 */
  function dashboard(name: Scenario, i: number): string {
    expect(observed[name].failures[i], `${name}[${i}] が失敗した`).toBeNull();
    return observed[name].dashboards[i]!;
  }

  it('3 回観測すると判定が成立する', () => {
    const first = dashboard('reachesMinRuns', 0);
    expect(first, '1 回目で判定してしまっている').toContain('flaky は判定していない');
    expect(first).toContain('最大 1 回しか無い');

    expect(dashboard('reachesMinRuns', 1)).toContain('最大 2 回しか無い');

    const third = dashboard('reachesMinRuns', 2);
    expect(third, '3 回目でも判定していない').not.toContain('flaky は判定していない');
    expect(third, '判定した上で 0 件の文言が出ていない').toContain('No flaky tests detected.');
  });

  it('3 回のうち 1 回だけ失敗した test を flaky として出す', () => {
    const third = dashboard('flakyOnceInThree', 2);
    expect(third, 'flaky の表が出ていない').toContain('| testId | failure rate |');
    expect(third).toContain('| T-B-001 |');
    expect(third).toContain('33.3%');
  });

  it('同じ report を 2 度観測しても run 数が増えない', () => {
    // `--vitest-json` で同じ file を再利用する経路がある。 2 度足すと 1 回の run が 2 回に化け、
    // 判定が実態より早く成立する。
    expect(dashboard('sameReportTwice', 1), '同じ run を 2 回数えている').toContain(
      '最大 1 回しか無い',
    );
  });

  it('Summary はこの run を数える (累積で埋めない)', () => {
    // 累積を Summary に渡すと、 この run が 0 件でも過去の record で pass rate が出て、 走らせて
    // いない状態が成功に見える (#1909 で禁じた形、 Round 1 F1)。
    const empty = dashboard('summaryCountsThisRun', 1);
    expect(empty, 'この run が 0 件なのに pass rate を出している').toContain('| pass rate | n/a |');
    expect(empty).toContain('| total records | 0 |');
  });

  it('startTime が無い report を 2 度観測しても 2 run に数えない', () => {
    // 時刻で代用すると観測のたびに別 run になり、 1 run が 2 run に化ける (Round 1 F2)。
    //
    // 保証するのは **file の中身が同じなら同じ id** まで。 意味で正規化すると、 結果が同じ 2 run が
    // 1 run に畳まれて flaky が永久に判定されない (Round 2 F1 への回答)。 したがって hash の入力を
    // raw text から parse 後の object に変えても、 この検査は通る = その 2 つは本検査にとって等価な
    // 実装。
    expect(dashboard('withoutStartTime', 1), '同じ report を 2 run と数えている').toContain(
      '最大 1 回しか無い',
    );
  });

  it('同じ run に同じ testId が 2 度出ても 1 run と数える', () => {
    // retry / 同名 test。 畳まないと 1 run が複数 run として数えられる (Round 1 F3)。
    expect(dashboard('repeatedTestIds', 0), '1 run を複数 run と数えている').toContain(
      '最大 1 回しか無い',
    );
  });

  it('producer が違えば history を分ける', () => {
    // `contract` は forge と hardhat の 2 producer を持つ。 混ぜると別の成果物の run が同じ testId で
    // 数えられる (Round 1 F5)。
    expect(dashboard('producerSplitsHistory', 2), '別 producer の run を数えている').toContain(
      '最大 1 回しか無い',
    );
  });

  it('retry の最終結果を採る (先頭ではなく後)', () => {
    // 同じ run に同じ testId が pass と fail で並ぶ形。 先頭を残すと、 直った test を失敗として
    // 数える (Round 2 F2)。 最終結果を採っていれば 3 run とも pass = flaky ではない。
    expect(dashboard('retryKeepsLastResult', 2), 'retry の先頭 (失敗) を採っている').toContain(
      'No flaky tests detected.',
    );
  });

  it('Summary も retry の最終結果を数える', () => {
    // 畳み込みを history 側だけに掛けると、 Summary が両 attempt を数えて pass rate 50% と出る =
    // その run の最終結果を表さない (Round 3 F2-R3)。
    const failThenPass = dashboard('summaryTakesRetryPass', 0);
    expect(failThenPass, 'Summary が retry の両方を数えている').toContain('| total records | 1 |');
    expect(failThenPass).toContain('| pass rate | 100.0% |');

    const passThenFail = dashboard('summaryTakesRetryFail', 0);
    expect(passThenFail).toContain('| total records | 1 |');
    expect(passThenFail, '悪化した retry の最終結果を採っていない').toContain('| pass rate | 0.0% |');
  });

  it('判定の対象期間を dashboard に書く', () => {
    // Summary は この run、 flaky は累積。 期間が違うことを書かないと、 件数が食い違って見える
    // (Round 2 F3)。
    expect(dashboard('writesJudgedWindow', 1), '判定の対象期間を書いていない').toMatch(
      /判定は累積 \d+ record に対して行う/,
    );
  });

  it('file 名に使えない module / layer を拒む', () => {
    // path に埋める値。 separator を含む形で起点の外に書けないようにする (Round 1 F4)。
    //
    // **どの値が拒まれたかまで見る**。 「何かで落ちた」 だけだと、 spec が読めない等の無関係な
    // 失敗を「拒んだ」 と読んでしまう。
    const [failure] = observed.rejectsUnusableProducer.failures;
    expect(failure, '起点の外を指す producer を通している').not.toBeNull();
    expect(failure, '拒んだ値を message に書いていない').toContain('PRODUCER');
  });

  it('history が壊れている時は黙って空から数え直さない', () => {
    // 空へ倒すと、 判定に届かない状態が「まだ 3 回に達していない」 と区別できず毎回そう見える
    // (#1909 / #1910 と同じ「静かな緑」)。
    const { failures } = observed.brokenHistory;
    expect(failures[0], '1 回目が失敗している').toBeNull();
    expect(failures[1], '壊れた history から数え直している').not.toBeNull();
    // 素の SyntaxError には file 名が入らない。 どの file を消せばよいか判らないと、 「止める」 が
    // 行き止まりになる。
    expect(failures[1], '消すべき file を message に書いていない').toContain(
      'history-mint-nft-unit-kiwa-vitest.json',
    );
  });
});
