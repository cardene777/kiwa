import { describe, expect, it } from 'vitest';
import {
  invokeAction,
  fail,
  redirect,
  SK_FAIL_SYMBOL,
  SK_REDIRECT_SYMBOL,
  type ActionFunction,
} from '../src/index.js';

describe('invokeAction', () => {
  it('T-SKA-001 正常系: action returns plain object', async () => {
    const action: ActionFunction<{ ok: true }> = async () => ({ ok: true });
    const { result, fail: f, redirect: r, error } = await invokeAction({
      action,
      url: 'http://localhost:5173/',
    });
    expect(error).toBeUndefined();
    expect(f).toBeNull();
    expect(r).toBeNull();
    expect(result).toEqual({ ok: true });
  });

  it('T-SKA-002 formData: parsed via standard Request.formData()', async () => {
    let email: FormDataEntryValue | null = null;
    const action: ActionFunction = async (event) => {
      const fd = await event.request.formData();
      email = fd.get('email');
      return {};
    };
    await invokeAction({
      action,
      url: 'http://localhost:5173/',
      formData: { email: 'user@example.com' },
    });
    expect(email).toBe('user@example.com');
  });

  it('T-SKA-003 fail signal: ActionFailure captured into result.fail', async () => {
    const action: ActionFunction = async (event) => {
      const fd = await event.request.formData();
      const email = fd.get('email');
      if (typeof email !== 'string') {
        return fail(400, { error: 'email required' });
      }
      return { ok: true };
    };
    const { result, fail: f } = await invokeAction({
      action,
      url: 'http://localhost:5173/',
    });
    expect(result).toBeUndefined();
    expect(f?.[SK_FAIL_SYMBOL]).toBe(true);
    expect(f?.status).toBe(400);
    expect(f?.data).toEqual({ error: 'email required' });
  });

  it('T-SKA-004 redirect throw: captured into result.redirect', async () => {
    const action: ActionFunction = async () => {
      throw redirect(303, '/dashboard');
    };
    const { result, redirect: r } = await invokeAction({
      action,
      url: 'http://localhost:5173/login',
    });
    expect(result).toBeUndefined();
    expect(r?.[SK_REDIRECT_SYMBOL]).toBe(true);
    expect(r?.location).toBe('/dashboard');
  });

  it('T-SKA-005 cookies: action can read + write cookies', async () => {
    const action: ActionFunction = async (event) => {
      const prev = event.cookies.get('count');
      const next = String(Number(prev ?? '0') + 1);
      event.cookies.set('count', next);
      return { next };
    };
    const { result, env } = await invokeAction({
      action,
      url: 'http://localhost:5173/',
      cookies: { count: '3' },
    });
    expect(result).toEqual({ next: '4' });
    expect(env.cookies.get('count')).toBe('4');
  });

  it('T-SKA-006 異常系: non-signal throw captured into result.error', async () => {
    const action: ActionFunction = async () => {
      throw new Error('db down');
    };
    const { error } = await invokeAction({
      action,
      url: 'http://localhost:5173/',
    });
    expect((error as Error).message).toBe('db down');
  });

  it('T-SKA-007a cookies.delete during action', async () => {
    const action: ActionFunction = async (event) => {
      event.cookies.delete('telemetry');
      return {};
    };
    const { env } = await invokeAction({
      action,
      url: 'http://localhost:5173/',
      cookies: { telemetry: 'tid_old', session: 'sid_42' },
    });
    expect(env.cookies.get('telemetry')).toBeUndefined();
    expect(env.cookies.get('session')).toBe('sid_42');
  });

  it('T-SKA-007 method default POST + locals access', async () => {
    let m: string | undefined;
    let role: unknown;
    const action: ActionFunction = async (event) => {
      m = event.request.method;
      role = (event.locals as { role?: string }).role;
      return {};
    };
    await invokeAction({
      action,
      url: 'http://localhost:5173/',
      locals: { role: 'admin' },
    });
    expect(m).toBe('POST');
    expect(role).toBe('admin');
  });
});
