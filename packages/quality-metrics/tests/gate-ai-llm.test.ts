import { describe, expect, it } from 'vitest';
import {
  evaluateReleaseGate,
  isAiLlmProvider,
  type QualityReport,
} from '../src/index.js';

function passingAiLlmReport(): QualityReport {
  return {
    provider: '@kiwa-test/ai-llm',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
    cost: { perRequestUsd: 0.05, totalUsd: 5.0, requests: 100 },
    latency: { p50Ms: 500, p95Ms: 1500, p99Ms: 2500, samples: 100 },
    token: { promptTokens: 800, completionTokens: 400, totalTokens: 1200, requests: 100 },
    accuracy: { score: 0.92, samples: 50, method: 'cosine' },
  };
}

describe('isAiLlmProvider', () => {
  it('T-QM-AI-001 accepts @kiwa-test/ai- prefix', () => {
    expect(isAiLlmProvider('@kiwa-test/ai-llm')).toBe(true);
    expect(isAiLlmProvider('@kiwa-test/ai-openai')).toBe(true);
    expect(isAiLlmProvider('@kiwa-test/ai-anthropic')).toBe(true);
  });

  it('T-QM-AI-002 rejects other providers', () => {
    expect(isAiLlmProvider('@kiwa-test/auth')).toBe(false);
    expect(isAiLlmProvider('@kiwa-test/api')).toBe(false); // ai と api を混同しない
    expect(isAiLlmProvider('@kiwa-test/queue')).toBe(false);
    expect(isAiLlmProvider('ai-llm')).toBe(false);
  });
});

describe('evaluateReleaseGate — AI-LLM pass', () => {
  it('T-QM-AI-003 passes 11 軸 when all AI-LLM metrics clear defaults', () => {
    const verdict = evaluateReleaseGate(passingAiLlmReport());
    expect(verdict.passed).toBe(true);
    expect(verdict.blockers).toEqual([]);
    expect(verdict.axesEvaluated).toBe(11);
  });
});

describe('evaluateReleaseGate — AI-LLM cost blocking', () => {
  it('T-QM-AI-004 blocks when cost per request above ceiling', () => {
    const report = passingAiLlmReport();
    report.cost = { perRequestUsd: 0.5, totalUsd: 50, requests: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'cost.perRequestUsd');
    expect(blocker?.op).toBe('<=');
    expect(blocker?.threshold).toBe(0.1);
    expect(blocker?.actual).toBe(0.5);
  });

  it('T-QM-AI-005 blocks when cost field is missing (undefined = fail)', () => {
    const report = passingAiLlmReport();
    delete report.cost;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers.map((b) => b.axis)).toContain('cost.perRequestUsd');
  });

  it('T-QM-AI-006 boundary — cost exactly at threshold passes', () => {
    const report = passingAiLlmReport();
    report.cost = { perRequestUsd: 0.1, totalUsd: 10, requests: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.find((b) => b.axis === 'cost.perRequestUsd')).toBeUndefined();
  });
});

describe('evaluateReleaseGate — AI-LLM latency blocking', () => {
  it('T-QM-AI-007 blocks when latency p95 above ceiling', () => {
    const report = passingAiLlmReport();
    report.latency = { p50Ms: 1000, p95Ms: 5000, p99Ms: 8000, samples: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'latency.p95Ms');
    expect(blocker?.op).toBe('<=');
    expect(blocker?.threshold).toBe(3000);
    expect(blocker?.actual).toBe(5000);
  });

  it('T-QM-AI-008 blocks when latency field is missing', () => {
    const report = passingAiLlmReport();
    delete report.latency;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('latency.p95Ms');
  });

  it('T-QM-AI-009 boundary — latency exactly at threshold passes', () => {
    const report = passingAiLlmReport();
    report.latency = { p50Ms: 1000, p95Ms: 3000, p99Ms: 3500, samples: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.find((b) => b.axis === 'latency.p95Ms')).toBeUndefined();
  });
});

describe('evaluateReleaseGate — AI-LLM token blocking', () => {
  it('T-QM-AI-010 blocks when totalTokens above ceiling', () => {
    const report = passingAiLlmReport();
    report.token = { promptTokens: 4000, completionTokens: 2000, totalTokens: 6000, requests: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'token.totalTokens');
    expect(blocker?.op).toBe('<=');
    expect(blocker?.threshold).toBe(4000);
    expect(blocker?.actual).toBe(6000);
  });

  it('T-QM-AI-011 blocks when token field is missing', () => {
    const report = passingAiLlmReport();
    delete report.token;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('token.totalTokens');
  });

  it('T-QM-AI-012 boundary — totalTokens exactly at threshold passes', () => {
    const report = passingAiLlmReport();
    report.token = { promptTokens: 3000, completionTokens: 1000, totalTokens: 4000, requests: 100 };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.find((b) => b.axis === 'token.totalTokens')).toBeUndefined();
  });
});

describe('evaluateReleaseGate — AI-LLM accuracy blocking', () => {
  it('T-QM-AI-013 blocks when accuracy score below floor', () => {
    const report = passingAiLlmReport();
    report.accuracy = { score: 0.6, samples: 50, method: 'cosine' };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'accuracy.score');
    expect(blocker?.op).toBe('>=');
    expect(blocker?.threshold).toBe(0.8);
    expect(blocker?.actual).toBe(0.6);
  });

  it('T-QM-AI-014 blocks when accuracy field is missing', () => {
    const report = passingAiLlmReport();
    delete report.accuracy;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.map((b) => b.axis)).toContain('accuracy.score');
  });

  it('T-QM-AI-015 boundary — accuracy exactly at threshold passes', () => {
    const report = passingAiLlmReport();
    report.accuracy = { score: 0.8, samples: 50, method: 'cosine' };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.blockers.find((b) => b.axis === 'accuracy.score')).toBeUndefined();
  });
});

describe('evaluateReleaseGate — AI-LLM overrides', () => {
  it('T-QM-AI-016 honours cost override', () => {
    const verdict = evaluateReleaseGate(passingAiLlmReport(), {
      costPerRequestUsd: 0.01,
    });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'cost.perRequestUsd');
    expect(blocker?.threshold).toBe(0.01);
  });

  it('T-QM-AI-017 honours accuracy override for stricter bar', () => {
    const verdict = evaluateReleaseGate(passingAiLlmReport(), {
      accuracyScore: 0.99,
    });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'accuracy.score');
    expect(blocker?.threshold).toBe(0.99);
    expect(blocker?.actual).toBe(0.92);
  });

  it('T-QM-AI-018 all 4 AI-LLM axes fail together — reports 4 blockers', () => {
    const report = passingAiLlmReport();
    report.cost = { perRequestUsd: 1.0, totalUsd: 100, requests: 100 };
    report.latency = { p50Ms: 5000, p95Ms: 10000, p99Ms: 15000, samples: 100 };
    report.token = { promptTokens: 5000, completionTokens: 5000, totalTokens: 10000, requests: 100 };
    report.accuracy = { score: 0.3, samples: 50, method: 'cosine' };
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    const axes = verdict.blockers.map((b) => b.axis);
    expect(axes).toContain('cost.perRequestUsd');
    expect(axes).toContain('latency.p95Ms');
    expect(axes).toContain('token.totalTokens');
    expect(axes).toContain('accuracy.score');
  });
});
