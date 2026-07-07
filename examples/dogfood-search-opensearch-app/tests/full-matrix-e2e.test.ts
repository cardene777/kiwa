/**
 * Full matrix e2e — walks 1 backend x 3 fixture sets = 3 lifecycles
 * through both mock + real adapters and asserts the trace + op set
 * stay stable. This is the widest lifecycle test the dogfood app runs
 * — any missing op / divergent event on the neutral trace surfaces
 * here.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  driveFullMatrix,
  driveOpenSearchLifecycle,
  OPS_UNDER_TEST,
} from '../src/flows/search-flows.js';
import {
  ALL_FIXTURES,
  FIXTURE_ARTICLES,
  FIXTURE_CLUSTER,
} from '../src/policies/query-fixtures.js';

describe('dogfood-search-opensearch-app — full matrix e2e', () => {
  it('T-DFSOS-FM-001 driveFullMatrix on mock runs 3 lifecycles (1 backend x 3 fixtures)', async () => {
    const mock = makeMockAdapter();
    const result = await driveFullMatrix(mock);
    // OpenSearch backend x 3 fixtures = 3 lifecycles.
    expect(result.lifecyclesRun).toBe(3);
  });

  it('T-DFSOS-FM-002 driveFullMatrix on mock emits every op from OPS_UNDER_TEST at least once', async () => {
    const mock = makeMockAdapter();
    await driveFullMatrix(mock);
    const observed = new Set(mock.trace().map((t) => t.op));
    for (const op of OPS_UNDER_TEST) {
      expect(observed.has(op)).toBe(true);
    }
  });

  it('T-DFSOS-FM-003 driveOpenSearchLifecycle emits emitFidelitySignal + queryOpensearchHealth for articles', async () => {
    const mock = makeMockAdapter();
    await driveOpenSearchLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
      fixture: FIXTURE_ARTICLES,
    });
    const events = mock.trace().map((t) => t.neutralEvent);
    expect(events).toContain('search.fidelity_signal');
    expect(events).toContain('search.opensearch_health_ok');
  });

  it('T-DFSOS-FM-004 cluster fixture combines index-mgmt ops in one lifecycle', async () => {
    const mock = makeMockAdapter();
    await driveOpenSearchLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'idx-cluster',
      fixture: FIXTURE_CLUSTER,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startIndexMgmtSession')).toBe(true);
    expect(ops.has('allocateShards')).toBe(true);
    expect(ops.has('promoteReplica')).toBe(true);
    expect(ops.has('advanceRollingReindex')).toBe(true);
    expect(ops.has('swapZeroDowntime')).toBe(true);
  });

  it('T-DFSOS-FM-005 real adapter (env-missing) emits search.env_missing for every backend op', async () => {
    const real = makeRealAdapter({ env: {} });
    await driveFullMatrix(real);
    // Every backend call should emit search.env_missing.
    const envMissing = real
      .trace()
      .filter((e) => e.neutralEvent === 'search.env_missing');
    expect(envMissing.length).toBeGreaterThan(0);
    for (const e of envMissing) {
      expect(e.ok).toBe(false);
      expect(e.errorKind).toBe('KIWA_SEARCH_ENV_MISSING');
    }
  });

  it('T-DFSOS-FM-006 real adapter with forceEnvPresent walks the same op set as mock', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter({ forceEnvPresent: true });
    await driveFullMatrix(mock);
    await driveFullMatrix(real);
    const mockOps = new Set(mock.trace().map((t) => t.op));
    const realOps = new Set(real.trace().map((t) => t.op));
    // Every op the mock walks must also appear on the forced-env real
    // adapter.
    for (const op of mockOps) {
      expect(realOps.has(op)).toBe(true);
    }
  });

  it('T-DFSOS-FM-007 every fixture lifecycle contributes at least one trace entry', async () => {
    for (const fixture of ALL_FIXTURES) {
      const mock = makeMockAdapter();
      await driveOpenSearchLifecycle(mock, {
        backend: 'opensearch-oss',
        indexId: `idx-${fixture.id}`,
        fixture,
      });
      expect(mock.trace().length).toBeGreaterThan(0);
    }
  });

  it('T-DFSOS-FM-008 trace timestamps are monotonically non-decreasing per lifecycle', async () => {
    const mock = makeMockAdapter();
    await driveOpenSearchLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
      fixture: FIXTURE_ARTICLES,
    });
    const trace = mock.trace();
    for (let i = 1; i < trace.length; i++) {
      expect(trace[i]!.timestampMs).toBeGreaterThanOrEqual(trace[i - 1]!.timestampMs);
    }
  });
});
