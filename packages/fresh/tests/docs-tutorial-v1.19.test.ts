/**
 * v1.19-5 docs 補強 (Issue #811) — tutorial 29 code snippet 検証。
 *
 * `docs/tutorials/29-fresh-islands.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  invokeFreshHandler,
  redirect,
  isRedirectSignal,
  h,
  stringify,
  type FreshHandlers,
} from '../src/route.js';
import {
  defineIsland,
  islandPlaceholder,
  hydrateIslands,
} from '../src/islands.js';
import { defineHead, mergeHead, renderHead } from '../src/head.js';

describe('tutorial 29 — invokeFreshHandler route contract snippet', () => {
  it('GET handler renders JSON body + 200 status', async () => {
    const handlers: FreshHandlers = {
      GET: () =>
        new Response(JSON.stringify({ ok: 1 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    };
    const { response, error } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/api/health'),
    });
    expect(error).toBeUndefined();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: 1 });
  });

  it('POST handler throws redirect() + result exposes redirect signal', async () => {
    const handlers: FreshHandlers = {
      POST: () => {
        throw redirect('/login', 302);
      },
    };
    const { redirect: r, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/api/session', { method: 'POST' }),
    });
    expect(r).not.toBeNull();
    expect(r?.location).toBe('/login');
    expect(r?.status).toBe(302);
    expect(response.status).toBe(302);
    expect(isRedirectSignal(r!)).toBe(true);
  });
});

describe('tutorial 29 — Islands placeholder + hydration snippet', () => {
  it('placeholder serializes data-island + data-props for the client', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
    });
    const ph = islandPlaceholder(Counter, { start: 3 });
    const html = stringify(ph);
    expect(html).toContain('data-island="Counter"');
    // Escaped JSON survives the round-trip through data-props.
    expect(JSON.parse(String(ph.props['data-props']))).toEqual({ start: 3 });
  });

  it('hydrateIslands walks a page tree + mounts every placeholder', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
    });
    const ssrTree = h(
      'main',
      null,
      islandPlaceholder(Counter, { start: 1 }),
      islandPlaceholder(Counter, { start: 2 }),
    );
    const { hydrated, missing, unregistered } = hydrateIslands({
      ssrTree,
      islands: [Counter],
    });
    expect(hydrated).toHaveLength(2);
    expect(hydrated[0]?.name).toBe('Counter');
    expect(hydrated[1]?.mount.props).toEqual({ start: 2 });
    expect(missing).toEqual([]);
    expect(unregistered).toEqual([]);
  });
});

describe('tutorial 29 — Head merge + render snippet', () => {
  it('mergeHead + renderHead produces a canonical fragment (route title wins)', () => {
    const base = defineHead({
      title: 'kiwa',
      meta: [{ name: 'viewport', content: 'width=device-width' }],
    });
    const route = defineHead({
      title: 'kiwa — home',
      meta: [{ name: 'description', content: 'test framework' }],
    });
    const merged = mergeHead([base, route]);
    const html = renderHead(merged);
    expect(html).toContain('<title>kiwa — home</title>');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('name="description"');
  });
});
