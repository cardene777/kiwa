import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import { setupCacheEnv, setupKeyDBEnv, setupMemcachedEnv } from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'cache';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: 3 provider (Redis via setupCacheEnv / Memcached / KeyDB) primary paths',
    async () => {
      const redis = await setupCacheEnv({ client: 'ioredis' });
      const memcached = await setupMemcachedEnv({ client: 'memjs' });
      const keydb = await setupKeyDBEnv({ client: 'ioredis' });

      try {
        const result = await runPerf3Layer({
          moduleName: MODULE,
          reportPath: REPORT_PATH,
          baselinePath: BASELINE_PATH,
          ops: [
            {
              // Redis env access — client selector + backend probe.
              // Real prod path = ioredis connect + PING roundtrip. Mock exercises
              // the same env shape (client / backend / redisUrl accessors).
              name: 'redisEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (redis.client !== 'ioredis') throw new Error('client drift');
              },
            },
            {
              // Memcached env access — server ring + client accessor.
              // Real prod path = memjs connect + consistent-hash ring build.
              name: 'memcachedEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (!memcached.servers.length) throw new Error('servers missing');
              },
            },
            {
              // KeyDB env access — multi-master cluster + client accessor.
              // Real prod path = ioredis cluster mode + active-active replication.
              name: 'keydbEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (!keydb.cluster.length) throw new Error('cluster missing');
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
      } finally {
        await Promise.all([redis.stop(), memcached.stop(), keydb.stop()]);
      }
    },
    120_000,
  );
});
