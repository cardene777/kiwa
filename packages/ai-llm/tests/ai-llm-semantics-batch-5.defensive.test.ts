import { describe, expect, it } from 'vitest';
import {
  startPeaSession,
  expandChainOfThought,
  selectFewShot,
  cachePrompt,
  pinVersion,
} from '../src/semantics/prompt-engineering-advanced.js';
import {
  startFtpSession,
  prepareDataset,
  stepRlhf,
  runEvalLoop,
  detectDrift,
} from '../src/semantics/fine-tuning-pipeline.js';

describe('prompt-engineering-advanced edge cases', () => {
  it('startPeaSession throws when sessionId is empty', () => {
    expect(() =>
      startPeaSession({ target: 'openai', sessionId: '' }),
    ).toThrow(/sessionId must not be empty/);
  });

  it('expandChainOfThought throws on empty thoughts array', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's1' });
    expect(() => expandChainOfThought(session, { thoughts: [] })).toThrow(
      /thoughts must not be empty/,
    );
  });

  it('expandChainOfThought throws when individual thought is empty', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's2' });
    expect(() =>
      expandChainOfThought(session, { thoughts: ['first', ''] }),
    ).toThrow(/individual thought must not be empty/);
  });

  it('selectFewShot throws when called before expand CoT', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's3' });
    expect(() =>
      selectFewShot(session, {
        pool: [{ id: 'a', input: 'a', output: 'b', score: 0.9 }],
        k: 1,
      }),
    ).toThrow(/expand CoT first/);
  });

  it('selectFewShot throws when pool is empty', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's4' });
    expandChainOfThought(session, { thoughts: ['t'] });
    expect(() =>
      selectFewShot(session, { pool: [], k: 1 }),
    ).toThrow(/pool must not be empty/);
  });

  it('selectFewShot throws when k is zero or negative', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's5' });
    expandChainOfThought(session, { thoughts: ['t'] });
    expect(() =>
      selectFewShot(session, {
        pool: [{ id: 'a', input: 'a', output: 'b', score: 0.9 }],
        k: 0,
      }),
    ).toThrow(/k must be positive/);
  });

  it('selectFewShot picks top-k by score descending', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's6' });
    expandChainOfThought(session, { thoughts: ['t'] });
    const { selected } = selectFewShot(session, {
      pool: [
        { id: 'lo', input: 'lo', output: 'x', score: 0.1 },
        { id: 'hi', input: 'hi', output: 'x', score: 0.9 },
        { id: 'mid', input: 'mid', output: 'x', score: 0.5 },
      ],
      k: 2,
    });
    expect(selected).toHaveLength(2);
    expect(selected[0]?.score).toBe(0.9);
    expect(selected[1]?.score).toBe(0.5);
  });

  it('cachePrompt throws when session is idle', () => {
    const session = startPeaSession({ target: 'openai', sessionId: 's7' });
    expect(() =>
      cachePrompt(session, { key: 'k', value: 'p' }),
    ).toThrow();
  });
});

describe('fine-tuning-pipeline edge cases', () => {
  it('startFtpSession throws when sessionId is empty', () => {
    expect(() =>
      startFtpSession({ target: 'openai', sessionId: '' }),
    ).toThrow(/sessionId must not be empty/);
  });

  it('runEvalLoop throws when epochScores is empty', () => {
    const session = startFtpSession({ target: 'openai', sessionId: 's1' });
    prepareDataset(session, {
      samples: [{ prompt: 'p', chosen: 'c', rejected: 'r' }],
      dedupe: false,
    });
    expect(() =>
      runEvalLoop(session, { epochScores: [] }),
    ).toThrow(/epochScores must not be empty/);
  });

  it('runEvalLoop sets baselineScore on first call, preserves on subsequent', () => {
    const session = startFtpSession({ target: 'openai', sessionId: 's2' });
    prepareDataset(session, {
      samples: [{ prompt: 'p', chosen: 'c', rejected: 'r' }],
      dedupe: false,
    });
    runEvalLoop(session, { epochScores: [0.5, 0.6] });
    const baseline = session.baselineScore;
    runEvalLoop(session, { epochScores: [0.7] });
    expect(session.baselineScore).toBe(baseline);
  });

  it('detectDrift throws when threshold is negative', () => {
    const session = startFtpSession({ target: 'openai', sessionId: 's3' });
    prepareDataset(session, {
      samples: [{ prompt: 'p', chosen: 'c', rejected: 'r' }],
      dedupe: false,
    });
    runEvalLoop(session, { epochScores: [0.5] });
    expect(() => detectDrift(session, { threshold: -1 })).toThrow(
      /threshold must be non-negative/,
    );
  });

  it('detectDrift reports drifted=true when |latest-baseline| >= threshold', () => {
    const session = startFtpSession({ target: 'openai', sessionId: 's4' });
    prepareDataset(session, {
      samples: [{ prompt: 'p', chosen: 'c', rejected: 'r' }],
      dedupe: false,
    });
    runEvalLoop(session, { epochScores: [0.5] });
    runEvalLoop(session, { epochScores: [0.9] });
    const { step } = detectDrift(session, { threshold: 0.1 });
    expect(step.metadata.drifted).toBe(true);
  });

  it('detectDrift reports drifted=false when |latest-baseline| < threshold', () => {
    const session = startFtpSession({ target: 'openai', sessionId: 's5' });
    prepareDataset(session, {
      samples: [{ prompt: 'p', chosen: 'c', rejected: 'r' }],
      dedupe: false,
    });
    runEvalLoop(session, { epochScores: [0.5] });
    runEvalLoop(session, { epochScores: [0.51] });
    const { step } = detectDrift(session, { threshold: 0.2 });
    expect(step.metadata.drifted).toBe(false);
  });
});
