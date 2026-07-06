/**
 * Vitest — real adapter probe (v1.32-4).
 *
 * The real adapter returns a skipped variant when `SQLITE_KEY` is unset.
 * The 4 non-testcontainers ops throw a SkippedError with a
 * `SQLITE_ENV_MISSING` code. When the env is set, the higher-level ops
 * still return `REAL_ADAPTER_NOT_IMPLEMENTED` until the v1.32-6 publish
 * milestone wires the libsql client.
 */

import { describe, expect, it } from 'vitest';
import { detectRealEnv, makeRealAdapter, SkippedError } from '../src/adapters/real.js';

describe('dogfood-sqlite-wal-fts-app — real adapter probe', () => {
  it('T-DSW-REAL-001 detectRealEnv returns null when SQLITE_KEY is unset', () => {
    const saved = process.env['SQLITE_KEY'];
    delete process.env['SQLITE_KEY'];
    try {
      expect(detectRealEnv()).toBeNull();
    } finally {
      if (saved !== undefined) process.env['SQLITE_KEY'] = saved;
    }
  });

  it('T-DSW-REAL-002 detectRealEnv reads default images when only bootstrap is set', () => {
    process.env['SQLITE_KEY'] = 'libsql://x.turso.io';
    delete process.env['SQLITE_IMAGE'];
    delete process.env['LIBSQL_IMAGE'];
    try {
      const env = detectRealEnv();
      expect(env?.sqliteImage).toBe('sqlite:3.45');
      expect(env?.libsqlImage).toContain('libsql-server');
    } finally {
      delete process.env['SQLITE_KEY'];
    }
  });

  it('T-DSW-REAL-003 skipped variant throws SkippedError on driveWalFullJourney', async () => {
    const saved = process.env['SQLITE_KEY'];
    delete process.env['SQLITE_KEY'];
    try {
      const real = await makeRealAdapter();
      await expect(real.driveWalFullJourney()).rejects.toBeInstanceOf(SkippedError);
      const trace = real.traces().find((t) => t.op === 'driveWalFullJourney');
      expect(trace?.errorKind).toBe('SQLITE_ENV_MISSING');
    } finally {
      if (saved !== undefined) process.env['SQLITE_KEY'] = saved;
    }
  });

  it('T-DSW-REAL-004 connected variant reports REAL_ADAPTER_NOT_IMPLEMENTED for higher-level ops', async () => {
    process.env['SQLITE_KEY'] = 'libsql://x.turso.io';
    try {
      const real = await makeRealAdapter();
      await expect(real.driveFts5FullJourney()).rejects.toThrow(/not implemented/);
      const trace = real.traces().find((t) => t.op === 'driveFts5FullJourney');
      expect(trace?.errorKind).toBe('REAL_ADAPTER_NOT_IMPLEMENTED');
      await real.reset();
    } finally {
      delete process.env['SQLITE_KEY'];
    }
  });

  it('T-DSW-REAL-005 connected variant echoes bootstrap URL on driveTestcontainersProbe', async () => {
    process.env['SQLITE_KEY'] = 'libsql://k.turso.io';
    try {
      const real = await makeRealAdapter();
      const observation = await real.driveTestcontainersProbe();
      expect(observation.sqliteUrl).toBe('libsql://k.turso.io');
      expect(observation.reachable).toBe(true);
      await real.reset();
    } finally {
      delete process.env['SQLITE_KEY'];
    }
  });
});
