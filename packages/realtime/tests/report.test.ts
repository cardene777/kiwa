import { describe, expect, it } from 'vitest';
import {
  buildRealtimeReport,
  createSupabaseRealtimeMock,
  type RealtimeFidelityReport,
} from '../src/index.js';

function fakeFidelity(): RealtimeFidelityReport {
  return {
    records: [
      {
        scenarioId: 'chat',
        real: [{ kind: 'broadcast', event: 'chat', payload: { text: 'hi' }, order: 0, relativeTimeMs: 0 }],
        mock: [{ kind: 'broadcast', event: 'chat', payload: { text: 'hi' }, order: 0, relativeTimeMs: 0 }],
        eventCountDiff: 0,
        kindOrderMatch: 1,
        payloadMatch: 1,
        accuracyScore: 1,
        totalDurationDiffMs: 0,
      },
    ],
    summary: {
      scenarios: 1,
      avgAccuracyScore: 1,
      avgEventCountDiff: 0,
      avgKindOrderMatch: 1,
      avgPayloadMatch: 1,
      avgTotalDurationDiffMs: 0,
      accuracyMethod: 'sequence-jaccard',
    },
  };
}

describe('buildRealtimeReport', () => {
  it('T-RT-REP-001 produces a QualityReport with 11 axes populated for AI-LLM provider', async () => {
    const mock = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const channel = mock.channel('room:1');
    await channel.subscribe();
    await channel.send({ type: 'broadcast', event: 'chat', payload: { n: 1 } });
    await new Promise((r) => setTimeout(r, 20));
    const report = buildRealtimeReport({
      provider: '@kiwa-lab/realtime',
      version: '0.1.0',
      fidelity: fakeFidelity(),
      mockMetrics: mock.getMetrics(),
      testCount: { behavior: 10, integration: 5, e2e: 0 },
    });
    expect(report.provider).toBe('@kiwa-lab/realtime');
    expect(report.version).toBe('0.1.0');
    expect(report.cost).toBeDefined();
    expect(report.latency).toBeDefined();
    expect(report.token).toBeDefined();
    expect(report.accuracy).toBeDefined();
    expect(report.accuracy?.score).toBe(1);
  });

  it('T-RT-REP-002 accuracyScore below threshold marks behavioralDivergences', () => {
    const fid: RealtimeFidelityReport = {
      records: [
        {
          scenarioId: 's1',
          real: [],
          mock: [],
          eventCountDiff: 0,
          kindOrderMatch: 0.3,
          payloadMatch: 0.3,
          accuracyScore: 0.3,
          totalDurationDiffMs: 0,
        },
      ],
      summary: {
        scenarios: 1,
        avgAccuracyScore: 0.3,
        avgEventCountDiff: 0,
        avgKindOrderMatch: 0.3,
        avgPayloadMatch: 0.3,
        avgTotalDurationDiffMs: 0,
        accuracyMethod: 'sequence-jaccard',
      },
    };
    const mock = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const report = buildRealtimeReport({
      provider: '@kiwa-lab/realtime',
      version: '0.1.0',
      fidelity: fid,
      mockMetrics: mock.getMetrics(),
    });
    expect(report.fidelity.behavioralDivergences).toBe(1);
  });

  it('T-RT-REP-003 default coverage uses 100 when not provided', () => {
    const mock = createSupabaseRealtimeMock({ artificialLatencyMs: 0 });
    const report = buildRealtimeReport({
      provider: '@kiwa-lab/realtime',
      version: '0.1.0',
      fidelity: fakeFidelity(),
      mockMetrics: mock.getMetrics(),
    });
    expect(report.coverage.line).toBe(100);
    expect(report.coverage.branch).toBe(100);
    expect(report.coverage.function).toBe(100);
  });
});
