import { describe, expect, it } from 'vitest';
import {
  invokeLoad,
  redirect,
  error,
  SK_REDIRECT_SYMBOL,
  SK_ERROR_SYMBOL,
  type LoadFunction,
} from '../src/invoke-load.js';

describe('invokeLoad', () => {
  it('T-SKL-001 正常系: load returns data, env empty', async () => {
    const load: LoadFunction<{ msg: string }> = async () => ({ msg: 'hello' });
    const { data, redirect: r, error: e, env } = await invokeLoad({
      load,
      url: 'http://localhost:5173/',
    });
    expect(e).toBeUndefined();
    expect(r).toBeNull();
    expect(data).toEqual({ msg: 'hello' });
    expect(env.responseHeaders.size).toBe(0);
  });

  it('T-SKL-002 params: route params accessible via event.params', async () => {
    let id: string | undefined;
    const load: LoadFunction = async (event) => {
      id = event.params.id;
      return {};
    };
    await invokeLoad({
      load,
      url: 'http://localhost:5173/users/42',
      params: { id: '42' },
    });
    expect(id).toBe('42');
  });

  it('T-SKL-003 url: parsed URL with searchParams', async () => {
    let q: string | null = null;
    const load: LoadFunction = async (event) => {
      q = event.url.searchParams.get('q');
      return {};
    };
    await invokeLoad({
      load,
      url: 'http://localhost:5173/search?q=kiwa',
    });
    expect(q).toBe('kiwa');
  });

  it('T-SKL-004 cookies: get / set / delete / getAll', async () => {
    const load: LoadFunction = async (event) => {
      const session = event.cookies.get('session');
      event.cookies.set('telemetry', 'tid_1');
      event.cookies.delete('stale');
      const all = event.cookies.getAll();
      return { session, all };
    };
    const { data, env } = await invokeLoad({
      load,
      url: 'http://localhost:5173/',
      cookies: { session: 'sid_42', stale: 'gone' },
    });
    expect((data as { session?: string }).session).toBe('sid_42');
    expect(env.cookies.get('telemetry')).toBe('tid_1');
    expect(env.cookies.get('stale')).toBeUndefined();
  });

  it('T-SKL-005 setHeaders: response headers captured + lowercased', async () => {
    const load: LoadFunction = async (event) => {
      event.setHeaders({ 'Cache-Control': 'max-age=60', 'X-Trace': 't_1' });
      return {};
    };
    const { env } = await invokeLoad({
      load,
      url: 'http://localhost:5173/',
    });
    expect(env.responseHeaders.get('cache-control')).toBe('max-age=60');
    expect(env.responseHeaders.get('x-trace')).toBe('t_1');
  });

  it('T-SKL-006 redirect throw: signal captured into result.redirect', async () => {
    const load: LoadFunction = async (event) => {
      if (!event.cookies.get('session')) throw redirect(303, '/login');
      return {};
    };
    const { data, redirect: r } = await invokeLoad({
      load,
      url: 'http://localhost:5173/dashboard',
    });
    expect(data).toBeUndefined();
    expect(r?.[SK_REDIRECT_SYMBOL]).toBe(true);
    expect(r?.status).toBe(303);
    expect(r?.location).toBe('/login');
  });

  it('T-SKL-007 error throw: signal captured into result.error', async () => {
    const load: LoadFunction = async () => {
      throw error(404, 'Not Found');
    };
    const { error: e } = await invokeLoad({
      load,
      url: 'http://localhost:5173/x',
    });
    expect((e as { [SK_ERROR_SYMBOL]?: true })[SK_ERROR_SYMBOL]).toBe(true);
    expect((e as { status?: number }).status).toBe(404);
  });

  it('T-SKL-008 異常系: non-signal throw becomes raw error', async () => {
    const load: LoadFunction = async () => {
      throw new Error('boom');
    };
    const { error: e } = await invokeLoad({
      load,
      url: 'http://localhost:5173/',
    });
    expect((e as Error).message).toBe('boom');
  });

  it('T-SKL-009 locals: server hooks set values become accessible to load', async () => {
    let user: unknown;
    const load: LoadFunction = async (event) => {
      user = event.locals.user;
      return {};
    };
    await invokeLoad({
      load,
      url: 'http://localhost:5173/',
      locals: { user: { id: 1 } },
    });
    expect(user).toEqual({ id: 1 });
  });

  it('T-SKL-010 fetch: custom fetch is forwarded to event.fetch', async () => {
    let called = false;
    const fake = (async () => {
      called = true;
      return new Response('{}', { headers: { 'content-type': 'application/json' } });
    }) as typeof globalThis.fetch;
    const load: LoadFunction = async (event) => {
      await event.fetch('http://localhost/x');
      return {};
    };
    await invokeLoad({
      load,
      url: 'http://localhost:5173/',
      fetch: fake,
    });
    expect(called).toBe(true);
  });
});
