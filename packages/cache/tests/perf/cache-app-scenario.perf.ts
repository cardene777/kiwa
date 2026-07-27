/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv } from '../../src/index.js';

const MODULE = 'cache-app-scenario';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

/**
 * cache 実 app scenario perf test = 実 SaaS/API で発生する cache 使用 pattern を再現。
 * dogfood-cache-* project の実 workload に対応、 read-heavy 80/20 mix / pub-sub burst /
 * TTL expiry cycle の 3 scenario で end-to-end timing 測定。
 */
describe('cache app scenario perf (real workload)', () => {
  it('3-layer perf: read-heavy 80/20 mix / pub-sub burst / TTL expiry', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'read_heavy_workload (80 get / 20 set / 100 ops burst)',
          fn: async () => {
            const env = createInMemoryCacheEnv({ mode: 'in-memory' });
            for (let i = 0; i < 20; i++) await env.set(`k-${i}`, `v-${i}`);
            for (let i = 0; i < 100; i++) {
              const idx = i % 20;
              if (i % 5 === 0) await env.set(`k-${idx}`, `v-${idx}-updated`);
              else await env.get(`k-${idx}`);
            }
            await env.stop();
          },
          serialP95CapMs: 30,
        },
        {
          name: 'pub_sub_burst (subscribe + 50 publish + drain)',
          fn: async () => {
            const env = createInMemoryCacheEnv({ mode: 'in-memory' });
            const sub = await env.subscribe('ch');
            const received: Promise<unknown>[] = [];
            for (let i = 0; i < 50; i++) {
              received.push(sub.next());
              await env.publish('ch', `msg-${i}`);
            }
            await Promise.all(received);
            await sub.close();
            await env.stop();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'ttl_expiry_cycle (set with TTL + get + assertTTL loop)',
          fn: async () => {
            const env = createInMemoryCacheEnv({ mode: 'in-memory' });
            for (let i = 0; i < 20; i++) {
              await env.set(`ttl-${i}`, `v-${i}`, { ttlSeconds: 60 });
              await env.get(`ttl-${i}`);
              await env.assertTTL(`ttl-${i}`, { atLeast: 1, atMost: 60 });
            }
            await env.stop();
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
