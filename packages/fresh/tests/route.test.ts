import { describe, expect, it } from 'vitest';
import {
  invokeFreshHandler,
  invokeDefineRoute,
  defineRoute,
  isDefinedRoute,
  isRedirectSignal,
  isNotFoundSignal,
  isFreshVNode,
  redirect,
  notFound,
  h,
  stringify,
  findNodes,
  FRESH_REDIRECT_SYMBOL,
  FRESH_NOT_FOUND_SYMBOL,
  FRESH_ROUTE_SYMBOL,
  type FreshHandlers,
} from '../src/route.js';

describe('h / isFreshVNode / stringify / findNodes', () => {
  it('T-FR-001 h creates a virtual node with props + children', () => {
    const el = h('div', { class: 'x' }, 'hello', h('span', null, 'world'));
    expect(isFreshVNode(el)).toBe(true);
    expect(el.type).toBe('div');
    expect(el.props).toEqual({ class: 'x' });
    expect(el.children).toHaveLength(2);
  });

  it('T-FR-002 h defaults null props to {} and no children to []', () => {
    const el = h('br', null);
    expect(el.props).toEqual({});
    expect(el.children).toEqual([]);
  });

  it('T-FR-003 stringify emits void elements self-closed (spec-shaped meta)', () => {
    const meta = h('meta', { name: 'viewport', content: 'width=device-width' });
    expect(stringify(meta)).toBe('<meta name="viewport" content="width=device-width" />');
  });

  it('T-FR-004 stringify renders arrays + skips null / false / true / children key', () => {
    const tree = h('ul', { children: 'ignored' }, [
      h('li', null, 1),
      h('li', null, 'two'),
      null,
      false,
      h('li', null, true, ' ', 3),
    ]);
    expect(stringify(tree)).toBe('<ul><li>1</li><li>two</li><li> 3</li></ul>');
  });

  it('T-FR-005 stringify renders bare boolean attrs as key-only + skips false / null props', () => {
    const el = h('input', { type: 'checkbox', checked: true, disabled: false, placeholder: null });
    expect(stringify(el)).toBe('<input type="checkbox" checked />');
  });

  it('T-FR-006 findNodes walks depth-first + filters by predicate', () => {
    const tree = h('section', null, h('h1', null, 'title'), h('ul', null, [h('li', null, 'a'), h('li', null, 'b')]));
    const lis = findNodes(tree, (n) => n.type === 'li');
    expect(lis).toHaveLength(2);
    expect(lis.map((el) => el.children[0])).toEqual(['a', 'b']);
  });

  it('T-FR-007 findNodes returns [] on primitive-only / null tree', () => {
    expect(findNodes('leaf', () => true)).toEqual([]);
    expect(findNodes(null, () => true)).toEqual([]);
  });
});

describe('redirect / notFound signals', () => {
  it('T-FR-008 redirect() carries FRESH_REDIRECT_SYMBOL + location + status', () => {
    const r = redirect('/login', 307);
    expect(isRedirectSignal(r)).toBe(true);
    expect(r[FRESH_REDIRECT_SYMBOL]).toBe(true);
    expect(r.location).toBe('/login');
    expect(r.status).toBe(307);
  });

  it('T-FR-009 redirect() defaults status to 302', () => {
    const r = redirect('/next');
    expect(r.status).toBe(302);
  });

  it('T-FR-010 notFound() carries FRESH_NOT_FOUND_SYMBOL', () => {
    const nf = notFound();
    expect(isNotFoundSignal(nf)).toBe(true);
    expect(nf[FRESH_NOT_FOUND_SYMBOL]).toBe(true);
  });
});

describe('invokeFreshHandler', () => {
  it('T-FR-011 dispatches GET and returns Response directly', async () => {
    const handlers: FreshHandlers = {
      GET: () => new Response('hi', { status: 200 }),
    };
    const { response, error, redirect: r, notFound: nf } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/index'),
    });
    expect(error).toBeUndefined();
    expect(r).toBeNull();
    expect(nf).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hi');
  });

  it('T-FR-012 dispatches POST separately from GET', async () => {
    const handlers: FreshHandlers = {
      GET: () => new Response('get'),
      POST: () => new Response('post', { status: 201 }),
    };
    const { response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/', { method: 'POST' }),
    });
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('post');
  });

  it('T-FR-013 returns 405 + Allow header when method not handled', async () => {
    const handlers: FreshHandlers = { GET: () => new Response('ok') };
    const { response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/', { method: 'DELETE' }),
    });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });

  it('T-FR-014 captures ctx.render(data) + invokes page component with data', async () => {
    const handlers: FreshHandlers<{ name: string }> = {
      GET: (_req, ctx) => ctx.render({ name: 'kiwa' }),
    };
    const { response, renderData, page } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
      page: ({ data }) => h('p', null, `hello ${data?.name}`),
    });
    expect(renderData).toEqual({ name: 'kiwa' });
    expect(page && stringify(page)).toBe('<p>hello kiwa</p>');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<p>hello kiwa</p>');
  });

  it('T-FR-015 ctx.redirect(location, status) surfaces on result.redirect', async () => {
    const handlers: FreshHandlers = {
      GET: (_req, ctx) => ctx.redirect('/next', 303),
    };
    const { redirect: r, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
    });
    expect(r?.location).toBe('/next');
    expect(r?.status).toBe(303);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/next');
  });

  it('T-FR-016 ctx.renderNotFound() surfaces on result.notFound', async () => {
    const handlers: FreshHandlers = {
      GET: (_req, ctx) => ctx.renderNotFound(),
    };
    const { notFound: nf, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/missing'),
    });
    expect(nf).toBeTruthy();
    expect(response.status).toBe(404);
  });

  it('T-FR-017 handler throw of redirect() lands in result.redirect (not error)', async () => {
    const handlers: FreshHandlers = {
      GET: () => {
        throw redirect('/login');
      },
    };
    const { redirect: r, error, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
    });
    expect(error).toBeUndefined();
    expect(r?.location).toBe('/login');
    expect(response.status).toBe(302);
  });

  it('T-FR-018 handler throw (non-signal) surfaces as error + 500 response', async () => {
    const handlers: FreshHandlers = {
      GET: () => {
        throw new Error('boom');
      },
    };
    const { error, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
    });
    expect((error as Error).message).toBe('boom');
    expect(response.status).toBe(500);
  });

  it('T-FR-019 passes params + state through to handler ctx', async () => {
    let seenParams: Record<string, string | undefined> | null = null;
    let seenState: Record<string, unknown> | null = null;
    const handlers: FreshHandlers = {
      GET: (_req, ctx) => {
        seenParams = { ...ctx.params };
        seenState = { ...ctx.state };
        return new Response('ok');
      },
    };
    await invokeFreshHandler({
      handlers,
      req: new Request('http://x/blog/42'),
      params: { slug: '42' },
      state: { user: 'alice' },
    });
    expect(seenParams).toEqual({ slug: '42' });
    expect(seenState).toEqual({ user: 'alice' });
  });

  it('T-FR-020 accepts a single handler fn (no method key)', async () => {
    const { response } = await invokeFreshHandler({
      handlers: () => new Response('single', { status: 200 }),
      req: new Request('http://x/'),
    });
    expect(await response.text()).toBe('single');
  });

  it('T-FR-020a handler returning page data directly (non-Response, non-undefined) is treated as a captured render', async () => {
    // Closes the else-if arm at lines 219-224 in invokeFreshHandler where the handler
    // returns page data directly (a shape defineRoute users lean on) instead of a
    // Response or void.
    const handlers: FreshHandlers = {
      GET: () => ({ title: 'from-data', body: 'plain-object' }),
    };
    const { renderData } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
    });
    expect(renderData).toEqual({ title: 'from-data', body: 'plain-object' });
  });
});

describe('defineRoute + invokeDefineRoute', () => {
  it('T-FR-021 defineRoute() brands the returned wrapper', () => {
    const route = defineRoute(() => h('p', null, 'x'));
    expect(isDefinedRoute(route)).toBe(true);
    expect(route[FRESH_ROUTE_SYMBOL]).toBe(true);
  });

  it('T-FR-022 invokeDefineRoute runs the body + renders html', async () => {
    const route = defineRoute((_req, ctx) => h('article', null, `id=${ctx.params.id}`));
    const { tree, html, error } = await invokeDefineRoute({
      route,
      req: new Request('http://x/post/42'),
      params: { id: '42' },
    });
    expect(error).toBeUndefined();
    expect(tree && isFreshVNode(tree) && stringify(tree)).toBe('<article>id=42</article>');
    expect(html).toBe('<article>id=42</article>');
  });

  it('T-FR-023 invokeDefineRoute captures redirect() throw', async () => {
    const route = defineRoute(() => {
      throw redirect('/next');
    });
    const { redirect: r, tree, error } = await invokeDefineRoute({
      route,
      req: new Request('http://x/'),
    });
    expect(error).toBeUndefined();
    expect(r?.location).toBe('/next');
    expect(tree).toBeNull();
  });

  it('T-FR-024 invokeDefineRoute captures notFound() throw', async () => {
    const route = defineRoute(() => {
      throw notFound();
    });
    const { notFound: nf, tree } = await invokeDefineRoute({
      route,
      req: new Request('http://x/missing'),
    });
    expect(nf).toBeTruthy();
    expect(tree).toBeNull();
  });

  it('T-FR-025 invokeDefineRoute captures non-signal throw as error', async () => {
    const route = defineRoute(() => {
      throw new Error('oops');
    });
    const { error, tree, html } = await invokeDefineRoute({
      route,
      req: new Request('http://x/'),
    });
    expect((error as Error).message).toBe('oops');
    expect(tree).toBeNull();
    expect(html).toBe('');
  });

  it('T-FR-026 invokeDefineRoute accepts a raw fn (not wrapped)', async () => {
    const { tree } = await invokeDefineRoute({
      route: () => h('p', null, 'bare'),
      req: new Request('http://x/'),
    });
    expect(tree && stringify(tree)).toBe('<p>bare</p>');
  });

  // The four ctx helpers (render / renderNotFound / redirect / next) are inline
  // arrow functions in invokeDefineRoute — none of the existing tests calls them,
  // so branch + function coverage on lines 348..357 misses. These four tests each
  // call one helper from the route body and assert the visible effect.

  it('T-FR-027 invokeDefineRoute — ctx.render() returns the sentinel Response', async () => {
    let renderResponse: Response | null = null;
    const route = defineRoute((_req, ctx) => {
      renderResponse = ctx.render();
      return h('p', null, 'body');
    });
    await invokeDefineRoute({ route, req: new Request('http://x/') });
    expect(renderResponse).not.toBeNull();
    expect((renderResponse as unknown as Response).status).toBe(200);
    expect(await (renderResponse as unknown as Response).text()).toBe('__kiwa_fresh_render__');
  });

  it('T-FR-028 invokeDefineRoute — ctx.renderNotFound() surfaces on result.notFound', async () => {
    const route = defineRoute((_req, ctx) => {
      ctx.renderNotFound();
      return h('p', null, 'body');
    });
    const { notFound: nf } = await invokeDefineRoute({ route, req: new Request('http://x/') });
    expect(nf).toBeTruthy();
  });

  it('T-FR-029 invokeDefineRoute — ctx.redirect(location, status) surfaces on result.redirect', async () => {
    const route = defineRoute((_req, ctx) => {
      ctx.redirect('/target', 307);
      return h('p', null, 'body');
    });
    const { redirect: r } = await invokeDefineRoute({ route, req: new Request('http://x/') });
    expect(r?.location).toBe('/target');
    expect(r?.status).toBe(307);
  });

  it('T-FR-030 invokeDefineRoute — ctx.next() returns a 404 Response', async () => {
    let nextResponse: Response | null = null;
    const route = defineRoute(async (_req, ctx) => {
      nextResponse = await ctx.next();
      return h('p', null, 'body');
    });
    await invokeDefineRoute({ route, req: new Request('http://x/') });
    expect(nextResponse).not.toBeNull();
    expect((nextResponse as unknown as Response).status).toBe(404);
  });
});
