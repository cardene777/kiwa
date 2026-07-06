/**
 * Subscribe end-to-end fidelity spec (server-action-advanced axis:
 * form action + revalidatePath).
 *
 * Sub-Issue CAR-786 (v1.34-3) AC — the mock adapter drives a full form
 * action + revalidatePath ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across three axes.
 *
 *  1. submitSubscribe captures the form fields, transitions the session
 *     from idle to submitted, and records one submitSubscribe trace entry.
 *  2. revalidateSubscribePath transitions the session from submitted to
 *     path-revalidated + records the path in the trace detail.
 *  3. The trace order (startSubscribe → submitSubscribe →
 *     revalidateSubscribePath) mirrors the Next.js runtime lifecycle.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_SERVER_ACTION_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link ServerActionAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleSubscribeRequest,
  validateSubscribeRequest,
} from '../src/app/subscribe/route.js';
import type { ServerActionAdapter } from '../src/adapters/interface.js';

let mock: ServerActionAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — subscribe form action + revalidatePath', () => {
  it('axis 1: submitSubscribe captures form fields and reports submitted', async () => {
    const result = await mock.submitSubscribe({
      routeId: '/subscribe',
      actionId: 'subscribe-action',
      form: { email: 'user@example.com', plan: 'monthly' },
      revalidatePath: '/subscribers',
    });
    expect(result.routeId).toBe('/subscribe');
    expect(result.actionId).toBe('subscribe-action');
    expect(result.form).toEqual({ email: 'user@example.com', plan: 'monthly' });
    expect(result.submitted).toBe(true);
  });

  it('axis 1: submitSubscribe trace records field count', async () => {
    await mock.submitSubscribe({
      routeId: '/subscribe',
      actionId: 'a1',
      form: { email: 'u@example.com', plan: 'yearly', consent: 'yes' },
      revalidatePath: '/subscribers',
    });
    const submit = mock.traces().find((t) => t.op === 'submitSubscribe');
    expect(submit?.ok).toBe(true);
    expect((submit?.detail as { fieldCount?: number })?.fieldCount).toBe(3);
  });

  it('axis 2: revalidateSubscribePath appends the path to revalidatedPaths', async () => {
    const result = await mock.submitSubscribe({
      routeId: '/subscribe',
      actionId: 'a2',
      form: { email: 'u@example.com' },
      revalidatePath: '/blog',
    });
    expect(result.revalidatedPaths).toEqual(['/blog']);
  });

  it('axis 2: revalidateSubscribePath trace records the path', async () => {
    await mock.submitSubscribe({
      routeId: '/subscribe',
      actionId: 'a3',
      form: { email: 'u@example.com' },
      revalidatePath: '/marketing',
    });
    const reval = mock.traces().find((t) => t.op === 'revalidateSubscribePath');
    expect(reval?.ok).toBe(true);
    expect((reval?.detail as { path?: string })?.path).toBe('/marketing');
  });

  it('axis 3: trace order is startSubscribe → submitSubscribe → revalidateSubscribePath', async () => {
    await mock.submitSubscribe({
      routeId: '/subscribe',
      actionId: 'ordered',
      form: { email: 'u@example.com' },
      revalidatePath: '/x',
    });
    const traces = mock.traces();
    const startIdx = traces.findIndex((t) => t.op === 'startSubscribe');
    const submitIdx = traces.findIndex((t) => t.op === 'submitSubscribe');
    const revalIdx = traces.findIndex((t) => t.op === 'revalidateSubscribePath');
    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(submitIdx).toBeGreaterThan(startIdx);
    expect(revalIdx).toBeGreaterThan(submitIdx);
  });

  it('axis 3: metrics.subscribesSubmitted increments monotonically', async () => {
    expect(mock.metrics().subscribesSubmitted).toBe(0);
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 's1',
      form: { email: 'a@a.com' },
      revalidatePath: '/x',
    });
    expect(mock.metrics().subscribesSubmitted).toBe(1);
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 's2',
      form: { email: 'b@b.com' },
      revalidatePath: '/y',
    });
    expect(mock.metrics().subscribesSubmitted).toBe(2);
  });

  it('axis 3: metrics.pathRevalidations tracks revalidatePath calls', async () => {
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 'r1',
      form: { email: 'a@a.com' },
      revalidatePath: '/x',
    });
    expect(mock.metrics().pathRevalidations).toBe(1);
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 'r2',
      form: { email: 'b@b.com' },
      revalidatePath: '/y',
    });
    expect(mock.metrics().pathRevalidations).toBe(2);
  });

  it('axis 3: subscribeLatencySamplesMs records one sample per submit', async () => {
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 'l1',
      form: { email: 'a@a.com' },
      revalidatePath: '/x',
    });
    await mock.submitSubscribe({
      routeId: '/s',
      actionId: 'l2',
      form: { email: 'b@b.com' },
      revalidatePath: '/y',
    });
    expect(mock.metrics().subscribeLatencySamplesMs).toHaveLength(2);
    for (const sample of mock.metrics().subscribeLatencySamplesMs) {
      expect(sample).toBeGreaterThanOrEqual(0);
    }
  });

  it('rejects empty routeId', async () => {
    await expect(
      mock.submitSubscribe({
        routeId: '',
        actionId: 'a',
        form: {},
        revalidatePath: '/x',
      }),
    ).rejects.toThrow(/routeId/);
  });

  it('rejects empty actionId', async () => {
    await expect(
      mock.submitSubscribe({
        routeId: '/s',
        actionId: '',
        form: {},
        revalidatePath: '/x',
      }),
    ).rejects.toThrow(/actionId/);
  });

  it('rejects empty revalidatePath', async () => {
    await expect(
      mock.submitSubscribe({
        routeId: '/s',
        actionId: 'a',
        form: {},
        revalidatePath: '',
      }),
    ).rejects.toThrow(/revalidatePath/);
  });

  it('rejects revalidatePath that does not start with slash', async () => {
    await expect(
      mock.submitSubscribe({
        routeId: '/s',
        actionId: 'a',
        form: {},
        revalidatePath: 'no-slash',
      }),
    ).rejects.toThrow(/must start with/);
  });
});

describe('subscribe route handler — request validation', () => {
  it('accepts a valid submit request', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/subscribe',
      actionId: 'a',
      form: { email: 'u@example.com' },
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const result = validateSubscribeRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('rejects a missing routeId', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      actionId: 'a',
      form: {},
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('routeId_required');
  });

  it('rejects a missing actionId', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/s',
      form: {},
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('actionId_required');
  });

  it('rejects an unknown kind', () => {
    const result = validateSubscribeRequest({
      kind: 'query',
      routeId: '/s',
      actionId: 'a',
      form: {},
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_submit');
  });

  it('rejects a missing form', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/s',
      actionId: 'a',
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('form_required');
  });

  it('rejects a form with non-string values', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/s',
      actionId: 'a',
      form: { email: 42 },
      revalidatePath: '/x',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('form_values_must_be_strings');
  });

  it('rejects revalidatePath that does not start with slash', () => {
    const result = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/s',
      actionId: 'a',
      form: {},
      revalidatePath: 'no-slash',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('revalidatePath_must_start_with_slash');
  });

  it('handleSubscribeRequest returns fieldCount when submit succeeds', async () => {
    const parsed = validateSubscribeRequest({
      kind: 'submit',
      routeId: '/subscribe',
      actionId: 'h',
      form: { email: 'u@example.com', plan: 'monthly' },
      revalidatePath: '/subs',
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleSubscribeRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.fieldCount).toBe(2);
    expect(response.revalidatedPaths).toEqual(['/subs']);
  });

  it('handleSubscribeRequest surfaces adapter errors as ok:false', async () => {
    const response = await handleSubscribeRequest(mock, {
      kind: 'submit',
      routeId: '',
      actionId: '',
      form: {},
      revalidatePath: '/x',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBeDefined();
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing returns a reason string when SERVER_ACTION_BROWSER_READY is unset', () => {
    const previous = process.env['SERVER_ACTION_BROWSER_READY'];
    delete process.env['SERVER_ACTION_BROWSER_READY'];
    try {
      expect(detectRealEnvMissing()).toMatch(/ENV_MISSING|KIWA_MODE=mock/);
    } finally {
      if (previous !== undefined) process.env['SERVER_ACTION_BROWSER_READY'] = previous;
    }
  });

  it('submitSubscribe throws with KIWA_SERVER_ACTION_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.submitSubscribe({
        routeId: '/s',
        actionId: 'a',
        form: {},
        revalidatePath: '/x',
      }),
    ).rejects.toThrow(/KIWA_SERVER_ACTION_ENV_MISSING|KIWA_MODE=mock/);
    const trace = real.traces().find((t) => t.op === 'submitSubscribe');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toMatch(/ENV_MISSING|KIWA_MODE=mock/);
  });
});
