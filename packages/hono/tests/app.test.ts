import { describe, expect, it } from 'vitest';
import {
  createHonoApp,
  invokeRoute,
  createContext,
  buildRequest,
  compileRoute,
  matchRoute,
  isHonoApp,
  isHonoContext,
  HONO_APP_SYMBOL,
} from '../src/app.js';

describe('createHonoApp', () => {
  it('T-H-001 exposes brand symbol + is recognized by isHonoApp', () => {
    const app = createHonoApp();
    expect(isHonoApp(app)).toBe(true);
    expect((app as unknown as { [HONO_APP_SYMBOL]: true })[HONO_APP_SYMBOL]).toBe(true);
  });

  it('T-H-002 chainable .get() registers a route entry', () => {
    const app = createHonoApp();
    const chained = app.get('/health', (c) => c.text('ok'));
    expect(chained).toBe(app);
    expect(app.routes.length).toBe(1);
    expect(app.routes[0]?.method).toBe('GET');
    expect(app.routes[0]?.pattern).toBe('/health');
  });

  it('T-H-003 supports every HTTP method + all()', () => {
    const app = createHonoApp();
    app.get('/g', (c) => c.text(''));
    app.post('/p', (c) => c.text(''));
    app.put('/u', (c) => c.text(''));
    app.delete('/d', (c) => c.text(''));
    app.patch('/pt', (c) => c.text(''));
    app.all('/a', (c) => c.text(''));
    expect(app.routes.map((r) => r.method)).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL']);
  });
});

describe('invokeRoute', () => {
  it('T-H-010 dispatches to the matching handler and returns its response', async () => {
    const app = createHonoApp();
    app.get('/hello', (c) => c.json({ ok: 1 }));
    const result = await invokeRoute({ app, method: 'GET', path: '/hello' });
    expect(result.matched).toBe(true);
    expect(result.response.status).toBe(200);
    expect(result.response.body).toEqual({ ok: 1 });
    expect(result.response.bodyKind).toBe('json');
  });

  it('T-H-011 unmatched request returns 404 spec + matched=false', async () => {
    const app = createHonoApp();
    app.get('/exists', (c) => c.text('yes'));
    const result = await invokeRoute({ app, method: 'GET', path: '/missing' });
    expect(result.matched).toBe(false);
    expect(result.response.status).toBe(404);
    expect(result.trace).toEqual([]);
  });

  it('T-H-012 captures :param route matches into c.req.param()', async () => {
    const app = createHonoApp();
    app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
    const result = await invokeRoute({ app, method: 'GET', path: '/users/42' });
    expect(result.response.body).toEqual({ id: '42' });
  });

  it('T-H-013 wildcard * matches any path suffix', async () => {
    const app = createHonoApp();
    app.get('/api/*', (c) => c.text('caught'));
    const result = await invokeRoute({ app, method: 'GET', path: '/api/users/1/settings' });
    expect(result.matched).toBe(true);
    expect(result.response.body).toBe('caught');
  });

  it('T-H-014 method-mismatch returns 404 (route registered for other method)', async () => {
    const app = createHonoApp();
    app.post('/orders', (c) => c.json({}));
    const result = await invokeRoute({ app, method: 'GET', path: '/orders' });
    expect(result.matched).toBe(false);
  });

  it('T-H-015 all() handles every method', async () => {
    const app = createHonoApp();
    app.all('/any', (c) => c.text('any'));
    const g = await invokeRoute({ app, method: 'GET', path: '/any' });
    const p = await invokeRoute({ app, method: 'POST', path: '/any' });
    expect(g.matched).toBe(true);
    expect(p.matched).toBe(true);
  });

  it('T-H-016 handler thrown error surfaces on result.error, response is unchanged', async () => {
    const app = createHonoApp();
    app.get('/boom', () => {
      throw new Error('kaboom');
    });
    const result = await invokeRoute({ app, method: 'GET', path: '/boom' });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe('kaboom');
  });

  it('T-H-017 handler returning a response spec directly is copied to c.response', async () => {
    const app = createHonoApp();
    app.get('/direct', (c) => {
      // Handler crafts a spec by calling c.json then re-returning; but also try direct return.
      return { status: 201, body: 'x', bodyKind: 'text', headers: { 'x-foo': 'bar' } };
    });
    const result = await invokeRoute({ app, method: 'GET', path: '/direct' });
    expect(result.response.status).toBe(201);
    expect(result.response.headers['x-foo']).toBe('bar');
  });
});

describe('middleware chain', () => {
  it('T-H-020 use() middleware runs before matching handler', async () => {
    const app = createHonoApp();
    const order: string[] = [];
    app.use('/*', async (_c, next) => {
      order.push('mw:before');
      await next();
      order.push('mw:after');
    });
    app.get('/x', (c) => {
      order.push('handler');
      return c.text('done');
    });
    await invokeRoute({ app, method: 'GET', path: '/x' });
    expect(order).toEqual(['mw:before', 'handler', 'mw:after']);
  });

  it('T-H-021 middleware trace records kind+pattern for each entry', async () => {
    const app = createHonoApp();
    app.use('/*', async (_c, next) => {
      await next();
    });
    app.get('/y', (c) => c.text('yes'));
    const { trace } = await invokeRoute({ app, method: 'GET', path: '/y' });
    expect(trace.map((e) => e.kind)).toEqual(['middleware', 'handler']);
    expect(trace[0]?.pattern).toBe('/*');
    expect(trace[1]?.pattern).toBe('/y');
  });

  it('T-H-022 middleware whose pattern does not match is skipped', async () => {
    const app = createHonoApp();
    let called = false;
    app.use('/admin/*', async (_c, next) => {
      called = true;
      await next();
    });
    app.get('/public', (c) => c.text('ok'));
    await invokeRoute({ app, method: 'GET', path: '/public' });
    expect(called).toBe(false);
  });

  it('T-H-023 middleware can short-circuit by not calling next()', async () => {
    const app = createHonoApp();
    let handlerRan = false;
    app.use('/*', async (c) => {
      c.status(401);
      c.text('unauth');
    });
    app.get('/secret', () => {
      handlerRan = true;
    });
    const { response } = await invokeRoute({ app, method: 'GET', path: '/secret' });
    expect(handlerRan).toBe(false);
    expect(response.status).toBe(401);
  });

  it('T-H-024 multi-middleware run in registration order', async () => {
    const app = createHonoApp();
    const order: string[] = [];
    app.use('/*', async (_c, next) => {
      order.push('mw1:in');
      await next();
      order.push('mw1:out');
    });
    app.use('/*', async (_c, next) => {
      order.push('mw2:in');
      await next();
      order.push('mw2:out');
    });
    app.get('/z', (c) => {
      order.push('h');
      return c.text('');
    });
    await invokeRoute({ app, method: 'GET', path: '/z' });
    expect(order).toEqual(['mw1:in', 'mw2:in', 'h', 'mw2:out', 'mw1:out']);
  });

  it('T-H-025 middleware can set + handler read via c.set / c.get', async () => {
    const app = createHonoApp();
    app.use('/*', async (c, next) => {
      c.set('userId', 'u-1');
      await next();
    });
    app.get('/me', (c) => c.json({ userId: c.get('userId') }));
    const { response } = await invokeRoute({ app, method: 'GET', path: '/me' });
    expect(response.body).toEqual({ userId: 'u-1' });
  });
});

describe('route composition', () => {
  it('T-H-030 route(prefix, sub) merges routes with prefix applied', async () => {
    const sub = createHonoApp();
    sub.get('/users', (c) => c.json({ list: [] }));
    sub.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
    const app = createHonoApp();
    app.route('/api', sub);
    const listed = await invokeRoute({ app, method: 'GET', path: '/api/users' });
    const single = await invokeRoute({ app, method: 'GET', path: '/api/users/9' });
    expect(listed.response.body).toEqual({ list: [] });
    expect(single.response.body).toEqual({ id: '9' });
  });

  it('T-H-031 route(prefix, sub) also merges sub middleware with prefix', async () => {
    const sub = createHonoApp();
    let hit = 0;
    sub.use('/*', async (_c, next) => {
      hit += 1;
      await next();
    });
    sub.get('/ping', (c) => c.text('pong'));
    const app = createHonoApp();
    app.route('/v1', sub);
    await invokeRoute({ app, method: 'GET', path: '/v1/ping' });
    await invokeRoute({ app, method: 'GET', path: '/nothing' });
    expect(hit).toBe(1);
  });
});

describe('request helpers', () => {
  it('T-H-040 buildRequest parses query strings and header-name lowercase', () => {
    const req = buildRequest({ method: 'GET', url: '/x?a=1&b=two', headers: { 'X-Foo': 'bar' } });
    expect(req.queryValue('a')).toBe('1');
    expect(req.queryValue('b')).toBe('two');
    expect(req.header('x-foo')).toBe('bar');
    expect(req.header('X-Foo')).toBe('bar');
  });

  it('T-H-041 buildRequest strips scheme + host prefix from url for path', () => {
    const req = buildRequest({ method: 'GET', url: 'http://example.com/api/health?q=1' });
    expect(req.path).toBe('/api/health');
  });

  it('T-H-042 c.req.json() parses body on demand', async () => {
    const app = createHonoApp();
    app.post('/echo', async (c) => c.json(await c.req.json()));
    const { response } = await invokeRoute({
      app,
      method: 'POST',
      path: '/echo',
      body: JSON.stringify({ hi: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    expect(response.body).toEqual({ hi: 1 });
  });

  it('T-H-043 c.req.text() returns raw body string', async () => {
    const app = createHonoApp();
    app.post('/raw', async (c) => c.text(await c.req.text()));
    const { response } = await invokeRoute({
      app,
      method: 'POST',
      path: '/raw',
      body: 'hello world',
    });
    expect(response.body).toBe('hello world');
  });

  it('T-H-044 query-value returns undefined for missing key', () => {
    const req = buildRequest({ method: 'GET', url: '/z' });
    expect(req.queryValue('nope')).toBeUndefined();
  });

  it('T-H-045 query with no value → empty string', () => {
    const req = buildRequest({ method: 'GET', url: '/z?bare' });
    expect(req.queryValue('bare')).toBe('');
  });
});

describe('createContext', () => {
  it('T-H-050 exposes brand + status/header/json/text builders', () => {
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    expect(isHonoContext(c)).toBe(true);
    c.status(201).header('x-h', 'v');
    c.json({ x: 1 });
    expect(c.response.status).toBe(201);
    expect(c.response.headers['x-h']).toBe('v');
    expect(c.response.headers['content-type']).toBe('application/json');
  });

  it('T-H-051 c.text() sets content-type text/plain when not overridden', () => {
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    c.text('body');
    expect(c.response.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  it('T-H-052 c.json(body, status) overrides both body and status', () => {
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    c.json({ x: 1 }, 418);
    expect(c.response.status).toBe(418);
  });

  it('T-H-053 c.header does not clobber existing content-type', () => {
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    c.header('content-type', 'application/xml');
    c.json({});
    expect(c.response.headers['content-type']).toBe('application/xml');
  });

  it('T-H-054 c.get returns undefined for a key that was never set', () => {
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    expect(c.get('nope')).toBeUndefined();
  });
});

describe('compileRoute + matchRoute', () => {
  it('T-H-060 compileRoute captures param names', () => {
    const m = compileRoute('/blog/:slug/comments/:id');
    expect(m.paramNames).toEqual(['slug', 'id']);
  });

  it('T-H-061 matchRoute returns null on no match', () => {
    const m = compileRoute('/x');
    expect(matchRoute(m, '/y')).toBeNull();
  });

  it('T-H-062 matchRoute decodes URI-encoded param values', () => {
    const m = compileRoute('/tag/:name');
    const params = matchRoute(m, '/tag/hello%20world');
    expect(params).toEqual({ name: 'hello world' });
  });

  it('T-H-063 empty pattern matches root path', () => {
    const m = compileRoute('/');
    expect(matchRoute(m, '/')).toEqual({});
  });

  it('T-H-064 pattern with special regex chars is escaped', () => {
    const m = compileRoute('/prices.json');
    expect(matchRoute(m, '/prices.json')).toEqual({});
    expect(matchRoute(m, '/pricesXjson')).toBeNull();
  });
});

describe('app.request', () => {
  it('T-H-070 request(url) resolves to a HonoResponseSpec', async () => {
    const app = createHonoApp();
    app.get('/ping', (c) => c.text('pong'));
    const spec = await app.request('/ping');
    expect(spec.status).toBe(200);
    expect(spec.body).toBe('pong');
  });

  it('T-H-071 request(url, { method, body }) posts', async () => {
    const app = createHonoApp();
    app.post('/echo', async (c) => c.json(await c.req.json()));
    const spec = await app.request('/echo', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
      headers: { 'content-type': 'application/json' },
    });
    expect(spec.body).toEqual({ a: 1 });
  });

  it('T-H-072 request(url, { headers: array-form }) accepts [k,v] pairs', async () => {
    const app = createHonoApp();
    app.get('/h', (c) => c.text(c.req.header('x-tag') ?? ''));
    const spec = await app.request('/h', { headers: [['X-Tag', 'v1']] });
    expect(spec.body).toBe('v1');
  });

  it('T-H-073 request(url, { headers: Headers }) accepts a Headers instance', async () => {
    const app = createHonoApp();
    app.get('/h2', (c) => c.text(c.req.header('x-a') ?? ''));
    const hdrs = new Headers();
    hdrs.set('x-a', 'zebra');
    const spec = await app.request('/h2', { headers: hdrs });
    expect(spec.body).toBe('zebra');
  });

  it('T-H-074 request(init-object) — non-string input skips url arg and routes to /', async () => {
    // Closes app.js:299-300 — `typeof input === 'string' ? … : input` /
    // `typeof input === 'string' ? input : '/'`. Passing an init-object as the
    // first arg falls into the "input is not a string" arm on both lines.
    const app = createHonoApp();
    app.get('/', (c) => c.text('root'));
    // The overload types expect a URL; cast to the raw shape so the runtime
    // arms are exercised without a compile error.
    const spec = await (app.request as unknown as (init: { method?: string }) => Promise<{ body: unknown }>)({
      method: 'GET',
    });
    expect(spec.body).toBe('root');
  });

  it('T-H-075 request(url, init, env, executionCtx) forwards env + executionCtx through app.request', async () => {
    // Closes app.js:277-278 — `env !== undefined ? { env } : {}` and
    // `executionCtx !== undefined ? { executionCtx } : {}` on the request()
    // options builder inside createHonoApp().
    const app = createHonoApp<{ TAG: string }>();
    const captured: { env?: { TAG: string }; waitUntilCalled: boolean } = { waitUntilCalled: false };
    app.get('/env-probe', (c) => {
      captured.env = c.env;
      c.executionCtx?.waitUntil(Promise.resolve());
      return c.json({ tag: c.env.TAG });
    });
    const executionCtx = {
      waitUntil: () => {
        captured.waitUntilCalled = true;
      },
      passThroughOnException: () => {
        /* no-op */
      },
    };
    const spec = await app.request('/env-probe', undefined, { TAG: 'v1' }, executionCtx);
    expect(spec.body).toEqual({ tag: 'v1' });
    expect(captured.env?.TAG).toBe('v1');
    expect(captured.waitUntilCalled).toBe(true);
  });
});

describe('route composition edge cases', () => {
  it('T-H-035 route(prefix-ending-in-slash, sub) trims trailing slash from prefix', async () => {
    // Closes app.js:293 — `prefix.endsWith('/') ? prefix.slice(0, -1) : prefix`.
    const sub = createHonoApp();
    sub.get('/hello', (c) => c.text('hi'));
    const app = createHonoApp();
    app.route('/api/', sub);
    const spec = await app.request('/api/hello');
    expect(spec.status).toBe(200);
    expect(spec.body).toBe('hi');
  });

  it('T-H-036 route(prefix, sub-with-slashless-pattern) prepends slash to sub pattern', async () => {
    // Closes app.js:294 — `sub.startsWith('/') ? sub : `/${sub}``. A route
    // registered with a pattern that lacks the leading `/` is joined with an
    // interposed slash.
    const sub = createHonoApp();
    sub.get('bare', (c) => c.text('bare-hit'));
    const app = createHonoApp();
    app.route('/api', sub);
    const spec = await app.request('/api/bare');
    expect(spec.status).toBe(200);
    expect(spec.body).toBe('bare-hit');
  });
});

describe('parseQuery + parsePath edge cases', () => {
  it('T-H-046 buildRequest skips empty `&&` pairs in the query string', () => {
    // Closes app.js:79 — `if (pair.length === 0) continue;` when the query
    // contains an empty segment (leading `?&` or `&&`).
    const req = buildRequest({ method: 'GET', url: '/x?&a=1&&b=2&' });
    expect(req.queryValue('a')).toBe('1');
    expect(req.queryValue('b')).toBe('2');
  });

  it('T-H-047 buildRequest normalizes an absolute URL with no path to `/`', () => {
    // Closes app.js:96 — `path = rest.length === 0 ? '/' : rest;` when the
    // absolute-URL prefix strip leaves nothing behind.
    const req = buildRequest({ method: 'GET', url: 'http://example.com' });
    expect(req.path).toBe('/');
  });
});

describe('createContext extras', () => {
  it('T-H-055 c.req.json() returns undefined when the raw body is an empty string', async () => {
    // Closes app.js:123 — `if (rawBody === '') return undefined;` on the
    // request json() helper.
    const req = buildRequest({ method: 'POST', url: '/z' });
    expect(await req.json()).toBeUndefined();
  });

  it('T-H-056 c.text(body, status) overrides both body and status', () => {
    // Closes app.js:187 — `if (status !== undefined) response.status = status;`
    // on the text() context helper (mirrors c.json(body, status) branch).
    const req = buildRequest({ method: 'GET', url: '/' });
    const c = createContext({ req });
    c.text('gone', 410);
    expect(c.response.body).toBe('gone');
    expect(c.response.status).toBe(410);
  });
});

describe('matchRoute defensive arms', () => {
  it('T-H-065 matchRoute skips a paramNames entry that is undefined', () => {
    // Closes app.js:64 — `if (name === undefined) continue;` on the
    // paramNames iteration. Real compileRoute never produces undefined entries
    // (it push()es concrete strings), but the runtime guard is defensive
    // against a caller-crafted matcher that supplies a sparse paramNames.
    const matcher = { regex: /^\/(.+)$/, paramNames: [undefined as unknown as string] } as unknown as ReturnType<typeof compileRoute>;
    const params = matchRoute(matcher, '/hello');
    expect(params).toEqual({});
  });
});
