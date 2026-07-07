import { describe, expect, it } from 'vitest';
import {
  applyRubric,
  blockToxicity,
  chunkDocument,
  checkBudget,
  detectInjection,
  detectCatastrophicForgetting,
  engageFallback,
  expandToT,
  evaluateSft,
  evaluateDpo,
  hybridRetrieve,
  judgeCandidates,
  matchRegex,
  measureLatency,
  reactStep,
  reflectAndCorrect,
  rerank,
  routeModel,
  scoreConfidence,
  scoreSelfConsistency,
  selectTool,
  startAgentSession,
  startEvalSession,
  startFtSession,
  startGuardrailSession,
  startHallucinationSession,
  startInjectionSession,
  startRagSession,
  startSlaSession,
  updateElo,
  validateSchema,
} from '../../src/semantics/index.js';

describe('edge — very large inputs', () => {
  it('injection detection handles 100KB input', () => {
    const s = startInjectionSession({ target: 'anthropic', sessionId: 's' });
    const big = 'safe text '.repeat(10000);
    const { detections } = detectInjection(s, big);
    expect(detections).toEqual([]);
  });

  it('rag chunking handles very large document', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    const big = 'a'.repeat(50000);
    const { chunks } = chunkDocument(s, { doc: big, chunkSize: 500, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(50);
  });
});

describe('edge — empty and minimal inputs', () => {
  it('confidence with empty text returns hedgingRatio 0', () => {
    const s = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(s, ['a', 'a']);
    const { hedgingRatio } = scoreConfidence(s, '');
    expect(hedgingRatio).toBe(0);
  });

  it('rag chunking of 1-char doc yields 1 chunk', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    const { chunks } = chunkDocument(s, { doc: 'x', chunkSize: 10, overlap: 0 });
    expect(chunks).toHaveLength(1);
  });

  it('measureLatency with 1 sample returns same value for all percentiles', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 1 });
    const { p50, p95, p99 } = measureLatency(s, [{ requestId: 'r', latencyMs: 50 }]);
    expect(p50).toBe(50);
    expect(p95).toBe(50);
    expect(p99).toBe(50);
  });
});

describe('edge — unicode and non-ascii', () => {
  it('handles japanese text without crash', () => {
    const s = startInjectionSession({ target: 'anthropic', sessionId: 's' });
    const { detections } = detectInjection(s, '東京は日本の首都です');
    expect(detections).toEqual([]);
  });

  it('handles emoji-heavy input without crash', () => {
    const g = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(g, { value: {}, schema: { type: 'object', properties: {} } });
    const { blocked } = blockToxicity(g, { text: '🎉 kiwa 🍓 realtime 🚀' });
    expect(blocked).toBe(false);
  });
});

describe('edge — state machine violation', () => {
  it('rag reranking without hybrid-retrieved throws', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() => rerank(s, { query: 'x', hits: [] })).toThrow();
  });

  it('rubric before judge throws', () => {
    const s = startEvalSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      applyRubric(s, { candidateId: 'a', criteria: [{ key: 'a', weight: 1, score: 1 }] }),
    ).toThrow();
  });

  it('reflect on idle session throws', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() => reflectAndCorrect(s, { output: 'x', critiqueRules: [] })).toThrow();
  });
});

describe('edge — extreme numeric inputs', () => {
  it('budget guard rejects when cost > budget', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 1 });
    const { allowed } = checkBudget(s, { cost: 999 });
    expect(allowed).toBe(false);
  });

  it('elo with extreme k (0) yields no rating change', () => {
    const s = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(s, { prompt: 'x', candidates: [{ id: 'a', text: 'x' }] });
    const { winnerRating, loserRating } = updateElo(s, { winner: 'a', loser: 'b', k: 0 });
    expect(winnerRating).toBe(1200);
    expect(loserRating).toBe(1200);
  });

  it('ToT with depth=1 yields single node', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    const { nodeCount } = expandToT(s, {
      root: { thought: 'r' },
      branches: [{ thought: 'a', score: 1 }],
      depth: 1,
    });
    expect(nodeCount).toBe(1);
  });
});

describe('edge — regex patterns', () => {
  it('matchRegex allow mode with no patterns returns passed=false', () => {
    const g = startGuardrailSession({ target: 'openai', sessionId: 's' });
    validateSchema(g, { value: {}, schema: { type: 'object', properties: {} } });
    const { passed } = matchRegex(g, { text: 'x', patterns: [], mode: 'allow' });
    expect(passed).toBe(false);
  });

  it('matchRegex deny mode with no patterns returns passed=true', () => {
    const g = startGuardrailSession({ target: 'vercel-ai', sessionId: 's' });
    validateSchema(g, { value: {}, schema: { type: 'object', properties: {} } });
    const { passed } = matchRegex(g, { text: 'x', patterns: [], mode: 'deny' });
    expect(passed).toBe(true);
  });
});

describe('edge — hybrid retrieval extreme weights', () => {
  it('dense weight only', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'a b c d', chunkSize: 2, overlap: 0 });
    const { hits } = hybridRetrieve(s, {
      query: 'a',
      denseWeight: 1,
      sparseWeight: 0,
      topK: 2,
    });
    expect(hits.length).toBeGreaterThan(0);
  });

  it('sparse weight only', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'a b c d', chunkSize: 2, overlap: 0 });
    const { hits } = hybridRetrieve(s, {
      query: 'a',
      denseWeight: 0,
      sparseWeight: 1,
      topK: 2,
    });
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe('edge — evaluateDpo tied margin', () => {
  it('tied logp yields margin 0 and accuracy 0', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    const { averageMargin, preferenceAccuracy } = evaluateDpo(s, [
      { prompt: 'x', chosen: 'a', rejected: 'b', chosenLogp: -1, rejectedLogp: -1 },
    ]);
    expect(averageMargin).toBe(0);
    expect(preferenceAccuracy).toBe(0);
  });
});

describe('edge — fallback ladder exhausted', () => {
  it('all models failed yields nextModel null', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    routeModel(s, {
      candidates: [{ model: 'a', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.9 }],
      slaLatencyMs: 500,
      minQuality: 0.5,
    });
    const { nextModel } = engageFallback(s, {
      ladder: ['a', 'b'],
      failed: ['a', 'b'],
    });
    expect(nextModel).toBeNull();
  });
});

describe('edge — routing with all candidates below quality bar', () => {
  it('returns chosen=null when no candidate qualifies', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    const { chosen, considered } = routeModel(s, {
      candidates: [
        { model: 'a', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.3 },
        { model: 'b', costPerCall: 0.02, latencyMs: 200, qualityScore: 0.4 },
      ],
      slaLatencyMs: 500,
      minQuality: 0.5,
    });
    expect(chosen).toBeNull();
    expect(considered).toEqual([]);
  });
});

describe('edge — catastrophic forgetting with no drop', () => {
  it('threshold not met yields no forgotten benchmarks', () => {
    const s = startFtSession({ target: 'openai', sessionId: 's' });
    evaluateSft(s, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    const { forgotten } = detectCatastrophicForgetting(s, {
      baseline: [{ name: 'mmlu', score: 0.7 }],
      postFineTune: [{ name: 'mmlu', score: 0.71 }],
      threshold: 0.1,
    });
    expect(forgotten).toEqual([]);
  });
});

describe('edge — selectTool with empty intent', () => {
  it('empty intent yields null selection', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { selected } = selectTool(s, {
      intent: '',
      candidates: [{ name: 'search', description: 'search' }],
    });
    expect(selected).toBeNull();
  });
});
