import { describe, expect, it } from 'vitest';
import { detectRealEnv, makeRealAdapter, SkippedError } from '../src/adapters/real.js';

describe('real adapter env-gated probe', () => {
  it('T-DMR-ENV-001 detectRealEnv returns null when MYSQL_KEY is unset', () => {
    const previous = process.env.MYSQL_KEY;
    delete process.env.MYSQL_KEY;
    try {
      expect(detectRealEnv()).toBeNull();
    } finally {
      if (previous !== undefined) process.env.MYSQL_KEY = previous;
    }
  });

  it('T-DMR-ENV-002 detectRealEnv reads MYSQL_KEY + defaults clientId', () => {
    const prevKey = process.env.MYSQL_KEY;
    const prevClient = process.env.MYSQL_CLIENT_ID;
    process.env.MYSQL_KEY = 'mysql://user:pass@localhost:3306/kiwa';
    delete process.env.MYSQL_CLIENT_ID;
    try {
      const env = detectRealEnv();
      expect(env?.bootstrap).toBe('mysql://user:pass@localhost:3306/kiwa');
      expect(env?.clientId).toBe('dogfood-mysql-rls-tenant-app');
    } finally {
      if (prevKey !== undefined) process.env.MYSQL_KEY = prevKey;
      else delete process.env.MYSQL_KEY;
      if (prevClient !== undefined) process.env.MYSQL_CLIENT_ID = prevClient;
    }
  });

  it('T-DMR-ENV-003 makeRealAdapter without env returns skipped adapter with MYSQL_ENV_MISSING traces', async () => {
    const previous = process.env.MYSQL_KEY;
    delete process.env.MYSQL_KEY;
    try {
      const adapter = await makeRealAdapter();
      await expect(
        adapter.driveTenantInjection({ orgs: [] }),
      ).rejects.toThrowError(SkippedError);
      const trace = adapter.traces();
      expect(trace).toHaveLength(1);
      expect(trace[0]!.errorKind).toBe('MYSQL_ENV_MISSING');
    } finally {
      if (previous !== undefined) process.env.MYSQL_KEY = previous;
    }
  });

  it('T-DMR-ENV-004 makeRealAdapter with valid DSN records probe.ok=true', async () => {
    const previous = process.env.MYSQL_KEY;
    process.env.MYSQL_KEY = 'mysql://user:pass@localhost:3306/kiwa';
    try {
      const adapter = await makeRealAdapter();
      const probeTrace = adapter.traces().find((t) => t.op === 'probe');
      expect(probeTrace?.ok).toBe(true);
    } finally {
      if (previous !== undefined) process.env.MYSQL_KEY = previous;
      else delete process.env.MYSQL_KEY;
    }
  });

  it('T-DMR-ENV-005 makeRealAdapter connected variant reports REAL_ADAPTER_NOT_IMPLEMENTED', async () => {
    const previous = process.env.MYSQL_KEY;
    process.env.MYSQL_KEY = 'mysql://user:pass@localhost:3306/kiwa';
    try {
      const adapter = await makeRealAdapter();
      await expect(
        adapter.driveTenantInjection({ orgs: [] }),
      ).rejects.toThrowError(/REAL_ADAPTER_NOT_IMPLEMENTED/);
      const trace = adapter.traces();
      const nonProbe = trace.filter((t) => t.op !== 'probe');
      expect(nonProbe.some((t) => t.errorKind === 'REAL_ADAPTER_NOT_IMPLEMENTED')).toBe(
        true,
      );
    } finally {
      if (previous !== undefined) process.env.MYSQL_KEY = previous;
      else delete process.env.MYSQL_KEY;
    }
  });
});
