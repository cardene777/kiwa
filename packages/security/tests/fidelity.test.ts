import { describe, expect, it } from 'vitest';
import {
  reasonSimilarity,
  runSecurityFidelityCheck,
  SECURITY_FIDELITY_GRID,
  verdictSimilarity,
} from '../src/index.js';
import type { SecurityDriver, SecurityEvent } from '../src/index.js';

function eventOf(
  axis: SecurityEvent['axis'],
  provider: SecurityEvent['provider'],
  verdict: SecurityEvent['verdict'],
  reason: string,
  timestamp: number,
): SecurityEvent {
  return { axis, provider, verdict, reason, payload: {}, timestamp };
}

function makeStaticDriver(
  events: SecurityEvent[],
  axis: SecurityEvent['axis'],
  provider: SecurityEvent['provider'],
): SecurityDriver {
  return {
    provider,
    axis,
    reset() {},
    async runScenario() {
      return events;
    },
  };
}

describe('Fidelity — verdictSimilarity', () => {
  it('T-SEC-FID-001 returns 1 for identical verdict sequences', () => {
    const real = [eventOf('csp', 'helmet', 'deny', 'x', 0)];
    const mock = [eventOf('csp', 'helmet', 'deny', 'y', 0)];
    expect(verdictSimilarity(real, mock)).toBe(1);
  });

  it('T-SEC-FID-002 returns 0 for entirely mismatched verdicts', () => {
    const real = [eventOf('csp', 'helmet', 'deny', 'x', 0)];
    const mock = [eventOf('csp', 'helmet', 'allow', 'y', 0)];
    expect(verdictSimilarity(real, mock)).toBe(0);
  });

  it('T-SEC-FID-003 returns 1 for two empty sequences', () => {
    expect(verdictSimilarity([], [])).toBe(1);
  });

  it('T-SEC-FID-004 returns 0 for mismatched lengths', () => {
    const real = [eventOf('csp', 'helmet', 'deny', 'x', 0)];
    expect(verdictSimilarity(real, [])).toBe(0);
  });
});

describe('Fidelity — reasonSimilarity', () => {
  it('T-SEC-FID-005 returns 1 for identical reason token sets', () => {
    const real = [eventOf('csp', 'helmet', 'deny', 'inline script blocked', 0)];
    const mock = [eventOf('csp', 'helmet', 'deny', 'blocked inline script', 0)];
    expect(reasonSimilarity(real, mock)).toBe(1);
  });

  it('T-SEC-FID-006 returns 0 for disjoint reasons', () => {
    const real = [eventOf('csp', 'helmet', 'deny', 'abc', 0)];
    const mock = [eventOf('csp', 'helmet', 'deny', 'xyz', 0)];
    expect(reasonSimilarity(real, mock)).toBe(0);
  });

  it('T-SEC-FID-007 returns 1 for two empty event lists', () => {
    expect(reasonSimilarity([], [])).toBe(1);
  });
});

describe('Fidelity — runSecurityFidelityCheck', () => {
  it('T-SEC-FID-008 aggregates records across scenarios', async () => {
    const events: SecurityEvent[] = [
      eventOf('csp', 'helmet', 'deny', 'inline blocked', 1),
    ];
    const real = makeStaticDriver(events, 'csp', 'helmet');
    const mock = makeStaticDriver(events, 'csp', 'helmet');
    const report = await runSecurityFidelityCheck({
      provider: 'helmet',
      axis: 'csp',
      realDriver: real,
      mockDriver: mock,
      scenarios: ['s1', 's2'],
    });
    expect(report.records).toHaveLength(2);
    expect(report.summary.avgAccuracyScore).toBe(1);
  });

  it('T-SEC-FID-009 reports mismatch score for divergent drivers', async () => {
    const real = makeStaticDriver(
      [eventOf('csp', 'helmet', 'deny', 'inline blocked', 1)],
      'csp',
      'helmet',
    );
    const mock = makeStaticDriver(
      [eventOf('csp', 'helmet', 'allow', 'ok', 1)],
      'csp',
      'helmet',
    );
    const report = await runSecurityFidelityCheck({
      provider: 'helmet',
      axis: 'csp',
      realDriver: real,
      mockDriver: mock,
      scenarios: ['s1'],
    });
    expect(report.records[0]?.accuracyScore).toBeLessThan(1);
  });

  it('T-SEC-FID-010 fails scenarios that exceed the timeout', async () => {
    const slow: SecurityDriver = {
      axis: 'csp',
      provider: 'helmet',
      reset() {},
      runScenario: () => new Promise(() => {}),
    };
    const quick = makeStaticDriver([], 'csp', 'helmet');
    await expect(
      runSecurityFidelityCheck({
        provider: 'helmet',
        axis: 'csp',
        realDriver: slow,
        mockDriver: quick,
        scenarios: ['s1'],
        perScenarioTimeoutMs: 10,
      }),
    ).rejects.toThrow(/timeout/);
  });

  it('T-SEC-FID-011 empty summary has 0 avg values', async () => {
    const noop = makeStaticDriver([], 'csp', 'helmet');
    const report = await runSecurityFidelityCheck({
      provider: 'helmet',
      axis: 'csp',
      realDriver: noop,
      mockDriver: noop,
      scenarios: [],
    });
    expect(report.summary.scenarios).toBe(0);
    expect(report.summary.avgAccuracyScore).toBe(0);
  });
});

describe('Fidelity — SECURITY_FIDELITY_GRID', () => {
  it('T-SEC-FID-012 exposes 32 combinations (4 provider x 8 axis)', () => {
    expect(SECURITY_FIDELITY_GRID).toHaveLength(32);
  });

  it('T-SEC-FID-013 each axis appears exactly 4 times', () => {
    const axes = new Map<string, number>();
    for (const cell of SECURITY_FIDELITY_GRID) {
      axes.set(cell.axis, (axes.get(cell.axis) ?? 0) + 1);
    }
    for (const [, count] of axes) {
      expect(count).toBe(4);
    }
  });

  it('T-SEC-FID-014 each provider appears exactly 8 times', () => {
    const providers = new Map<string, number>();
    for (const cell of SECURITY_FIDELITY_GRID) {
      providers.set(cell.provider, (providers.get(cell.provider) ?? 0) + 1);
    }
    for (const [, count] of providers) {
      expect(count).toBe(8);
    }
  });

  it('T-SEC-FID-015 covers all 4 providers', () => {
    const providers = new Set(SECURITY_FIDELITY_GRID.map((c) => c.provider));
    expect(providers).toEqual(new Set(['helmet', 'express-rate-limit', 'casbin', 'coraza']));
  });

  it('T-SEC-FID-016 covers all 8 axes', () => {
    const axes = new Set(SECURITY_FIDELITY_GRID.map((c) => c.axis));
    expect(axes.size).toBe(8);
  });
});
