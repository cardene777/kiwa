import { describe, expect, it } from 'vitest';
import {
  invokeServerFunction,
  redirect,
  SOLIDSTART_REDIRECT_SYMBOL,
  type ServerFunctionFunction,
} from '../src/invoke-server-function.js';

describe('invokeServerFunction', () => {
  it('T-SS-001 正常系: server function returns plain object', async () => {
    const fn: ServerFunctionFunction<readonly [string], { ok: true; name: string }> = async (name) => ({ ok: true, name });
    const { result, error, redirect: r } = await invokeServerFunction({ fn, args: ['kiwa'] });
    expect(error).toBeUndefined();
    expect(r).toBeNull();
    expect(result).toEqual({ ok: true, name: 'kiwa' });
  });

  it('T-SS-002 default args = empty array', async () => {
    const fn: ServerFunctionFunction = async () => 'no args';
    const { result } = await invokeServerFunction({ fn });
    expect(result).toBe('no args');
  });

  it('T-SS-003 redirect signal: function throws redirect(), env captures it', async () => {
    const fn: ServerFunctionFunction = async () => {
      throw redirect('/dashboard', 302);
    };
    const { result, redirect: r, error } = await invokeServerFunction({ fn });
    expect(result).toBeUndefined();
    expect(error).toBeUndefined();
    expect(r?.url).toBe('/dashboard');
    expect(r?.status).toBe(302);
    expect(r?.[SOLIDSTART_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-SS-004 redirect default status 302', async () => {
    const fn: ServerFunctionFunction = async () => {
      throw redirect('/x');
    };
    const { redirect: r } = await invokeServerFunction({ fn });
    expect(r?.status).toBe(302);
  });

  it('T-SS-005 異常系: non-redirect throw surfaces as error', async () => {
    const fn: ServerFunctionFunction = async () => {
      throw new Error('db down');
    };
    const { error } = await invokeServerFunction({ fn });
    expect((error as Error).message).toBe('db down');
  });

  it('T-SS-006 headers seed: normalized to lowercase keys', async () => {
    const fn: ServerFunctionFunction = async () => 'ok';
    const { env } = await invokeServerFunction({
      fn,
      headers: { 'Content-Type': 'application/json', 'X-CSRF': 't' },
    });
    expect(env.requestHeaders.get('content-type')).toBe('application/json');
    expect(env.requestHeaders.get('x-csrf')).toBe('t');
  });

  it('T-SS-007 cookies seed: accessible via env.requestCookies', async () => {
    const fn: ServerFunctionFunction = async () => 'ok';
    const { env } = await invokeServerFunction({
      fn,
      cookies: { session: 'sid_42' },
    });
    expect(env.requestCookies.get('session')).toBe('sid_42');
  });

  it('T-SS-008 multiple args passed in order', async () => {
    const fn: ServerFunctionFunction<readonly [number, string], string> = async (a, b) => `${a}-${b}`;
    const { result } = await invokeServerFunction({ fn, args: [42, 'kiwa'] });
    expect(result).toBe('42-kiwa');
  });
});
