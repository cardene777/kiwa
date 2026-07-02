import { makeMockAdapter } from '../../src/adapters/mock.js';
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

const MODULE = 'dogfood-socketio-notification';
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
    'measures notification adapter 4 ops and emits a perf report',
    async () => {
      const adapter = makeMockAdapter();

      const subscribeRoom = await measure({
        name: 'subscribeRoom',
        iterations: 60,
        warmup: 3,
        fn: async () => {
          await adapter.subscribeRoom({
            namespace: '/notify',
            room: `room-${Math.random()}`,
            userId: `u${Math.random()}`,
          });
        },
      });

      const sharedRoom = 'room-shared';
      await adapter.subscribeRoom({
        namespace: '/notify',
        room: sharedRoom,
        userId: 'u1',
      });

      const deliverNotification = await measure({
        name: 'deliverNotification',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await adapter.deliverNotification({
            namespace: '/notify',
            room: sharedRoom,
            payload: { userId: 'u1', priority: 'medium', body: 'ping' },
          });
        },
      });

      const getPending = await measure({
        name: 'getPending',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await adapter.getPending({ room: sharedRoom });
        },
      });

      const simulateReconnect = await measure({
        name: 'simulateReconnect',
        iterations: 40,
        warmup: 3,
        fn: async () => {
          await adapter.simulateReconnect();
        },
      });

      const results: BaselineMap = {
        subscribeRoom,
        deliverNotification,
        getPending,
        simulateReconnect,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        subscribeRoom: evaluatePerfGate({ result: subscribeRoom, thresholds: { p95Ms: 50 } }),
        deliverNotification: evaluatePerfGate({ result: deliverNotification, thresholds: { p95Ms: 30 } }),
        getPending: evaluatePerfGate({ result: getPending, thresholds: { p95Ms: 30 } }),
        simulateReconnect: evaluatePerfGate({ result: simulateReconnect, thresholds: { p95Ms: 100 } }),
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
      if (WRITE_BASELINE || baseline === null) saveBaselineMap(BASELINE_PATH, results);
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
