/**
 * runPerf3LayerLive — 3-layer perf against a live third-party API.
 *
 * Companion to {@link runPerf3Layer}. Same shape, same reporting, same
 * baseline semantics. Three behavioural differences:
 *
 * 1. **env-skip contract** — the caller declares which env vars are required
 *    to reach the live API. When any required var is unset, the helper skips
 *    the run and emits a `LIVE_ENV_MISSING` marker report (so CI-independent
 *    perf sweeps can attribute empty results to missing credentials, not
 *    silent success).
 * 2. **live thresholds** — the default cap is the provider's public SLA
 *    (see docs/quality/perf-thresholds.md § Real-API measurement mode).
 *    Concurrent multiplier stays 2×.
 * 3. **no in-run normalization** — the mock path measures each op alternating
 *    with a harness-owned reference op and judges on the ratio (#1737). Neither
 *    reference kind shares the disturbance of a network round trip, so this path
 *    keeps measuring the op alone. `MeasureResult.reference` is therefore absent
 *    here, `resolveNormalization` reports `normalized: false`, and the verdict
 *    compares raw durations — carrying the run-to-run drift the mock path now
 *    cancels. The stored `measurementPremise` is shared with the mock path, so
 *    it does not distinguish the two; the presence of `reference` does.
 *
 * Live runs cost money and are slow. Iterations default to 10 (vs 200 for
 * mock) so a full pass fits inside a coffee break. Concurrency defaults to
 * 3 so we don't rate-limit ourselves.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { measure, measureHarnessResolution } from './measure.js';
import { measureConcurrent } from './concurrent.js';
import { measureMemory } from './memory.js';
import { RESOLUTION_FLOOR_MULTIPLE, detectRegression } from './regression.js';
import {
  BASELINE_SCHEMA,
  captureEnv,
  defaultBaselinePath,
  isComparableEnv,
  loadBaseline,
  saveBaselineEnvelope,
} from './baseline.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport, formatMs } from './report.js';
import type { MeasureResult } from './types.js';
import { buildRegressionNote } from './three-layer.js';
import type { OpOutcome, PerfOpSpec } from './three-layer.js';

export interface LivePerfOpSpec extends PerfOpSpec {
  /**
   * Env vars that must all be set for this op to reach the live API.
   * When any is missing the op is skipped and reported as LIVE_ENV_MISSING.
   */
  requiredEnv: string[];
}

export interface RunPerf3LayerLiveInput {
  moduleName: string;
  ops: LivePerfOpSpec[];
  reportPath: string;
  baselinePath?: string;
  serialIterations?: number;
  serialWarmup?: number;
  concurrency?: number;
  iterationsPerWorker?: number;
  memoryIterations?: number;
  thresholdDocLink?: string;
  /**
   * GC を呼べない測定を memory gate の失敗として扱う (default false)。
   *
   * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
   * 成立しない。 config 側で GC を可能にしても、呼出が要求しなければ
   * 「測れていない実行」 が上限内として通る。 mock 経路 (`runPerf3Layer`) と
   * 同じ契約にする (#1708)。
   */
  requireGc?: boolean;
}

export interface LiveOpOutcome extends Partial<OpOutcome> {
  name: string;
  skipped: boolean;
  skipReason: string | null;
}

export interface RunPerf3LayerLiveResult {
  outcomes: LiveOpOutcome[];
  allPassed: boolean;
  anySkipped: boolean;
  baselineSeeded: boolean;
}

export async function runPerf3LayerLive(
  input: RunPerf3LayerLiveInput,
): Promise<RunPerf3LayerLiveResult> {
  const serialIterations = input.serialIterations ?? 10;
  const serialWarmup = input.serialWarmup ?? 1;
  const concurrency = input.concurrency ?? 3;
  const iterationsPerWorker = input.iterationsPerWorker ?? 3;
  const memoryIterations = input.memoryIterations ?? 20;
  const memoryCapDefault = 100 * 1024;
  const baselinePath =
    input.baselinePath ?? defaultBaselinePath(`${input.moduleName}.live`);
  const thresholdDocLink = input.thresholdDocLink ?? '../../quality/perf-thresholds';

  const loadedBaseline = await loadBaseline(baselinePath);
  // 測定の前提が違う baseline とは比べない。 mock 経路 (`runPerf3Layer`) は #1708 から
  // これを行っていたが live 経路には無く、 版を上げるたびに前提の違う値と比べ続けていた。
  const priorBaselineLoaded =
    loadedBaseline && isComparableEnv(loadedBaseline.envelope.env, captureEnv())
      ? loadedBaseline
      : null;
  const priorBaseline: Record<string, MeasureResult> | null = priorBaselineLoaded
    ? priorBaselineLoaded.envelope.results
    : null;
  const combinedForBaseline: Record<string, MeasureResult> = {};
  const outcomes: LiveOpOutcome[] = [];
  let baselineSeeded = false;
  let anySkipped = false;

  // mock 経路と同じく、 回帰判定の絶対下限をこの実行の中で測って決める。
  // live の op は network 越しで ms 規模なので下限が効く場面はまずないが、
  // 判定の前提を経路ごとに変えると report の読み方が経路ごとに変わる。
  const resolutionMs = await measureHarnessResolution({
    iterations: serialIterations,
    warmup: serialWarmup,
  });

  for (const op of input.ops) {
    const missing = op.requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      anySkipped = true;
      outcomes.push({
        name: op.name,
        skipped: true,
        skipReason: `LIVE_ENV_MISSING: ${missing.join(', ')}`,
      });
      continue;
    }

    const serial = await measure({
      name: `${op.name}.live.serial`,
      iterations: serialIterations,
      warmup: serialWarmup,
      fn: async () => {
        await op.fn();
      },
    });
    const concurrent = await measureConcurrent({
      name: `${op.name}.live.concurrent`,
      concurrency,
      iterationsPerWorker,
      warmup: 1,
      fn: async () => {
        await op.fn();
      },
    });
    const memory = await measureMemory({
      fn: async () => {
        await op.fn();
      },
      iterations: memoryIterations,
    });

    const concurrentCap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
    const memoryCap = op.memoryArrayBuffersCapBytes ?? memoryCapDefault;

    const serialGate = evaluatePerfGate({
      result: serial,
      thresholds: { p95Ms: op.serialP95CapMs },
    });
    const concurrentGate = evaluatePerfGate({
      result: concurrent,
      thresholds: { p95Ms: concurrentCap },
    });
    const memoryGatePassed =
      (!input.requireGc || memory.gcExposed) && memory.arrayBuffersDeltaBytes < memoryCap;

    const priorSerial = priorBaseline?.[`${op.name}.live.serial`];
    const regression = priorSerial
      ? detectRegression({
          current: serial,
          baseline: priorSerial,
          threshold: 0.2,
          resolutionMs,
          // `LivePerfOpSpec` は `PerfOpSpec` を継承するので op 側で下限を指定できる。
          // 渡さないと、 同じ指定が mock 経路でだけ効いて live 経路では黙って無視される。
          ...(op.regressionMinDeltaMs === undefined
            ? {}
            : { minDeltaMs: op.regressionMinDeltaMs }),
        })
      : null;

    combinedForBaseline[`${op.name}.live.serial`] = serial;
    combinedForBaseline[`${op.name}.live.concurrent`] = concurrent;

    outcomes.push({
      name: op.name,
      skipped: false,
      skipReason: null,
      serial,
      concurrent,
      memory,
      serialGatePassed: serialGate.verdict.passed,
      concurrentGatePassed: concurrentGate.verdict.passed,
      memoryGatePassed,
      // この経路の n/a は「seed が起きた」 を保証しない。 保存条件は
      // `priorBaseline === null` かつ測定が成立していることで、 既存 baseline が
      // ある実行では 1 byte も書かない (新しい op を足しても追記されない)。
      // mock 経路は理由を分けて出すが、 live 側は保存経路そのものが足りていない
      // ため、 文言だけ直すと「追記されるはず」 という別の誤解を生む。
      // 保存経路と併せて別 Issue で扱う。
      regressionVerdict: regression ? regression.verdict : 'n/a (baseline seeded)',
      ...(regression === null ? {} : buildRegressionNote(regression, 0.2)),
    });
  }

  const measured = outcomes.filter((o) => !o.skipped);
  const anyMeasured = measured.length > 0;
  const allPassed = measured.every(
    (o) => o.serialGatePassed && o.concurrentGatePassed && o.memoryGatePassed,
  );

  // 測定そのものが成立している実行の値だけを基準にする。 GC を呼べない実行や
  // 上限を割った実行を保存すると、壊れた状態が次回以降の比較対象になる。
  // mock 経路 (`runPerf3Layer`) と同じ条件 (#1708)。
  const premiseValid = !input.requireGc || measured.every((o) => o.memory?.gcExposed);
  if (anyMeasured && priorBaseline === null && premiseValid && allPassed) {
    await saveBaselineEnvelope(baselinePath, {
      schema: BASELINE_SCHEMA,
      env: captureEnv(),
      results: combinedForBaseline,
    });
    baselineSeeded = true;
  }

  writeLiveReport({
    reportPath: input.reportPath,
    moduleName: input.moduleName,
    outcomes,
    ops: input.ops,
    thresholdDocLink,
    priorBaseline,
    concurrency,
    iterationsPerWorker,
    memoryIterations,
    memoryCapDefault,
    resolutionMs,
  });

  return { outcomes, allPassed, anySkipped, baselineSeeded };
}

interface WriteLiveReportInput {
  reportPath: string;
  moduleName: string;
  outcomes: LiveOpOutcome[];
  ops: LivePerfOpSpec[];
  thresholdDocLink: string;
  priorBaseline: Record<string, MeasureResult> | null;
  concurrency: number;
  iterationsPerWorker: number;
  memoryIterations: number;
  memoryCapDefault: number;
  /** この実行で測った測定系の分解能 (ms)。 回帰判定の絶対下限の素。 */
  resolutionMs: number;
}

function writeLiveReport(input: WriteLiveReportInput): void {
  const lines: string[] = [
    `# Perf Suite — ${input.moduleName} (LIVE)`,
    '',
    `Threshold source: [docs/quality/perf-thresholds.md § Real-API measurement mode](${input.thresholdDocLink})`,
    '',
  ];

  const skippedOps = input.outcomes.filter((o) => o.skipped);
  const measuredOps = input.outcomes.filter((o) => !o.skipped);

  if (skippedOps.length > 0) {
    lines.push('## Skipped ops (missing env)', '', '| op | reason |', '|---|---|');
    for (const o of skippedOps) lines.push(`| ${o.name} | ${o.skipReason} |`);
    lines.push('');
  }

  if (measuredOps.length === 0) {
    lines.push('_No live ops ran this pass. Set the required env vars to enable._');
  } else {
    lines.push(
      `測定系の分解能 = ${formatMs(input.resolutionMs)} (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの ${RESOLUTION_FLOOR_MULTIPLE} 倍 = ${formatMs(input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE)}、 op ごとの実効値は下表の「下限」 列。`,
      '',
      '## Serial (LIVE, concurrency = 1)',
      '',
    );
    lines.push('| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |');
    lines.push('|---|---|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.serial) return;
      lines.push(
        `| ${op.name} | ${formatMs(out.serial.p10)} | ${formatMs(out.serial.p95)} | ${op.serialP95CapMs}ms | ${formatMs(op.regressionMinDeltaMs ?? input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE)} | ${out.serialGatePassed ? 'PASS' : 'FAIL'} | ${out.regressionNote ? `${out.regressionVerdict} (${out.regressionNote})` : out.regressionVerdict} |`,
      );
    });

    lines.push(
      '',
      `## Concurrent p95 (LIVE, concurrency = ${input.concurrency})`,
      '',
      '| op | p95 | cap | gate |',
      '|---|---|---|---|',
    );
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.concurrent) return;
      const cap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
      lines.push(
        `| ${op.name} | ${out.concurrent.p95.toFixed(2)}ms | ${cap}ms | ${out.concurrentGatePassed ? 'PASS' : 'FAIL'} |`,
      );
    });

    lines.push('', '## Memory retention (LIVE)', '');
    // gc exposed 列は測定条件の証跡。--expose-gc なしだと解放される一時使用まで
    // 拾うため、no と yes の値を同じ基準で比べられない。
    lines.push('| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |');
    lines.push('|---|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.memory) return;
      const cap = op.memoryArrayBuffersCapBytes ?? input.memoryCapDefault;
      lines.push(
        `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${cap} B | ${out.memory.gcExposed ? 'yes' : 'no'} | ${out.memoryGatePassed ? 'PASS' : 'FAIL'} |`,
      );
    });

    lines.push('', '## Detailed serial reports', '');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.serial) return;
      lines.push(`### ${op.name}`);
      lines.push('');
      const priorSerial = input.priorBaseline?.[`${op.name}.live.serial`];
      lines.push(
        emitPerfReport(out.serial, {
          includeSamples: false,
          ...(priorSerial !== undefined ? { baseline: priorSerial } : {}),
        }),
      );
    });
  }

  mkdirSync(path.dirname(input.reportPath), { recursive: true });
  writeFileSync(input.reportPath, `${lines.join('\n')}\n`, 'utf8');
}
