/**
 * Burn-rate + MWMBR tests — exercise the Google SRE canonical MWMBR
 * pattern (fast burn / slow burn / ticket burn) across all 3 SLO
 * objectives (99.9 / 99.95 / 99.99).
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  SLO_TARGET_99_9,
  SLO_TARGET_99_95,
  SLO_TARGET_99_99,
} from '../src/policies/objectives.js';
import {
  MWMBR_FAST_BURN,
  MWMBR_SLOW_BURN,
  MWMBR_TICKET_BURN,
} from '../src/policies/thresholds.js';

async function primeBurnRate(input: {
  target: typeof SLO_TARGET_99_9;
  requests: number;
  errors: number;
}) {
  const mock = makeMockAdapter();
  await mock.startSlo(input.target);
  await mock.openWindow(input.target.sloId);
  await mock.recordRequests({
    sloId: input.target.sloId,
    requests: input.requests,
    errors: input.errors,
  });
  await mock.computeErrorBudget(input.target.sloId);
  return mock;
}

describe('dogfood-observability-slo-app — burn rate', () => {
  it('T-DFS-BR-001 fast burn (rate 14.4) matches when observed error rate is 15x allowed', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      // 1.5% observed vs 0.1% allowed = 15x burn rate
      errors: 15_000,
    });
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    expect(result.burnRate).toBeCloseTo(15, 4);
    expect(result.burnRate).toBeGreaterThan(MWMBR_FAST_BURN.burnRate);
  });

  it('T-DFS-BR-002 slow burn (rate 6) matches when observed error rate is 7x allowed', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 7_000,
    });
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_SLOW_BURN,
    });
    expect(result.burnRate).toBeCloseTo(7, 4);
    expect(result.burnRate).toBeGreaterThan(MWMBR_SLOW_BURN.burnRate);
  });

  it('T-DFS-BR-003 ticket burn (rate 3) matches when observed error rate is 4x allowed', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 4_000,
    });
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_TICKET_BURN,
    });
    expect(result.burnRate).toBeCloseTo(4, 4);
    expect(result.burnRate).toBeGreaterThan(MWMBR_TICKET_BURN.burnRate);
  });

  it('T-DFS-BR-004 burn rate scaled by 99.95 uses tighter allowed rate (0.0005)', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_95,
      requests: 1_000_000,
      errors: 500,
    });
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_95.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    // 0.05% observed vs 0.05% allowed = burn rate 1
    expect(result.burnRate).toBeCloseTo(1, 4);
  });

  it('T-DFS-BR-005 burn rate scaled by 99.99 uses tightest allowed rate (0.0001)', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_99,
      requests: 1_000_000,
      errors: 200,
    });
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_99.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    // 0.02% observed vs 0.01% allowed = burn rate 2
    expect(result.burnRate).toBeCloseTo(2, 4);
  });

  it('T-DFS-BR-006 fireMwmbrAlert on 15x rate matches all 3 severities (fast + slow + ticket)', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 15_000,
    });
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    const result = await mock.fireMwmbrAlert({
      sloId: SLO_TARGET_99_9.sloId,
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: true,
    });
    expect(result.fired).toBe(true);
    expect(result.matchedSeverities).toHaveLength(3);
    expect(result.matchedSeverities).toEqual(['fast', 'slow', 'slow']);
  });

  it('T-DFS-BR-007 fireMwmbrAlert on 5x rate matches slow + ticket only (not fast)', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 5_000,
    });
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    const result = await mock.fireMwmbrAlert({
      sloId: SLO_TARGET_99_9.sloId,
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: true,
    });
    // burn rate 5 -> matches slow (6) NO, ticket (3) YES
    expect(result.fired).toBe(true);
    expect(result.matchedSeverities).toContain('slow');
    expect(result.matchedSeverities).toHaveLength(1);
  });

  it('T-DFS-BR-008 fireMwmbrAlert with empty thresholds throws', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 1_000,
    });
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    await expect(
      mock.fireMwmbrAlert({
        sloId: SLO_TARGET_99_9.sloId,
        thresholds: [],
        page: true,
      }),
    ).rejects.toThrow();
  });

  it('T-DFS-BR-009 evaluateBurnRate on 0-request session returns burn rate 0', async () => {
    const mock = makeMockAdapter();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    expect(result.burnRate).toBe(0);
  });

  it('T-DFS-BR-010 pagerEnabled=false still reports fired without paging semantics', async () => {
    const mock = await primeBurnRate({
      target: SLO_TARGET_99_9,
      requests: 1_000_000,
      errors: 15_000,
    });
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    const result = await mock.fireMwmbrAlert({
      sloId: SLO_TARGET_99_9.sloId,
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: false,
    });
    expect(result.fired).toBe(true);
    expect(result.pagerEnabled).toBe(false);
  });

  it('T-DFS-BR-011 threshold shortWindowMinutes short vs long are distinguishable', async () => {
    expect(MWMBR_FAST_BURN.shortWindowMinutes).toBe(5);
    expect(MWMBR_FAST_BURN.longWindowMinutes).toBe(60);
    expect(MWMBR_SLOW_BURN.shortWindowMinutes).toBe(30);
    expect(MWMBR_SLOW_BURN.longWindowMinutes).toBe(360);
    expect(MWMBR_TICKET_BURN.shortWindowMinutes).toBe(60);
    expect(MWMBR_TICKET_BURN.longWindowMinutes).toBe(1440);
  });

  it('T-DFS-BR-012 fast burn severity is fast, slow burns are slow', async () => {
    expect(MWMBR_FAST_BURN.severity).toBe('fast');
    expect(MWMBR_SLOW_BURN.severity).toBe('slow');
    expect(MWMBR_TICKET_BURN.severity).toBe('slow');
  });
});
