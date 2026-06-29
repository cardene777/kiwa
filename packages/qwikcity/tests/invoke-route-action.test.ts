import { describe, expect, it } from 'vitest';
import {
  invokeRouteAction,
  QWIK_FAIL_SYMBOL,
  QWIK_REDIRECT_SYMBOL,
  type RouteActionFunction,
} from '../src/invoke-route-action.js';

describe('invokeRouteAction', () => {
  it('T-QA-001 正常系: action returns plain object', async () => {
    const action: RouteActionFunction<{ name: string }, { ok: true; name: string }> = async ({ name }) => ({ ok: true, name });
    const { result, fail, redirect, error } = await invokeRouteAction({
      action,
      formValues: { name: 'kiwa' },
    });
    expect(error).toBeUndefined();
    expect(fail).toBeNull();
    expect(redirect).toBeNull();
    expect(result).toEqual({ ok: true, name: 'kiwa' });
  });

  it('T-QA-002 fail() signal: validation failure captured into result.fail', async () => {
    const action: RouteActionFunction<{ email?: string }> = async ({ email }, event) => {
      if (typeof email !== 'string') return event.fail(400, { error: 'email required' });
      return { ok: true };
    };
    const { fail, result } = await invokeRouteAction({
      action,
      formValues: {},
    });
    expect(result).toBeUndefined();
    expect(fail?.[QWIK_FAIL_SYMBOL]).toBe(true);
    expect(fail?.status).toBe(400);
    expect(fail?.data).toEqual({ error: 'email required' });
  });

  it('T-QA-003 redirect throw via event.redirect → captured into result.redirect', async () => {
    const action: RouteActionFunction = async (_form, event) => {
      event.redirect(303, '/dashboard');
    };
    const { redirect, result } = await invokeRouteAction({
      action,
      formValues: {},
    });
    expect(result).toBeUndefined();
    expect(redirect?.[QWIK_REDIRECT_SYMBOL]).toBe(true);
    expect(redirect?.status).toBe(303);
    expect(redirect?.location).toBe('/dashboard');
  });

  it('T-QA-004 cookies seed + write captured via env.cookies', async () => {
    const action: RouteActionFunction = async (_form, event) => {
      const prev = event.cookie.get('session');
      event.cookie.set('telemetry', 'tid_1');
      return { prev: prev?.value };
    };
    const { result, env } = await invokeRouteAction({
      action,
      formValues: {},
      cookies: { session: 'sid_42' },
    });
    expect(result).toEqual({ prev: 'sid_42' });
    expect(env.cookies.get('telemetry')).toBe('tid_1');
  });

  it('T-QA-005 cookies.delete reflected in env.cookies', async () => {
    const action: RouteActionFunction = async (_form, event) => {
      event.cookie.delete('stale');
      return {};
    };
    const { env } = await invokeRouteAction({
      action,
      formValues: {},
      cookies: { stale: 'old', session: 'sid' },
    });
    expect(env.cookies.get('stale')).toBeUndefined();
    expect(env.cookies.get('session')).toBe('sid');
  });

  it('T-QA-006 cookies.get returns null for missing cookie', async () => {
    let v: { value: string } | null = { value: 'unset' };
    const action: RouteActionFunction = async (_form, event) => {
      v = event.cookie.get('missing');
      return {};
    };
    await invokeRouteAction({ action, formValues: {} });
    expect(v).toBeNull();
  });

  it('T-QA-007 headers seed normalized to lowercase, accessible via event.headers', async () => {
    let auth: string | undefined;
    const action: RouteActionFunction = async (_form, event) => {
      auth = event.headers.get('authorization');
      return {};
    };
    await invokeRouteAction({
      action,
      formValues: {},
      headers: { Authorization: 'Bearer tok_1' },
    });
    expect(auth).toBe('Bearer tok_1');
  });

  it('T-QA-008 url default + override', async () => {
    let u: string | undefined;
    const action: RouteActionFunction = async (_form, event) => {
      u = event.url.href;
      return {};
    };
    await invokeRouteAction({ action, formValues: {}, url: 'http://localhost:5173/products/42' });
    expect(u).toBe('http://localhost:5173/products/42');
  });

  it('T-QA-009 異常系: non-redirect throw becomes raw error', async () => {
    const action: RouteActionFunction = async () => {
      throw new Error('db down');
    };
    const { error } = await invokeRouteAction({ action, formValues: {} });
    expect((error as Error).message).toBe('db down');
  });
});
