import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectRealEnv, makeRealAdapter, SkippedError } from '../src/adapters/real.js';

// -----------------------------------------------------------------------------
// Real adapter — env-gated probe + skipped variant
//
// Every op on the skipped variant must throw SkippedError with the
// POSTGRES_ENV_MISSING code so the fidelity harness records a well-defined
// gap. When POSTGRES_BOOTSTRAP is set, the connected variant probes the
// bootstrap string but reports higher-level ops as REAL_ADAPTER_NOT_IMPLEMENTED
// under the v1.26-2 scope.
// -----------------------------------------------------------------------------

describe('real adapter — POSTGRES_BOOTSTRAP env gate', () => {
  const savedBootstrap = process.env.POSTGRES_BOOTSTRAP;
  const savedClientId = process.env.POSTGRES_CLIENT_ID;
  const savedPostgresImage = process.env.POSTGRES_IMAGE;
  const savedPgvectorImage = process.env.PGVECTOR_IMAGE;

  beforeEach(() => {
    delete process.env.POSTGRES_BOOTSTRAP;
    delete process.env.POSTGRES_CLIENT_ID;
    delete process.env.POSTGRES_IMAGE;
    delete process.env.PGVECTOR_IMAGE;
  });

  afterEach(() => {
    if (savedBootstrap === undefined) delete process.env.POSTGRES_BOOTSTRAP;
    else process.env.POSTGRES_BOOTSTRAP = savedBootstrap;
    if (savedClientId === undefined) delete process.env.POSTGRES_CLIENT_ID;
    else process.env.POSTGRES_CLIENT_ID = savedClientId;
    if (savedPostgresImage === undefined) delete process.env.POSTGRES_IMAGE;
    else process.env.POSTGRES_IMAGE = savedPostgresImage;
    if (savedPgvectorImage === undefined) delete process.env.PGVECTOR_IMAGE;
    else process.env.PGVECTOR_IMAGE = savedPgvectorImage;
  });

  it('T-DPR-ENV-001 detectRealEnv returns null when POSTGRES_BOOTSTRAP is missing', () => {
    expect(detectRealEnv()).toBeNull();
  });

  it('T-DPR-ENV-002 skipped adapter records POSTGRES_ENV_MISSING on every op', async () => {
    const adapter = await makeRealAdapter();
    expect(adapter.mode).toBe('real');
    await expect(
      adapter.driveOutbox([{ orderId: 'x', region: 'us', total: 1 }]),
    ).rejects.toBeInstanceOf(SkippedError);
    // emitFidelity does not throw — it appends a trace entry so the fidelity
    // harness can record the divergence without aborting the matrix run.
    await adapter.emitFidelity();
    const trace = adapter.traces();
    expect(trace.every((t) => t.errorKind === 'POSTGRES_ENV_MISSING')).toBe(true);
    expect(trace.length).toBeGreaterThanOrEqual(2);
    await adapter.reset();
  });

  it('T-DPR-ENV-003 detectRealEnv respects POSTGRES_CLIENT_ID + image overrides', () => {
    process.env.POSTGRES_BOOTSTRAP = 'localhost:5432';
    process.env.POSTGRES_CLIENT_ID = 'test-client';
    const env = detectRealEnv();
    expect(env).toMatchObject({
      bootstrap: 'localhost:5432',
      clientId: 'test-client',
    });
    // v1.32-2 adds postgres + pgvector image tags (default fallbacks).
    expect(env?.postgresImage).toBe('postgres:16-alpine');
    expect(env?.pgvectorImage).toBe('pgvector/pgvector:pg16');
  });

  it('T-DPR-ENV-004 connected adapter probes but reports REAL_ADAPTER_NOT_IMPLEMENTED for high-level ops', async () => {
    process.env.POSTGRES_BOOTSTRAP = 'postgres://user:pass@localhost:5432/db';
    const adapter = await makeRealAdapter();
    const probeTrace = adapter.traces().find((t) => t.op === 'probe');
    expect(probeTrace?.ok).toBe(true);
    await expect(
      adapter.driveOutbox([{ orderId: 'x', region: 'us', total: 1 }]),
    ).rejects.toThrowError(/REAL_ADAPTER_NOT_IMPLEMENTED/);
    await adapter.reset();
  });

  it('T-DPR-ENV-005 connected adapter with malformed bootstrap fails probe', async () => {
    process.env.POSTGRES_BOOTSTRAP = 'not-a-valid-dsn';
    const adapter = await makeRealAdapter();
    const probeTrace = adapter.traces().find((t) => t.op === 'probe');
    expect(probeTrace?.ok).toBe(false);
    await adapter.reset();
  });
});
