/**
 * Hallucination detection end-to-end fidelity spec (hallucination axis:
 * self-consistency + factuality + citation + confidence + hedging).
 *
 * Issue CAR-848 (v1.38-3) AC — the mock adapter drives a full
 * hallucination detection ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. scoreSelfConsistency returns a Jaccard-based score across LLM
 *     samples — matching samples → high score, divergent samples → low.
 *  2. checkFactuality returns a score based on how many evidence rows
 *     back the claim, plus the matching rows.
 *  3. verifyCitation returns a score based on how many citations exist
 *     in the corpus, plus the missing ones.
 *  4. scoreConfidence returns a score inverse to hedging language
 *     density ("maybe" / "might" / "perhaps" / etc.).
 *  5. traces record ordered ops with detail payloads suitable for the
 *     fidelity harness.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_LLM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link LlmQualityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleHallucinationRequest,
  validateHallucinationRequest,
} from '../src/app/hallucination/route.js';
import type { LlmQualityAdapter } from '../src/adapters/interface.js';

let mock: LlmQualityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — self-consistency scoring', () => {
  it('axis 1: scoreSelfConsistency returns high score for identical samples', async () => {
    await mock.startHallucination({ sessionId: 's1' });
    const r = await mock.scoreSelfConsistency({
      sessionId: 's1',
      samples: [
        'Paris is the capital of France',
        'Paris is the capital of France',
        'Paris is the capital of France',
      ],
    });
    expect(r.score).toBeGreaterThan(0.9);
    expect(r.sampleCount).toBe(3);
  });

  it('axis 1: scoreSelfConsistency returns low score for divergent samples', async () => {
    await mock.startHallucination({ sessionId: 's2' });
    const r = await mock.scoreSelfConsistency({
      sessionId: 's2',
      samples: ['apple banana carrot', 'moon sun star', 'red green blue'],
    });
    expect(r.score).toBeLessThan(0.3);
  });

  it('axis 1: scoreSelfConsistency returns partial score for mixed samples', async () => {
    await mock.startHallucination({ sessionId: 's3' });
    const r = await mock.scoreSelfConsistency({
      sessionId: 's3',
      samples: [
        'Paris is the capital of France',
        'The capital of France is Paris',
        'France capital Paris',
      ],
    });
    expect(r.score).toBeGreaterThan(0.3);
    expect(r.score).toBeLessThanOrEqual(1);
  });

  it('axis 1: scoreSelfConsistency requires at least 2 samples', async () => {
    await mock.startHallucination({ sessionId: 's4' });
    await expect(
      mock.scoreSelfConsistency({ sessionId: 's4', samples: ['only-one'] }),
    ).rejects.toThrow(/at least 2 samples/);
  });

  it('axis 1: scoreSelfConsistency reports latency > 0', async () => {
    await mock.startHallucination({ sessionId: 's5' });
    const r = await mock.scoreSelfConsistency({
      sessionId: 's5',
      samples: ['x y z', 'x y z'],
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('axis 1: scoreSelfConsistency without startHallucination fails', async () => {
    await expect(
      mock.scoreSelfConsistency({ sessionId: 'missing', samples: ['a', 'b'] }),
    ).rejects.toThrow(/no session missing/);
  });
});

describe('mock adapter — factuality checking', () => {
  it('axis 2: checkFactuality returns high score for backed claim', async () => {
    await mock.startHallucination({ sessionId: 'f1' });
    await mock.scoreSelfConsistency({
      sessionId: 'f1',
      samples: ['seed a', 'seed b'],
    });
    const r = await mock.checkFactuality({
      sessionId: 'f1',
      claim: 'Paris is the capital of France',
      evidence: [
        'Paris is the capital of France',
        'Paris France capital city',
      ],
    });
    expect(r.score).toBeGreaterThan(0.5);
    expect(r.matchCount).toBeGreaterThan(0);
  });

  it('axis 2: checkFactuality returns low score for unbacked claim', async () => {
    await mock.startHallucination({ sessionId: 'f2' });
    await mock.scoreSelfConsistency({
      sessionId: 'f2',
      samples: ['seed a', 'seed b'],
    });
    const r = await mock.checkFactuality({
      sessionId: 'f2',
      claim: 'Zebra planet orbits Neptune',
      evidence: ['Paris is a city', 'Water is wet', 'Sun rises east'],
    });
    expect(r.score).toBeLessThan(0.3);
  });

  it('axis 2: checkFactuality returns match rows in matches array', async () => {
    await mock.startHallucination({ sessionId: 'f3' });
    await mock.scoreSelfConsistency({
      sessionId: 'f3',
      samples: ['seed a', 'seed b'],
    });
    const r = await mock.checkFactuality({
      sessionId: 'f3',
      claim: 'Paris capital France',
      evidence: [
        'Paris capital of France',
        'random unrelated text about cats',
      ],
    });
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches[0]).toContain('Paris');
  });

  it('axis 2: checkFactuality without prior scoreSelfConsistency fails', async () => {
    await mock.startHallucination({ sessionId: 'f4' });
    await expect(
      mock.checkFactuality({
        sessionId: 'f4',
        claim: 'x',
        evidence: ['y'],
      }),
    ).rejects.toThrow(/self-consistency first/);
  });

  it('axis 2: checkFactuality requires non-empty evidence', async () => {
    await mock.startHallucination({ sessionId: 'f5' });
    await mock.scoreSelfConsistency({
      sessionId: 'f5',
      samples: ['a', 'b'],
    });
    await expect(
      mock.checkFactuality({ sessionId: 'f5', claim: 'x', evidence: [] }),
    ).rejects.toThrow(/evidence must not be empty/);
  });
});

describe('mock adapter — citation verification', () => {
  it('axis 3: verifyCitation returns high score when all citations exist', async () => {
    await mock.startHallucination({ sessionId: 'c1' });
    await mock.scoreSelfConsistency({
      sessionId: 'c1',
      samples: ['seed', 'seed'],
    });
    const r = await mock.verifyCitation({
      sessionId: 'c1',
      citations: ['doc-a', 'doc-b'],
      corpus: ['doc-a', 'doc-b', 'doc-c'],
    });
    expect(r.score).toBe(1);
    expect(r.verifiedCount).toBe(2);
    expect(r.missing).toEqual([]);
  });

  it('axis 3: verifyCitation returns low score when citations missing', async () => {
    await mock.startHallucination({ sessionId: 'c2' });
    await mock.scoreSelfConsistency({
      sessionId: 'c2',
      samples: ['seed', 'seed'],
    });
    const r = await mock.verifyCitation({
      sessionId: 'c2',
      citations: ['doc-x', 'doc-y', 'doc-z'],
      corpus: ['doc-a', 'doc-b'],
    });
    expect(r.score).toBe(0);
    expect(r.missing.length).toBe(3);
  });

  it('axis 3: verifyCitation returns partial score for mixed hits', async () => {
    await mock.startHallucination({ sessionId: 'c3' });
    await mock.scoreSelfConsistency({
      sessionId: 'c3',
      samples: ['seed', 'seed'],
    });
    const r = await mock.verifyCitation({
      sessionId: 'c3',
      citations: ['doc-a', 'doc-x'],
      corpus: ['doc-a', 'doc-b'],
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(1);
    expect(r.missing).toEqual(['doc-x']);
  });

  it('axis 3: verifyCitation requires prior factuality or self-consistency check', async () => {
    await mock.startHallucination({ sessionId: 'c4' });
    await expect(
      mock.verifyCitation({
        sessionId: 'c4',
        citations: ['a'],
        corpus: ['a'],
      }),
    ).rejects.toThrow(/session is idle/);
  });

  it('axis 3: verifyCitation requires non-empty citations', async () => {
    await mock.startHallucination({ sessionId: 'c5' });
    await mock.scoreSelfConsistency({
      sessionId: 'c5',
      samples: ['a', 'b'],
    });
    await expect(
      mock.verifyCitation({
        sessionId: 'c5',
        citations: [],
        corpus: ['a'],
      }),
    ).rejects.toThrow(/citations must not be empty/);
  });
});

describe('mock adapter — confidence scoring', () => {
  it('axis 4: scoreConfidence returns high score for confident language', async () => {
    await mock.startHallucination({ sessionId: 'cf1' });
    await mock.scoreSelfConsistency({
      sessionId: 'cf1',
      samples: ['seed', 'seed'],
    });
    const r = await mock.scoreConfidence({
      sessionId: 'cf1',
      text: 'The answer is definitely correct and clear',
    });
    expect(r.score).toBeGreaterThan(0.9);
    expect(r.hedgeCount).toBe(0);
  });

  it('axis 4: scoreConfidence returns low score for hedging language', async () => {
    await mock.startHallucination({ sessionId: 'cf2' });
    await mock.scoreSelfConsistency({
      sessionId: 'cf2',
      samples: ['seed', 'seed'],
    });
    const r = await mock.scoreConfidence({
      sessionId: 'cf2',
      text: 'maybe might perhaps possibly could may',
    });
    expect(r.score).toBeLessThan(0.3);
    expect(r.hedgeCount).toBeGreaterThan(0);
  });

  it('axis 4: scoreConfidence returns hedgingRatio', async () => {
    await mock.startHallucination({ sessionId: 'cf3' });
    await mock.scoreSelfConsistency({
      sessionId: 'cf3',
      samples: ['seed', 'seed'],
    });
    const r = await mock.scoreConfidence({
      sessionId: 'cf3',
      text: 'this maybe works',
    });
    expect(r.hedgingRatio).toBeGreaterThan(0);
    expect(r.hedgingRatio).toBeLessThan(1);
  });

  it('axis 4: scoreConfidence without prior op fails', async () => {
    await mock.startHallucination({ sessionId: 'cf4' });
    await expect(
      mock.scoreConfidence({ sessionId: 'cf4', text: 'x' }),
    ).rejects.toThrow(/run other checks first/);
  });
});

describe('mock adapter — hallucination close + trace', () => {
  it('axis 5: closeHallucination records history length', async () => {
    await mock.startHallucination({ sessionId: 't1' });
    await mock.scoreSelfConsistency({
      sessionId: 't1',
      samples: ['a', 'b'],
    });
    await mock.closeHallucination({ sessionId: 't1' });
    const trace = mock.traces().find((e) => e.op === 'closeHallucination');
    expect(trace?.ok).toBe(true);
    expect(
      (trace?.detail as { historyLength?: number })?.historyLength,
    ).toBeGreaterThan(0);
  });

  it('axis 5: full ceremony records ordered ops', async () => {
    await mock.startHallucination({ sessionId: 't2' });
    await mock.scoreSelfConsistency({
      sessionId: 't2',
      samples: ['a b c', 'a b c'],
    });
    await mock.checkFactuality({
      sessionId: 't2',
      claim: 'a b c',
      evidence: ['a b c'],
    });
    await mock.closeHallucination({ sessionId: 't2' });
    const ops = mock.traces().map((e) => e.op);
    expect(ops).toEqual([
      'startHallucination',
      'scoreSelfConsistency',
      'checkFactuality',
      'closeHallucination',
    ]);
  });

  it('axis 5: startHallucination twice throws DUPLICATE_SESSION', async () => {
    await mock.startHallucination({ sessionId: 't3' });
    await expect(
      mock.startHallucination({ sessionId: 't3' }),
    ).rejects.toThrow(/duplicate session t3/);
  });
});

describe('real adapter — refuses without KIWA_MODE=real', () => {
  const originalMode = process.env['KIWA_MODE'];
  const originalKey = process.env['OPENAI_API_KEY'];
  const originalBudget = process.env['KIWA_LLM_BUDGET_USD'];

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env['KIWA_MODE'];
    } else {
      process.env['KIWA_MODE'] = originalMode;
    }
    if (originalKey === undefined) {
      delete process.env['OPENAI_API_KEY'];
    } else {
      process.env['OPENAI_API_KEY'] = originalKey;
    }
    if (originalBudget === undefined) {
      delete process.env['KIWA_LLM_BUDGET_USD'];
    } else {
      process.env['KIWA_LLM_BUDGET_USD'] = originalBudget;
    }
  });

  it('default env reports KIWA_LLM_ENV_MISSING', () => {
    delete process.env['KIWA_MODE'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('KIWA_MODE=mock reports KIWA_MODE=mock', () => {
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('KIWA_MODE=real without key reports OPENAI_API_KEY_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    delete process.env['OPENAI_API_KEY'];
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('OPENAI_API_KEY_MISSING');
  });

  it('KIWA_MODE=real with key but no budget reports KIWA_LLM_BUDGET_USD_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['OPENAI_API_KEY'] = 'sk-test';
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_MISSING');
  });

  it('KIWA_MODE=real with invalid budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['OPENAI_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = 'not-a-number';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('KIWA_MODE=real with zero budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['OPENAI_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '0';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('all env set returns null (real available)', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['OPENAI_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '10';
    expect(detectRealEnvMissing()).toBe(null);
  });

  it('real adapter scoreSelfConsistency refuses with env missing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await expect(
      real.scoreSelfConsistency({ sessionId: 'x', samples: ['a', 'b'] }),
    ).rejects.toThrow(/KIWA_LLM_ENV_MISSING/);
    const trace = real.traces().find((t) => t.op === 'scoreSelfConsistency');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('real adapter startHallucination records refusal without throwing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await real.startHallucination({ sessionId: 'x' });
    const trace = real.traces().find((t) => t.op === 'startHallucination');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });
});

describe('hallucination route validator', () => {
  it('rejects non-object body', () => {
    const r = validateHallucinationRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validateHallucinationRequest({
      kind: 'scoreSelfConsistency',
      samples: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects invalid kind', () => {
    const r = validateHallucinationRequest({
      sessionId: 's',
      kind: 'nope',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('kind_must_be_valid_op');
  });

  it('rejects missing samples for self-consistency', () => {
    const r = validateHallucinationRequest({
      sessionId: 's',
      kind: 'scoreSelfConsistency',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('samples_required');
  });

  it('rejects missing claim for factuality', () => {
    const r = validateHallucinationRequest({
      sessionId: 's',
      kind: 'checkFactuality',
      evidence: ['x'],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('claim_required');
  });

  it('accepts valid scoreSelfConsistency request', () => {
    const r = validateHallucinationRequest({
      sessionId: 's',
      kind: 'scoreSelfConsistency',
      samples: ['a', 'b'],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('scoreSelfConsistency');
  });
});

describe('hallucination route handler', () => {
  it('handles scoreSelfConsistency end-to-end via mock', async () => {
    await mock.startHallucination({ sessionId: 'h1' });
    const res = await handleHallucinationRequest(mock, {
      sessionId: 'h1',
      kind: 'scoreSelfConsistency',
      samples: ['same', 'same'],
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('scoreSelfConsistency');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleHallucinationRequest(mock, {
      sessionId: 'nope',
      kind: 'scoreSelfConsistency',
      samples: ['a', 'b'],
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
