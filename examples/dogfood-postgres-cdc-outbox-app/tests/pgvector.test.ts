/**
 * Vitest — pgvector IVFFlat + k-NN + hybrid + distance flow (v1.32-2 axis 3).
 *
 * Asserts a build → knn → hybrid → distance walk records the search count +
 * computed cosine distance for downstream fidelity comparison. Uses the
 * probe vectors pinned in `src/pgvector/index.ts` so the cosine distance
 * between (1,0,...) and (0,1,...) is exactly 1 (orthogonal unit vectors).
 */

import { describe, expect, it } from 'vitest';
import { drivePgvectorFlow as drivePgvectorUnit } from '../src/pgvector/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { drivePgvectorFlow } from '../src/flows/postgres-flows.js';

describe('pgvector — build → knn → hybrid → distance', () => {
  it('T-DPE-PV-001 records IVFFlat build + 2 searches + cosine distance = 1', () => {
    const { observation, session } = drivePgvectorUnit();
    expect(observation.indexKind).toBe('ivfflat');
    expect(observation.dimensions).toBe(8);
    expect(observation.lists).toBe(3);
    expect(observation.searchCount).toBe(2);
    expect(observation.bothSearchesRecorded).toBe(true);
    // Cosine distance between orthogonal unit vectors is exactly 1.
    expect(observation.computedDistance).toBeCloseTo(1, 6);
    expect(session.state).toBe('searched');
  });

  it('T-DPE-PV-002 mock adapter records drivePgvector ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await drivePgvectorFlow(adapter);
    expect(observation.bothSearchesRecorded).toBe(true);
    const trace = adapter.traces().find((t) => t.op === 'drivePgvector');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().pgvectorSearches).toBe(2);
    await adapter.reset();
  });

  it('T-DPE-PV-003 lower-dim override still produces a valid distance', () => {
    const { observation } = drivePgvectorUnit({ dimensions: 4, lists: 2 });
    expect(observation.dimensions).toBe(4);
    expect(observation.lists).toBe(2);
    expect(Number.isFinite(observation.computedDistance)).toBe(true);
  });
});
