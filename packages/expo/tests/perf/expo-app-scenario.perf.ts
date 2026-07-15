/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createExpoTestEnv, dispatchNotification } from '../../src/index.js';

const MODULE = 'expo-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('expo app scenario perf (real workload)', () => {
  it('3-layer perf: onboarding_workflow / file_capture_batch / permission_error_handling', async () => {
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
          name: 'onboarding_workflow (router + secureStore + notification x10 cycle)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const env = createExpoTestEnv();
              env.router.push('/onboarding/step-1');
              await env.secureStore.setItemAsync('userId', `u-${i}`);
              env.router.push('/onboarding/step-2');
              await env.secureStore.setItemAsync('token', `tok-${i}`);
              dispatchNotification(env, { title: 'Welcome', body: `user ${i}` });
              env.router.replace('/home');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'file_capture_batch (camera picture + fileSystem write x5)',
          fn: async () => {
            const env = createExpoTestEnv({ camera: { initialPermission: 'granted' } });
            for (let i = 0; i < 5; i++) {
              const pic = await env.camera.takePictureAsync({ base64: true });
              await env.fileSystem.writeAsStringAsync(`file:///mock/document/pic-${i}.txt`, pic.base64!);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'permission_error_handling (5 denied camera + secureStore fail)',
          fn: async () => {
            const env = createExpoTestEnv({
              camera: { initialPermission: 'denied' },
              secureStore: { failOn: (k) => k === 'blocked' },
            });
            for (let i = 0; i < 5; i++) {
              try {
                await env.camera.takePictureAsync();
              } catch { /* handled */ }
              try {
                await env.secureStore.setItemAsync('blocked', 'x');
              } catch { /* handled */ }
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
