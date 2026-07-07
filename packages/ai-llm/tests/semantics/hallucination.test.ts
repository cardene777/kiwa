import { describe, expect, it } from 'vitest';
import {
  checkFactuality,
  scoreConfidence,
  scoreSelfConsistency,
  startHallucinationSession,
  verifyCitation,
} from '../../src/semantics/index.js';

describe('startHallucinationSession', () => {
  it('creates idle session', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.scores).toEqual({});
  });

  it('throws when sessionId empty', () => {
    expect(() => startHallucinationSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('scoreSelfConsistency', () => {
  it('scores 1.0 for identical samples', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    const { score } = scoreSelfConsistency(s, ['tokyo capital japan', 'tokyo capital japan']);
    expect(score).toBeCloseTo(1.0, 2);
  });

  it('scores low for disjoint samples', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    const { score } = scoreSelfConsistency(s, ['red apple', 'blue ocean']);
    expect(score).toBeLessThan(0.2);
  });

  it('averages jaccard across all pairs when 3+ samples', () => {
    const s = startHallucinationSession({ target: 'vercel-ai', sessionId: 's' });
    const { score } = scoreSelfConsistency(s, ['a b', 'a b c', 'a c']);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('throws when < 2 samples', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    expect(() => scoreSelfConsistency(s, ['only one'])).toThrow('at least 2 samples');
  });

  it('updates session state to self-consistency-scored', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a b', 'a b']);
    expect(s.state).toBe('self-consistency-scored');
  });

  it('records score into session.scores', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    expect(s.scores.selfConsistency).toBeCloseTo(1.0, 2);
  });
});

describe('checkFactuality', () => {
  it('matches claim tokens against evidence tokens', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score, matches } = checkFactuality(s, {
      claim: 'tokyo is capital japan',
      evidence: ['tokyo capital japan', 'paris capital france'],
    });
    expect(score).toBeGreaterThan(0);
    expect(matches).toContain('tokyo capital japan');
  });

  it('scores 0 when no evidence matches', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score } = checkFactuality(s, {
      claim: 'moon is made of cheese',
      evidence: ['earth orbits sun', 'gravity is force'],
    });
    expect(score).toBe(0);
  });

  it('throws when session idle', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    expect(() =>
      checkFactuality(s, { claim: 'x', evidence: ['y'] }),
    ).toThrow('run self-consistency first');
  });

  it('throws when evidence empty', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    expect(() => checkFactuality(s, { claim: 'x', evidence: [] })).toThrow('evidence must not be empty');
  });

  it('records score into session', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    checkFactuality(s, {
      claim: 'tokyo capital japan',
      evidence: ['tokyo capital japan tokyo japan'],
    });
    expect(s.scores.factuality).toBeGreaterThan(0);
  });
});

describe('verifyCitation', () => {
  it('scores 1.0 when all citations found in corpus', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score, missing } = verifyCitation(s, {
      citations: ['src1', 'src2'],
      corpus: ['src1', 'src2', 'src3'],
    });
    expect(score).toBe(1);
    expect(missing).toEqual([]);
  });

  it('scores partial when some missing', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score, missing } = verifyCitation(s, {
      citations: ['src1', 'unknown'],
      corpus: ['src1'],
    });
    expect(score).toBe(0.5);
    expect(missing).toEqual(['unknown']);
  });

  it('throws when citations empty', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    expect(() => verifyCitation(s, { citations: [], corpus: ['x'] })).toThrow(
      'citations must not be empty',
    );
  });

  it('throws when session idle', () => {
    const s = startHallucinationSession({ target: 'openai', sessionId: 's' });
    expect(() => verifyCitation(s, { citations: ['a'], corpus: ['a'] })).toThrow();
  });
});

describe('scoreConfidence', () => {
  it('high confidence when no hedging words', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score, hedgingRatio } = scoreConfidence(s, 'tokyo is the capital of japan');
    expect(hedgingRatio).toBe(0);
    expect(score).toBe(1);
  });

  it('low confidence when many hedging words', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { score } = scoreConfidence(s, 'maybe possibly might be perhaps could seems');
    expect(score).toBeLessThan(0.5);
  });

  it('throws when session idle', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    expect(() => scoreConfidence(s, 'x')).toThrow('run other checks first');
  });

  it('detects hedging words case-insensitive', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { hedgingRatio } = scoreConfidence(s, 'MAYBE Might POSSIBLY');
    expect(hedgingRatio).toBeGreaterThan(0);
  });
});

describe('providerEvent dialect', () => {
  it.each(['anthropic', 'openai', 'vercel-ai', 'langchain'] as const)(
    '%s uses provider prefix',
    (target) => {
      const s = startHallucinationSession({ target, sessionId: 's' });
      scoreSelfConsistency(s, ['a', 'a']);
      const providerPrefix: Record<string, string> = {
        anthropic: 'anthropic',
        openai: 'openai',
        'vercel-ai': 'vercel',
        langchain: 'langchain',
      };
      expect(s.history[0]?.providerEvent).toContain(providerPrefix[target]!);
    },
  );
});
