import { describe, expect, it } from 'vitest';
import {
  invokeEdgeHandler,
  type EdgeFetchHandler,
} from '../src/invoke-edge-handler.js';
import { createKvNamespace } from '../src/kv-mock.js';

describe('invokeEdgeHandler', () => {
  it('T-EDGE-001 正常系: handler returns Response, ctx clean', async () => {
    const handler: EdgeFetchHandler = async () => new Response('ok', { status: 200 });
    const { response, redirect, ctx, error } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: {},
    });
    expect(error).toBeUndefined();
    expect(redirect).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
    expect(ctx.waitedPromises).toHaveLength(0);
    expect(ctx.passThroughCalled).toBe(false);
  });

  it('T-EDGE-002 env bindings forwarded verbatim', async () => {
    let kvFromEnv: unknown;
    const handler: EdgeFetchHandler = async (_req, env) => {
      kvFromEnv = env.MY_KV;
      return new Response('ok');
    };
    const kv = createKvNamespace({ greeting: 'hello' });
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: { MY_KV: kv },
    });
    expect(kvFromEnv).toBe(kv);
  });

  it('T-EDGE-003 waitUntil captures background promise without blocking', async () => {
    const handler: EdgeFetchHandler = async (_req, _env, ctx) => {
      ctx.waitUntil(Promise.resolve('background'));
      return new Response('ok');
    };
    const { ctx } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: {},
    });
    expect(ctx.waitedPromises).toHaveLength(1);
    await expect(ctx.waitedPromises[0]).resolves.toBe('background');
  });

  it('T-EDGE-004 passThroughOnException flag captured', async () => {
    const handler: EdgeFetchHandler = async (_req, _env, ctx) => {
      ctx.passThroughOnException();
      return new Response('ok');
    };
    const { ctx } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: {},
    });
    expect(ctx.passThroughCalled).toBe(true);
  });

  it('T-EDGE-005 redirect response: 3xx + location → redirect captured', async () => {
    const handler: EdgeFetchHandler = async () =>
      new Response(null, { status: 302, headers: { location: '/login' } });
    const { redirect } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/secure',
      env: {},
    });
    expect(redirect?.url).toBe('/login');
    expect(redirect?.status).toBe(302);
  });

  it('T-EDGE-006 redirect without location header → empty url', async () => {
    const handler: EdgeFetchHandler = async () => new Response(null, { status: 307 });
    const { redirect } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: {},
    });
    expect(redirect?.url).toBe('');
  });

  it('T-EDGE-007 POST formData parsed via request.formData()', async () => {
    let email: FormDataEntryValue | null = null;
    const handler: EdgeFetchHandler = async (req) => {
      const fd = await req.formData();
      email = fd.get('email');
      return new Response('ok');
    };
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/signup',
      formData: { email: 'user@example.com' },
      env: {},
    });
    expect(email).toBe('user@example.com');
  });

  it('T-EDGE-008 POST JSON body parsed', async () => {
    let body: unknown;
    const handler: EdgeFetchHandler = async (req) => {
      body = await req.json();
      return new Response('ok');
    };
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/x',
      jsonBody: { name: 'edge' },
      env: {},
    });
    expect(body).toEqual({ name: 'edge' });
  });

  it('T-EDGE-009 method default GET / POST inferred', async () => {
    let m: string | undefined;
    const handler: EdgeFetchHandler = async (req) => {
      m = req.method;
      return new Response('ok');
    };
    await invokeEdgeHandler({ handler, url: 'https://example.com/', env: {} });
    expect(m).toBe('GET');
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      formData: { x: 'y' },
      env: {},
    });
    expect(m).toBe('POST');
  });

  it('T-EDGE-010 method override DELETE', async () => {
    let m: string | undefined;
    const handler: EdgeFetchHandler = async (req) => {
      m = req.method;
      return new Response('ok');
    };
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/x',
      method: 'DELETE',
      env: {},
    });
    expect(m).toBe('DELETE');
  });

  it('T-EDGE-011 異常系: handler throw → error captured + 500 response default', async () => {
    const handler: EdgeFetchHandler = async () => {
      throw new Error('boom');
    };
    const { response, error } = await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      env: {},
    });
    expect((error as Error).message).toBe('boom');
    expect(response.status).toBe(500);
  });

  it('T-EDGE-012 headers seed forwarded', async () => {
    let auth: string | null = null;
    const handler: EdgeFetchHandler = async (req) => {
      auth = req.headers.get('authorization');
      return new Response('ok');
    };
    await invokeEdgeHandler({
      handler,
      url: 'https://example.com/',
      headers: { authorization: 'Bearer tok' },
      env: {},
    });
    expect(auth).toBe('Bearer tok');
  });
});
