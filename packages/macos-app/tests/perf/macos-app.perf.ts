import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
  mockScreencap,
  emitUserNotification,
} from '../../src/index.js';

const MODULE = 'macos-app';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: env + interaction + accessibility + screencap + notification primary paths',
    async () => {
      const env = createMacAppEnv({ mode: 'swiftui' });
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'createMacAppEnv',
            serialP95CapMs: 5,
            fn: async () => {
              createMacAppEnv({ mode: 'appkit' });
            },
          },
          {
            name: 'simulateUserInteraction',
            serialP95CapMs: 5,
            fn: async () => {
              simulateUserInteraction(env, { type: 'click', target: 'action' });
            },
          },
          {
            name: 'captureAccessibilityTree',
            serialP95CapMs: 5,
            fn: async () => {
              captureAccessibilityTree(env);
            },
          },
          {
            name: 'mockScreencap',
            serialP95CapMs: 5,
            fn: async () => {
              mockScreencap(env, { region: { x: 0, y: 0, width: 100, height: 100 } });
            },
          },
          {
            name: 'emitUserNotification',
            serialP95CapMs: 5,
            fn: async () => {
              emitUserNotification(env, { title: 't', body: 'b' });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
