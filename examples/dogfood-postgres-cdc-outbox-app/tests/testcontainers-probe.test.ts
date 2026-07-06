/**
 * Vitest — Postgres 16 + pgvector testcontainers probe flow (v1.32-2 axis 4).
 *
 * The probe under mock mode always returns deterministic placeholders
 * (postgres:16-alpine + pgvector/pgvector:pg16). The real adapter (when
 * `POSTGRES_BOOTSTRAP` is unset) records a `POSTGRES_ENV_MISSING`
 * divergence; the connected variant (when the env is set) echoes the
 * bootstrap URL + image tags for downstream v1.32-6 wiring.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { driveTestcontainersProbeFlow } from '../src/flows/postgres-flows.js';

describe('testcontainers probe — mock + real env-gate', () => {
  it('T-DPE-TC-001 mock adapter returns deterministic postgres + pgvector image tags', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveTestcontainersProbeFlow(adapter);
    expect(observation.postgresUrl).toContain('postgres-mock');
    expect(observation.postgresImage).toContain('postgres:16');
    expect(observation.pgvectorImage).toContain('pgvector');
    expect(observation.reachable).toBe(true);
    expect(adapter.metrics().testcontainersProbes).toBe(1);
    await adapter.reset();
  });

  it('T-DPE-TC-002 real adapter with unset env records POSTGRES_ENV_MISSING trace', async () => {
    const savedBootstrap = process.env.POSTGRES_BOOTSTRAP;
    delete process.env.POSTGRES_BOOTSTRAP;
    try {
      const real = await makeRealAdapter();
      // SkippedError is thrown by the skipped variant; the trace entry
      // records the POSTGRES_ENV_MISSING code the fidelity harness consumes.
      await expect(driveTestcontainersProbeFlow(real)).rejects.toThrow(/SkippedError/);
      const trace = real.traces().find((t) => t.op === 'driveTestcontainersProbe');
      expect(trace?.errorKind).toBe('POSTGRES_ENV_MISSING');
      await real.reset();
    } finally {
      if (savedBootstrap === undefined) delete process.env.POSTGRES_BOOTSTRAP;
      else process.env.POSTGRES_BOOTSTRAP = savedBootstrap;
    }
  });

  it('T-DPE-TC-003 real adapter with bootstrap set echoes the URL + image tags', async () => {
    process.env.POSTGRES_BOOTSTRAP = 'postgresql://user:pass@localhost:5432/orders';
    process.env.POSTGRES_IMAGE = 'postgres:16-bookworm';
    process.env.PGVECTOR_IMAGE = 'pgvector/pgvector:pg16';
    try {
      const real = await makeRealAdapter();
      const observation = await driveTestcontainersProbeFlow(real);
      expect(observation.postgresUrl).toBe('postgresql://user:pass@localhost:5432/orders');
      expect(observation.postgresImage).toBe('postgres:16-bookworm');
      expect(observation.pgvectorImage).toBe('pgvector/pgvector:pg16');
      expect(observation.reachable).toBe(true);
      await real.reset();
    } finally {
      delete process.env.POSTGRES_BOOTSTRAP;
      delete process.env.POSTGRES_IMAGE;
      delete process.env.PGVECTOR_IMAGE;
    }
  });
});
