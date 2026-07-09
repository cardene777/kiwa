import { describe, expect, it } from 'vitest';
import { evaluateReleaseGate } from '@kiwa-lab/quality-metrics';
import {
  buildAiLlmReport,
  buildAiLlmReportFromMock,
  createAnthropicMock,
  runFidelityCheck,
  type ChatCompletion,
  type ChatInput,
} from '../src/index.js';

function fakeReal(content: string): ChatCompletion {
  return {
    message: { role: 'assistant', content },
    usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
    costUsd: 0.02,
    latencyMs: 500,
    finishReason: 'stop',
  };
}

describe('buildAiLlmReport', () => {
  it('T-AI-REP-001 aggregates fidelity records into QualityReport 11 axes', async () => {
    const mock = createAnthropicMock({
      responses: {
        'q': {
          content: 'hello',
          usage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
        },
      },
    });
    const prompts: ChatInput[] = Array.from({ length: 15 }, () => ({
      messages: [{ role: 'user', content: 'q' }],
    }));
    const fidelity = await runFidelityCheck({
      mock,
      real: async () => fakeReal('hello'),
      prompts,
    });
    const report = buildAiLlmReport({
      provider: '@kiwa-lab/ai-llm',
      version: '0.1.0',
      fidelity,
      surfaceCoverage: { mockCoveredMethods: 4, realTotalMethods: 4 },
      testCount: { behavior: 20, integration: 0, e2e: 0 },
      coverageV8Summary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 100 },
      },
      mutation: { mutations: 50, killed: 40 },
      perfSamplesMs: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    });
    expect(report.provider).toBe('@kiwa-lab/ai-llm');
    expect(report.cost?.requests).toBe(15);
    expect(report.latency?.samples).toBe(15);
    expect(report.token?.requests).toBe(15);
    expect(report.accuracy?.score).toBe(1);
    expect(report.accuracy?.method).toBe('jaccard');
  });

  it('T-AI-REP-002 report passes 11-axis release gate when all metrics clear defaults', async () => {
    const mock = createAnthropicMock({
      responses: {
        'ok': {
          content: 'concise',
          usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
        },
      },
    });
    const prompts: ChatInput[] = Array.from({ length: 10 }, () => ({
      messages: [{ role: 'user', content: 'ok' }],
    }));
    const fidelity = await runFidelityCheck({
      mock,
      real: async () => fakeReal('concise'),
      prompts,
    });
    const report = buildAiLlmReport({
      provider: '@kiwa-lab/ai-llm',
      version: '0.1.0',
      fidelity,
      testCount: { behavior: 15, integration: 0, e2e: 0 },
      coverageV8Summary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 100 },
      },
      mutation: { mutations: 50, killed: 40 },
      perfSamplesMs: Array.from({ length: 100 }, () => 5),
    });
    const verdict = evaluateReleaseGate(report);
    expect(verdict.axesEvaluated).toBe(11);
    expect(verdict.passed).toBe(true);
  });

  it('T-AI-REP-003 report fails release gate when accuracy drops below 0.8', async () => {
    const mock = createAnthropicMock({
      responses: { 'diverge': { content: 'aaa bbb ccc' } },
    });
    const fidelity = await runFidelityCheck({
      mock,
      real: async () => fakeReal('xxx yyy zzz'),
      prompts: Array.from({ length: 5 }, () => ({
        messages: [{ role: 'user' as const, content: 'diverge' }],
      })),
    });
    const report = buildAiLlmReport({
      provider: '@kiwa-lab/ai-llm',
      version: '0.1.0',
      fidelity,
      testCount: { behavior: 15, integration: 0, e2e: 0 },
      coverageV8Summary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 100 },
      },
      mutation: { mutations: 50, killed: 40 },
      perfSamplesMs: Array.from({ length: 100 }, () => 5),
    });
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers.find((b) => b.axis === 'accuracy.score')).toBeDefined();
  });
});

describe('buildAiLlmReportFromMock', () => {
  it('T-AI-REP-004 assembles QualityReport from mock.getMetrics without fidelity harness', async () => {
    const mock = createAnthropicMock({
      responses: {
        'q': {
          content: 'ans',
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        },
      },
    });
    await mock.messages.create({ messages: [{ role: 'user', content: 'q' }] });
    await mock.messages.create({ messages: [{ role: 'user', content: 'q' }] });
    const report = buildAiLlmReportFromMock({
      provider: '@kiwa-lab/ai-llm',
      version: '0.1.0',
      mock,
      accuracyScore: 0.9,
      accuracyMethod: 'cosine',
      testCount: { behavior: 15, integration: 0, e2e: 0 },
    });
    expect(report.cost?.requests).toBe(2);
    expect(report.token?.totalTokens).toBe(150);
    expect(report.accuracy?.score).toBe(0.9);
    expect(report.accuracy?.method).toBe('cosine');
  });
});
