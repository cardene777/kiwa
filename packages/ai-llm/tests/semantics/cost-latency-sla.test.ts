import { describe, expect, it } from 'vitest';
import {
  checkBudget,
  engageFallback,
  measureLatency,
  routeModel,
  startSlaSession,
} from '../../src/semantics/index.js';

describe('startSlaSession', () => {
  it('creates session with budget and 0 spent', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    expect(s.budgetUsd).toBe(10);
    expect(s.spent).toBe(0);
    expect(s.state).toBe('idle');
  });

  it('throws when sessionId empty', () => {
    expect(() =>
      startSlaSession({ target: 'openai', sessionId: '', budgetUsd: 1 }),
    ).toThrow('sessionId must not be empty');
  });

  it('throws when budget negative', () => {
    expect(() =>
      startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: -1 }),
    ).toThrow('budgetUsd must be non-negative');
  });
});

describe('checkBudget', () => {
  it('allows spending within budget', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    const { allowed, remaining } = checkBudget(s, { cost: 3 });
    expect(allowed).toBe(true);
    expect(remaining).toBe(7);
    expect(s.spent).toBe(3);
  });

  it('rejects when cumulative spend exceeds budget', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    checkBudget(s, { cost: 4 });
    const { allowed } = checkBudget(s, { cost: 2 });
    expect(allowed).toBe(false);
    expect(s.spent).toBe(4); // not updated when rejected
  });

  it('rejects negative cost', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    expect(() => checkBudget(s, { cost: -1 })).toThrow('cost must be non-negative');
  });

  it('remaining floored at 0', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    checkBudget(s, { cost: 4 });
    checkBudget(s, { cost: 1 });
    const { remaining } = checkBudget(s, { cost: 0 });
    expect(remaining).toBe(0);
  });
});

describe('measureLatency', () => {
  it('computes p50 / p95 / p99 from samples', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    const samples = Array.from({ length: 100 }, (_, i) => ({
      requestId: `r${i}`,
      latencyMs: i + 1,
    }));
    const { p50, p95, p99 } = measureLatency(s, samples);
    expect(p50).toBe(50);
    expect(p95).toBe(95);
    expect(p99).toBe(99);
  });

  it('throws when samples empty', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    expect(() => measureLatency(s, [])).toThrow('samples must not be empty');
  });

  it('single sample yields p50 == p95 == p99', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    const { p50, p95, p99 } = measureLatency(s, [{ requestId: 'r', latencyMs: 42 }]);
    expect(p50).toBe(42);
    expect(p95).toBe(42);
    expect(p99).toBe(42);
  });
});

describe('routeModel', () => {
  it('picks cheapest candidate within SLA constraints', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    const { chosen } = routeModel(s, {
      candidates: [
        { model: 'cheap', costPerCall: 0.01, latencyMs: 500, qualityScore: 0.8 },
        { model: 'fast', costPerCall: 0.05, latencyMs: 100, qualityScore: 0.9 },
      ],
      slaLatencyMs: 1000,
      minQuality: 0.75,
    });
    expect(chosen?.model).toBe('cheap');
  });

  it('rejects candidates exceeding latency SLA', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    const { considered } = routeModel(s, {
      candidates: [
        { model: 'slow', costPerCall: 0.01, latencyMs: 5000, qualityScore: 0.9 },
      ],
      slaLatencyMs: 1000,
      minQuality: 0.5,
    });
    expect(considered).toEqual([]);
  });

  it('rejects candidates below minQuality', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    const { chosen } = routeModel(s, {
      candidates: [
        { model: 'low-q', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.4 },
      ],
      slaLatencyMs: 1000,
      minQuality: 0.7,
    });
    expect(chosen).toBeNull();
  });

  it('throws when candidates empty', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 10 });
    checkBudget(s, { cost: 0 });
    expect(() =>
      routeModel(s, { candidates: [], slaLatencyMs: 1000, minQuality: 0.5 }),
    ).toThrow('candidates must not be empty');
  });
});

describe('engageFallback', () => {
  it('finds first non-failed model in ladder', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 5 });
    checkBudget(s, { cost: 0 });
    routeModel(s, {
      candidates: [{ model: 'a', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.9 }],
      slaLatencyMs: 200,
      minQuality: 0.5,
    });
    const { nextModel } = engageFallback(s, {
      ladder: ['gpt-4o-mini', 'gpt-4o', 'claude-haiku'],
      failed: ['gpt-4o-mini'],
    });
    expect(nextModel).toBe('gpt-4o');
  });

  it('returns null when ladder exhausted', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    checkBudget(s, { cost: 0 });
    routeModel(s, {
      candidates: [{ model: 'a', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.9 }],
      slaLatencyMs: 200,
      minQuality: 0.5,
    });
    const { nextModel } = engageFallback(s, {
      ladder: ['gpt-4o-mini'],
      failed: ['gpt-4o-mini'],
    });
    expect(nextModel).toBeNull();
  });

  it('throws when ladder empty', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 5 });
    checkBudget(s, { cost: 0 });
    routeModel(s, {
      candidates: [{ model: 'a', costPerCall: 0.01, latencyMs: 100, qualityScore: 0.9 }],
      slaLatencyMs: 200,
      minQuality: 0.5,
    });
    expect(() => engageFallback(s, { ladder: [], failed: [] })).toThrow(
      'ladder must not be empty',
    );
  });
});

describe('providerEvent dialect', () => {
  it.each(['anthropic', 'openai', 'vercel-ai', 'langchain'] as const)(
    '%s uses provider prefix',
    (target) => {
      const s = startSlaSession({ target, sessionId: 's', budgetUsd: 1 });
      checkBudget(s, { cost: 0.1 });
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
