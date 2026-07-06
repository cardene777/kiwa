/**
 * Vitest — MySQL 8 + MySQL Router testcontainers probe flow (v1.32-3 axis 4).
 *
 * The probe under mock mode always returns deterministic placeholders
 * (mysql:8.4 + mysql/mysql-router:8.4). The real adapter (when
 * `MYSQL_KEY` is unset) records a `MYSQL_ENV_MISSING` divergence; the
 * connected variant (when the env is set) echoes the bootstrap URL +
 * image tags for downstream v1.32-6 wiring.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { driveTestcontainersProbeFlow } from '../src/flows/mysql-flows.js';

describe('testcontainers probe — mock + real env-gate', () => {
  it('T-DMTC-001 mock adapter returns deterministic mysql + router image tags', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveTestcontainersProbeFlow(adapter);
    expect(observation.mysqlUrl).toContain('mysql-mock');
    expect(observation.mysqlImage).toContain('mysql:8');
    expect(observation.routerImage).toContain('mysql-router');
    expect(observation.reachable).toBe(true);
    expect(adapter.metrics().testcontainersProbes).toBe(1);
    await adapter.reset();
  });

  it('T-DMTC-002 real adapter with unset env records MYSQL_ENV_MISSING trace', async () => {
    const savedKey = process.env.MYSQL_KEY;
    delete process.env.MYSQL_KEY;
    try {
      const real = await makeRealAdapter();
      // SkippedError is thrown by the skipped variant; the trace entry
      // records the MYSQL_ENV_MISSING code the fidelity harness consumes.
      await expect(driveTestcontainersProbeFlow(real)).rejects.toThrow(
        /SkippedError/,
      );
      const trace = real.traces().find((t) => t.op === 'driveTestcontainersProbe');
      expect(trace?.errorKind).toBe('MYSQL_ENV_MISSING');
      await real.reset();
    } finally {
      if (savedKey === undefined) delete process.env.MYSQL_KEY;
      else process.env.MYSQL_KEY = savedKey;
    }
  });

  it('T-DMTC-003 real adapter with bootstrap set echoes the URL + image tags', async () => {
    process.env.MYSQL_KEY = 'mysql://user:pass@localhost:3306/kiwa';
    process.env.MYSQL_IMAGE = 'mysql:8.0.36';
    process.env.MYSQL_ROUTER_IMAGE = 'mysql/mysql-router:8.0.36';
    try {
      const real = await makeRealAdapter();
      const observation = await driveTestcontainersProbeFlow(real);
      expect(observation.mysqlUrl).toBe('mysql://user:pass@localhost:3306/kiwa');
      expect(observation.mysqlImage).toBe('mysql:8.0.36');
      expect(observation.routerImage).toBe('mysql/mysql-router:8.0.36');
      expect(observation.reachable).toBe(true);
      await real.reset();
    } finally {
      delete process.env.MYSQL_KEY;
      delete process.env.MYSQL_IMAGE;
      delete process.env.MYSQL_ROUTER_IMAGE;
    }
  });

  it('T-DMTC-004 real adapter with bootstrap set + no image override uses defaults', async () => {
    process.env.MYSQL_KEY = 'mysql://user:pass@localhost:3306/kiwa';
    delete process.env.MYSQL_IMAGE;
    delete process.env.MYSQL_ROUTER_IMAGE;
    try {
      const real = await makeRealAdapter();
      const observation = await driveTestcontainersProbeFlow(real);
      expect(observation.mysqlImage).toBe('mysql:8.4');
      expect(observation.routerImage).toBe('mysql/mysql-router:8.4');
      await real.reset();
    } finally {
      delete process.env.MYSQL_KEY;
    }
  });
});
