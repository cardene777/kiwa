/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createQueryClient,
  fetchQuery,
  mutate,
  invalidateQuery,
  subscribeToQuery,
} from '../../src/index.js';

const MODULE = 'query-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('query app scenario perf (real workload)', () => {
  it('3-layer perf: dashboard_fetch_workflow / mutation_invalidate_batch / subscribe_error_handling', async () => {
    const providers = ['tanstack', 'swr', 'urql', 'apollo'] as const;

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
          name: 'dashboard_fetch_workflow (10 fetchQuery across 4 providers)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const client = createQueryClient({ provider: providers[i % 4] });
              await fetchQuery(client, ['dashboard', i], async () => ({ id: i, title: `d-${i}` }));
              await fetchQuery(client, ['dashboard', i], async () => ({ id: i, title: 'unused' }));
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'mutation_invalidate_batch (5 mutate with invalidate chain)',
          fn: async () => {
            const client = createQueryClient({ provider: 'tanstack' });
            for (let i = 0; i < 5; i++) {
              await fetchQuery(client, ['item', i], async () => ({ id: i }));
            }
            for (let i = 0; i < 5; i++) {
              await mutate(client, async (n: number) => ({ updated: n }), i, {
                invalidateKeys: [['item', i]],
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'subscribe_error_handling (5 fetch throw + catch + listener notify)',
          fn: async () => {
            const client = createQueryClient({ provider: 'swr' });
            let observed = 0;
            const sub = subscribeToQuery(client, ['err'], () => { observed += 1; });
            for (let i = 0; i < 5; i++) {
              try {
                await fetchQuery(client, ['err'], async () => { throw new Error('boom'); }, { force: true });
              } catch { /* handled */ }
            }
            sub.unsubscribe();
            if (observed === 0) throw new Error('listener never fired');
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
    invalidateQuery(createQueryClient(), ['warmup']);
  });
});
