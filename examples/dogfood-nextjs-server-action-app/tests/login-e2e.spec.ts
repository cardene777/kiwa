/**
 * Login end-to-end fidelity spec (form-action-advanced + server-action-
 * advanced axes: progressive enhancement + redirect).
 *
 * Sub-Issue CAR-786 (v1.34-3) AC — the mock adapter drives a full form
 * action + progressive enhancement + redirect ceremony end to end and the
 * fidelity harness diffs the raw {@link TraceEvent} sequence across four
 * axes.
 *
 *  1. enhanceLogin enables progressive enhancement so the form still
 *     submits when JS is disabled (JS-off fallback path).
 *  2. markLoginPending transitions the form action session to pending
 *     (useFormStatus).
 *  3. submitLogin captures the credentials on the server-action session.
 *  4. redirectLogin sets the redirect URL + closes the session with a
 *     resolveLogin trace.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  handleLoginRequest,
  validateLoginRequest,
} from '../src/app/login/route.js';
import type { ServerActionAdapter } from '../src/adapters/interface.js';

let mock: ServerActionAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — login form action + progressive enhancement + redirect', () => {
  it('axis 1: enhanceLogin marks the form as progressively enhanced', async () => {
    const result = await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a1',
      formId: 'login-form-1',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com', password: 'p' },
      enhance: { actionUrl: '/api/login', method: 'post' },
      redirectTo: '/dashboard',
    });
    expect(result.enhanced).toBe(true);
  });

  it('axis 1: enhanceLogin records the actionUrl in the trace', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a2',
      formId: 'login-form-2',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
      enhance: { actionUrl: '/api/login', method: 'get' },
    });
    const enhance = mock.traces().find((t) => t.op === 'enhanceLogin');
    expect(enhance?.ok).toBe(true);
    expect((enhance?.detail as { actionUrl?: string })?.actionUrl).toBe('/api/login');
    expect((enhance?.detail as { method?: string })?.method).toBe('get');
  });

  it('axis 1: enhanceLogin is absent when enhance is not provided', async () => {
    const result = await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a3',
      formId: 'login-form-3',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
      redirectTo: '/dashboard',
    });
    expect(result.enhanced).toBe(false);
    expect(mock.traces().find((t) => t.op === 'enhanceLogin')).toBeUndefined();
  });

  it('axis 2: markLoginPending records the submitter in the trace', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a4',
      formId: 'login-form-4',
      submitter: 'submit-primary',
      credentials: { email: 'u@example.com' },
      redirectTo: '/x',
    });
    const pending = mock.traces().find((t) => t.op === 'markLoginPending');
    expect(pending?.ok).toBe(true);
    expect((pending?.detail as { submitter?: string })?.submitter).toBe('submit-primary');
  });

  it('axis 3: submitLogin trace records the field count', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a5',
      formId: 'login-form-5',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com', password: 'p', remember: 'on' },
      redirectTo: '/x',
    });
    const submit = mock.traces().find((t) => t.op === 'submitLogin');
    expect(submit?.ok).toBe(true);
    expect((submit?.detail as { fieldCount?: number })?.fieldCount).toBe(3);
  });

  it('axis 4: redirectLogin sets the redirect URL', async () => {
    const result = await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a6',
      formId: 'login-form-6',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
      redirectTo: '/dashboard/home',
    });
    expect(result.redirectUrl).toBe('/dashboard/home');
    expect(mock.metrics().redirects).toBe(1);
  });

  it('axis 4: redirectLogin trace records the destination url', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a7',
      formId: 'login-form-7',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
      redirectTo: '/dashboard/settings',
    });
    const redirect = mock.traces().find((t) => t.op === 'redirectLogin');
    expect(redirect?.ok).toBe(true);
    expect((redirect?.detail as { url?: string })?.url).toBe('/dashboard/settings');
  });

  it('axis 4: redirectLogin is absent when redirectTo is not provided', async () => {
    const result = await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a8',
      formId: 'login-form-8',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
    });
    expect(result.redirectUrl).toBeNull();
    expect(mock.traces().find((t) => t.op === 'redirectLogin')).toBeUndefined();
  });

  it('rejects the session when rejectWith is provided (no redirect)', async () => {
    const result = await mock.runLogin({
      routeId: '/login',
      actionId: 'login-a9',
      formId: 'login-form-9',
      submitter: 'submit-btn',
      credentials: { email: 'u@example.com' },
      redirectTo: '/dashboard',
      rejectWith: 'invalid_credentials',
    });
    expect(result.redirectUrl).toBeNull();
    expect(mock.metrics().formsRejected).toBe(1);
    const resolve = mock.traces().find((t) => t.op === 'resolveLogin');
    expect((resolve?.detail as { rejected?: boolean })?.rejected).toBe(true);
    expect((resolve?.detail as { reason?: string })?.reason).toBe('invalid_credentials');
  });

  it('trace order: startLogin → enhanceLogin → markLoginPending → submitLogin → redirectLogin → resolveLogin', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'ordered',
      formId: 'ordered',
      submitter: 'btn',
      credentials: { email: 'a@a.com' },
      enhance: { actionUrl: '/api/login', method: 'post' },
      redirectTo: '/x',
    });
    const t = mock.traces();
    const s = t.findIndex((e) => e.op === 'startLogin');
    const e = t.findIndex((ev) => ev.op === 'enhanceLogin');
    const p = t.findIndex((ev) => ev.op === 'markLoginPending');
    const sub = t.findIndex((ev) => ev.op === 'submitLogin');
    const r = t.findIndex((ev) => ev.op === 'redirectLogin');
    const res = t.findIndex((ev) => ev.op === 'resolveLogin');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(e).toBeGreaterThan(s);
    expect(p).toBeGreaterThan(e);
    expect(sub).toBeGreaterThan(p);
    expect(r).toBeGreaterThan(sub);
    expect(res).toBeGreaterThan(r);
  });

  it('metrics.loginsSubmitted + redirects + progressiveEnhancements track counts', async () => {
    await mock.runLogin({
      routeId: '/login',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
      credentials: { email: 'a@a.com' },
      enhance: { actionUrl: '/api/login' },
      redirectTo: '/x',
    });
    const m = mock.metrics();
    expect(m.loginsSubmitted).toBe(1);
    expect(m.redirects).toBe(1);
    expect(m.progressiveEnhancements).toBe(1);
  });

  it('rejects empty routeId', async () => {
    await expect(
      mock.runLogin({
        routeId: '',
        actionId: 'a',
        formId: 'f',
        submitter: 'btn',
        credentials: {},
      }),
    ).rejects.toThrow(/routeId/);
  });

  it('rejects empty actionId', async () => {
    await expect(
      mock.runLogin({
        routeId: '/l',
        actionId: '',
        formId: 'f',
        submitter: 'btn',
        credentials: {},
      }),
    ).rejects.toThrow(/actionId/);
  });

  it('rejects empty formId', async () => {
    await expect(
      mock.runLogin({
        routeId: '/l',
        actionId: 'a',
        formId: '',
        submitter: 'btn',
        credentials: {},
      }),
    ).rejects.toThrow(/formId/);
  });
});

describe('login route handler — request validation', () => {
  it('accepts a valid run request', () => {
    const result = validateLoginRequest({
      kind: 'run',
      routeId: '/login',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
      credentials: { email: 'u@example.com', password: 'p' },
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const result = validateLoginRequest(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('rejects a missing credentials', () => {
    const result = validateLoginRequest({
      kind: 'run',
      routeId: '/l',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('credentials_required');
  });

  it('rejects credentials with non-string values', () => {
    const result = validateLoginRequest({
      kind: 'run',
      routeId: '/l',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
      credentials: { email: 42 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('credentials_values_must_be_strings');
  });

  it('rejects an unknown kind', () => {
    const result = validateLoginRequest({
      kind: 'query',
      routeId: '/l',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
      credentials: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_run');
  });

  it('rejects enhance with missing actionUrl', () => {
    const result = validateLoginRequest({
      kind: 'run',
      routeId: '/l',
      actionId: 'a',
      formId: 'f',
      submitter: 'btn',
      credentials: {},
      enhance: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('enhance_actionUrl_required');
  });

  it('handleLoginRequest returns enhanced:true when enhance is provided', async () => {
    const parsed = validateLoginRequest({
      kind: 'run',
      routeId: '/login',
      actionId: 'h',
      formId: 'h-form',
      submitter: 'btn',
      credentials: { email: 'u@example.com' },
      enhance: { actionUrl: '/api/login', method: 'post' },
      redirectTo: '/dashboard',
    });
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleLoginRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.enhanced).toBe(true);
    expect(response.redirectUrl).toBe('/dashboard');
  });

  it('handleLoginRequest surfaces adapter errors as ok:false', async () => {
    const response = await handleLoginRequest(mock, {
      kind: 'run',
      routeId: '',
      actionId: '',
      formId: '',
      submitter: '',
      credentials: {},
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBeDefined();
  });
});

describe('real adapter — login refuses env-missing', () => {
  it('runLogin throws with KIWA_SERVER_ACTION_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.runLogin({
        routeId: '/l',
        actionId: 'a',
        formId: 'f',
        submitter: 'btn',
        credentials: {},
      }),
    ).rejects.toThrow(/KIWA_SERVER_ACTION_ENV_MISSING|KIWA_MODE=mock/);
  });
});
