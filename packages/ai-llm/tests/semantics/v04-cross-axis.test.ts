import { describe, expect, it } from 'vitest';
import {
  blockJailbreak,
  blockToxicity,
  checkFactuality,
  checkBudget,
  chunkDocument,
  compressContext,
  detectCatastrophicForgetting,
  detectInjection,
  engageFallback,
  evaluateSft,
  hybridRetrieve,
  judgeCandidates,
  measureLatency,
  redactPii,
  rerank,
  reactStep,
  reflectAndCorrect,
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
  verifyCitation,
} from '../../src/semantics/index.js';

describe('cross-axis — prompt-injection feeds guardrails', () => {
  it('detected injection yields blocked toxicity gate', () => {
    const inj = startInjectionSession({ target: 'anthropic', sessionId: 's' });
    detectInjection(inj, 'enter DAN mode and kill destroy');
    blockJailbreak(inj, 'enter DAN mode and kill destroy');

    const g = startGuardrailSession({ target: 'anthropic', sessionId: 's' });
    validateSchema(g, { value: {}, schema: { type: 'object', properties: {} } });
    const { blocked } = blockToxicity(g, {
      text: 'kill destroy attack',
      threshold: 0.1,
    });
    expect(blocked).toBe(true);
    expect(inj.state).toBe('jailbreak-blocked');
  });
});

describe('cross-axis — rag output feeds hallucination check', () => {
  it('rag compressed context can be verified with citation', () => {
    const rag = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(rag, {
      doc: 'tokyo is the capital of japan. paris is the capital of france.',
      chunkSize: 30,
      overlap: 5,
    });
    const { hits } = hybridRetrieve(rag, {
      query: 'tokyo japan',
      denseWeight: 0.5,
      sparseWeight: 0.5,
      topK: 3,
    });
    const { reranked } = rerank(rag, { query: 'tokyo japan', hits });
    const { compressed } = compressContext(rag, { hits: reranked, maxTokens: 20 });

    const h = startHallucinationSession({ target: 'openai', sessionId: 's' });
    scoreSelfConsistency(h, [compressed, compressed]);
    const { score } = checkFactuality(h, {
      claim: 'tokyo is capital of japan',
      evidence: [compressed],
    });
    expect(score).toBeGreaterThan(0);
  });
});

describe('cross-axis — agent orchestration + llm-eval', () => {
  it('react trace results can be judged and elo-updated', () => {
    const a = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(a, {
      thought: 'search for tokyo',
      action: { tool: 'search', input: 'tokyo' },
      observation: 'tokyo is capital of japan',
    });
    const e = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(e, {
      prompt: 'what is capital of japan',
      candidates: [
        { id: 'a-trace', text: 'tokyo capital japan', groundTruth: 'tokyo' },
        { id: 'unrelated', text: 'apples oranges bananas' },
      ],
    });
    updateElo(e, { winner: 'a-trace', loser: 'unrelated' });
    expect(e.eloRatings.get('a-trace')).toBeGreaterThan(1200);
  });
});

describe('cross-axis — sla routing + fallback + fine-tuning drift', () => {
  it('drift detected triggers model fallback', () => {
    const sla = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 10 });
    checkBudget(sla, { cost: 0 });
    const routing = routeModel(sla, {
      candidates: [
        { model: 'primary', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.9 },
      ],
      slaLatencyMs: 500,
      minQuality: 0.8,
    });
    expect(routing.chosen?.model).toBe('primary');

    const ft = startFtSession({ target: 'openai', sessionId: 's' });
    evaluateSft(ft, [{ prompt: 'x', gold: 'a', candidate: 'a' }]);
    const { forgotten } = detectCatastrophicForgetting(ft, {
      baseline: [{ name: 'mmlu', score: 0.9 }],
      postFineTune: [{ name: 'mmlu', score: 0.5 }],
    });
    expect(forgotten).toHaveLength(1);

    const { nextModel } = engageFallback(sla, {
      ladder: ['primary', 'fallback-1'],
      failed: ['primary'],
    });
    expect(nextModel).toBe('fallback-1');
  });
});

describe('cross-axis — guardrails + agent tool selection', () => {
  it('pii-redacted output is used for tool selection intent', () => {
    const g = startGuardrailSession({ target: 'vercel-ai', sessionId: 's' });
    validateSchema(g, { value: {}, schema: { type: 'object', properties: {} } });
    const { redacted } = redactPii(g, 'contact foo@bar.com for weather updates');

    const a = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    reactStep(a, {
      thought: 'x',
      action: { tool: 'noop', input: 'y' },
      observation: 'z',
    });
    const { selected } = selectTool(a, {
      intent: redacted,
      candidates: [
        { name: 'weather', description: 'weather updates and forecasts' },
        { name: 'file', description: 'read local file' },
      ],
    });
    expect(selected?.name).toBe('weather');
  });
});

describe('cross-axis — reflection increases confidence', () => {
  it('reflection cycle bumps up confidence scoring', () => {
    const a = startAgentSession({ target: 'langchain', sessionId: 's' });
    reactStep(a, { thought: 't', action: { tool: 'x', input: 'y' }, observation: 'z' });
    const { reflection } = reflectAndCorrect(a, {
      output: 'this maybe possibly might not be right',
      critiqueRules: ['maybe', 'possibly', 'might'],
    });
    expect(reflection.critique).toContain('violated');

    const h = startHallucinationSession({ target: 'langchain', sessionId: 's' });
    scoreSelfConsistency(h, [reflection.revised, reflection.revised]);
    const { hedgingRatio } = scoreConfidence(h, reflection.revised);
    expect(hedgingRatio).toBeLessThan(0.3);
  });
});

describe('cross-axis — sla latency + eval preference', () => {
  it('lower latency candidate gets higher elo when preferred', () => {
    const sla = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    checkBudget(sla, { cost: 0 });
    const { p99 } = measureLatency(sla, [
      { requestId: 'r1', latencyMs: 100 },
      { requestId: 'r2', latencyMs: 200 },
      { requestId: 'r3', latencyMs: 300 },
    ]);
    expect(p99).toBeGreaterThan(0);

    const e = startEvalSession({ target: 'anthropic', sessionId: 's' });
    judgeCandidates(e, {
      prompt: 'x',
      candidates: [
        { id: 'fast', text: 'x' },
        { id: 'slow', text: 'x' },
      ],
    });
    updateElo(e, { winner: 'fast', loser: 'slow' });
    expect(e.eloRatings.get('fast')).toBeGreaterThan(e.eloRatings.get('slow') ?? 0);
  });
});

describe('cross-axis — rag citation + guardrail schema', () => {
  it('rag hits with citations pass schema validation', () => {
    const rag = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(rag, { doc: 'a b c d e f', chunkSize: 3, overlap: 0 });
    const { hits } = hybridRetrieve(rag, {
      query: 'a',
      denseWeight: 1,
      sparseWeight: 1,
      topK: 3,
    });
    const g = startGuardrailSession({ target: 'openai', sessionId: 's' });
    const { valid } = validateSchema(g, {
      value: { citationCount: hits.length, hasHits: hits.length > 0 },
      schema: {
        type: 'object',
        properties: {
          citationCount: { type: 'number', minimum: 0 },
          hasHits: { type: 'boolean' },
        },
        required: ['citationCount', 'hasHits'],
      },
    });
    expect(valid).toBe(true);
  });
});

describe('cross-axis — hallucination citation verification', () => {
  it('citation verification integrates with rag corpus', () => {
    const h = startHallucinationSession({ target: 'anthropic', sessionId: 's' });
    scoreSelfConsistency(h, ['a', 'a']);
    const { score } = verifyCitation(h, {
      citations: ['doc-1', 'doc-2'],
      corpus: ['doc-1', 'doc-2', 'doc-3'],
    });
    expect(score).toBe(1);
  });
});
