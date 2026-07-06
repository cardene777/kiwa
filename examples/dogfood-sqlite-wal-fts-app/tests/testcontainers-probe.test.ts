/**
 * Vitest — libsql / SQLite testcontainers probe flow (v1.32-4).
 *
 * The probe under mock mode always returns deterministic placeholders
 * (sqlite:3.45 + tursodatabase/libsql-server). The real adapter (when
 * `SQLITE_KEY` is unset) records a `SQLITE_ENV_MISSING` divergence; the
 * connected variant (when the env is set) echoes the bootstrap URL +
 * image tags for downstream v1.32-6 wiring.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';

describe('testcontainers probe — mock + real env-gate', () => {
  it('T-DSW-TC-001 mock adapter returns deterministic sqlite + libsql image tags', async () => {
    const adapter = makeMockAdapter();
    const observation = await adapter.driveTestcontainersProbe();
    expect(observation.sqliteUrl).toContain('sqlite-mock');
    expect(observation.sqliteImage).toContain('sqlite:3');
    expect(observation.libsqlImage).toContain('libsql');
    expect(observation.reachable).toBe(true);
    expect(adapter.metrics().testcontainersProbes).toBe(1);
    await adapter.reset();
  });

  it('T-DSW-TC-002 real adapter with unset env records SQLITE_ENV_MISSING trace', async () => {
    const savedBootstrap = process.env['SQLITE_KEY'];
    delete process.env['SQLITE_KEY'];
    try {
      const real = await makeRealAdapter();
      await expect(real.driveTestcontainersProbe()).rejects.toThrow(/SkippedError/);
      const trace = real.traces().find((t) => t.op === 'driveTestcontainersProbe');
      expect(trace?.errorKind).toBe('SQLITE_ENV_MISSING');
      await real.reset();
    } finally {
      if (savedBootstrap === undefined) delete process.env['SQLITE_KEY'];
      else process.env['SQLITE_KEY'] = savedBootstrap;
    }
  });

  it('T-DSW-TC-003 real adapter with bootstrap set echoes the URL + image tags', async () => {
    process.env['SQLITE_KEY'] = 'libsql://kiwa-notebook.turso.io';
    process.env['SQLITE_IMAGE'] = 'sqlite:3.46-alpine';
    process.env['LIBSQL_IMAGE'] = 'ghcr.io/tursodatabase/libsql-server:v0.24.30';
    try {
      const real = await makeRealAdapter();
      const observation = await real.driveTestcontainersProbe();
      expect(observation.sqliteUrl).toBe('libsql://kiwa-notebook.turso.io');
      expect(observation.sqliteImage).toBe('sqlite:3.46-alpine');
      expect(observation.libsqlImage).toBe('ghcr.io/tursodatabase/libsql-server:v0.24.30');
      expect(observation.reachable).toBe(true);
      await real.reset();
    } finally {
      delete process.env['SQLITE_KEY'];
      delete process.env['SQLITE_IMAGE'];
      delete process.env['LIBSQL_IMAGE'];
    }
  });
});
