import { describe, expect, it } from 'vitest';
import {
  AI_LLM_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type AiLlmAxis,
  type AiLlmTarget,
} from '../../src/semantics/index.js';

const ALL_PROVIDERS: AiLlmTarget[] = ['anthropic', 'openai', 'vercel-ai', 'langchain'];
const ALL_AXES: AiLlmAxis[] = [
  'prompt-injection',
  'hallucination',
  'llm-eval',
  'guardrails',
  'rag-advanced',
  'agent-orchestration',
  'fine-tuning-eval',
  'cost-latency-sla',
];

describe('AI_LLM_AXIS_TO_EVENTS', () => {
  it('has 8 axes', () => {
    expect(Object.keys(AI_LLM_AXIS_TO_EVENTS)).toHaveLength(8);
  });

  it.each(ALL_AXES)('%s axis has at least 4 neutral events', (axis) => {
    expect(AI_LLM_AXIS_TO_EVENTS[axis].length).toBeGreaterThanOrEqual(4);
  });

  it('has at least 32 total neutral events (baseline 4 × 8 axis)', () => {
    const total = Object.values(AI_LLM_AXIS_TO_EVENTS).reduce((s, arr) => s + arr.length, 0);
    expect(total).toBeGreaterThanOrEqual(32);
  });

  it('all neutral events are unique across axes', () => {
    const all = Object.values(AI_LLM_AXIS_TO_EVENTS).flat();
    const uniq = new Set(all);
    expect(uniq.size).toBe(all.length);
  });
});

describe('collectFidelityCoverage', () => {
  it('produces 32 rows for 4 provider × 8 axis grid', () => {
    const cov = collectFidelityCoverage();
    expect(cov.rows).toHaveLength(32);
  });

  it('includes all 4 provider targets by default', () => {
    const cov = collectFidelityCoverage();
    expect(cov.providers).toEqual(ALL_PROVIDERS);
  });

  it('includes all 8 axes', () => {
    const cov = collectFidelityCoverage();
    expect(cov.axes.sort()).toEqual([...ALL_AXES].sort());
  });

  it.each(ALL_PROVIDERS)('emits 8 rows per provider (%s)', (provider) => {
    const cov = collectFidelityCoverage();
    const rows = cov.rows.filter((r) => r.provider === provider);
    expect(rows).toHaveLength(8);
  });

  it.each(ALL_AXES)('emits 4 rows per axis (%s)', (axis) => {
    const cov = collectFidelityCoverage();
    const rows = cov.rows.filter((r) => r.axis === axis);
    expect(rows).toHaveLength(4);
  });

  it('each row has neutralEvents matching AI_LLM_AXIS_TO_EVENTS', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      expect(row.neutralEvents).toEqual(AI_LLM_AXIS_TO_EVENTS[row.axis]);
    }
  });

  it('each row has providerEvents count matching axis neutral events', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      expect(row.providerEvents).toHaveLength(AI_LLM_AXIS_TO_EVENTS[row.axis].length);
    }
  });

  it('providerEvents use provider prefix', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      const prefix: Record<AiLlmTarget, string> = {
        anthropic: 'anthropic',
        openai: 'openai',
        'vercel-ai': 'vercel',
        langchain: 'langchain',
      };
      for (const pe of row.providerEvents) {
        expect(pe.startsWith(prefix[row.provider])).toBe(true);
      }
    }
  });

  it('accepts subset of providers', () => {
    const cov = collectFidelityCoverage(['anthropic']);
    expect(cov.rows).toHaveLength(8);
    expect(cov.providers).toEqual(['anthropic']);
  });

  it('empty provider list yields 0 rows', () => {
    const cov = collectFidelityCoverage([]);
    expect(cov.rows).toHaveLength(0);
  });
});

describe('providerEventName', () => {
  it.each(ALL_PROVIDERS)('%s dialect covers all 32 neutral events', (target) => {
    for (const events of Object.values(AI_LLM_AXIS_TO_EVENTS)) {
      for (const neutral of events) {
        const pe = providerEventName(target, neutral);
        expect(pe).not.toBe(neutral); // dialect must override
        expect(pe.length).toBeGreaterThan(0);
      }
    }
  });

  it('different providers yield different dialect strings for same event', () => {
    const seen = new Set(
      ALL_PROVIDERS.map((p) => providerEventName(p, 'injection.direct_detected')),
    );
    expect(seen.size).toBe(ALL_PROVIDERS.length);
  });
});
