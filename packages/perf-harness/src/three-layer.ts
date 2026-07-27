/**
 * runPerf3Layer — the reusable 3-layer perf harness landed in v1.14-post.
 *
 * v1.13-1 shipped `measure` alone which caps at "serial mock is fast" — not
 * a real perf guarantee. #739 introduced 3-layer coverage:
 *
 * - **serial** — `measure` at concurrency 1 (baseline latency)
 * - **concurrent** — `measureConcurrent` at N workers (contention / bottleneck)
 * - **memory** — `measureMemory` (arrayBuffers axis, GC-independent)
 *
 * Plus baseline auto-seed + regression detection (20 % delta + Welch t-test)
 * + a markdown report with SSOT threshold references.
 *
 * Callers declare their target ops + thresholds and this helper drives the
 * whole pipeline. See docs/quality/perf-thresholds.md for the threshold
 * SSOT.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { measure } from './measure.js';
import { measureConcurrent } from './concurrent.js';
import { measureMemory, type MemorySample } from './memory.js';
import { detectRegression } from './regression.js';
import {
  captureEnv,
  defaultBaselinePath,
  isComparableEnv,
  loadBaseline,
  saveBaselineEnvelope,
} from './baseline.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport } from './report.js';
import type { MeasureResult } from './types.js';

export interface PerfOpSpec {
  name: string;
  fn: () => Promise<unknown> | unknown;
  /**
   * Serial p95 hard cap (ms). Source: docs/quality/perf-thresholds.md.
   */
  serialP95CapMs: number;
  /**
   * Optional override for concurrent cap. Default = 2 × serial cap per SSOT.
   */
  concurrentP95CapMs?: number;
  /**
   * 回帰と判定する p95 差の下限 (ms、default 0.5)。
   *
   * 既定値は測定の揺らぎを除くためのものだが、高頻度 op には緩すぎる。
   * 0.10ms → 0.59ms は 490% の悪化でも差が 0.49ms なので既定では stable になる。
   * そうした op は実測の noise floor に合わせて小さくする。
   */
  regressionMinDeltaMs?: number;
  /**
   * Optional override for memory arrayBuffers cap.
   * Default = 100 KB across 200 iterations.
   */
  memoryArrayBuffersCapBytes?: number;
}

export interface RunPerf3LayerInput {
  moduleName: string;
  ops: PerfOpSpec[];
  /**
   * Absolute path to the markdown report file. Overwritten each run.
   */
  reportPath: string;
  /**
   * Optional override for baseline path. Default = defaultBaselinePath(moduleName).
   */
  baselinePath?: string;
  /**
   * Iterations for the serial phase. Default 200.
   */
  serialIterations?: number;
  /**
   * Warmup iterations for the serial phase (discarded). Default 5.
   */
  serialWarmup?: number;
  /**
   * Worker count for the concurrent phase. Default 10.
   */
  concurrency?: number;
  /**
   * Per-worker iterations for the concurrent phase. Default 50.
   */
  iterationsPerWorker?: number;
  /**
   * Iterations for the memory phase. Default 200.
   */
  memoryIterations?: number;
  /**
   * Path (relative to reportPath's directory tree) that the report references
   * as the threshold SSOT. Default: '../../quality/perf-thresholds'.
   */
  thresholdDocLink?: string;
  /**
   * 今回測っていない op を baseline から削除する (default false)。
   *
   * op 名を別処理へ付け替えたときに無関係な過去値と比較しないための掃除だが、
   * 常に有効だと絞り込み実行で op が一度欠けるだけで過去値が消える。
   * 次の完全実行では再 seed されて直前の退行を見逃すので、suite 全体を
   * 回す呼出だけが明示的に有効化する。
   */
  pruneStaleBaselineOps?: boolean;
}

export interface OpOutcome {
  name: string;
  serial: MeasureResult;
  concurrent: MeasureResult;
  memory: MemorySample;
  serialGatePassed: boolean;
  concurrentGatePassed: boolean;
  memoryGatePassed: boolean;
  regressionVerdict: 'stable' | 'improved' | 'regressed' | 'n/a (baseline seeded)';
}

export interface RunPerf3LayerResult {
  outcomes: OpOutcome[];
  allPassed: boolean;
  baselineSeeded: boolean;
}

export async function runPerf3Layer(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult> {
  const serialIterations = input.serialIterations ?? 200;
  const serialWarmup = input.serialWarmup ?? 5;
  const concurrency = input.concurrency ?? 10;
  const iterationsPerWorker = input.iterationsPerWorker ?? 50;
  const memoryIterations = input.memoryIterations ?? 200;
  const memoryCapDefault = 100 * 1024;
  const baselinePath = input.baselinePath ?? defaultBaselinePath(input.moduleName);
  const thresholdDocLink = input.thresholdDocLink ?? '../../quality/perf-thresholds';

  const loadedBaseline = await loadBaseline(baselinePath);
  // 測定の前提が違う baseline とは比べない。とくに GC を呼べるかどうかで
  // memory 測定の意味が変わるため、実装が同じでも回帰と判定されてしまう。
  const priorBaselineLoaded =
    loadedBaseline && isComparableEnv(loadedBaseline.envelope.env, captureEnv())
      ? loadedBaseline
      : null;
  const priorBaseline: Record<string, MeasureResult> | null = priorBaselineLoaded
    ? priorBaselineLoaded.envelope.results
    : null;
  const combinedForBaseline: Record<string, MeasureResult> = {};
  const outcomes: OpOutcome[] = [];

  for (const op of input.ops) {
    const serial = await measure({
      name: `${op.name}.serial`,
      iterations: serialIterations,
      warmup: serialWarmup,
      fn: async () => {
        await op.fn();
      },
    });
    const concurrent = await measureConcurrent({
      name: `${op.name}.concurrent`,
      concurrency,
      iterationsPerWorker,
      warmup: 2,
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
    // GC を呼べない測定は解放される一時使用まで拾うため、上限との比較が成立しない。
    // 表示だけで済ませると設定漏れの測定を PASS として公開してしまう。
    const memoryGatePassed = memory.gcExposed && memory.arrayBuffersDeltaBytes < memoryCap;

    const priorSerial = priorBaseline?.[`${op.name}.serial`];
    const regression = priorSerial
      ? detectRegression({
          current: serial,
          baseline: priorSerial,
          threshold: 0.2,
          ...(op.regressionMinDeltaMs === undefined
            ? {}
            : { minDeltaMs: op.regressionMinDeltaMs }),
        })
      : null;

    combinedForBaseline[`${op.name}.serial`] = serial;
    combinedForBaseline[`${op.name}.concurrent`] = concurrent;

    outcomes.push({
      name: op.name,
      serial,
      concurrent,
      memory,
      serialGatePassed: serialGate.verdict.passed,
      concurrentGatePassed: concurrentGate.verdict.passed,
      memoryGatePassed,
      regressionVerdict: regression ? regression.verdict : 'n/a (baseline seeded)',
    });
  }

  // 既存 op の基準値はそのまま残し、まだ記録の無い op だけ書き足す。
  // baseline file の有無だけで判定すると、後から op を増やしたときに
  // その op が永久に「基準値なし」のまま回帰判定できない。
  // 今回測った op のうち、まだ記録の無いものだけ書き足す。
  // 既存 op の値は保持しないと比較対象が毎回入れ替わって回帰を検出できない。
  // 一方で今回測っていない op は落とす。op 名を別の処理へ付け替えたときに
  // 無関係な過去値と比較してしまうため。
  const priorResults = priorBaseline ?? {};
  const currentKeys = new Set(Object.keys(combinedForBaseline));
  const retained = input.pruneStaleBaselineOps
    ? Object.fromEntries(Object.entries(priorResults).filter(([key]) => currentKeys.has(key)))
    : priorResults;
  const unseededOps = Object.fromEntries(
    Object.entries(combinedForBaseline).filter(([key]) => !(key in priorResults)),
  );
  const baselineSeeded = priorBaseline === null;
  const staleDropped = Object.keys(priorResults).length !== Object.keys(retained).length;
  if (Object.keys(unseededOps).length > 0 || staleDropped) {
    // 追記は現在の環境で測った値なので env も現在のものにする。
    // 古い env を残すと、どの環境の測定値と比較しているのか判別できない。
    await saveBaselineEnvelope(baselinePath, {
      schema: 1,
      env: captureEnv(),
      results: { ...retained, ...unseededOps },
    });
  }

  // 閾値内でも有意な回帰は gate を落とす (docs/quality/perf-thresholds.md
  // § Regression detection defaults)。cap だけを見ると、20% 超の悪化が
  // 上限に収まっている限り素通りしてしまう。
  const allPassed = outcomes.every(
    (o) =>
      o.serialGatePassed &&
      o.concurrentGatePassed &&
      o.memoryGatePassed &&
      o.regressionVerdict !== 'regressed',
  );

  writeReport({
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

  return { outcomes, allPassed, baselineSeeded };
}

interface WriteReportInput {
  reportPath: string;
  moduleName: string;
  outcomes: OpOutcome[];
  ops: PerfOpSpec[];
  thresholdDocLink: string;
  priorBaseline: Record<string, MeasureResult> | null;
  concurrency: number;
  iterationsPerWorker: number;
  memoryIterations: number;
  memoryCapDefault: number;
}

function writeReport(input: WriteReportInput): void {
  const lines: string[] = [
    `# Perf Suite — ${input.moduleName}`,
    '',
    `Threshold source: [docs/quality/perf-thresholds.md](${input.thresholdDocLink})`,
    '',
    '## Serial p95 (concurrency = 1)',
    '',
    '| op | p95 | cap | gate | regression |',
    '|---|---|---|---|---|',
  ];
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    lines.push(
      `| ${op.name} | ${out.serial.p95.toFixed(2)}ms | ${op.serialP95CapMs}ms | ${out.serialGatePassed ? 'PASS' : 'FAIL'} | ${out.regressionVerdict} |`,
    );
  });

  lines.push(
    '',
    `## Concurrent p95 (concurrency = ${input.concurrency}, ${input.iterationsPerWorker} iter each)`,
    '',
    '| op | p95 | cap | gate |',
    '|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const cap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
    lines.push(
      `| ${op.name} | ${out.concurrent.p95.toFixed(2)}ms | ${cap}ms | ${out.concurrentGatePassed ? 'PASS' : 'FAIL'} |`,
    );
  });

  lines.push(
    '',
    `## Memory retention (${input.memoryIterations} iter, arrayBuffers axis is the gate; heap is informational)`,
    '',
    // gc exposed 列は測定条件の証跡。--expose-gc なしだと解放される一時使用まで
    // 拾うため、no と yes の値を同じ基準で比べられない。
    '| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |',
    '|---|---|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const cap = op.memoryArrayBuffersCapBytes ?? input.memoryCapDefault;
    lines.push(
      `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${cap} B | ${out.memory.gcExposed ? 'yes' : 'no'} | ${out.memoryGatePassed ? 'PASS' : 'FAIL'} |`,
    );
  });

  lines.push('', '## Detailed serial reports', '');
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    lines.push(`### ${op.name}`);
    lines.push('');
    const priorSerial = input.priorBaseline?.[`${op.name}.serial`];
    lines.push(
      emitPerfReport(out.serial, {
        includeSamples: false,
        ...(priorSerial !== undefined ? { baseline: priorSerial } : {}),
      }),
    );
  });

  mkdirSync(path.dirname(input.reportPath), { recursive: true });
  writeFileSync(input.reportPath, `${lines.join('\n')}\n`, 'utf8');
}

/**
 * runPerf3LayerStrict — v0.3 strict variant。 iter 2 倍 + Welch |t|>3 +
 * delta 10%。 test 漏れゼロを狙う fail-fast mode。
 *
 * defaults ...
 * - serialIterations: 400 (v0.2 200)
 * - serialWarmup: 10 (v0.2 5)
 * - concurrency: 20 (v0.2 10)
 * - iterationsPerWorker: 100 (v0.2 50)
 * - memoryIterations: 400 (v0.2 200)
 *
 * regression 判定は detectRegressionStrict 経由 (|t|>3 + delta 10%)。
 */
export async function runPerf3LayerStrict(
  input: RunPerf3LayerInput,
): Promise<RunPerf3LayerResult> {
  return runPerf3Layer({
    ...input,
    serialIterations: input.serialIterations ?? 400,
    serialWarmup: input.serialWarmup ?? 10,
    concurrency: input.concurrency ?? 20,
    iterationsPerWorker: input.iterationsPerWorker ?? 100,
    memoryIterations: input.memoryIterations ?? 400,
  });
}

/**
 * resolveKiwaRepoRoot — walk upward from `start` until finding a package.json
 * whose `name` matches `kiwa-monorepo`. Used by every kiwa perf test to
 * resolve the report path regardless of vitest cwd.
 */
export function resolveKiwaRepoRoot(start: string): string {
  let current = start;
  while (true) {
    const pkgPath = path.join(current, 'package.json');
    if (existsSync(pkgPath)) {
      const m = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (m.name === 'kiwa-monorepo') return current;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`Could not resolve repo root from ${start}`);
    current = parent;
  }
}
