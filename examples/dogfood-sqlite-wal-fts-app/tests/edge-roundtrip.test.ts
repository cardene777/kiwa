/**
 * Vitest — Bun-style edge roundtrip flow (v1.32-4 AC2).
 *
 * The mock adapter simulates a deterministic cold + warm request profile.
 * Assertions cover Bun cold start being faster than Node, warm mean being
 * within a plausible edge steady-state (< 1ms), and multi-request handling.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveEdgeRoundtripFlow } from '../src/edge/index.js';

describe('edge roundtrip — Bun edge deployment simulator', () => {
  it('T-DSW-EDGE-001 Bun cold start ≪ Node cold start', () => {
    const bun = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'bun', requests: 4 });
    const node = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'node', requests: 4 });
    expect(bun.coldStartMs).toBeLessThan(node.coldStartMs);
  });

  it('T-DSW-EDGE-002 warm samples are deterministic + close to 0.4ms floor', () => {
    const a = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'bun', requests: 8 });
    const b = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'bun', requests: 8 });
    expect(a.warmSamplesMs).toEqual(b.warmSamplesMs);
    for (const sample of a.warmSamplesMs) {
      expect(sample).toBeGreaterThanOrEqual(0.4);
      expect(sample).toBeLessThan(1);
    }
  });

  it('T-DSW-EDGE-003 workerd runtime reports the tightest cold start', () => {
    const workerd = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'workerd', requests: 2 });
    expect(workerd.coldStartMs).toBe(1);
  });

  it('T-DSW-EDGE-004 requests<=0 is rejected', () => {
    expect(() => driveEdgeRoundtripFlow({ region: 'iad', runtime: 'bun', requests: 0 })).toThrow(
      /requests must be positive/,
    );
  });

  it('T-DSW-EDGE-005 mock adapter records edge invocations across regions', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveEdgeRoundtrip({ region: 'iad', runtime: 'bun', requests: 5 });
    await adapter.driveEdgeRoundtrip({ region: 'nrt', runtime: 'bun', requests: 3 });
    const metrics = adapter.metrics();
    expect(metrics.edgeInvocations).toBe(8);
    await adapter.reset();
  });

  it('T-DSW-EDGE-006 region name influences the warm jitter (different region → different samples)', () => {
    const iad = driveEdgeRoundtripFlow({ region: 'iad', runtime: 'bun', requests: 4 });
    const nrt = driveEdgeRoundtripFlow({ region: 'nrt', runtime: 'bun', requests: 4 });
    // Different region seeds produce a different jitter walk; the arrays
    // must not be identical or the deterministic seed is broken.
    expect(iad.warmSamplesMs).not.toEqual(nrt.warmSamplesMs);
  });
});
