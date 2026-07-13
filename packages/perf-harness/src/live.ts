/**
 * runPerf3LayerLive — 3-layer perf against a live third-party API.
 *
 * Companion to {@link runPerf3Layer}. Same shape, same reporting, same
 * baseline / regression semantics. Two behavioural differences:
 *
 * 1. **env-skip contract** — the caller declares which env vars are required
 *    to reach the live API. When any required var is unset, the helper skips
 *    the run and emits a `LIVE_ENV_MISSING` marker report (so CI-independent
 *    perf sweeps can attribute empty results to missing credentials, not
 *    silent success).
 * 2. **live thresholds** — the default cap is the provider's public SLA
 *    (see docs/quality/perf-thresholds.md § Real-API measurement mode).
 *    Concurrent multiplier stays 2×.
 *
 * Live runs cost money and are slow. Iterations default to 10 (vs 200 for
 * mock) so a full pass fits inside a coffee break. Concurrency defaults to
 * 3 so we don't rate-limit ourselves.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { measure } from './measure.js';
import { measureConcurrent } from './concurrent.js';
import { measureMemory } from './memory.js';
import { detectRegression } from './regression.js';
import { captureEnv, defaultBaselinePath, loadBaseline, saveBaselineEnvelope } from './baseline.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport } from './report.js';
import type { MeasureResult } from './types.js';
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

  const priorBaselineLoaded = await loadBaseline(baselinePath);
  const priorBaseline: Record<string, MeasureResult> | null = priorBaselineLoaded
    ? priorBaselineLoaded.envelope.results
    : null;
  const combinedForBaseline: Record<string, MeasureResult> = {};
  const outcomes: LiveOpOutcome[] = [];
  let baselineSeeded = false;
  let anySkipped = false;

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
    const memoryGatePassed = memory.arrayBuffersDeltaBytes < memoryCap;

    const priorSerial = priorBaseline?.[`${op.name}.live.serial`];
    const regression = priorSerial
      ? detectRegression({ current: serial, baseline: priorSerial, threshold: 0.2 })
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
      regressionVerdict: regression ? regression.verdict : 'n/a (baseline seeded)',
    });
  }

  const anyMeasured = outcomes.some((o) => !o.skipped);
  if (anyMeasured && priorBaseline === null) {
    await saveBaselineEnvelope(baselinePath, {
      schema: 1,
      env: captureEnv(),
      results: combinedForBaseline,
    });
    baselineSeeded = true;
  }

  const allPassed = outcomes
    .filter((o) => !o.skipped)
    .every((o) => o.serialGatePassed && o.concurrentGatePassed && o.memoryGatePassed);

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
    lines.push('## Serial p95 (LIVE)', '');
    lines.push('| op | p95 | cap | gate | regression |');
    lines.push('|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.serial) return;
      lines.push(
        `| ${op.name} | ${out.serial.p95.toFixed(2)}ms | ${op.serialP95CapMs}ms | ${out.serialGatePassed ? 'PASS' : 'FAIL'} | ${out.regressionVerdict} |`,
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
    lines.push('| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |');
    lines.push('|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.memory) return;
      const cap = op.memoryArrayBuffersCapBytes ?? input.memoryCapDefault;
      lines.push(
        `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${cap} B | ${out.memoryGatePassed ? 'PASS' : 'FAIL'} |`,
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
