import {
  createAblyMock,
  createPusherMock,
  createSocketioMock,
  createSupabaseRealtimeMock,
} from '../../src/index.js';
import {
  defaultBaselinePath,
  detectRegression,
  emitPerfReport,
  evaluatePerfGate,
  loadBaseline,
  measure,
  measureConcurrent,
  measureMemory,
  saveBaseline,
  type MeasureResult,
  type MemorySample,
} from '@kiwa-test/perf-harness';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'realtime';
const BASELINE_PATH = defaultBaselinePath(MODULE);
const REPORT_PATH = path.join(
  resolveRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

// Threshold sources — see docs/quality/perf-thresholds.md
// All 4 provider mocks are mock-invariant so the same 20 ms serial cap applies.
// Concurrent cap = 2 × serial per SSOT.
//
// Memory cap uses arrayBuffers axis (GC-independent + only accounts for
// off-heap allocation) because heapUsed under a vitest child process without
// `--expose-gc` includes V8 young-generation slack that is not a real leak.
// arrayBuffers > 100 KB / 200 iter would signal an actual retained Buffer
// pile (the pattern the earlier v1 socketio + supabase leaks would have
// produced before the pushBounded fix in engine.ts).
const SERIAL_P95_CAP_MS = 20;
const CONCURRENT_P95_CAP_MS = 40;
const MEMORY_ARRAY_BUFFERS_CAP_BYTES = 100 * 1024;

type BaselineMap = Record<string, MeasureResult>;

describe(MODULE, () => {
  it(
    'serial + concurrent + memory across 4 provider mocks, gate on SSOT thresholds',
    async () => {
      const supabase = createSupabaseRealtimeMock();
      const ably = createAblyMock();
      const pusher = createPusherMock();
      const socketio = createSocketioMock();

      // 1. serial p95 measurement — one call per iteration
      // NOTE: channel / room / clientId names are FIXED so the mock's
      // internal `channels` Map stays bounded across iterations. Using
      // Math.random() here would leak channel entries and mask real
      // per-call retention with unbounded growth.
      const supabaseChannel = supabase.channel('perf-room');
      await supabaseChannel.subscribe();
      const ablyChannelHandle = ably.channels.get('perf-ch');
      const pusherPersistentChannel = pusher.subscribeChannel('perf-ch');
      pusherPersistentChannel.bind('event', () => {});
      const socketClient = socketio.io('/notify');

      const serialTargets = {
        supabasePresenceTrack: async () => {
          await supabaseChannel.track({ userId: 'u1', online_at: new Date().toISOString() });
        },
        ablyPublish: async () => {
          await ablyChannelHandle.publish('event', { data: 'ping' });
        },
        pusherSubscribeChannel: async () => {
          // idempotent subscribe check — same channel, no new handler binds
          // (adding handlers per iteration would leak by design)
          pusher.subscribeChannel('perf-ch');
        },
        socketioEmit: async () => {
          socketClient.emit('event', { data: 'ping' });
        },
      };

      const serial: BaselineMap = {};
      for (const [name, fn] of Object.entries(serialTargets)) {
        serial[name] = await measure({
          name: `${name}.serial`,
          iterations: 200,
          warmup: 5,
          fn,
        });
      }

      // 2. concurrent stress — 10 workers × 50 iterations = 500 samples
      const concurrent: BaselineMap = {};
      for (const [name, fn] of Object.entries(serialTargets)) {
        concurrent[name] = await measureConcurrent({
          name: `${name}.concurrent`,
          concurrency: 10,
          iterationsPerWorker: 50,
          warmup: 2,
          fn,
        });
      }

      // 3. memory retention — 200 iterations, arrayBuffers axis is GC-independent
      const memory: Record<string, MemorySample> = {};
      for (const [name, fn] of Object.entries(serialTargets)) {
        memory[name] = await measureMemory({ fn, iterations: 200 });
      }

      // 4. baseline autoload / autosave — first run seeds baseline, later runs compare
      const priorBaseline = (await loadBaseline(BASELINE_PATH)) as unknown as BaselineMap | null;
      const combinedForBaseline: BaselineMap = {};
      for (const key of Object.keys(serialTargets)) {
        combinedForBaseline[`${key}.serial`] = serial[key]!;
        combinedForBaseline[`${key}.concurrent`] = concurrent[key]!;
      }
      if (priorBaseline === null) {
        // saveBaseline expects MeasureResult but we save a Map; upstream
        // loadBaseline returns whatever JSON is on disk, so this cast pair
        // is the accepted contract for multi-op baselines.
        await saveBaseline(BASELINE_PATH, combinedForBaseline as unknown as import('@kiwa-test/perf-harness').MeasureResult);
      }

      // 5. gate — hard-cap check against SSOT thresholds + regression vs baseline
      const serialGates: Record<string, ReturnType<typeof evaluatePerfGate>> = {};
      const concurrentGates: Record<string, ReturnType<typeof evaluatePerfGate>> = {};
      const regressions: Record<string, ReturnType<typeof detectRegression> | null> = {};
      const memoryVerdicts: Record<string, 'PASS' | 'FAIL'> = {};

      for (const key of Object.keys(serialTargets)) {
        serialGates[key] = evaluatePerfGate({
          result: serial[key]!,
          thresholds: { p95Ms: SERIAL_P95_CAP_MS },
        });
        concurrentGates[key] = evaluatePerfGate({
          result: concurrent[key]!,
          thresholds: { p95Ms: CONCURRENT_P95_CAP_MS },
        });

        // regression check against prior baseline (skipped on first run)
        const priorSerial = priorBaseline?.[`${key}.serial`];
        regressions[key] = priorSerial
          ? detectRegression({ current: serial[key]!, baseline: priorSerial, threshold: 0.2 })
          : null;

        memoryVerdicts[key] = memory[key]!.arrayBuffersDeltaBytes < MEMORY_ARRAY_BUFFERS_CAP_BYTES ? 'PASS' : 'FAIL';
      }

      // 6. emit report
      const lines: string[] = [
        `# Perf Suite — ${MODULE}`,
        '',
        `Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)`,
        '',
        '## Serial p95 (concurrency = 1, 200 iter)',
        '',
        '| op | p95 | cap | gate | regression |',
        '|---|---|---|---|---|',
      ];
      for (const key of Object.keys(serialTargets)) {
        const p95 = serial[key]!.p95.toFixed(2);
        const gate = serialGates[key]!.verdict.passed ? 'PASS' : 'FAIL';
        const reg = regressions[key]?.verdict ?? 'n/a (baseline seeded)';
        lines.push(`| ${key} | ${p95}ms | ${SERIAL_P95_CAP_MS}ms | ${gate} | ${reg} |`);
      }

      lines.push('', '## Concurrent p95 (concurrency = 10, 50 iter each = 500 samples)', '');
      lines.push('| op | p95 | cap | gate |');
      lines.push('|---|---|---|---|');
      for (const key of Object.keys(serialTargets)) {
        const p95 = concurrent[key]!.p95.toFixed(2);
        const gate = concurrentGates[key]!.verdict.passed ? 'PASS' : 'FAIL';
        lines.push(`| ${key} | ${p95}ms | ${CONCURRENT_P95_CAP_MS}ms | ${gate} |`);
      }

      lines.push('', '## Memory retention (200 iter, arrayBuffers axis is the gate; heap axis is informational)', '');
      lines.push('| op | heapUsed Δ | arrayBuffers Δ | verdict (arrayBuffers) |');
      lines.push('|---|---|---|---|');
      for (const key of Object.keys(serialTargets)) {
        const m = memory[key]!;
        lines.push(
          `| ${key} | ${m.heapUsedDeltaBytes} B | ${m.arrayBuffersDeltaBytes} B | ${memoryVerdicts[key]} |`,
        );
      }

      lines.push('', '## Detailed serial reports', '');
      for (const key of Object.keys(serialTargets)) {
        lines.push(`### ${key}`);
        lines.push('');
        lines.push(emitPerfReport(serial[key]!, { baseline: priorBaseline?.[`${key}.serial`], includeSamples: false }));
      }

      writeReport(REPORT_PATH, lines.join('\n'));

      // 7. hard assertions — fail the test if any hard cap breached
      for (const key of Object.keys(serialTargets)) {
        expect.soft(serialGates[key]!.verdict.passed, `${key} serial p95 must be < ${SERIAL_P95_CAP_MS}ms`).toBe(true);
        expect.soft(concurrentGates[key]!.verdict.passed, `${key} concurrent p95 must be < ${CONCURRENT_P95_CAP_MS}ms`).toBe(true);
        expect.soft(memory[key]!.arrayBuffersDeltaBytes, `${key} must retain < ${MEMORY_ARRAY_BUFFERS_CAP_BYTES} B arrayBuffers / 200 iter`).toBeLessThan(MEMORY_ARRAY_BUFFERS_CAP_BYTES);
      }
      expect(existsSync(REPORT_PATH)).toBe(true);
    },
    180_000,
  );
});

function writeReport(filePath: string, markdown: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${markdown}\n`, 'utf8');
}

function resolveRepoRoot(start: string): string {
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
