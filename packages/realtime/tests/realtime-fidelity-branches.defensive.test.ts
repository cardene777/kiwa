import { describe, expect, it } from 'vitest';
import {
  runRealtimeFidelityCheck,
  sequenceSimilarity,
  createMockCollector,
} from '../src/fidelity.js';
import { createSupabaseRealtimeMock } from '../src/supabase.js';
import type { RealtimeDriver, CollectedEvent } from '../src/fidelity.js';

function makeStubDriver(events: CollectedEvent[]): RealtimeDriver {
  return {
    async runScenario(_scenario) {
      return events;
    },
    reset() {
      // no-op
    },
  };
}

describe('sequenceSimilarity edge cases', () => {
  it('returns 1 for empty arrays', () => {
    expect(sequenceSimilarity<string>([], [])).toBe(1);
  });

  it('returns 0 when one side is empty and the other not', () => {
    expect(sequenceSimilarity(['a'], [])).toBe(0);
    expect(sequenceSimilarity([], ['a'])).toBe(0);
  });

  it('returns 1 for identical arrays', () => {
    expect(sequenceSimilarity(['a', 'b'], ['a', 'b'])).toBe(1);
  });

  it('returns partial score for partial matches', () => {
    const s = sequenceSimilarity(['a', 'b', 'c'], ['a', 'x', 'c']);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it('handles length mismatch by dividing by longer length', () => {
    const s = sequenceSimilarity(['a', 'b'], ['a', 'b', 'c']);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

describe('runRealtimeFidelityCheck', () => {
  it('produces records with accuracy scores', async () => {
    const realEvents: CollectedEvent[] = [
      { kind: 'broadcast', event: 'msg', payload: { text: 'hi' }, relativeTimeMs: 10, order: 0 },
    ];
    const mockEvents: CollectedEvent[] = [
      { kind: 'broadcast', event: 'msg', payload: { text: 'hi' }, relativeTimeMs: 12, order: 0 },
    ];
    const report = await runRealtimeFidelityCheck({
      scenarios: ['scenario-1'],
      realDriver: makeStubDriver(realEvents),
      mockDriver: makeStubDriver(mockEvents),
    });
    expect(report.records).toHaveLength(1);
    expect(report.records[0]?.accuracyScore).toBe(1);
  });

  it('handles empty event lists (real + mock both empty)', async () => {
    const report = await runRealtimeFidelityCheck({
      scenarios: ['empty-scenario'],
      realDriver: makeStubDriver([]),
      mockDriver: makeStubDriver([]),
    });
    expect(report.records[0]?.accuracyScore).toBe(1);
    expect(report.records[0]?.totalDurationDiffMs).toBe(0);
  });

  it('handles perScenarioTimeoutMs override', async () => {
    const report = await runRealtimeFidelityCheck({
      scenarios: ['fast'],
      realDriver: makeStubDriver([]),
      mockDriver: makeStubDriver([]),
      perScenarioTimeoutMs: 100,
    });
    expect(report.records).toHaveLength(1);
  });

  it('handles multiple scenarios', async () => {
    const report = await runRealtimeFidelityCheck({
      scenarios: ['s1', 's2', 's3'],
      realDriver: makeStubDriver([]),
      mockDriver: makeStubDriver([]),
    });
    expect(report.records).toHaveLength(3);
  });
});

describe('createMockCollector', () => {
  it('returns a driver + collected array', () => {
    const mock = createSupabaseRealtimeMock();
    const collector = createMockCollector(mock, 1);
    expect(collector.driver).toBeDefined();
    expect(Array.isArray(collector.collected)).toBe(true);
  });
});
