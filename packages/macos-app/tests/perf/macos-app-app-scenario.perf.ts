/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
  mockScreencap,
  emitUserNotification,
} from '../../src/index.js';

const MODULE = 'macos-app-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('macos-app scenario perf (real workload)', () => {
  it('3-layer perf: user_flow_workflow / a11y_batch / notification_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'user_flow_workflow (10 interaction+screencap cycle across modes)',
          fn: async () => {
            const modes = ['swiftui', 'appkit'] as const;
            for (let i = 0; i < 10; i++) {
              const env = createMacAppEnv({ mode: modes[i % 2] });
              simulateUserInteraction(env, { type: 'click', target: 'action' });
              mockScreencap(env, { region: { x: 0, y: 0, width: 200, height: 200 } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'a11y_batch (5 accessibility tree capture)',
          fn: async () => {
            const env = createMacAppEnv({ mode: 'swiftui' });
            for (let i = 0; i < 5; i++) {
              captureAccessibilityTree(env);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'notification_error_handling (5 empty title/body reject)',
          fn: async () => {
            const env = createMacAppEnv({ mode: 'appkit' });
            for (let i = 0; i < 5; i++) {
              emitUserNotification(env, { title: '', body: '' });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
