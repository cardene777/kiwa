import type { RunHistory, TestRunRecord } from './types.js';

export interface CollectRunHistoryOptions {
  /** Existing history to extend */
  history?: RunHistory;
  /** New records to append */
  records: TestRunRecord[];
  /** Cap the number of retained records per testId (FIFO eviction) */
  maxPerTest?: number;
}

export function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory {
  const existing = opts.history?.records ?? [];
  const combined = [...existing, ...opts.records];
  if (!opts.maxPerTest) {
    return { records: combined };
  }

  const byTest = new Map<string, TestRunRecord[]>();
  for (const rec of combined) {
    const arr = byTest.get(rec.testId) ?? [];
    arr.push(rec);
    byTest.set(rec.testId, arr);
  }

  const capped: TestRunRecord[] = [];
  for (const arr of byTest.values()) {
    const start = Math.max(0, arr.length - opts.maxPerTest);
    capped.push(...arr.slice(start));
  }
  capped.sort((a, b) => a.startedAt - b.startedAt);
  return { records: capped };
}

export interface VitestStyleAssertionResult {
  fullName?: string;
  title?: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
}

export interface VitestStyleTestResult {
  testFilePath?: string;
  assertionResults: VitestStyleAssertionResult[];
}

export interface VitestStyleReport {
  testResults: VitestStyleTestResult[];
  startTime?: number;
}

export interface FromVitestJsonOptions {
  runId: string;
}

const TC_ID_REGEX = /\bT-[A-Z0-9]+-\d+\b/;

export function fromVitestJson(report: VitestStyleReport, opts: FromVitestJsonOptions): TestRunRecord[] {
  const startedAt = report.startTime ?? 0;
  const out: TestRunRecord[] = [];
  for (const file of report.testResults) {
    for (const assertion of file.assertionResults) {
      const fullName = assertion.fullName ?? assertion.title ?? '';
      const match = fullName.match(TC_ID_REGEX);
      const testId = match ? match[0] : fullName;
      const status =
        assertion.status === 'passed'
          ? 'passed'
          : assertion.status === 'failed'
          ? 'failed'
          : 'skipped';
      out.push({
        testId,
        fullName,
        status,
        durationMs: assertion.duration ?? 0,
        runId: opts.runId,
        startedAt,
      });
    }
  }
  return out;
}

/**
 * Playwright `JSONReport` の最小形。
 *
 * 実 `JSONReport` は `config` 等も持つが、突き合わせに要るのは
 * suite の木と各 test の状態だけなので、読む field に絞って宣言する。
 * 絞ることで、Playwright 側が無関係な field を増やしても壊れない。
 */
export interface PlaywrightJsonResult {
  status?: 'passed' | 'failed' | 'timedOut' | 'interrupted' | 'skipped' | undefined;
  duration: number;
}

export interface PlaywrightJsonTest {
  /** test 単位の判定。 実 JSON では必須だが、欠落時も末尾 result から復元する。 */
  status?: 'skipped' | 'expected' | 'unexpected' | 'flaky';
  results: PlaywrightJsonResult[];
}

export interface PlaywrightJsonSpec {
  title: string;
  tests: PlaywrightJsonTest[];
}

export interface PlaywrightJsonSuite {
  title: string;
  specs: PlaywrightJsonSpec[];
  /** `test.describe` の入れ子。 深さに上限は無い。 */
  suites?: PlaywrightJsonSuite[];
}

export interface PlaywrightJsonReport {
  suites: PlaywrightJsonSuite[];
  stats: { startTime: string };
}

export interface FromPlaywrightJsonOptions {
  runId: string;
}

/**
 * Playwright の状態を `TestRunRecord` の 3 状態へ写す。
 *
 * Playwright は test 単位で `expected` / `unexpected` / `flaky` / `skipped` を返す。
 * `flaky` は「retry で通った」 = 最終的には通っているので `passed` に寄せる。
 * flaky そのものの検出は `detectFlaky` が run 履歴から行うため、ここでは畳んでよい。
 */
function playwrightStatus(test: PlaywrightJsonTest): TestRunRecord['status'] {
  switch (test.status) {
    case 'expected':
    case 'flaky':
      return 'passed';
    case 'unexpected':
      return 'failed';
    case 'skipped':
      return 'skipped';
    default:
      break;
  }
  // `status` が無い形は最後の result から決める。 retry があるので末尾を見る。
  const last = test.results[test.results.length - 1];
  if (last?.status === 'passed') return 'passed';
  if (last?.status === 'skipped' || last?.status === undefined) return 'skipped';
  return 'failed';
}

/** suite の木を平坦化して spec を順に返す。 入れ子の深さに上限を置かない。 */
function* walkSpecs(
  suites: PlaywrightJsonSuite[],
  trail: string[],
): Generator<{ spec: PlaywrightJsonSpec; trail: string[] }> {
  for (const suite of suites) {
    // `file` は木の根に付き、`title` が describe の名前になる。 名前の無い層は
    // ここでは落とさず、`fullName` を組む時に空要素をまとめて落とす。
    // ここでも落とすと 2 箇所が同じ入力を捕まえ、片方が死んでも気付けない
    // (変異でどちらを外しても 1 件も落ちなかった)。
    const next = [...trail, suite.title];
    for (const spec of suite.specs) {
      yield { spec, trail: next };
    }
    yield* walkSpecs(suite.suites ?? [], next);
  }
}

/**
 * Playwright の JSON レポートを `TestRunRecord[]` へ写す。
 *
 * `fromVitestJson` と対になる入口で、返す形も同じ。 違いは入力の木構造だけ。
 *
 * **`results` が空の test も 1 件として数える**。 Playwright は未実行の test にも
 * `status: 'skipped'` を付けるため、落とすと「実行していない」 が
 * 「存在しない」 に化けて突き合わせが実物とずれる。
 */
export function fromPlaywrightJson(
  report: PlaywrightJsonReport,
  opts: FromPlaywrightJsonOptions,
): TestRunRecord[] {
  const startedAt = Date.parse(report.stats.startTime);
  const out: TestRunRecord[] = [];
  for (const { spec, trail } of walkSpecs(report.suites, [])) {
    if (spec.tests.length === 0) continue;

    // Playwright は同じ spec の project / repeatEach 実行を tests にまとめる。
    // ここで 1 test = 1 record にすると同じ runId を複数 run として数えるため、
    // logical spec ごとに 1 record へ集約する。
    const statuses = spec.tests.map(playwrightStatus);
    const status = statuses.includes('failed')
      ? 'failed'
      : statuses.includes('passed')
        ? 'passed'
        : 'skipped';
    const durationMs = spec.tests.reduce(
      (testTotal, test) =>
        testTotal + test.results.reduce((attemptTotal, result) => attemptTotal + result.duration, 0),
      0,
    );

    // 空要素を落とす唯一の場所。 名前の無い suite (`test.describe` を挟まない file)
    // と、名前の無い spec の両方がここへ来る。
    const fullName = [...trail, spec.title].filter((part) => part !== '').join(' > ');
    const match = fullName.match(TC_ID_REGEX);
    out.push({
      testId: match ? match[0] : fullName,
      fullName,
      status,
      durationMs,
      runId: opts.runId,
      startedAt: Number.isNaN(startedAt) ? 0 : startedAt,
    });
  }
  return out;
}
