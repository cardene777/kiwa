// setupSvelteKitHooksEnv unified env builder tests (Issue #559、 v1.1).
//
// 4 hook (handle / handleError / handleFetch / locals injection) を共通 env で
// invoke できる unified helper。 既存 invokeHandle / invokeHandleFetch /
// invokeHandleError は backward compat 維持、 setupSvelteKitHooksEnv は new entry。

import { describe, expect, it } from 'vitest';
import {
  setupSvelteKitHooksEnv,
  sequence,
  type HandleFunction,
  type HandleFetchFunction,
  type HandleErrorFunction,
} from '../src/index.js';

describe('setupSvelteKitHooksEnv', () => {
  it('T-SKE-001 正常系: env を build して runHandle で handle 実行', async () => {
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const env = setupSvelteKitHooksEnv({
      url: 'http://localhost:5173/foo',
      cookies: { session: 'sid_42' },
    });
    const { response, resolveCalled } = await env.runHandle(handle);
    expect(resolveCalled).toBe(true);
    expect(response.status).toBe(200);
  });

  it('T-SKE-002 env.locals は arbitrary shape を inject 可能 (auth user mock)', async () => {
    interface AppLocals extends Record<string, unknown> {
      user: { id: string; role: string } | null;
      requestId: string;
    }
    const env = setupSvelteKitHooksEnv<AppLocals>({
      url: 'http://localhost:5173/dashboard',
      locals: { user: { id: 'u1', role: 'admin' }, requestId: 'req-001' },
    });
    let observed: AppLocals | null = null;
    const handle: HandleFunction<AppLocals> = async ({ event, resolve }) => {
      observed = { ...event.locals };
      return resolve(event);
    };
    await env.runHandle(handle);
    expect(observed).not.toBeNull();
    expect(observed!.user).toEqual({ id: 'u1', role: 'admin' });
    expect(observed!.requestId).toBe('req-001');
  });

  it('T-SKE-003 同 env を再利用して runHandleError 実行 — event.url / locals 共有', async () => {
    interface AppLocals extends Record<string, unknown> {
      requestId: string;
    }
    const env = setupSvelteKitHooksEnv<AppLocals>({
      url: 'http://localhost:5173/items/42',
      locals: { requestId: 'req-007' },
    });
    let captured: { path: string; locals: AppLocals } | null = null;
    const handleError: HandleErrorFunction<AppLocals> = ({ event }) => {
      captured = { path: event.url.pathname, locals: { ...event.locals } };
    };
    const { report } = await env.runHandleError(handleError, {
      error: new Error('boom'),
      status: 500,
      message: 'Internal Server Error',
    });
    expect(report).toBeUndefined();
    expect(captured).not.toBeNull();
    expect(captured!.path).toBe('/items/42');
    expect(captured!.locals.requestId).toBe('req-007');
  });

  it('T-SKE-004 同 env を再利用して runHandleFetch 実行 — locals 共有 + downstream rewrite', async () => {
    interface AppLocals extends Record<string, unknown> {
      apiToken: string;
    }
    const env = setupSvelteKitHooksEnv<AppLocals>({
      url: 'http://localhost:5173/api-call',
      locals: { apiToken: 'tok_abc' },
    });
    const handleFetch: HandleFetchFunction<AppLocals> = async ({ event, request, fetch }) => {
      const r = new Request(request, {
        headers: { authorization: `Bearer ${event.locals.apiToken}` },
      });
      return fetch(r);
    };
    const { downstreamRequest } = await env.runHandleFetch(handleFetch, {
      fetchUrl: 'https://api.example.com/v1/me',
    });
    expect(downstreamRequest?.headers.get('authorization')).toBe('Bearer tok_abc');
  });

  it('T-SKE-005 cookies write が env.cookies に persist (handle 経由)', async () => {
    const env = setupSvelteKitHooksEnv({
      url: 'http://localhost:5173/',
      cookies: { old: 'value' },
    });
    const handle: HandleFunction = async ({ event, resolve }) => {
      event.cookies.set('telemetry', 'tid_42');
      event.cookies.delete('old');
      return resolve(event);
    };
    await env.runHandle(handle);
    expect(env.cookies.get('telemetry')).toBe('tid_42');
    expect(env.cookies.get('old')).toBeUndefined();
  });

  it('T-SKE-006 env reset で cookies / locals を初期状態に戻す', async () => {
    const env = setupSvelteKitHooksEnv({
      url: 'http://localhost:5173/',
      cookies: { session: 'initial' },
      locals: { count: 0 },
    });
    await env.runHandle(async ({ event, resolve }) => {
      event.cookies.set('session', 'mutated');
      (event.locals as { count: number }).count = 99;
      return resolve(event);
    });
    expect(env.cookies.get('session')).toBe('mutated');
    env.reset();
    expect(env.cookies.get('session')).toBe('initial');
    expect((env.locals as { count: number }).count).toBe(0);
  });

  it('T-SKE-007 異常系: runHandle 内 throw → error capture + 500', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handle: HandleFunction = async () => {
      throw new Error('crash');
    };
    const { response, error } = await env.runHandle(handle);
    expect((error as Error).message).toBe('crash');
    expect(response.status).toBe(500);
  });

  it('T-SKE-008 runHandle resolveResponse に固定 Response 渡し', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const fixed = new Response('fixed', { status: 202 });
    const { response } = await env.runHandle(handle, fixed);
    expect(response.status).toBe(202);
    expect(await response.text()).toBe('fixed');
  });

  it('T-SKE-008b runHandle resolveResponse を関数で渡すと event を受け取って Response を返す', async () => {
    // The `typeof resolveResponse === 'function'` branch: the fixed-Response
    // form was covered by T-SKE-008; the function form was not, and calling
    // it is the point of the function form.
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/dynamic' });
    const handle: HandleFunction = async ({ event, resolve }) => resolve(event);
    const { response } = await env.runHandle(handle, (event) =>
      new Response(`resolved:${event.url.pathname}`, { status: 201 }),
    );
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('resolved:/dynamic');
  });

  it('T-SKE-009 runHandleFetch downstreamFetch 未指定で default downstream-ok response', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handleFetch: HandleFetchFunction = async ({ request, fetch }) => fetch(request);
    const { response, downstreamCalled } = await env.runHandleFetch(handleFetch, {
      fetchUrl: 'https://api.example.com/x',
    });
    expect(downstreamCalled).toBe(true);
    expect(await response.text()).toBe('downstream-ok');
  });

  it('T-SKE-009b runHandleFetch downstreamFetch 指定で custom response を返す', async () => {
    // The `typeof opts.downstreamFetch !== 'undefined'` branch was the mirror
    // of T-SKE-009: T-SKE-009 covered the undefined arm, this one covers the
    // defined arm.
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handleFetch: HandleFetchFunction = async ({ request, fetch }) => fetch(request);
    const { response } = await env.runHandleFetch(handleFetch, {
      fetchUrl: 'https://api.example.com/x',
      downstreamFetch: async () => new Response('custom', { status: 418 }),
    });
    expect(response.status).toBe(418);
    expect(await response.text()).toBe('custom');
  });

  it('T-SKE-010 runHandleError throw → thrown capture', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handleError: HandleErrorFunction = () => {
      throw new Error('logger crashed');
    };
    const { thrown } = await env.runHandleError(handleError, {
      error: new Error('original'),
      status: 500,
      message: 'ISE',
    });
    expect((thrown as Error).message).toBe('logger crashed');
  });

  it('T-SKE-011 runHandleFetch 内 throw → 500 + error capture', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handleFetch: HandleFetchFunction = async () => {
      throw new Error('fetch crash');
    };
    const { response, error } = await env.runHandleFetch(handleFetch, {
      fetchUrl: 'https://api.example.com/x',
    });
    expect((error as Error).message).toBe('fetch crash');
    expect(response.status).toBe(500);
  });

  it('T-SKE-012 buildEvent / cookies getter / locals getter で env 状態を観測', async () => {
    interface AppLocals extends Record<string, unknown> {
      count: number;
    }
    const env = setupSvelteKitHooksEnv<AppLocals>({
      url: 'http://localhost:5173/x',
      cookies: { a: '1' },
      locals: { count: 5 },
      routeId: '/x',
      params: { x: 'y' },
      platform: { foo: 'bar' },
      headers: { 'x-custom': 'v' },
      method: 'POST',
    });
    const event = env.buildEvent();
    expect(event.url.pathname).toBe('/x');
    expect(event.route.id).toBe('/x');
    expect(event.params).toEqual({ x: 'y' });
    expect(event.platform).toEqual({ foo: 'bar' });
    expect(event.request.method).toBe('POST');
    expect(event.request.headers.get('x-custom')).toBe('v');
    // Both faces of the shared cookieStore — env-level (for the test to
    // observe) and event-level (for the SvelteKit hook body to read).
    expect(env.cookies.get('a')).toBe('1');
    expect(event.cookies.get('a')).toBe('1');
    expect(env.locals.count).toBe(5);
  });

  it('T-SKE-014 runHandleFetch の fetchMethod / fetchHeaders が downstream に伝搬', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const handleFetch: HandleFetchFunction = async ({ request, fetch }) => fetch(request);
    const { downstreamRequest } = await env.runHandleFetch(handleFetch, {
      fetchUrl: 'https://api.example.com/x',
      fetchMethod: 'POST',
      fetchHeaders: { 'x-tenant': 'acme' },
    });
    expect(downstreamRequest?.method).toBe('POST');
    expect(downstreamRequest?.headers.get('x-tenant')).toBe('acme');
  });

  it('T-SKE-013 cookies / locals 省略 → 空 Map + 空 object でも動作', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    expect(env.cookies.size).toBe(0);
    expect(Object.keys(env.locals).length).toBe(0);
    const { resolveCalled } = await env.runHandle(async ({ event, resolve }) => resolve(event));
    expect(resolveCalled).toBe(true);
  });
});

describe('sequence (handle chain composer)', () => {
  it('T-SKQ-001 正常系: 2 つの handle を chain して順次実行', async () => {
    const order: string[] = [];
    const h1: HandleFunction = async ({ event, resolve }) => {
      order.push('h1-before');
      const r = await resolve(event);
      order.push('h1-after');
      return r;
    };
    const h2: HandleFunction = async ({ event, resolve }) => {
      order.push('h2-before');
      const r = await resolve(event);
      order.push('h2-after');
      return r;
    };
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    await env.runHandle(sequence(h1, h2));
    expect(order).toEqual(['h1-before', 'h2-before', 'h2-after', 'h1-after']);
  });

  it('T-SKQ-002 chain 中の locals 書込が後続 handle で観測される', async () => {
    interface AppLocals extends Record<string, unknown> {
      user: { id: string } | null;
      stage: string;
    }
    const auth: HandleFunction<AppLocals> = async ({ event, resolve }) => {
      event.locals.user = { id: 'u1' };
      return resolve(event);
    };
    let observedUser: AppLocals['user'] = null;
    const logger: HandleFunction<AppLocals> = async ({ event, resolve }) => {
      observedUser = event.locals.user;
      event.locals.stage = 'logged';
      return resolve(event);
    };
    const env = setupSvelteKitHooksEnv<AppLocals>({
      url: 'http://localhost:5173/',
      locals: { user: null, stage: 'init' },
    });
    const { localsAtResolve } = await env.runHandle(sequence(auth, logger));
    expect(observedUser).toEqual({ id: 'u1' });
    expect(localsAtResolve?.stage).toBe('logged');
  });

  it('T-SKQ-003 chain 途中の handle が short-circuit → 後続 handle は呼ばれない', async () => {
    const calls: string[] = [];
    const gate: HandleFunction = async ({ event: _event, resolve: _resolve }) => {
      calls.push('gate');
      return new Response('blocked', { status: 403 });
    };
    const downstream: HandleFunction = async ({ event, resolve }) => {
      calls.push('downstream');
      return resolve(event);
    };
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/admin' });
    const { response, resolveCalled } = await env.runHandle(sequence(gate, downstream));
    expect(response.status).toBe(403);
    expect(resolveCalled).toBe(false);
    expect(calls).toEqual(['gate']);
  });

  it('T-SKQ-004 sequence(single) — 1 handle のみ渡しても通常実行', async () => {
    const h: HandleFunction = async ({ event, resolve }) => resolve(event);
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const { resolveCalled, response } = await env.runHandle(sequence(h));
    expect(resolveCalled).toBe(true);
    expect(response.status).toBe(200);
  });

  it('T-SKQ-005 sequence() 引数なし → resolve を直接 invoke (no-op chain)', async () => {
    const env = setupSvelteKitHooksEnv({ url: 'http://localhost:5173/' });
    const { resolveCalled, response } = await env.runHandle(sequence());
    expect(resolveCalled).toBe(true);
    expect(response.status).toBe(200);
  });
});
