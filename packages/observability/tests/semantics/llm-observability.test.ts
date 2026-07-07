import { describe, expect, it } from 'vitest';
import {
  checkBudget,
  countTokens,
  flagHallucination,
  logPrompt,
  startLlmObsSession,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('llm-observability axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'claude-opus-4-7', promptTokens: 500, completionTokens: 300 });
    logPrompt(s, {
      requestId: 'req_1',
      system: 'you are helpful',
      user: 'what is 2+2',
      redacted: false,
    });
    flagHallucination(s, {
      signals: [
        { metric: 'faithfulness', score: 0.9, threshold: 0.8 },
        { metric: 'relevance', score: 0.7, threshold: 0.5 },
      ],
    });
    checkBudget(s, { spentUsd: 10, limitUsd: 100 });
    expect(s.state).toBe('budget-checked');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'llmobs.token_counted',
      'llmobs.prompt_logged',
      'llmobs.hallucination_flagged',
      'llmobs.budget_checked',
    ]);
  });

  it('countTokens sums prompt + completion', () => {
    const s = startLlmObsSession({ target: 'grafana-oss', serviceName: 'x' });
    const step = countTokens(s, {
      model: 'gpt-4',
      promptTokens: 100,
      completionTokens: 200,
    });
    expect(step.metadata.totalTokens).toBe(300);
    expect(step.metadata.model).toBe('gpt-4');
  });

  it('logPrompt records lengths and redaction flag', () => {
    const s = startLlmObsSession({ target: 'loki', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    const step = logPrompt(s, {
      requestId: 'req_42',
      system: 'sys',
      user: 'user query',
      redacted: true,
    });
    expect(step.metadata.systemLength).toBe(3);
    expect(step.metadata.userLength).toBe(10);
    expect(step.metadata.redacted).toBe(true);
  });

  it('flagHallucination flags below-threshold faithfulness and relevance', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [
        { metric: 'faithfulness', score: 0.3, threshold: 0.7 }, // flagged
        { metric: 'relevance', score: 0.9, threshold: 0.5 }, // ok
      ],
    });
    expect(step.metadata.flaggedCount).toBe(1);
    expect(step.metadata.anyFlagged).toBe(true);
  });

  it('flagHallucination flags above-threshold toxicity (inverse direction)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [{ metric: 'toxicity', score: 0.8, threshold: 0.5 }],
    });
    expect(step.metadata.flaggedCount).toBe(1);
    expect(step.metadata.anyFlagged).toBe(true);
  });

  it('flagHallucination with all signals ok reports 0 flagged', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [
        { metric: 'faithfulness', score: 0.95, threshold: 0.7 },
        { metric: 'toxicity', score: 0.1, threshold: 0.5 },
      ],
    });
    expect(step.metadata.flaggedCount).toBe(0);
    expect(step.metadata.anyFlagged).toBe(false);
  });

  it('checkBudget computes spend ratio', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'toxicity', score: 0, threshold: 0.5 }] });
    const step = checkBudget(s, { spentUsd: 75, limitUsd: 100 });
    expect(step.metadata.ratio).toBe(0.75);
    expect(step.metadata.exhausted).toBe(false);
  });

  it('checkBudget marks exhausted when spent >= limit', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'toxicity', score: 0, threshold: 0.5 }] });
    const step = checkBudget(s, { spentUsd: 100, limitUsd: 100 });
    expect(step.metadata.exhausted).toBe(true);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startLlmObsSession({ target, serviceName: 'x' });
    const step = countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('llm-observability axis — invariant guards', () => {
  it('rejects empty serviceName', () => {
    expect(() => startLlmObsSession({ target: 'prometheus', serviceName: '' })).toThrow(
      /serviceName/,
    );
  });

  it('rejects countTokens with empty model', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() => countTokens(s, { model: '', promptTokens: 0, completionTokens: 0 })).toThrow(
      /model/,
    );
  });

  it('rejects countTokens with negative counts', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      countTokens(s, { model: 'm', promptTokens: -1, completionTokens: 0 }),
    ).toThrow(/non-negative/);
  });

  it('rejects logPrompt before countTokens', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false }),
    ).toThrow(/not tokens-counted/);
  });

  it('rejects logPrompt with empty requestId', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    expect(() =>
      logPrompt(s, { requestId: '', system: 's', user: 'u', redacted: false }),
    ).toThrow(/requestId/);
  });

  it('rejects flagHallucination with out-of-range score', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    expect(() =>
      flagHallucination(s, {
        signals: [{ metric: 'faithfulness', score: 1.5, threshold: 0.5 }],
      }),
    ).toThrow(/within/);
  });

  it('rejects checkBudget with non-positive limit', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'toxicity', score: 0, threshold: 0.5 }] });
    expect(() => checkBudget(s, { spentUsd: 0, limitUsd: 0 })).toThrow(/positive/);
  });

  it('rejects checkBudget with negative spent', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'toxicity', score: 0, threshold: 0.5 }] });
    expect(() => checkBudget(s, { spentUsd: -1, limitUsd: 100 })).toThrow(/non-negative/);
  });

  it('rejects flagHallucination with empty signals', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    expect(() => flagHallucination(s, { signals: [] })).toThrow(/must not be empty/);
  });
});
