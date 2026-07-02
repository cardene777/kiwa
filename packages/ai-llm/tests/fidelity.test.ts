import { describe, expect, it } from 'vitest';
import {
  createAnthropicMock,
  jaccardSimilarity,
  runFidelityCheck,
  type ChatCompletion,
  type ChatInput,
} from '../src/index.js';

describe('jaccardSimilarity', () => {
  it('T-AI-FID-001 returns 1.0 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('T-AI-FID-002 returns 0.0 for fully disjoint strings', () => {
    expect(jaccardSimilarity('foo bar', 'zap qux')).toBe(0);
  });

  it('T-AI-FID-003 handles empty inputs as identical (1.0)', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
  });

  it('T-AI-FID-004 returns intermediate for partial overlap', () => {
    // {"a","b","c"} vs {"b","c","d"} → |∩|=2, |∪|=4 → 0.5
    expect(jaccardSimilarity('a b c', 'b c d')).toBeCloseTo(0.5);
  });
});

describe('runFidelityCheck', () => {
  function fakeReal(content: string, costUsd = 0.1, latencyMs = 400): ChatCompletion {
    return {
      message: { role: 'assistant', content },
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      costUsd,
      latencyMs,
      finishReason: 'stop',
    };
  }

  it('T-AI-FID-005 diffs cost / latency / token / accuracy across records', async () => {
    const mock = createAnthropicMock({
      responses: {
        'p1': { content: 'apple banana', usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 } },
        'p2': { content: 'car dog', usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 } },
      },
      artificialLatencyMs: 5,
    });
    const prompts: ChatInput[] = [
      { messages: [{ role: 'user', content: 'p1' }] },
      { messages: [{ role: 'user', content: 'p2' }] },
    ];
    const report = await runFidelityCheck({
      mock,
      real: async (input) => {
        const p = input.messages[input.messages.length - 1]?.content ?? '';
        return p === 'p1' ? fakeReal('apple banana', 0.1, 400) : fakeReal('car dog', 0.15, 500);
      },
      prompts,
    });
    expect(report.records.length).toBe(2);
    expect(report.summary.prompts).toBe(2);
    expect(report.summary.accuracyMethod).toBe('jaccard');
    // real content == mock content ⇒ accuracy 1.0
    expect(report.summary.avgAccuracyScore).toBe(1);
    // real cost > mock cost ⇒ diff > 0
    expect(report.summary.avgCostDiffUsd).toBeGreaterThan(0);
    // real latency > mock latency ⇒ diff > 0
    expect(report.summary.avgLatencyDiffMs).toBeGreaterThan(0);
  });

  it('T-AI-FID-006 reports low accuracyScore when real / mock outputs disagree', async () => {
    const mock = createAnthropicMock({
      responses: { 'p': { content: 'apple banana cherry' } },
    });
    const report = await runFidelityCheck({
      mock,
      real: async () => fakeReal('zap qux foo'),
      prompts: [{ messages: [{ role: 'user', content: 'p' }] }],
    });
    expect(report.records[0]?.accuracyScore).toBeLessThan(0.5);
  });

  it('T-AI-FID-007 supports a custom accuracy scorer function', async () => {
    const mock = createAnthropicMock({ responses: { 'p': { content: 'anything' } } });
    const report = await runFidelityCheck({
      mock,
      real: async () => fakeReal('whatever'),
      prompts: [{ messages: [{ role: 'user', content: 'p' }] }],
      accuracyMethod: (_r, _m) => 0.42,
    });
    expect(report.records[0]?.accuracyScore).toBe(0.42);
    expect(report.summary.accuracyMethod).toBe('custom');
  });
});
