import { describe, expect, it } from 'vitest';
import {
  attributeTeam,
  optimizeSpot,
  recommendRightsizing,
  recordCostPerRequest,
  startFinopsSession,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('finops axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'acct-1' });
    recordCostPerRequest(s, { requests: 1_000_000, totalCostUsd: 5000 });
    attributeTeam(s, {
      teamCosts: [
        { team: 'platform', costUsd: 3000 },
        { team: 'growth', costUsd: 2000 },
      ],
    });
    recommendRightsizing(s, {
      recommendations: [
        { resource: 'ec2/i-1', currentSizeUsd: 500, recommendedSizeUsd: 300 },
      ],
    });
    optimizeSpot(s, { onDemandUsd: 1000, spotUsd: 300 });
    expect(s.state).toBe('spot-optimized');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'finops.cost_per_request_recorded',
      'finops.team_attributed',
      'finops.rightsizing_recommended',
      'finops.spot_optimized',
    ]);
  });

  it('recordCostPerRequest computes CPR', () => {
    const s = startFinopsSession({ target: 'grafana-oss', accountId: 'x' });
    const step = recordCostPerRequest(s, { requests: 1000, totalCostUsd: 20 });
    expect(step.metadata.costPerRequestUsd).toBe(0.02);
  });

  it('attributeTeam calculates unattributed remainder', () => {
    const s = startFinopsSession({ target: 'loki', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    const step = attributeTeam(s, {
      teamCosts: [
        { team: 'a', costUsd: 40 },
        { team: 'b', costUsd: 30 },
      ],
    });
    expect(step.metadata.totalAttributedUsd).toBe(70);
    expect(step.metadata.unattributedUsd).toBe(30);
    expect(step.metadata.teamCount).toBe(2);
  });

  it('attributeTeam clamps unattributed to 0 when over-attributed', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 50 });
    const step = attributeTeam(s, {
      teamCosts: [{ team: 'a', costUsd: 100 }],
    });
    expect(step.metadata.unattributedUsd).toBe(0);
  });

  it('recommendRightsizing sums savings', () => {
    const s = startFinopsSession({ target: 'otel-collector', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    const step = recommendRightsizing(s, {
      recommendations: [
        { resource: 'r1', currentSizeUsd: 500, recommendedSizeUsd: 300 },
        { resource: 'r2', currentSizeUsd: 1000, recommendedSizeUsd: 700 },
      ],
    });
    expect(step.metadata.totalSavingsUsd).toBe(500);
    expect(step.metadata.resourceCount).toBe(2);
  });

  it('recommendRightsizing floors negative savings at 0', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    const step = recommendRightsizing(s, {
      recommendations: [
        { resource: 'r1', currentSizeUsd: 100, recommendedSizeUsd: 200 }, // upsize, savings = 0
      ],
    });
    expect(step.metadata.totalSavingsUsd).toBe(0);
  });

  it('optimizeSpot computes savings ratio', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    recommendRightsizing(s, {
      recommendations: [{ resource: 'r1', currentSizeUsd: 100, recommendedSizeUsd: 50 }],
    });
    const step = optimizeSpot(s, { onDemandUsd: 1000, spotUsd: 300 });
    expect(step.metadata.savingsUsd).toBe(700);
    expect(step.metadata.savingsRatio).toBe(0.7);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startFinopsSession({ target, accountId: 'x' });
    const step = recordCostPerRequest(s, { requests: 1, totalCostUsd: 1 });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('finops axis — invariant guards', () => {
  it('rejects empty accountId', () => {
    expect(() => startFinopsSession({ target: 'prometheus', accountId: '' })).toThrow(/accountId/);
  });

  it('rejects non-positive requests', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    expect(() => recordCostPerRequest(s, { requests: 0, totalCostUsd: 10 })).toThrow(/positive/);
  });

  it('rejects negative totalCost', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    expect(() => recordCostPerRequest(s, { requests: 100, totalCostUsd: -1 })).toThrow(
      /non-negative/,
    );
  });

  it('rejects attributeTeam before recordCostPerRequest', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    expect(() => attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 10 }] })).toThrow(
      /not cost-per-request-recorded/,
    );
  });

  it('rejects attributeTeam with negative team cost', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    expect(() => attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: -1 }] })).toThrow(
      /non-negative/,
    );
  });

  it('rejects empty teamCosts', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    expect(() => attributeTeam(s, { teamCosts: [] })).toThrow(/must not be empty/);
  });

  it('rejects recommendRightsizing with negative cost', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    expect(() =>
      recommendRightsizing(s, {
        recommendations: [{ resource: 'r', currentSizeUsd: -1, recommendedSizeUsd: 0 }],
      }),
    ).toThrow(/non-negative/);
  });

  it('rejects optimizeSpot with spot > onDemand', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    recommendRightsizing(s, {
      recommendations: [{ resource: 'r', currentSizeUsd: 100, recommendedSizeUsd: 50 }],
    });
    expect(() => optimizeSpot(s, { onDemandUsd: 100, spotUsd: 200 })).toThrow(/not exceed/);
  });

  it('rejects optimizeSpot with non-positive onDemand', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    recommendRightsizing(s, {
      recommendations: [{ resource: 'r', currentSizeUsd: 100, recommendedSizeUsd: 50 }],
    });
    expect(() => optimizeSpot(s, { onDemandUsd: 0, spotUsd: 0 })).toThrow(/positive/);
  });
});
