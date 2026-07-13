import { describe, expect, it } from 'vitest';
import {
  buildAiLlmReport,
  buildAiLlmReportFromMock,
} from '../src/report.js';
import { createAnthropicMock } from '../src/anthropic.js';
import type { FidelityReport, FidelityRecord } from '../src/fidelity.js';
import type { ChatCompletion } from '../src/types.js';

function makeCompletion(overrides: Partial<ChatCompletion> = {}): ChatCompletion {
  return {
    message: { role: 'assistant', content: 'ok' },
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    costUsd: 0.001,
    latencyMs: 50,
    finishReason: 'stop',
    ...overrides,
  };
}

function makeFidelityReport(): FidelityReport {
  const record: FidelityRecord = {
    prompt: 'test',
    real: makeCompletion(),
    mock: makeCompletion(),
    costDiffUsd: 0,
    latencyDiffMs: 0,
    tokenDiffTotal: 0,
    accuracyScore: 1,
  };
  return {
    records: [record],
    summary: {
      avgCostDiffUsd: 0,
      avgLatencyDiffMs: 0,
      avgTokenDiffTotal: 0,
      avgAccuracyScore: 1,
      prompts: 1,
      accuracyMethod: 'jaccard',
    },
  };
}

describe('buildAiLlmReport default branches', () => {
  it('uses default surfaceCoverage when omitted', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
    });
    expect(report.provider).toBe('test');
  });

  it('uses default coverage (100/100/100) when coverageV8Summary omitted', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
    });
    expect(report.coverage.line).toBe(100);
    expect(report.coverage.branch).toBe(100);
    expect(report.coverage.function).toBe(100);
  });

  it('uses coverageV8Summary when provided', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
      coverageV8Summary: {
        lines: { pct: 95 },
        branches: { pct: 90 },
        functions: { pct: 98 },
      },
    });
    expect(report.coverage.line).toBe(95);
    expect(report.coverage.branch).toBe(90);
    expect(report.coverage.function).toBe(98);
  });

  it('uses default mutation (0/0/0/0) when omitted', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
    });
    expect(report.mutation.mutations).toBe(0);
    expect(report.mutation.killed).toBe(0);
    expect(report.mutation.killRate).toBe(0);
  });

  it('uses mutation counts when provided', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
      mutation: { mutations: 10, killed: 8 },
    });
    expect(report.mutation.mutations).toBe(10);
    expect(report.mutation.killed).toBe(8);
    expect(report.mutation.survived).toBe(2);
    expect(report.mutation.killRate).toBeCloseTo(80);
  });

  it('includes notes when provided', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
      notes: 'a note',
    });
    expect(report.notes).toBe('a note');
  });

  it('uses testCount default (0/0/0) when omitted', () => {
    const report = buildAiLlmReport({
      provider: 'test',
      version: '1.0',
      fidelity: makeFidelityReport(),
    });
    expect(report.testCount.total).toBe(0);
  });
});

describe('buildAiLlmReportFromMock default branches', () => {
  it('uses default surfaceCoverage + testCount when omitted', async () => {
    const client = createAnthropicMock({
      responses: { 'q': { content: 'a' } },
    });
    // Generate some metrics
    await client.messages.create({
      messages: [{ role: 'user', content: 'q' }],
    });
    const report = buildAiLlmReportFromMock({
      provider: 'anthropic',
      version: '1.0',
      mock: client,
      accuracyScore: 0.95,
      accuracyMethod: 'jaccard',
    });
    expect(report.provider).toBe('anthropic');
    expect(report.testCount.total).toBe(0);
  });

  it('includes notes when provided', async () => {
    const client = createAnthropicMock({
      responses: { 'q': { content: 'a' } },
    });
    await client.messages.create({
      messages: [{ role: 'user', content: 'q' }],
    });
    const report = buildAiLlmReportFromMock({
      provider: 'anthropic',
      version: '1.0',
      mock: client,
      accuracyScore: 0.95,
      accuracyMethod: 'jaccard',
      notes: 'mock note',
    });
    expect(report.notes).toBe('mock note');
  });

  it('honors testCount override when provided', async () => {
    const client = createAnthropicMock({
      responses: { 'q': { content: 'a' } },
    });
    await client.messages.create({
      messages: [{ role: 'user', content: 'q' }],
    });
    const report = buildAiLlmReportFromMock({
      provider: 'anthropic',
      version: '1.0',
      mock: client,
      accuracyScore: 0.95,
      accuracyMethod: 'jaccard',
      testCount: { behavior: 5, integration: 3, e2e: 2 },
    });
    expect(report.testCount.total).toBe(10);
  });
});
