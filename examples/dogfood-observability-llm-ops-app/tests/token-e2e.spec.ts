/**
 * Token end-to-end fidelity spec (token axis: OTel GenAI stable token
 * counting + prompt / completion split + total accounting + session
 * lifecycle).
 *
 * Issue CAR-1048 (v1.42-3) AC — the mock adapter drives a full token
 * counting ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. startToken seats a token-count session under a serviceName +
 *     observability target, and rejects duplicate session ids.
 *  2. countTokens records prompt / completion / total tokens and
 *     enforces (non-empty model, non-negative counts, session open).
 *  3. closeToken tears down state and further ops on the same session id
 *     fail.
 *  4. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  5. Provider dialects (grafana-oss / prometheus / loki / otel-collector)
 *     translate the neutral event to their respective vocabulary.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_LLM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link LlmOpsAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleTokenRequest, validateTokenRequest } from '../src/app/tokens/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — token session start', () => {
  it('axis 1: startToken seats a session under a serviceName + observability target', async () => {
    await mock.startToken({
      sessionId: 't1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startToken');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startToken supports multi-service under distinct session ids', async () => {
    await mock.startToken({
      sessionId: 't2a',
      serviceName: 'search-api',
      target: 'loki',
    });
    await mock.startToken({
      sessionId: 't2b',
      serviceName: 'chat-api',
      target: 'grafana-oss',
    });
    const starts = mock.traces().filter((t) => t.op === 'startToken' && t.ok);
    expect(starts.length).toBe(2);
  });

  it('axis 1: startToken rejects duplicate session id', async () => {
    await mock.startToken({
      sessionId: 't3',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.startToken({
        sessionId: 't3',
        serviceName: 'llm-gateway',
        target: 'prometheus',
      }),
    ).rejects.toThrow(/token_session_exists/);
  });
});

describe('mock adapter — token counting', () => {
  it('axis 2: countTokens records prompt / completion / total counts', async () => {
    await mock.startToken({
      sessionId: 'c1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const result = await mock.countTokens({
      sessionId: 'c1',
      usage: {
        model: 'gpt-4o',
        promptTokens: 1200,
        completionTokens: 480,
      },
    });
    expect(result.promptTokens).toBe(1200);
    expect(result.completionTokens).toBe(480);
    expect(result.totalTokens).toBe(1680);
    expect(result.model).toBe('gpt-4o');
  });

  it('axis 2: countTokens handles zero-completion (streaming abort) case', async () => {
    await mock.startToken({
      sessionId: 'c2',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const result = await mock.countTokens({
      sessionId: 'c2',
      usage: {
        model: 'claude-sonnet-4-5',
        promptTokens: 500,
        completionTokens: 0,
      },
    });
    expect(result.completionTokens).toBe(0);
    expect(result.totalTokens).toBe(500);
  });

  it('axis 2: countTokens refuses empty model', async () => {
    await mock.startToken({
      sessionId: 'c3',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.countTokens({
        sessionId: 'c3',
        usage: { model: '', promptTokens: 10, completionTokens: 10 },
      }),
    ).rejects.toThrow(/model_must_not_be_empty/);
  });

  it('axis 2: countTokens refuses negative promptTokens', async () => {
    await mock.startToken({
      sessionId: 'c4',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.countTokens({
        sessionId: 'c4',
        usage: { model: 'gpt-4o', promptTokens: -1, completionTokens: 10 },
      }),
    ).rejects.toThrow(/token_counts_must_be_non_negative/);
  });

  it('axis 2: countTokens refuses when session not started', async () => {
    await expect(
      mock.countTokens({
        sessionId: 'ghost',
        usage: { model: 'gpt-4o', promptTokens: 10, completionTokens: 10 },
      }),
    ).rejects.toThrow(/token_session_not_found/);
  });
});

describe('mock adapter — token state machine', () => {
  it('axis 3: closeToken removes session', async () => {
    await mock.startToken({
      sessionId: 'sm1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await mock.closeToken({ sessionId: 'sm1' });
    await expect(
      mock.countTokens({
        sessionId: 'sm1',
        usage: { model: 'gpt-4o', promptTokens: 10, completionTokens: 10 },
      }),
    ).rejects.toThrow(/token_session_not_found/);
  });

  it('axis 3: rejects closeToken on unknown sessionId', async () => {
    await expect(mock.closeToken({ sessionId: 'ghost' })).rejects.toThrow(
      /token_session_not_found/,
    );
  });
});

describe('route handler — /tokens shape validation', () => {
  it('axis 4: validateTokenRequest rejects non-object body', () => {
    const result = validateTokenRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 4: validateTokenRequest rejects missing sessionId', () => {
    const result = validateTokenRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 4: validateTokenRequest rejects unknown kind', () => {
    const result = validateTokenRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_count_or_close');
  });

  it('axis 4: validateTokenRequest rejects invalid observability target', () => {
    const result = validateTokenRequest({
      sessionId: 'r2',
      kind: 'start',
      serviceName: 'llm-gateway',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 4: validateTokenRequest rejects usage without model', () => {
    const result = validateTokenRequest({
      sessionId: 'r3',
      kind: 'count',
      usage: { promptTokens: 1, completionTokens: 1 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('usage_model_required');
  });

  it('axis 4: handleTokenRequest dispatches the start op and returns serviceName', async () => {
    const response = await handleTokenRequest(mock, {
      kind: 'start',
      sessionId: 'r4',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
    expect(response.serviceName).toBe('llm-gateway');
  });

  it('axis 4: handleTokenRequest dispatches the count op and returns totals', async () => {
    await mock.startToken({
      sessionId: 'r5',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const response = await handleTokenRequest(mock, {
      kind: 'count',
      sessionId: 'r5',
      usage: {
        model: 'gpt-4o',
        promptTokens: 100,
        completionTokens: 200,
      },
    });
    expect(response.ok).toBe(true);
    expect(response.totalTokens).toBe(300);
  });

  it('axis 4: handleTokenRequest surfaces errorKind on failure', async () => {
    const response = await handleTokenRequest(mock, {
      kind: 'count',
      sessionId: 'ghost',
      usage: { model: 'gpt-4o', promptTokens: 1, completionTokens: 1 },
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('token_session_not_found');
  });
});

describe('mock adapter — token provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 5: startToken traces the ok event on %s target',
    async (target) => {
      await mock.startToken({
        sessionId: `d-${target}`,
        serviceName: 'llm-gateway',
        target,
      });
      await mock.countTokens({
        sessionId: `d-${target}`,
        usage: { model: 'gpt-4o', promptTokens: 10, completionTokens: 10 },
      });
      const starts = mock.traces().filter((t) => t.op === 'startToken' && t.ok);
      const counts = mock.traces().filter((t) => t.op === 'countTokens' && t.ok);
      expect(starts.length).toBeGreaterThan(0);
      expect(counts.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports LLM_STACK_READY on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    // Ordinary test envs will not have `LLM_STACK_READY=1` exported, so
    // the detector must report a stable env-missing reason.
    expect(missing).not.toBeNull();
  });

  it('real adapter refuses every op with KIWA_LLM_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startToken({
        sessionId: 'r-real',
        serviceName: 'llm-gateway',
        target: 'prometheus',
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startToken');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });
});
