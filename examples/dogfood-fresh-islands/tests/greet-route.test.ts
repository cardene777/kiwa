import { describe, expect, it } from 'vitest';
import { invokeDefineRoute, invokeFreshHandler, stringify } from '@kiwa-test/fresh';
import { greetDefineRoute, greetHandlers, greetPage } from '../src/routes/greet.js';

describe('greet route (defineRoute + Handlers)', () => {
  it('T-DFI-GR-001 defineRoute renders page with search param default', async () => {
    const outcome = await invokeDefineRoute({
      route: greetDefineRoute,
      req: new Request('http://x/greet?name=fresh'),
    });
    expect(outcome.error).toBeUndefined();
    expect(outcome.notFound).toBeNull();
    expect(outcome.redirect).toBeNull();
    expect(outcome.html).toContain('hello fresh');
  });

  it('T-DFI-GR-002 defineRoute renders params.name when set', async () => {
    const outcome = await invokeDefineRoute({
      route: greetDefineRoute,
      req: new Request('http://x/greet'),
      params: { name: 'kiwa' },
    });
    expect(outcome.html).toContain('hello kiwa');
  });

  it('T-DFI-GR-003 GET handler renders ctx.render(data) with default world', async () => {
    const outcome = await invokeFreshHandler({
      handlers: greetHandlers,
      req: new Request('http://x/'),
      page: greetPage,
    });
    expect(outcome.response.status).toBe(200);
    expect(outcome.renderData).toEqual({ name: 'world', at: 0 });
    expect(outcome.page).not.toBeNull();
    expect(outcome.page && stringify(outcome.page)).toContain('hello world');
  });

  it('T-DFI-GR-004 GET handler picks up ?name=alice', async () => {
    const outcome = await invokeFreshHandler({
      handlers: greetHandlers,
      req: new Request('http://x/?name=alice'),
      page: greetPage,
    });
    expect(outcome.renderData).toEqual({ name: 'alice', at: 0 });
    expect(outcome.page && stringify(outcome.page)).toContain('hello alice');
  });

  it('T-DFI-GR-005 POST handler decodes JSON body { name }', async () => {
    const outcome = await invokeFreshHandler({
      handlers: greetHandlers,
      req: new Request('http://x/', {
        method: 'POST',
        body: JSON.stringify({ name: 'bob' }),
        headers: { 'content-type': 'application/json' },
      }),
      page: greetPage,
    });
    expect(outcome.response.status).toBe(200);
    expect(outcome.renderData).toEqual({ name: 'bob', at: 0 });
  });

  it('T-DFI-GR-006 POST handler falls back to world on invalid JSON', async () => {
    const outcome = await invokeFreshHandler({
      handlers: greetHandlers,
      req: new Request('http://x/', {
        method: 'POST',
        body: 'not-json',
      }),
      page: greetPage,
    });
    expect(outcome.response.status).toBe(200);
    expect(outcome.renderData).toEqual({ name: 'world', at: 0 });
  });

  it('T-DFI-GR-007 unhandled method returns 405 with allow header', async () => {
    const outcome = await invokeFreshHandler({
      handlers: greetHandlers,
      req: new Request('http://x/', { method: 'DELETE' }),
      page: greetPage,
    });
    expect(outcome.response.status).toBe(405);
    expect(outcome.response.headers.get('allow')).toContain('GET');
    expect(outcome.response.headers.get('allow')).toContain('POST');
  });

  it('T-DFI-GR-008 defineRoute passes route path to page component', async () => {
    const outcome = await invokeDefineRoute({
      route: greetDefineRoute,
      req: new Request('http://x/greet/path'),
      path: '/greet/path',
    });
    expect(outcome.html).toContain('route=/greet/path');
  });
});
