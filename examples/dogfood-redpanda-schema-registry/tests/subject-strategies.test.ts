/**
 * T-DRS-* — subject naming strategies.
 *
 * v1.31-3 probes topic-name / record-name / topic-record-name against the
 * same topic + record to verify the naming convention wire-up. The oracle
 * asserts every strategy resolves to a distinct subject + that a fresh
 * register roundtrips against each strategy.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

let adapter: ReturnType<typeof makeMockAdapter> | null = null;

afterEach(async () => {
  if (adapter) await adapter.reset();
  adapter = null;
});

describe('driveSubjectStrategies — 3 naming strategies', () => {
  it('T-DRS-001 probes topic-name / record-name / topic-record-name', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveSubjectStrategies();
    const strategies = out.probed.map((p) => p.strategy);
    expect(strategies).toEqual(['topic-name', 'record-name', 'topic-record-name']);
  });

  it('T-DRS-002 topic-name resolves subject as `<topic>-value`', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveSubjectStrategies();
    const tn = out.probed.find((p) => p.strategy === 'topic-name');
    expect(tn?.derivedSubject).toBe('users-value');
  });

  it('T-DRS-003 record-name derives a distinct subject from topic-name', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveSubjectStrategies();
    const tn = out.probed.find((p) => p.strategy === 'topic-name');
    const rn = out.probed.find((p) => p.strategy === 'record-name');
    expect(rn?.derivedSubject).not.toBe(tn?.derivedSubject);
  });

  it('T-DRS-004 every probed strategy successfully registers the schema', async () => {
    adapter = makeMockAdapter();
    const out = await adapter.driveSubjectStrategies();
    for (const entry of out.probed) {
      expect(entry.registered).toBe(true);
      expect(entry.latestVersion).toBe(1);
    }
  });

  it('T-DRS-005 metrics counter subjectStrategyProbes advances by the strategy count', async () => {
    adapter = makeMockAdapter();
    const before = adapter.metrics().subjectStrategyProbes;
    await adapter.driveSubjectStrategies();
    const after = adapter.metrics().subjectStrategyProbes;
    expect(after - before).toBe(3);
  });
});
