/**
 * Prompt end-to-end fidelity spec (prompt axis: OTel GenAI stable
 * prompt log with PII redaction + faithfulness / relevance / toxicity
 * signal flagging + session lifecycle).
 *
 * Issue CAR-1048 (v1.42-3) AC — the mock adapter drives a full prompt
 * log + hallucination flag ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. startPrompt seats a prompt-log session under a serviceName +
 *     observability target, and rejects duplicate session ids.
 *  2. logPrompt records the request-id + PII redaction flag + system /
 *     user prompt lengths and enforces (non-empty requestId, session
 *     open).
 *  3. flagHallucination sums signal / flagged counts across
 *     faithfulness / relevance / toxicity metrics and enforces
 *     (non-empty signals, score in [0,1], session open).
 *  4. closePrompt tears down state and further ops on the same session
 *     id fail.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handlePromptRequest, validatePromptRequest } from '../src/app/prompts/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — prompt session start', () => {
  it('axis 1: startPrompt seats a session under a serviceName + observability target', async () => {
    await mock.startPrompt({
      sessionId: 'p1',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startPrompt');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startPrompt rejects duplicate session id', async () => {
    await mock.startPrompt({
      sessionId: 'p2',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await expect(
      mock.startPrompt({
        sessionId: 'p2',
        serviceName: 'chat-api',
        target: 'prometheus',
      }),
    ).rejects.toThrow(/prompt_session_exists/);
  });
});

describe('mock adapter — prompt logging', () => {
  it('axis 2: logPrompt records system + user prompt lengths and redacted flag', async () => {
    await mock.startPrompt({
      sessionId: 'l1',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const result = await mock.logPrompt({
      sessionId: 'l1',
      prompt: {
        requestId: 'req-001',
        system: 'You are a helpful assistant.',
        user: 'What is the capital of France?',
        redacted: false,
      },
    });
    expect(result.requestId).toBe('req-001');
    expect(result.systemLength).toBeGreaterThan(0);
    expect(result.userLength).toBeGreaterThan(0);
    expect(result.redacted).toBe(false);
  });

  it('axis 2: logPrompt captures PII redaction flag', async () => {
    await mock.startPrompt({
      sessionId: 'l2',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const result = await mock.logPrompt({
      sessionId: 'l2',
      prompt: {
        requestId: 'req-002',
        system: 'assistant',
        user: '[REDACTED_EMAIL] wants to know order status',
        redacted: true,
      },
    });
    expect(result.redacted).toBe(true);
  });

  it('axis 2: logPrompt refuses empty requestId', async () => {
    await mock.startPrompt({
      sessionId: 'l3',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await expect(
      mock.logPrompt({
        sessionId: 'l3',
        prompt: { requestId: '', system: 's', user: 'u', redacted: false },
      }),
    ).rejects.toThrow(/requestId_must_not_be_empty/);
  });

  it('axis 2: logPrompt refuses when session not started', async () => {
    await expect(
      mock.logPrompt({
        sessionId: 'ghost',
        prompt: { requestId: 'r', system: 's', user: 'u', redacted: false },
      }),
    ).rejects.toThrow(/prompt_session_not_found/);
  });
});

describe('mock adapter — hallucination flagging', () => {
  it('axis 3: flagHallucination sums signal / flagged counts', async () => {
    await mock.startPrompt({
      sessionId: 'h1',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const result = await mock.flagHallucination({
      sessionId: 'h1',
      signals: [
        { metric: 'faithfulness', score: 0.4, threshold: 0.7 },
        { metric: 'relevance', score: 0.9, threshold: 0.5 },
        { metric: 'toxicity', score: 0.8, threshold: 0.5 },
      ],
    });
    expect(result.signalCount).toBe(3);
    // faithfulness (0.4 < 0.7 threshold) + toxicity (0.8 >= 0.5 threshold) flagged
    expect(result.flaggedCount).toBe(2);
    expect(result.anyFlagged).toBe(true);
  });

  it('axis 3: flagHallucination reports no flag when all signals pass', async () => {
    await mock.startPrompt({
      sessionId: 'h2',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const result = await mock.flagHallucination({
      sessionId: 'h2',
      signals: [
        { metric: 'faithfulness', score: 0.95, threshold: 0.7 },
        { metric: 'relevance', score: 0.9, threshold: 0.5 },
        { metric: 'toxicity', score: 0.1, threshold: 0.5 },
      ],
    });
    expect(result.flaggedCount).toBe(0);
    expect(result.anyFlagged).toBe(false);
  });

  it('axis 3: flagHallucination refuses empty signals', async () => {
    await mock.startPrompt({
      sessionId: 'h3',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await expect(
      mock.flagHallucination({ sessionId: 'h3', signals: [] }),
    ).rejects.toThrow(/signals_must_not_be_empty/);
  });

  it('axis 3: flagHallucination refuses score outside [0, 1]', async () => {
    await mock.startPrompt({
      sessionId: 'h4',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await expect(
      mock.flagHallucination({
        sessionId: 'h4',
        signals: [{ metric: 'faithfulness', score: 1.5, threshold: 0.5 }],
      }),
    ).rejects.toThrow(/score_must_be_within_zero_and_one/);
  });

  it('axis 3: flagHallucination refuses when session not started', async () => {
    await expect(
      mock.flagHallucination({
        sessionId: 'ghost',
        signals: [{ metric: 'faithfulness', score: 0.5, threshold: 0.5 }],
      }),
    ).rejects.toThrow(/prompt_session_not_found/);
  });
});

describe('mock adapter — prompt state machine', () => {
  it('axis 4: closePrompt removes session', async () => {
    await mock.startPrompt({
      sessionId: 'sm1',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await mock.closePrompt({ sessionId: 'sm1' });
    await expect(
      mock.logPrompt({
        sessionId: 'sm1',
        prompt: { requestId: 'r', system: 's', user: 'u', redacted: false },
      }),
    ).rejects.toThrow(/prompt_session_not_found/);
  });

  it('axis 4: flagHallucination following logPrompt uses semantics-lifted state', async () => {
    await mock.startPrompt({
      sessionId: 'sm2',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    await mock.logPrompt({
      sessionId: 'sm2',
      prompt: { requestId: 'r', system: 's', user: 'u', redacted: false },
    });
    const flag = await mock.flagHallucination({
      sessionId: 'sm2',
      signals: [{ metric: 'faithfulness', score: 0.8, threshold: 0.5 }],
    });
    expect(flag.signalCount).toBe(1);
  });
});

describe('route handler — /prompts shape validation', () => {
  it('axis 5: validatePromptRequest rejects non-object body', () => {
    const result = validatePromptRequest(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validatePromptRequest rejects unknown kind', () => {
    const result = validatePromptRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_log_flag_or_close');
  });

  it('axis 5: validatePromptRequest rejects invalid target', () => {
    const result = validatePromptRequest({
      sessionId: 'r2',
      kind: 'start',
      serviceName: 'chat-api',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 5: validatePromptRequest rejects prompt with non-boolean redacted', () => {
    const result = validatePromptRequest({
      sessionId: 'r3',
      kind: 'log',
      prompt: {
        requestId: 'r',
        system: 's',
        user: 'u',
        redacted: 'yes',
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('prompt_redacted_required_boolean');
  });

  it('axis 5: validatePromptRequest rejects signal with invalid metric', () => {
    const result = validatePromptRequest({
      sessionId: 'r4',
      kind: 'flag',
      signals: [{ metric: 'bogus', score: 0.5, threshold: 0.5 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('signal_metric_required_valid');
  });

  it('axis 5: handlePromptRequest dispatches the log op and returns lengths', async () => {
    await mock.startPrompt({
      sessionId: 'r5',
      serviceName: 'chat-api',
      target: 'prometheus',
    });
    const response = await handlePromptRequest(mock, {
      kind: 'log',
      sessionId: 'r5',
      prompt: {
        requestId: 'req-005',
        system: 'sys',
        user: 'user-msg',
        redacted: false,
      },
    });
    expect(response.ok).toBe(true);
    expect(response.requestId).toBe('req-005');
    expect(response.systemLength).toBe(3);
    expect(response.userLength).toBe(8);
  });

  it('axis 5: handlePromptRequest surfaces errorKind on failure', async () => {
    const response = await handlePromptRequest(mock, {
      kind: 'log',
      sessionId: 'ghost',
      prompt: { requestId: 'r', system: 's', user: 'u', redacted: false },
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('prompt_session_not_found');
  });
});

describe('real adapter — prompt env-gate', () => {
  it('real adapter refuses logPrompt with KIWA_LLM_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.logPrompt({
        sessionId: 'r-real',
        prompt: { requestId: 'r', system: 's', user: 'u', redacted: false },
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'logPrompt');
    expect(trace?.ok).toBe(false);
  });

  it('real adapter refuses flagHallucination with KIWA_LLM_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.flagHallucination({
        sessionId: 'r-real',
        signals: [{ metric: 'faithfulness', score: 0.5, threshold: 0.5 }],
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'flagHallucination');
    expect(trace?.ok).toBe(false);
  });
});
