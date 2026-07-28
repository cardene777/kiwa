/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRNTestEnv,
  dispatchLinkingUrl,
  setPlatform,
  setDimensions,
} from '../../src/index.js';

const MODULE = 'react-native-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('react-native app scenario perf (real workload)', () => {
  it('3-layer perf: user_flow_workflow / multi_platform_batch / linking_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'user_flow_workflow (10 setup + navigate + storage)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const env = createRNTestEnv({ platform: 'ios', initialRoute: { name: 'Login' } });
              env.navigation.navigate('Detail', { id: i });
              await env.asyncStorage.setItem(`token-${i}`, `bearer-${i}`);
              await env.asyncStorage.getItem(`token-${i}`);
              env.navigation.goBack();
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'multi_platform_batch (5 iOS+Android+web env switch)',
          fn: async () => {
            const oses: Array<'ios' | 'android' | 'web'> = ['ios', 'android', 'web'];
            for (let i = 0; i < 5; i++) {
              const env = createRNTestEnv({ platform: oses[i % 3] });
              setPlatform(env.platform, { version: 34 });
              setDimensions(env.dimensions, { window: { width: 800, height: 1200, scale: 2 } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'linking_error_handling (5 invalid url + listener cleanup)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const env = createRNTestEnv({});
              const failing = () => {
                throw new Error(`bad url ${i}`);
              };
              env.linking.listeners.push(failing);
              try {
                dispatchLinkingUrl(env.linking, `bad://x${i}`);
              } catch {
                /* handled */
              }
              env.linking.listeners.pop();
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
