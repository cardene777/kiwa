/**
 * LLM eval end-to-end fidelity spec (llm-eval axis: LLM-as-judge +
 * rubric + preference + Elo + human-in-the-loop).
 *
 * Issue CAR-848 (v1.38-3) AC — the mock adapter drives a full LLM eval
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. judgeCandidates returns per-candidate verdicts scored on the
 *     overlap between prompt / candidate / ground truth.
 *  2. applyRubric returns a weighted average across per-criterion
 *     scores — heavier weights bias the composite score.
 *  3. rankPreference returns a wins / losses / ties table across
 *     pairwise comparisons.
 *  4. updateElo returns updated Elo ratings using the standard 400-scale
 *     expectation formula.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleEvalRequest,
  validateEvalRequest,
} from '../src/app/eval/route.js';
import type { LlmQualityAdapter } from '../src/adapters/interface.js';

let mock: LlmQualityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — judge candidates', () => {
  it('axis 1: judgeCandidates returns one verdict per candidate', async () => {
    await mock.startEval({ sessionId: 'j1' });
    const r = await mock.judgeCandidates({
      sessionId: 'j1',
      prompt: 'What is the capital of France?',
      candidates: [
        { id: 'a', text: 'Paris' },
        { id: 'b', text: 'Berlin' },
        { id: 'c', text: 'Tokyo' },
      ],
    });
    expect(r.verdicts.length).toBe(3);
    expect(r.verdicts.map((v) => v.candidateId).sort()).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('axis 1: judgeCandidates ranks overlapping candidate higher', async () => {
    await mock.startEval({ sessionId: 'j2' });
    const r = await mock.judgeCandidates({
      sessionId: 'j2',
      prompt: 'apple banana carrot',
      candidates: [
        { id: 'match', text: 'apple banana carrot' },
        { id: 'miss', text: 'xyz uvw rst' },
      ],
    });
    const match = r.verdicts.find((v) => v.candidateId === 'match');
    const miss = r.verdicts.find((v) => v.candidateId === 'miss');
    expect(match!.score).toBeGreaterThan(miss!.score);
  });

  it('axis 1: judgeCandidates topScore matches max verdict', async () => {
    await mock.startEval({ sessionId: 'j3' });
    const r = await mock.judgeCandidates({
      sessionId: 'j3',
      prompt: 'foo',
      candidates: [
        { id: 'a', text: 'foo' },
        { id: 'b', text: 'bar' },
      ],
    });
    expect(r.topScore).toBe(Math.max(...r.verdicts.map((v) => v.score)));
  });

  it('axis 1: judgeCandidates ground truth bonus lifts the score', async () => {
    await mock.startEval({ sessionId: 'j4' });
    const r = await mock.judgeCandidates({
      sessionId: 'j4',
      prompt: 'x',
      candidates: [
        { id: 'no-gt', text: 'answer' },
        { id: 'has-gt', text: 'answer', groundTruth: 'answer' },
      ],
    });
    const noGt = r.verdicts.find((v) => v.candidateId === 'no-gt');
    const hasGt = r.verdicts.find((v) => v.candidateId === 'has-gt');
    expect(hasGt!.score).toBeGreaterThanOrEqual(noGt!.score);
  });

  it('axis 1: judgeCandidates requires at least 1 candidate', async () => {
    await mock.startEval({ sessionId: 'j5' });
    await expect(
      mock.judgeCandidates({
        sessionId: 'j5',
        prompt: 'p',
        candidates: [],
      }),
    ).rejects.toThrow(/candidates must not be empty/);
  });

  it('axis 1: judgeCandidates without startEval fails', async () => {
    await expect(
      mock.judgeCandidates({
        sessionId: 'nope',
        prompt: 'x',
        candidates: [{ id: 'a', text: 'a' }],
      }),
    ).rejects.toThrow(/no session nope/);
  });
});

describe('mock adapter — rubric application', () => {
  it('axis 2: applyRubric returns weighted average across criteria', async () => {
    await mock.startEval({ sessionId: 'r1' });
    await mock.judgeCandidates({
      sessionId: 'r1',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.applyRubric({
      sessionId: 'r1',
      candidateId: 'c',
      criteria: [
        { key: 'accuracy', weight: 3, score: 1.0 },
        { key: 'style', weight: 1, score: 0.0 },
      ],
    });
    expect(r.weightedScore).toBeCloseTo(0.75, 2);
    expect(r.criteriaCount).toBe(2);
  });

  it('axis 2: applyRubric weight bias skews composite', async () => {
    await mock.startEval({ sessionId: 'r2' });
    await mock.judgeCandidates({
      sessionId: 'r2',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.applyRubric({
      sessionId: 'r2',
      candidateId: 'c',
      criteria: [
        { key: 'a', weight: 1, score: 0 },
        { key: 'b', weight: 9, score: 1 },
      ],
    });
    expect(r.weightedScore).toBeCloseTo(0.9, 2);
  });

  it('axis 2: applyRubric requires prior judge step', async () => {
    await mock.startEval({ sessionId: 'r3' });
    await expect(
      mock.applyRubric({
        sessionId: 'r3',
        candidateId: 'c',
        criteria: [{ key: 'a', weight: 1, score: 1 }],
      }),
    ).rejects.toThrow(/expected judged/);
  });

  it('axis 2: applyRubric requires non-empty criteria', async () => {
    await mock.startEval({ sessionId: 'r4' });
    await mock.judgeCandidates({
      sessionId: 'r4',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    await expect(
      mock.applyRubric({
        sessionId: 'r4',
        candidateId: 'c',
        criteria: [],
      }),
    ).rejects.toThrow(/criteria must not be empty/);
  });
});

describe('mock adapter — preference ranking', () => {
  it('axis 3: rankPreference tallies wins and losses correctly', async () => {
    await mock.startEval({ sessionId: 'p1' });
    await mock.judgeCandidates({
      sessionId: 'p1',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.rankPreference({
      sessionId: 'p1',
      pairs: [
        { a: 'x', b: 'y', preferred: 'a' },
        { a: 'x', b: 'z', preferred: 'a' },
        { a: 'y', b: 'z', preferred: 'b' },
      ],
    });
    const x = r.ranking.find((e) => e.id === 'x');
    const y = r.ranking.find((e) => e.id === 'y');
    const z = r.ranking.find((e) => e.id === 'z');
    expect(x!.wins).toBe(2);
    expect(y!.losses).toBe(2);
    expect(z!.wins).toBe(1);
  });

  it('axis 3: rankPreference records ties correctly', async () => {
    await mock.startEval({ sessionId: 'p2' });
    await mock.judgeCandidates({
      sessionId: 'p2',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.rankPreference({
      sessionId: 'p2',
      pairs: [{ a: 'x', b: 'y', preferred: 'tie' }],
    });
    const x = r.ranking.find((e) => e.id === 'x');
    expect(x!.ties).toBe(1);
  });

  it('axis 3: rankPreference sorts by wins descending', async () => {
    await mock.startEval({ sessionId: 'p3' });
    await mock.judgeCandidates({
      sessionId: 'p3',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.rankPreference({
      sessionId: 'p3',
      pairs: [
        { a: 'A', b: 'B', preferred: 'a' },
        { a: 'A', b: 'C', preferred: 'a' },
        { a: 'B', b: 'C', preferred: 'a' },
      ],
    });
    expect(r.ranking[0]?.id).toBe('A');
  });

  it('axis 3: rankPreference requires non-empty pairs', async () => {
    await mock.startEval({ sessionId: 'p4' });
    await mock.judgeCandidates({
      sessionId: 'p4',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    await expect(
      mock.rankPreference({ sessionId: 'p4', pairs: [] }),
    ).rejects.toThrow(/pairs must not be empty/);
  });
});

describe('mock adapter — Elo update', () => {
  it('axis 4: updateElo raises winner rating above 1200 baseline', async () => {
    await mock.startEval({ sessionId: 'e1' });
    await mock.judgeCandidates({
      sessionId: 'e1',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.updateElo({
      sessionId: 'e1',
      winner: 'alice',
      loser: 'bob',
    });
    expect(r.winnerRating).toBeGreaterThan(1200);
    expect(r.loserRating).toBeLessThan(1200);
  });

  it('axis 4: updateElo winner + loser deltas sum to zero', async () => {
    await mock.startEval({ sessionId: 'e2' });
    await mock.judgeCandidates({
      sessionId: 'e2',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const r = await mock.updateElo({
      sessionId: 'e2',
      winner: 'a',
      loser: 'b',
      k: 32,
    });
    const winnerDelta = r.winnerRating - 1200;
    const loserDelta = r.loserRating - 1200;
    expect(winnerDelta + loserDelta).toBeCloseTo(0, 6);
  });

  it('axis 4: updateElo custom k widens the delta', async () => {
    await mock.startEval({ sessionId: 'e3' });
    await mock.judgeCandidates({
      sessionId: 'e3',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const rk32 = await mock.updateElo({
      sessionId: 'e3',
      winner: 'a',
      loser: 'b',
      k: 32,
    });
    await mock.reset();
    mock = makeMockAdapter({ latencyMs: 1 });
    await mock.startEval({ sessionId: 'e3b' });
    await mock.judgeCandidates({
      sessionId: 'e3b',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    const rk64 = await mock.updateElo({
      sessionId: 'e3b',
      winner: 'a',
      loser: 'b',
      k: 64,
    });
    expect(rk64.winnerRating - 1200).toBeGreaterThan(rk32.winnerRating - 1200);
  });

  it('axis 4: updateElo winner === loser fails', async () => {
    await mock.startEval({ sessionId: 'e4' });
    await mock.judgeCandidates({
      sessionId: 'e4',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    await expect(
      mock.updateElo({ sessionId: 'e4', winner: 'x', loser: 'x' }),
    ).rejects.toThrow(/must differ/);
  });
});

describe('mock adapter — eval close + trace', () => {
  it('axis 5: closeEval records history length', async () => {
    await mock.startEval({ sessionId: 't1' });
    await mock.judgeCandidates({
      sessionId: 't1',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    await mock.closeEval({ sessionId: 't1' });
    const trace = mock.traces().find((e) => e.op === 'closeEval');
    expect(trace?.ok).toBe(true);
    expect(
      (trace?.detail as { historyLength?: number })?.historyLength,
    ).toBeGreaterThan(0);
  });

  it('axis 5: full ceremony records ordered ops', async () => {
    await mock.startEval({ sessionId: 't2' });
    await mock.judgeCandidates({
      sessionId: 't2',
      prompt: 'x',
      candidates: [{ id: 'c', text: 'c' }],
    });
    await mock.applyRubric({
      sessionId: 't2',
      candidateId: 'c',
      criteria: [{ key: 'a', weight: 1, score: 1 }],
    });
    await mock.closeEval({ sessionId: 't2' });
    const ops = mock.traces().map((e) => e.op);
    expect(ops).toEqual([
      'startEval',
      'judgeCandidates',
      'applyRubric',
      'closeEval',
    ]);
  });

  it('axis 5: startEval twice throws DUPLICATE_SESSION', async () => {
    await mock.startEval({ sessionId: 't3' });
    await expect(mock.startEval({ sessionId: 't3' })).rejects.toThrow(
      /duplicate session t3/,
    );
  });
});

describe('eval route validator', () => {
  it('rejects non-object body', () => {
    const r = validateEvalRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validateEvalRequest({ kind: 'judgeCandidates' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects invalid kind', () => {
    const r = validateEvalRequest({ sessionId: 's', kind: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('kind_must_be_valid_op');
  });

  it('rejects missing prompt for judge', () => {
    const r = validateEvalRequest({
      sessionId: 's',
      kind: 'judgeCandidates',
      candidates: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('prompt_required');
  });

  it('rejects missing candidateId for rubric', () => {
    const r = validateEvalRequest({
      sessionId: 's',
      kind: 'applyRubric',
      criteria: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('candidateId_required');
  });

  it('rejects missing pairs for preference', () => {
    const r = validateEvalRequest({
      sessionId: 's',
      kind: 'rankPreference',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('pairs_required');
  });

  it('rejects missing winner for updateElo', () => {
    const r = validateEvalRequest({
      sessionId: 's',
      kind: 'updateElo',
      loser: 'b',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('winner_required');
  });

  it('accepts valid judge request', () => {
    const r = validateEvalRequest({
      sessionId: 's',
      kind: 'judgeCandidates',
      prompt: 'p',
      candidates: [{ id: 'a', text: 'a' }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('judgeCandidates');
  });
});

describe('eval route handler', () => {
  it('handles judgeCandidates end-to-end via mock', async () => {
    await mock.startEval({ sessionId: 'h1' });
    const res = await handleEvalRequest(mock, {
      sessionId: 'h1',
      kind: 'judgeCandidates',
      prompt: 'x',
      candidates: [{ id: 'a', text: 'a' }],
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('judgeCandidates');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleEvalRequest(mock, {
      sessionId: 'nope',
      kind: 'judgeCandidates',
      prompt: 'x',
      candidates: [{ id: 'a', text: 'a' }],
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
