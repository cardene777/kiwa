import { describe, expect, it } from 'vitest';
import {
  detectBenchmarkDrift,
  detectCatastrophicForgetting,
  evaluateDpo,
  evaluateSft,
  startFtSession,
} from '../../src/semantics/index.js';

describe('startFtSession', () => {
  it('creates idle session', () => {
    const s = startFtSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.baselineBenchmarks.size).toBe(0);
  });

  it('throws when sessionId empty', () => {
    expect(() => startFtSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('evaluateSft', () => {
  it('scores F1 = 1.0 for perfect match', () => {
    const s = startFtSession({ target: 'anthropic', sessionId: 's' });
    const { averageF1, exactMatchRate } = evaluateSft(s, [
      { prompt: 'x', gold: 'kiwa fruit', candidate: 'kiwa fruit' },
    ]);
    expect(averageF1).toBe(1);
    expect(exactMatchRate).toBe(1);
  });

  it('scores F1 = 0 for disjoint tokens', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    const { averageF1 } = evaluateSft(s, [
      { prompt: 'x', gold: 'apple', candidate: 'banana' },
    ]);
    expect(averageF1).toBe(0);
  });

  it('averages F1 across samples', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    const { averageF1 } = evaluateSft(s, [
      { prompt: 'x', gold: 'a b', candidate: 'a b' },
      { prompt: 'y', gold: 'c d', candidate: 'x y' },
    ]);
    expect(averageF1).toBeCloseTo(0.5, 2);
  });

  it('throws when samples empty', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    expect(() => evaluateSft(s, [])).toThrow('samples must not be empty');
  });
});

describe('evaluateDpo', () => {
  it('counts preference accuracy when chosenLogp > rejectedLogp', () => {
    const s = startFtSession({ target: 'anthropic', sessionId: 's' });
    const { preferenceAccuracy } = evaluateDpo(s, [
      { prompt: 'x', chosen: 'a', rejected: 'b', chosenLogp: -1.0, rejectedLogp: -2.0 },
      { prompt: 'y', chosen: 'c', rejected: 'd', chosenLogp: -0.5, rejectedLogp: -1.5 },
    ]);
    expect(preferenceAccuracy).toBe(1);
  });

  it('averages margin correctly', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    const { averageMargin } = evaluateDpo(s, [
      { prompt: 'x', chosen: 'a', rejected: 'b', chosenLogp: -1.0, rejectedLogp: -2.0 },
      { prompt: 'y', chosen: 'c', rejected: 'd', chosenLogp: -1.0, rejectedLogp: -3.0 },
    ]);
    expect(averageMargin).toBeCloseTo(1.5, 2);
  });

  it('throws when samples empty', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    expect(() => evaluateDpo(s, [])).toThrow('samples must not be empty');
  });
});

describe('detectCatastrophicForgetting', () => {
  it('flags benchmarks with drop >= threshold', () => {
    const s = startFtSession({ target: 'anthropic', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    const { forgotten, averageDrop } = detectCatastrophicForgetting(s, {
      baseline: [
        { name: 'mmlu', score: 0.7 },
        { name: 'gsm8k', score: 0.5 },
      ],
      postFineTune: [
        { name: 'mmlu', score: 0.6 },
        { name: 'gsm8k', score: 0.48 },
      ],
      threshold: 0.05,
    });
    expect(forgotten.some((f) => f.name === 'mmlu')).toBe(true);
    expect(averageDrop).toBeGreaterThan(0);
  });

  it('no forgetting when scores identical', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    const { forgotten } = detectCatastrophicForgetting(s, {
      baseline: [{ name: 'mmlu', score: 0.7 }],
      postFineTune: [{ name: 'mmlu', score: 0.7 }],
    });
    expect(forgotten).toEqual([]);
  });

  it('throws when lengths mismatch', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    expect(() =>
      detectCatastrophicForgetting(s, {
        baseline: [{ name: 'a', score: 0.5 }],
        postFineTune: [],
      }),
    ).toThrow('length mismatch');
  });

  it('throws when session idle', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      detectCatastrophicForgetting(s, {
        baseline: [{ name: 'a', score: 0.5 }],
        postFineTune: [{ name: 'a', score: 0.4 }],
      }),
    ).toThrow('run sft/dpo eval first');
  });
});

describe('detectBenchmarkDrift', () => {
  it('flags benchmarks with abs delta >= threshold', () => {
    const s = startFtSession({ target: 'anthropic', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    detectCatastrophicForgetting(s, {
      baseline: [{ name: 'mmlu', score: 0.7 }],
      postFineTune: [{ name: 'mmlu', score: 0.65 }],
    });
    const { drifted } = detectBenchmarkDrift(s, {
      current: [{ name: 'mmlu', score: 0.6 }],
      driftThreshold: 0.05,
    });
    expect(drifted).toHaveLength(1);
    expect(drifted[0]?.name).toBe('mmlu');
  });

  it('ignores unknown benchmarks not in baseline', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    detectCatastrophicForgetting(s, {
      baseline: [{ name: 'mmlu', score: 0.7 }],
      postFineTune: [{ name: 'mmlu', score: 0.65 }],
    });
    const { drifted } = detectBenchmarkDrift(s, {
      current: [{ name: 'unknown', score: 0.5 }],
    });
    expect(drifted).toEqual([]);
  });

  it('does not flag benchmarks within threshold', () => {
    const s = startFtSession({ target: 'vercel-ai', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    detectCatastrophicForgetting(s, {
      baseline: [{ name: 'mmlu', score: 0.7 }],
      postFineTune: [{ name: 'mmlu', score: 0.7 }],
    });
    const { drifted } = detectBenchmarkDrift(s, {
      current: [{ name: 'mmlu', score: 0.71 }],
      driftThreshold: 0.05,
    });
    expect(drifted).toEqual([]);
  });
});

describe('providerEvent dialect', () => {
  it.each(['anthropic', 'openai', 'vercel-ai', 'langchain'] as const)(
    '%s uses provider prefix',
    (target) => {
      const s = startFtSession({ target, sessionId: 's' });
      evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
      const prefix: Record<string, string> = {
        anthropic: 'anthropic',
        openai: 'openai',
        'vercel-ai': 'vercel',
        langchain: 'langchain',
      };
      expect(s.history[0]?.providerEvent).toContain(prefix[target]!);
    },
  );
});
