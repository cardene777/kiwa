/**
 * Vitest — FTS5 full-journey flow (v1.32-4 AC1).
 *
 * Drives the 5-state FTS5 walk and asserts the mock adapter reports
 * every state transition + the final vocab inspection result.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveFts5Journey } from '../src/fts5/index.js';

describe('FTS5 full journey — mock adapter drives the 5-state walk', () => {
  it('T-DSW-FTS-001 mock adapter walks empty → vocab-inspected', async () => {
    const adapter = makeMockAdapter();
    const observation = await adapter.driveFts5FullJourney();
    expect(observation.finalState).toBe('vocab-inspected');
    expect(observation.tableName).toBe('notebook_fts');
    expect(observation.tokenizer).toBe('unicode61');
    expect(observation.tokenCount).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DSW-FTS-002 porter tokenizer + trigram tokenizer are accepted', async () => {
    const adapter = makeMockAdapter();
    const porter = await adapter.driveFts5FullJourney({
      tokenizer: 'porter',
      document: 'searching indexed tokens',
    });
    expect(porter.tokenizer).toBe('porter');
    const trigram = await adapter.driveFts5FullJourney({
      tokenizer: 'trigram',
      document: 'search tokens indexed',
    });
    expect(trigram.tokenizer).toBe('trigram');
    await adapter.reset();
  });

  it('T-DSW-FTS-003 empty document rejected by tokenizer', () => {
    expect(() =>
      driveFts5Journey({
        tableName: 'x',
        columns: ['a'],
        tokenizer: 'unicode61',
        document: '',
        query: 'x',
        rank: -1,
        vocabTerm: 'x',
        vocabOccurrences: 0,
      }),
    ).toThrow(/document must contain tokens/);
  });

  it('T-DSW-FTS-004 match rank is recorded verbatim on the observation', async () => {
    const adapter = makeMockAdapter();
    const observation = await adapter.driveFts5FullJourney({ rank: -7.25 });
    expect(observation.matchRank).toBe(-7.25);
    await adapter.reset();
  });

  it('T-DSW-FTS-005 metrics report 4 axis steps + 1 latency sample', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveFts5FullJourney();
    const metrics = adapter.metrics();
    expect(metrics.fts5JourneySteps).toBe(4);
    expect(metrics.latencySamplesMs.length).toBe(1);
    await adapter.reset();
  });
});
