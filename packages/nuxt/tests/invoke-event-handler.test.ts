import { describe, expect, it } from 'vitest';
import {
  invokeEventHandler,
  NUXT_REDIRECT_SYMBOL,
  type EventHandlerFunction,
} from '../src/invoke-event-handler.js';

describe('invokeEventHandler', () => {
  it('T-NX-001 正常系: handler returns JSON, env stays default', async () => {
    const handler: EventHandlerFunction<{ ok: boolean }> = async () => ({ ok: true });
    const { result, error, redirect, env } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/health',
    });
    expect(error).toBeUndefined();
    expect(redirect).toBeNull();
    expect(result).toEqual({ ok: true });
    expect(env.status).toBe(200);
    expect(env.responseHeaders.size).toBe(0);
  });

  it('T-NX-002 query: query params are parsed from the URL', async () => {
    let captured: Record<string, string | string[]> = {};
    const handler: EventHandlerFunction = async (event) => {
      captured = { ...event.query };
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/search?q=kiwa&page=2',
    });
    expect(captured.q).toBe('kiwa');
    expect(captured.page).toBe('2');
  });

  it('T-NX-003 query: same-key repeats become an array', async () => {
    let q: unknown;
    const handler: EventHandlerFunction = async (event) => {
      q = event.query.tag;
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/items?tag=a&tag=b&tag=c',
    });
    expect(q).toEqual(['a', 'b', 'c']);
  });

  it('T-NX-004 query override: explicit query option wins over URL parsing', async () => {
    let q: unknown;
    const handler: EventHandlerFunction = async (event) => {
      q = event.query.locale;
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x?locale=en',
      query: { locale: 'ja' },
    });
    expect(q).toBe('ja');
  });

  it('T-NX-005 body: arbitrary JSON body is passed through verbatim', async () => {
    let body: unknown;
    const handler: EventHandlerFunction = async (event) => {
      body = event.body;
      return { received: true };
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/items',
      method: 'POST',
      body: { name: 'kiwa', price: 100 },
    });
    expect(body).toEqual({ name: 'kiwa', price: 100 });
  });

  it('T-NX-006 redirect: sendRedirect throws NUXT_REDIRECT_SYMBOL signal', async () => {
    const handler: EventHandlerFunction = async (event) => {
      if (!event.cookies.get('session')) {
        event.sendRedirect('/login', 302);
      }
      return { ok: true };
    };
    const { result, redirect } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/secure',
    });
    expect(result).toBeUndefined();
    expect(redirect?.url).toBe('/login');
    expect(redirect?.status).toBe(302);
    expect(redirect?.[NUXT_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-NX-007 redirect default status 302 when not specified', async () => {
    const handler: EventHandlerFunction = async (event) => {
      event.sendRedirect('/x');
      return {};
    };
    const { redirect } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
    });
    expect(redirect?.status).toBe(302);
  });

  it('T-NX-008 setHeader: response headers captured + lowercased', async () => {
    const handler: EventHandlerFunction = async (event) => {
      event.setHeader('Cache-Control', 'no-store');
      event.setHeader('X-Trace-Id', 'tid_7');
      return {};
    };
    const { env } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
    });
    expect(env.responseHeaders.get('cache-control')).toBe('no-store');
    expect(env.responseHeaders.get('x-trace-id')).toBe('tid_7');
  });

  it('T-NX-009 setCookie: cookie writes captured by name', async () => {
    const handler: EventHandlerFunction = async (event) => {
      event.setCookie('lang', 'ja');
      return {};
    };
    const { env } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
    });
    expect(env.responseCookies.get('lang')).toBe('ja');
  });

  it('T-NX-010 setStatusCode: 201 propagates to env.status', async () => {
    const handler: EventHandlerFunction = async (event) => {
      event.setStatusCode(201);
      return { created: true };
    };
    const { env } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
      method: 'POST',
    });
    expect(env.status).toBe(201);
  });

  it('T-NX-011 異常系: non-redirect error surfaces via error', async () => {
    const handler: EventHandlerFunction = async () => {
      throw new Error('db down');
    };
    const { result, redirect, error } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
    });
    expect(result).toBeUndefined();
    expect(redirect).toBeNull();
    expect((error as Error).message).toBe('db down');
  });

  it('T-NX-012 headers seed: incoming headers normalized to lowercase', async () => {
    let auth: string | undefined;
    const handler: EventHandlerFunction = async (event) => {
      auth = event.headers.get('authorization');
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
      headers: { Authorization: 'Bearer abc' },
    });
    expect(auth).toBe('Bearer abc');
  });

  it('T-NX-013 method default: GET if omitted', async () => {
    let m: string | undefined;
    const handler: EventHandlerFunction = async (event) => {
      m = event.method;
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/x',
    });
    expect(m).toBe('GET');
  });

  it('T-NX-014 path: pathname + search exposed as event.path', async () => {
    let p: string | undefined;
    const handler: EventHandlerFunction = async (event) => {
      p = event.path;
      return {};
    };
    await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/items?page=3',
    });
    expect(p).toBe('/api/items?page=3');
  });
});
