/**
 * Vitest — MySQL Router R/W split flow (v1.32-3 axis 3).
 *
 * Asserts the pool advanced 5-state walk (cold → healthy → warmed-up →
 * draining → metrics-exported) combined with read/write route hit
 * classification. The mock semantics enforce min-warm connection floor +
 * non-negative final metrics + state ordering.
 */

import { describe, expect, it } from 'vitest';
import { driveRouterSplitFlow } from '../src/router-split/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveRouterSplitFlow as driveRouterSplitAdapterFlow } from '../src/flows/mysql-flows.js';

describe('router split — pool advanced + R/W hit accounting', () => {
  it('T-DMR-001 walks cold → healthy → warmed-up → draining → metrics-exported', () => {
    const { observation, session } = driveRouterSplitFlow();
    expect(observation.finalState).toBe('metrics-exported');
    expect(observation.warmedConnections).toBe(8);
    // Defaults contain 6 routes = 2 write + 4 read.
    expect(observation.writeHits).toBe(2);
    expect(observation.readHits).toBe(4);
    // health + warm + drain + metrics = 4 history entries.
    expect(session.history).toHaveLength(4);
    const events = session.history.map((s) => s.neutralEvent);
    expect(events).toEqual([
      'pool-advanced.health-checked',
      'pool-advanced.warmed-up',
      'pool-advanced.drained',
      'pool-advanced.metrics-exported',
    ]);
  });

  it('T-DMR-002 mock adapter records driveRouterSplit ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveRouterSplitAdapterFlow(adapter);
    expect(observation.finalState).toBe('metrics-exported');
    const trace = adapter.traces().find((t) => t.op === 'driveRouterSplit');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().routerSplitOps).toBe(1);
    await adapter.reset();
  });

  it('T-DMR-003 route-hit override classifies every entry', () => {
    const { observation } = driveRouterSplitFlow({
      routeHits: ['read', 'read', 'read', 'write'],
    });
    expect(observation.readHits).toBe(3);
    expect(observation.writeHits).toBe(1);
  });

  it('T-DMR-004 warm below min throws before drain', () => {
    expect(() =>
      driveRouterSplitFlow({
        minWarmConnections: 8,
        warmedConnections: 2,
      }),
    ).toThrowError(/connectionCount below minWarmConnections/);
  });
});
