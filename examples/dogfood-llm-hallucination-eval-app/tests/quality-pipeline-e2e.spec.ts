/**
 * Full answer-quality pipeline end-to-end fidelity spec (quality-
 * pipeline axis: multi-stage score → judge → verdict).
 *
 * Issue CAR-848 (v1.38-3) AC — {@link runPipeline} composes the
 * hallucination + eval surfaces so a single call takes a candidate
 * answer plus evidence / citations and returns either an accepted
 * verdict or a rejected reason.
 *
 *  1. High-confidence candidate + strong evidence + verified citations →
 *     verdict `accepted`.
 *  2. Divergent samples (low self-consistency) drops the hallucination
 *     score below threshold → verdict `rejected-hallucination`.
 *  3. Unverified citations drop the citation score to 0 →
 *     verdict `rejected-hallucination`.
 *  4. Prompt / candidate token miss drops the judge quality score →
 *     verdict `rejected-low-score`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePipelineRequest,
  validatePipelineRequest,
} from '../src/app/pipeline/route.js';
import type { LlmQualityAdapter } from '../src/adapters/interface.js';

let mock: LlmQualityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — quality pipeline', () => {
  it('axis 1: runPipeline accepts high-quality answer', async () => {
    await mock.startPipeline({ sessionId: 'p1' });
    const r = await mock.runPipeline({
      sessionId: 'p1',
      prompt: 'Paris capital France',
      samples: [
        'Paris is the capital of France',
        'Paris is the capital of France',
      ],
      evidence: [
        'Paris is the capital of France',
        'Paris France capital city',
      ],
      citations: ['wiki-paris', 'wiki-france'],
      corpus: ['wiki-paris', 'wiki-france', 'wiki-europe'],
      candidateId: 'ans-1',
      candidateText: 'Paris is the capital of France',
      minHallucinationScore: 0.3,
      minQualityScore: 0.1,
    });
    expect(r.verdict).toBe('accepted');
    expect(r.rejectedReason).toBe(null);
    expect(r.hallucinationScore).toBeGreaterThan(0);
    expect(r.qualityScore).toBeGreaterThan(0);
    expect(r.findings.some((f) => f.startsWith('self-consistency:'))).toBe(
      true,
    );
    expect(r.findings.some((f) => f.startsWith('factuality:'))).toBe(true);
    expect(r.findings.some((f) => f.startsWith('citation:'))).toBe(true);
    expect(r.findings.some((f) => f.startsWith('confidence:'))).toBe(true);
    expect(r.findings.some((f) => f.startsWith('judge:'))).toBe(true);
  });

  it('axis 2: runPipeline rejects on divergent samples (low self-consistency)', async () => {
    await mock.startPipeline({ sessionId: 'p2' });
    const r = await mock.runPipeline({
      sessionId: 'p2',
      prompt: 'p',
      samples: ['apple banana', 'moon sun', 'red green'],
      evidence: ['Paris'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'Paris',
      minHallucinationScore: 0.5,
    });
    expect(r.verdict).toBe('rejected-hallucination');
    expect(r.rejectedReason).toContain('hallucination:');
    expect(r.qualityScore).toBe(0);
  });

  it('axis 3: runPipeline rejects on unverified citations', async () => {
    await mock.startPipeline({ sessionId: 'p3' });
    const r = await mock.runPipeline({
      sessionId: 'p3',
      prompt: 'p',
      samples: ['Paris capital France', 'Paris capital France'],
      evidence: ['Paris capital France'],
      citations: ['fake-1', 'fake-2'],
      corpus: ['real-a', 'real-b'],
      candidateId: 'ans',
      candidateText: 'Paris capital France',
      minHallucinationScore: 0.5,
    });
    expect(r.verdict).toBe('rejected-hallucination');
    expect(r.rejectedReason).toContain('hallucination:');
  });

  it('axis 4: runPipeline rejects on low judge quality score', async () => {
    await mock.startPipeline({ sessionId: 'p4' });
    const r = await mock.runPipeline({
      sessionId: 'p4',
      prompt: 'apple banana carrot',
      samples: ['xyz uvw', 'xyz uvw'],
      evidence: ['xyz uvw'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'xyz uvw',
      minHallucinationScore: 0.1,
      minQualityScore: 0.9,
    });
    expect(r.verdict).toBe('rejected-low-score');
    expect(r.rejectedReason).toContain('quality:');
  });

  it('runPipeline records latency > 0', async () => {
    await mock.startPipeline({ sessionId: 'p5' });
    const r = await mock.runPipeline({
      sessionId: 'p5',
      prompt: 'x',
      samples: ['x', 'x'],
      evidence: ['x'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'x',
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('runPipeline without startPipeline fails', async () => {
    await expect(
      mock.runPipeline({
        sessionId: 'missing',
        prompt: 'x',
        samples: ['x', 'x'],
        evidence: ['x'],
        citations: ['a'],
        corpus: ['a'],
        candidateId: 'ans',
        candidateText: 'x',
      }),
    ).rejects.toThrow(/no session missing/);
  });

  it('startPipeline twice throws DUPLICATE_SESSION', async () => {
    await mock.startPipeline({ sessionId: 'p6' });
    await expect(
      mock.startPipeline({ sessionId: 'p6' }),
    ).rejects.toThrow(/duplicate session p6/);
  });
});

describe('pipeline route validator', () => {
  it('rejects non-object body', () => {
    const r = validatePipelineRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validatePipelineRequest({ prompt: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects missing prompt', () => {
    const r = validatePipelineRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('prompt_required');
  });

  it('rejects non-array samples', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      prompt: 'p',
      samples: 'nope',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('samples_required');
  });

  it('rejects missing candidateId', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      prompt: 'p',
      samples: ['a', 'b'],
      evidence: ['a'],
      citations: ['a'],
      corpus: ['a'],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('candidateId_required');
  });

  it('accepts a valid pipeline request', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      prompt: 'p',
      samples: ['a', 'b'],
      evidence: ['a'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'ans',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.candidateId).toBe('ans');
  });

  it('accepts optional threshold overrides', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      prompt: 'p',
      samples: ['a', 'b'],
      evidence: ['a'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'ans',
      minHallucinationScore: 0.4,
      minQualityScore: 0.5,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.minHallucinationScore).toBe(0.4);
      expect(r.value.minQualityScore).toBe(0.5);
    }
  });
});

describe('pipeline route handler', () => {
  it('handles a full pipeline request via mock', async () => {
    await mock.startPipeline({ sessionId: 'h1' });
    const res = await handlePipelineRequest(mock, {
      sessionId: 'h1',
      prompt: 'Paris capital France',
      samples: ['Paris capital France', 'Paris capital France'],
      evidence: ['Paris capital France'],
      citations: ['wiki'],
      corpus: ['wiki'],
      candidateId: 'ans',
      candidateText: 'Paris capital France',
    });
    expect(res.ok).toBe(true);
    expect(res.result?.verdict).toBe('accepted');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handlePipelineRequest(mock, {
      sessionId: 'nope',
      prompt: 'x',
      samples: ['x', 'x'],
      evidence: ['x'],
      citations: ['a'],
      corpus: ['a'],
      candidateId: 'ans',
      candidateText: 'x',
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
