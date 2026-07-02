import { describe, expect, it } from 'vitest';
import {
  runRealtimeFidelityCheck,
  sequenceSimilarity,
  type CollectedEvent,
  type RealtimeDriver,
} from '../src/index.js';

function makeDriver(sequence: CollectedEvent[]): RealtimeDriver {
  return {
    async runScenario(_scenario: string) {
      return sequence;
    },
    reset() {},
  };
}

describe('sequenceSimilarity', () => {
  it('T-RT-FID-001 returns 1 for identical sequences', () => {
    expect(sequenceSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
  });

  it('T-RT-FID-002 returns 0 for empty vs non-empty', () => {
    expect(sequenceSimilarity([], ['a'])).toBe(0);
    expect(sequenceSimilarity(['a'], [])).toBe(0);
  });

  it('T-RT-FID-003 returns 1 for both-empty', () => {
    expect(sequenceSimilarity([], [])).toBe(1);
  });

  it('T-RT-FID-004 partial match — 2/3 = ~0.67', () => {
    const s = sequenceSimilarity(['a', 'x', 'c'], ['a', 'b', 'c']);
    expect(s).toBeCloseTo(2 / 3, 2);
  });
});

describe('runRealtimeFidelityCheck', () => {
  it('T-RT-FID-005 identical drivers yield accuracyScore 1', async () => {
    const seq: CollectedEvent[] = [
      { kind: 'broadcast', event: 'chat', payload: { n: 1 }, order: 0, relativeTimeMs: 0 },
      { kind: 'broadcast', event: 'chat', payload: { n: 2 }, order: 1, relativeTimeMs: 10 },
    ];
    const report = await runRealtimeFidelityCheck({
      realDriver: makeDriver(seq),
      mockDriver: makeDriver(seq),
      scenarios: ['chat-broadcast'],
    });
    expect(report.records).toHaveLength(1);
    expect(report.records[0]?.accuracyScore).toBe(1);
    expect(report.summary.avgAccuracyScore).toBe(1);
  });

  it('T-RT-FID-006 diverging payloads lower payloadMatch', async () => {
    const real: CollectedEvent[] = [
      { kind: 'broadcast', event: 'chat', payload: { n: 1 }, order: 0, relativeTimeMs: 0 },
    ];
    const mock: CollectedEvent[] = [
      { kind: 'broadcast', event: 'chat', payload: { n: 999 }, order: 0, relativeTimeMs: 0 },
    ];
    const report = await runRealtimeFidelityCheck({
      realDriver: makeDriver(real),
      mockDriver: makeDriver(mock),
      scenarios: ['chat-broadcast'],
    });
    expect(report.records[0]?.payloadMatch).toBe(0);
    expect(report.records[0]?.kindOrderMatch).toBe(1);
    expect(report.records[0]?.accuracyScore).toBeCloseTo(0.5, 2);
  });

  it('T-RT-FID-007 event count diff is reported', async () => {
    const real: CollectedEvent[] = [
      { kind: 'broadcast', event: 'a', payload: null, order: 0, relativeTimeMs: 0 },
      { kind: 'broadcast', event: 'b', payload: null, order: 1, relativeTimeMs: 5 },
    ];
    const mock: CollectedEvent[] = [
      { kind: 'broadcast', event: 'a', payload: null, order: 0, relativeTimeMs: 0 },
    ];
    const report = await runRealtimeFidelityCheck({
      realDriver: makeDriver(real),
      mockDriver: makeDriver(mock),
      scenarios: ['multi-event'],
    });
    expect(report.records[0]?.eventCountDiff).toBe(1);
  });

  it('T-RT-FID-008 multiple scenarios averaged in summary', async () => {
    const identical: CollectedEvent[] = [
      { kind: 'broadcast', event: 'x', payload: {}, order: 0, relativeTimeMs: 0 },
    ];
    const different: CollectedEvent[] = [
      { kind: 'presence', event: 'sync', payload: {}, order: 0, relativeTimeMs: 0 },
    ];
    const report = await runRealtimeFidelityCheck({
      realDriver: makeDriver(identical),
      mockDriver: makeDriver(different),
      scenarios: ['s1', 's2'],
    });
    expect(report.summary.scenarios).toBe(2);
  });
});
