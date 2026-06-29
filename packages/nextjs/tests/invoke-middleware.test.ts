import { describe, expect, it } from 'vitest';
import {
  invokeMiddleware,
  middlewareActions,
  MIDDLEWARE_ACTION_SYMBOL,
  type MiddlewareFunction,
} from '../src/invoke-middleware.js';

describe('invokeMiddleware', () => {
  it('T-MW-001 正常系: pass-through middleware returns next() with empty response state', async () => {
    const middleware: MiddlewareFunction = async () => middlewareActions.next();
    const { env, error } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/dashboard',
    });
    expect(error).toBeUndefined();
    expect(env.action.kind).toBe('next');
    expect(env.action[MIDDLEWARE_ACTION_SYMBOL]).toBe(true);
    expect(env.responseHeaders.size).toBe(0);
    expect(env.responseCookies.size).toBe(0);
  });

  it('T-MW-002 redirect: auth guard sends unauthed user to /login', async () => {
    const middleware: MiddlewareFunction = async (req) => {
      if (!req.cookies.get('session')) {
        return middlewareActions.redirect('/login');
      }
      return middlewareActions.next();
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/dashboard',
    });
    expect(env.action.kind).toBe('redirect');
    expect(env.action.url).toBe('/login');
    expect(env.action.status).toBe(307);
  });

  it('T-MW-003 redirect skipped when session cookie is present', async () => {
    const middleware: MiddlewareFunction = async (req) => {
      if (!req.cookies.get('session')) {
        return middlewareActions.redirect('/login');
      }
      return middlewareActions.next();
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/dashboard',
      cookies: { session: 'sid_42' },
    });
    expect(env.action.kind).toBe('next');
  });

  it('T-MW-004 rewrite: locale prefix rewrite preserves visible URL', async () => {
    const middleware: MiddlewareFunction = async (req) => {
      const locale = req.cookies.get('locale') ?? 'en';
      return middlewareActions.rewrite(`/${locale}${req.nextUrl.pathname}`);
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/products',
      cookies: { locale: 'ja' },
    });
    expect(env.action.kind).toBe('rewrite');
    expect(env.action.url).toBe('/ja/products');
  });

  it('T-MW-005 headers: outgoing response headers captured via seam.setHeader', async () => {
    const middleware: MiddlewareFunction = async (_req, env) => {
      env.setHeader('X-Request-Id', 'req-1');
      env.setHeader('X-Frame-Options', 'DENY');
      return middlewareActions.next();
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
    });
    expect(env.responseHeaders.get('x-request-id')).toBe('req-1');
    expect(env.responseHeaders.get('x-frame-options')).toBe('DENY');
  });

  it('T-MW-006 cookies: outgoing cookies captured via seam.setCookie', async () => {
    const middleware: MiddlewareFunction = async (_req, env) => {
      env.setCookie('telemetry_id', 'tid_77');
      return middlewareActions.next();
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
    });
    expect(env.responseCookies.get('telemetry_id')).toBe('tid_77');
  });

  it('T-MW-007 json short-circuit: API-style middleware returns JSON body + status', async () => {
    const middleware: MiddlewareFunction = async (req) => {
      if (req.nextUrl.pathname === '/api/health') {
        return middlewareActions.json({ ok: true }, 200);
      }
      return middlewareActions.next();
    };
    const { env } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/api/health',
    });
    expect(env.action.kind).toBe('json');
    expect(env.action.body).toEqual({ ok: true });
    expect(env.action.status).toBe(200);
  });

  it('T-MW-008 geo: country-based gate uses req.geo.country', async () => {
    const middleware: MiddlewareFunction = async (req) => {
      if (req.geo.country === 'XX') {
        return middlewareActions.redirect('/blocked');
      }
      return middlewareActions.next();
    };
    const { env: enJp } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
      geo: { country: 'JP' },
    });
    expect(enJp.action.kind).toBe('next');
    const { env: enXx } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
      geo: { country: 'XX' },
    });
    expect(enXx.action.kind).toBe('redirect');
    expect(enXx.action.url).toBe('/blocked');
  });

  it('T-MW-009 異常系: middleware throw surfaces via error + action defaults to noop', async () => {
    const middleware: MiddlewareFunction = async () => {
      throw new Error('boom');
    };
    const { env, error } = await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
    });
    expect((error as Error).message).toBe('boom');
    expect(env.action.kind).toBe('noop');
  });

  it('T-MW-010 nextUrl: search params + pathname are parsed from the seeded URL', async () => {
    let captured: { pathname: string; q: string | null } = { pathname: '', q: null };
    const middleware: MiddlewareFunction = async (req) => {
      captured = {
        pathname: req.nextUrl.pathname,
        q: req.nextUrl.searchParams.get('q'),
      };
      return middlewareActions.next();
    };
    await invokeMiddleware({
      middleware,
      url: 'https://example.com/search?q=kiwa',
    });
    expect(captured.pathname).toBe('/search');
    expect(captured.q).toBe('kiwa');
  });

  it('T-MW-011 headers seed: incoming headers are normalized to lowercase keys', async () => {
    let auth: string | undefined;
    const middleware: MiddlewareFunction = async (req) => {
      auth = req.headers.get('authorization');
      return middlewareActions.next();
    };
    await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
      headers: { Authorization: 'Bearer tok_1' },
    });
    expect(auth).toBe('Bearer tok_1');
  });

  it('T-MW-012 method override: POST request', async () => {
    let method: string | undefined;
    const middleware: MiddlewareFunction = async (req) => {
      method = req.method;
      return middlewareActions.next();
    };
    await invokeMiddleware({
      middleware,
      url: 'https://example.com/',
      method: 'POST',
    });
    expect(method).toBe('POST');
  });
});
