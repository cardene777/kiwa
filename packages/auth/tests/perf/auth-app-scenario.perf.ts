/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter, issueSession, upsertUserFromProfile } from '../../src/index.js';

const MODULE = 'auth-app-scenario';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

/**
 * auth 実 app scenario perf test = SaaS auth service で発生する実 workload を再現。
 * dogfood-auth-* project の実 app usage pattern に対応、 raw API 呼出ではなく
 * end-to-end login flow / OAuth flow / session validate loop の timing を測定する。
 */
describe('auth app scenario perf (real workload)', () => {
  it('3-layer perf: login flow / OAuth flow / session validate loop', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'login_flow (createUser + issueSession + getSessionAndUser)',
          fn: async () => {
            const adapter = createInMemoryAdapter();
            const user = await adapter.createUser({ email: `u-${Math.random()}@ex.com`, emailVerified: undefined });
            const session = await issueSession(adapter, user, 'database', 3600);
            const bundle = await adapter.getSessionAndUser(session.sessionToken);
            if (!bundle) throw new Error('session lookup failed');
          },
          serialP95CapMs: 20,
        },
        {
          name: 'oauth_flow (upsertUserFromProfile + issueSession)',
          fn: async () => {
            const adapter = createInMemoryAdapter();
            const profile = {
              provider: 'github' as const,
              providerAccountId: `gh-${Math.random()}`,
              email: `oauth-${Math.random()}@ex.com`,
              name: 'Test',
            };
            const user = await upsertUserFromProfile(adapter, profile);
            await issueSession(adapter, user, 'database', 3600);
          },
          serialP95CapMs: 20,
        },
        {
          name: 'session_validate_loop (10x getSessionAndUser)',
          fn: async () => {
            const adapter = createInMemoryAdapter();
            const user = await adapter.createUser({ email: `v-${Math.random()}@ex.com`, emailVerified: undefined });
            const session = await issueSession(adapter, user, 'database', 3600);
            for (let i = 0; i < 10; i++) {
              const bundle = await adapter.getSessionAndUser(session.sessionToken);
              if (!bundle) throw new Error('validate failed');
            }
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
