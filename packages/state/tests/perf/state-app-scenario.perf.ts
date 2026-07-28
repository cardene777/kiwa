/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStore, dispatch, subscribe, selectState, mockAction } from '../../src/index.js';

const MODULE = 'state-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('state app scenario perf (real workload)', () => {
  it('3-layer perf: multi_provider_workflow / subscribe_batch / dispatch_error_handling', async () => {
    const providers = ['zustand', 'redux', 'jotai', 'valtio', 'mobx'] as const;
    const add = mockAction<number>('add');

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
          name: 'multi_provider_workflow (5 provider x 2 dispatch cycles)',
          fn: async () => {
            for (const provider of providers) {
              const store = createStore<{ total: number }>({
                provider,
                initialState: { total: 0 },
                reducer: (s, a) => (a.type === 'add' ? { total: s.total + Number(a.payload ?? 0) } : s),
              });
              dispatch(store, add(10));
              dispatch(store, add(20));
              selectState(store, (s) => s.total);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'subscribe_batch (5 listener + 5 state updates)',
          fn: async () => {
            const store = createStore<{ n: number }>({ provider: 'zustand', initialState: { n: 0 } });
            const subs = Array.from({ length: 5 }, () => subscribe(store, () => {}));
            for (let i = 0; i < 5; i++) {
              store.setState({ n: i });
            }
            for (const s of subs) s.unsubscribe();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'dispatch_error_handling (5 unknown action type dispatch)',
          fn: async () => {
            const store = createStore<{ x: number }>({
              provider: 'redux',
              initialState: { x: 0 },
              reducer: (s, a) => {
                if (a.type === 'unknown') throw new Error('unknown action');
                return s;
              },
            });
            for (let i = 0; i < 5; i++) {
              try {
                dispatch(store, { type: 'unknown' });
              } catch { /* handled */ }
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
