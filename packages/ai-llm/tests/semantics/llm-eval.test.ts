import { describe, expect, it } from 'vitest';
import {
  applyRubric,
  judgeCandidates,
  rankPreference,
  startEvalSession,
  updateElo,
} from '../../src/semantics/index.js';

describe('startEvalSession', () => {
  it('creates idle session with empty elo map', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.eloRatings.size).toBe(0);
  });

  it('throws when sessionId empty', () => {
    expect(() => startEvalSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('judgeCandidates', () => {
  it('scores candidates via prompt overlap', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    const { verdicts } = judgeCandidates(s, {
      prompt: 'capital of japan',
      candidates: [
        { id: 'a', text: 'tokyo is the capital of japan' },
        { id: 'b', text: 'i like apples' },
      ],
    });
    expect(verdicts[0]?.score).toBeGreaterThan(verdicts[1]?.score ?? 1);
  });

  it('rewards ground-truth match when provided', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    const { verdicts } = judgeCandidates(s, {
      prompt: 'x',
      candidates: [
        { id: 'a', text: 'tokyo japan', groundTruth: 'tokyo japan' },
        { id: 'b', text: 'unrelated', groundTruth: 'tokyo japan' },
      ],
    });
    expect(verdicts[0]?.score).toBeGreaterThan(verdicts[1]?.score ?? 1);
  });

  it('throws when candidates empty', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    expect(() => judgeCandidates(s, { prompt: 'x', candidates: [] })).toThrow(
      'candidates must not be empty',
    );
  });

  it('reasoning includes overlap + ground factors', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    const { verdicts } = judgeCandidates(s, {
      prompt: 'x',
      candidates: [{ id: 'a', text: 'x' }],
    });
    expect(verdicts[0]?.reasoning).toMatch(/overlap/);
    expect(verdicts[0]?.reasoning).toMatch(/ground/);
  });
});

describe('applyRubric', () => {
  it('computes weighted score', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { weightedScore } = applyRubric(s, {
      candidateId: 'a',
      criteria: [
        { key: 'accuracy', weight: 0.7, score: 0.9 },
        { key: 'style', weight: 0.3, score: 0.5 },
      ],
    });
    expect(weightedScore).toBeCloseTo(0.78, 2);
  });

  it('throws when criteria empty', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(() => applyRubric(s, { candidateId: 'a', criteria: [] })).toThrow(
      'criteria must not be empty',
    );
  });

  it('throws when total weight is 0', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(() =>
      applyRubric(s, {
        candidateId: 'a',
        criteria: [{ key: 'x', weight: 0, score: 0.5 }],
      }),
    ).toThrow('totalWeight must be positive');
  });

  it('throws when session idle', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    expect(() =>
      applyRubric(s, { candidateId: 'a', criteria: [{ key: 'x', weight: 1, score: 1 }] }),
    ).toThrow('expected judged');
  });
});

describe('rankPreference', () => {
  it('ranks candidates by wins', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { ranking } = rankPreference(s, {
      pairs: [
        { a: 'a', b: 'b', preferred: 'a' },
        { a: 'a', b: 'c', preferred: 'a' },
        { a: 'b', b: 'c', preferred: 'b' },
      ],
    });
    expect(ranking[0]?.id).toBe('a');
  });

  it('counts ties symmetrically', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { ranking } = rankPreference(s, {
      pairs: [{ a: 'a', b: 'b', preferred: 'tie' }],
    });
    expect(ranking.find((r) => r.id === 'a')?.ties).toBe(1);
    expect(ranking.find((r) => r.id === 'b')?.ties).toBe(1);
  });

  it('throws when pairs empty', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(() => rankPreference(s, { pairs: [] })).toThrow('pairs must not be empty');
  });
});

describe('updateElo', () => {
  it('assigns default 1200 rating for new players', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { winnerRating, loserRating } = updateElo(s, { winner: 'a', loser: 'b' });
    expect(winnerRating).toBeGreaterThan(1200);
    expect(loserRating).toBeLessThan(1200);
  });

  it('winner and loser rating sum unchanged (approx)', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { winnerRating, loserRating } = updateElo(s, { winner: 'a', loser: 'b' });
    expect(winnerRating + loserRating).toBeCloseTo(2400, 1);
  });

  it('throws when winner == loser', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(() => updateElo(s, { winner: 'a', loser: 'a' })).toThrow('must differ');
  });

  it('honors custom k factor (larger k moves rating more)', () => {
    const s1 = startEvalSession({ target: 'anthropic', sessionId: 's1' });
    judgeCandidates(s1, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { winnerRating: r32 } = updateElo(s1, { winner: 'a', loser: 'b' });

    const s2 = startEvalSession({ target: 'anthropic', sessionId: 's2' });
    judgeCandidates(s2, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { winnerRating: r100 } = updateElo(s2, { winner: 'a', loser: 'b', k: 100 });
    expect(r100).toBeGreaterThan(r32);
  });

  it('updates ratings map', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    updateElo(s, { winner: 'a', loser: 'b' });
    expect(s.eloRatings.get('a')).toBeGreaterThan(1200);
  });
});

describe('providerEvent dialect', () => {
  it('anthropic dialect appears', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(s.history[0]?.providerEvent).toBe('anthropic.eval.judge');
  });

  it('openai dialect appears', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    expect(s.history[0]?.providerEvent).toBe('openai.eval.judge');
  });
});
