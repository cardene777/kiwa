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
  measure,
  type MeasureResult,
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
const WRITE_BASELINE = process.argv.includes('--baseline');
const COMPARE_BASELINE = process.argv.includes('--compare');

type BaselineMap = Record<string, MeasureResult>;

describe(MODULE, () => {
  it(
    'measures 4 provider mock call latency and emits a perf report',
    async () => {
      const supabase = createSupabaseRealtimeMock();
      const ably = createAblyMock();
      const pusher = createPusherMock();
      const socketio = createSocketioMock();

      const supabasePresenceTrack = await measure({
        name: 'supabase.channel.track',
        iterations: 200,
        warmup: 5,
        fn: async () => {
          const channel = supabase.channel(`room-${Math.random()}`);
          await channel.subscribe();
          await channel.track({ userId: 'u1', online_at: new Date().toISOString() });
        },
      });

      const ablyPublish = await measure({
        name: 'ably.channel.publish',
        iterations: 200,
        warmup: 5,
        fn: async () => {
          const ch = ably.channels.get(`ch-${Math.random()}`);
          await ch.publish('event', { data: 'ping' });
        },
      });

      const pusherSubscribe = await measure({
        name: 'pusher.subscribeChannel',
        iterations: 200,
        warmup: 5,
        fn: async () => {
          const ch = pusher.subscribeChannel(`ch-${Math.random()}`);
          ch.bind('event', () => {});
        },
      });

      const socketioEmit = await measure({
        name: 'socketio.emit',
        iterations: 200,
        warmup: 5,
        fn: async () => {
          const client = socketio.io('/notify');
          client.emit('event', { data: 'ping' });
        },
      });

      const results: BaselineMap = {
        supabasePresenceTrack,
        ablyPublish,
        pusherSubscribeChannel: pusherSubscribe,
        socketioEmit,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        supabasePresenceTrack: evaluatePerfGate({ result: supabasePresenceTrack, thresholds: { p95Ms: 20 } }),
        ablyPublish: evaluatePerfGate({ result: ablyPublish, thresholds: { p95Ms: 20 } }),
        pusherSubscribeChannel: evaluatePerfGate({ result: pusherSubscribe, thresholds: { p95Ms: 20 } }),
        socketioEmit: evaluatePerfGate({ result: socketioEmit, thresholds: { p95Ms: 20 } }),
      };

      const lines: string[] = [
        `# Perf Suite — ${MODULE}`,
        '',
        '| op | p95 | gate | regression | blockers |',
        '|---|---|---|---|---|',
      ];

      for (const [name, result] of Object.entries(results)) {
        const prior = baseline?.[name];
        const regression = prior
          ? detectRegression({ current: result, baseline: prior, threshold: 0.2 })
          : null;
        if (COMPARE_BASELINE && regression?.regressed) {
          throw new Error(`${MODULE}/${name} regressed by ${(regression.deltaPct * 100).toFixed(2)}%`);
        }
        const gate = gates[name as keyof typeof gates];
        lines.push(
          `| ${name} | ${result.p95.toFixed(2)}ms | ${gate.verdict.passed ? 'PASS' : 'FAIL'} | ${regression?.verdict ?? 'n/a'} | ${formatBlockers(gate.verdict.blockers)} |`,
        );
      }

      lines.push('');
      for (const [name, result] of Object.entries(results)) {
        lines.push(`## ${name}`);
        lines.push('');
        lines.push(emitPerfReport(result, { baseline: baseline?.[name], includeSamples: true }));
      }

      writeReport(REPORT_PATH, lines.join('\n'));
      if (WRITE_BASELINE || baseline === null) {
        saveBaselineMap(BASELINE_PATH, results);
      }

      expect(existsSync(REPORT_PATH)).toBe(true);
    },
    120_000,
  );
});

function loadBaselineMap(filePath: string): BaselineMap | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8')) as BaselineMap;
}

function saveBaselineMap(filePath: string, value: BaselineMap): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeReport(filePath: string, markdown: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${markdown}\n`, 'utf8');
}

function formatBlockers(blockers: Array<{ axis: string }>): string {
  return blockers.length === 0 ? 'none' : blockers.map((b) => b.axis).join(', ');
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
