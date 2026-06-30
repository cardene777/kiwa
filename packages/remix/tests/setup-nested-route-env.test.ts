// setupRemixNestedRouteEnv unit tests (Issue #561, v1.1).
// 観点 ... loader chain (parent → child の data 連鎖) / headers() merge (parent + child + loader)
// / Set-Cookie persistence (parent / child の cookie が後続 chain 起動で persist)
// / defer() / resolveDeferred の resolved + pending + error map / reset。
//
// 公式 Remix server-runtime (`headers.js` の getDocumentHeaders) と整合した
// prependCookies semantics を `T-NR-007` / `T-NR-008` で固定する。

import { describe, expect, it } from 'vitest';
import {
  setupRemixNestedRouteEnv,
  defer,
  resolveDeferred,
  isDeferred,
  DEFERRED_DATA_SYMBOL,
  type RemixNestedRouteDefinition,
  type LoaderFunction,
} from '../src/index.js';

describe('setupRemixNestedRouteEnv — loader chain', () => {
  it('T-NR-001: parent loader 結果が child loader の context.parentData として渡る', async () => {
    let observedParentData: unknown;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => ({ user: 'alice', role: 'admin' }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        observedParentData = (context as { parentData?: unknown }).parentData;
        return { childOk: true };
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(result.parent.result).toEqual({ user: 'alice', role: 'admin' });
    expect(result.child.result).toEqual({ childOk: true });
    expect(observedParentData).toEqual({ user: 'alice', role: 'admin' });
  });

  it('T-NR-002: parent loader が JSON Response を返すと child の parentData は body を auto-deserialize した値 (Remix useMatches 互換)', async () => {
    let received: unknown = 'not-set';
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(JSON.stringify({ via: 'response' }), {
        headers: { 'content-type': 'application/json' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        received = (context as { parentData?: unknown }).parentData;
        return { childOk: true };
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(result.parent.result).toBeUndefined();
    expect(result.parent.response?.status).toBe(200);
    // JSON Response は auto-deserialize される (Remix の useMatches() がやるのと同等)
    expect(received).toEqual({ via: 'response' });
    // parent.response の body は clone() 経由で deserialize しているので caller 再 read 可能
    const reread = await result.parent.response?.json();
    expect(reread).toEqual({ via: 'response' });
  });

  it('T-NR-002b: parent loader が non-JSON Response (text/html) を返すと parentData は undefined', async () => {
    let received: unknown = 'unset';
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response('<html>error</html>', {
        headers: { 'content-type': 'text/html' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        received = (context as { parentData?: unknown }).parentData;
        return {};
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(received).toBeUndefined();
  });

  it('T-NR-002c: parent loader Response の JSON body 解析失敗時は parentData=undefined (例外伝播せず)', async () => {
    let received: unknown = 'unset';
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response('not-json-but-says-application/json', {
        headers: { 'content-type': 'application/json' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        received = (context as { parentData?: unknown }).parentData;
        return {};
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(received).toBeUndefined();
  });

  it('T-NR-003: child loader は parent loader を待ってから走る (順次 invoke)', async () => {
    const events: string[] = [];
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => {
        events.push('parent-start');
        await Promise.resolve();
        events.push('parent-end');
        return { v: 1 };
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => {
        events.push('child-start');
        await Promise.resolve();
        events.push('child-end');
        return { v: 2 };
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(events).toEqual(['parent-start', 'parent-end', 'child-start', 'child-end']);
  });

  it('T-NR-004: parent loader 不在は parent.result=undefined、 child は parentData=undefined で走る', async () => {
    let received: unknown = 'unset';
    const parent: RemixNestedRouteDefinition = { id: 'routes/parent' }; // loader 無し
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        received = (context as { parentData?: unknown }).parentData;
        return { ok: true };
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(result.parent.result).toBeUndefined();
    expect(received).toBeUndefined();
    expect(result.child.result).toEqual({ ok: true });
  });

  it('T-NR-005: params / context / headers が parent / child 両方の loader に届く', async () => {
    let parentParams: Record<string, string> | undefined;
    let childParams: Record<string, string> | undefined;
    let parentAuth: string | null = null;
    let childAuth: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent.$id',
      loader: async ({ params, request }) => {
        parentParams = params as Record<string, string>;
        parentAuth = request.headers.get('authorization');
        return {};
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.$id.child',
      loader: async ({ params, request }) => {
        childParams = params as Record<string, string>;
        childAuth = request.headers.get('authorization');
        return {};
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/42/child',
      params: { id: '42' },
      headers: { authorization: 'Bearer kiwa' },
    });
    await env.runLoaderChain();
    expect(parentParams).toEqual({ id: '42' });
    expect(childParams).toEqual({ id: '42' });
    expect(parentAuth).toBe('Bearer kiwa');
    expect(childAuth).toBe('Bearer kiwa');
  });
});

describe('setupRemixNestedRouteEnv — headers() merge (Remix 公式 prependCookies 互換)', () => {
  it('T-NR-006: 両 route が headers 無しは parent + child の loader Set-Cookie を merge', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'session=abc; Path=/' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'flash=msg; Path=/' },
      }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    const set = result.mergedHeaders.getSetCookie();
    expect(set).toContain('session=abc; Path=/');
    expect(set).toContain('flash=msg; Path=/');
    expect(set.length).toBe(2);
  });

  it('T-NR-007: child の headers() function は parentHeaders / loaderHeaders を受け取る', async () => {
    let observedParent: Headers | undefined;
    let observedLoader: Headers | undefined;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        headers: { 'cache-control': 'private, max-age=60' },
      }),
      // Remix 公式 semantics ... 親 loader の `cache-control` を子の parentHeaders
      // まで bubble up させたい場合は親に `headers()` export が必要。 export 無し時は
      // Set-Cookie のみ prependCookies 経由で merge される (`getDocumentHeaders` 経路)。
      headers: ({ loaderHeaders }) => loaderHeaders,
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {
        headers: { 'x-trace-id': 'kiwa-child' },
      }),
      headers: ({ parentHeaders, loaderHeaders }) => {
        observedParent = parentHeaders;
        observedLoader = loaderHeaders;
        const h = new Headers();
        // child override: parent の cache-control を維持しつつ child loader header も足す
        const cc = parentHeaders.get('cache-control');
        if (cc !== null) h.set('cache-control', cc);
        const trace = loaderHeaders.get('x-trace-id');
        if (trace !== null) h.set('x-trace-id', trace);
        h.set('x-merged-by', 'child');
        return h;
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(observedParent?.get('cache-control')).toBe('private, max-age=60');
    expect(observedLoader?.get('x-trace-id')).toBe('kiwa-child');
    expect(result.mergedHeaders.get('cache-control')).toBe('private, max-age=60');
    expect(result.mergedHeaders.get('x-trace-id')).toBe('kiwa-child');
    expect(result.mergedHeaders.get('x-merged-by')).toBe('child');
  });

  it('T-NR-008: parent の Set-Cookie が child Headers に prepend される (公式 prependCookies 互換)', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'session=parent-cookie; Path=/' },
      }),
      headers: () => ({ 'x-parent-tag': 'p' }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response('ok', { status: 200 }),
      headers: ({ parentHeaders, loaderHeaders }) => {
        // child は自前で Set-Cookie を返さない → parent の Set-Cookie が prepend される
        const h = new Headers(parentHeaders);
        const trace = loaderHeaders.get('x-trace');
        if (trace !== null) h.set('x-trace', trace);
        return h;
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(result.mergedHeaders.getSetCookie()).toContain('session=parent-cookie; Path=/');
    expect(result.mergedHeaders.get('x-parent-tag')).toBe('p');
  });

  it('T-NR-009: 同 cookie 名の parent / child を別文字列で両方 merge (公式 prependCookies 文字列単位 dedupe、 MINOR 6 fix)', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'session=parent; Path=/' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'session=child; Path=/' },
      }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    const cookies = result.mergedHeaders.getSetCookie();
    // MINOR 6 fix ... 公式 Remix `headers.ts:prependCookies` は文字列単位 dedupe、
    // 同 cookie 名で値違いは両方残す (browser cookie jar が RFC 6265 § 5.3 step 11 で last-write-wins する semantics に依存)。
    // kiwa env も公式に揃え、 docstring / test を「両方残る」 で明示固定する。
    expect(cookies).toContain('session=child; Path=/');
    expect(cookies).toContain('session=parent; Path=/');
    expect(cookies.length).toBe(2);
  });

  it('T-NR-010: parent の headers が HeadersInit (object 形式) でも merge する', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      headers: { 'x-static-parent': 'yes' },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response('ok'),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    expect(result.mergedHeaders.get('x-static-parent')).toBe('yes');
  });
});

describe('setupRemixNestedRouteEnv — Set-Cookie persistence + Cookie header', () => {
  it('T-NR-011: initial cookies は parent loader の Cookie header に乗る', async () => {
    let observedCookie: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        observedCookie = request.headers.get('cookie');
        return {};
      },
    };
    const child: RemixNestedRouteDefinition = { id: 'routes/parent.child' };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
      cookies: { session: 'tok-123' },
    });
    await env.runLoaderChain();
    expect(observedCookie).toBe('session=tok-123');
  });

  it('T-NR-012: parent loader が Set-Cookie を返すと child loader の Cookie header に反映', async () => {
    let parentCookieHeader: string | null = null;
    let childCookieHeader: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        parentCookieHeader = request.headers.get('cookie');
        return new Response(null, {
          headers: { 'set-cookie': 'newSession=NEW; Path=/' },
        });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ request }) => {
        childCookieHeader = request.headers.get('cookie');
        return {};
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(parentCookieHeader).toBeNull();
    expect(childCookieHeader).toContain('newSession=NEW');
  });

  it('T-NR-013: 後続 chain 起動で前回 parent + child の Set-Cookie が cookieStore に persist', async () => {
    let lastParentCookieHeader: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        lastParentCookieHeader = request.headers.get('cookie');
        return new Response(null, {
          headers: { 'set-cookie': 'a=1; Path=/' },
        });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'b=2; Path=/' },
      }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    // 1 回目
    await env.runLoaderChain();
    expect(env.cookies.get('a')).toBe('1');
    expect(env.cookies.get('b')).toBe('2');
    // 2 回目は a / b 両方が cookie header に乗る
    await env.runLoaderChain();
    expect(lastParentCookieHeader).toContain('a=1');
    expect(lastParentCookieHeader).toContain('b=2');
  });

  it('T-NR-014: reset() で cookieStore が初期 snapshot に戻る', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'flash=tmp; Path=/' },
      }),
    };
    const child: RemixNestedRouteDefinition = { id: 'routes/parent.child' };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
      cookies: { initial: 'kept' },
    });
    await env.runLoaderChain();
    expect(env.cookies.get('flash')).toBe('tmp');
    expect(env.cookies.get('initial')).toBe('kept');
    env.reset();
    expect(env.cookies.get('flash')).toBeUndefined();
    expect(env.cookies.get('initial')).toBe('kept');
  });

  it('T-NR-015: 明示 cookie header 指定時は cookieStore より優先する', async () => {
    let observed: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        observed = request.headers.get('cookie');
        return {};
      },
    };
    const child: RemixNestedRouteDefinition = { id: 'routes/parent.child' };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
      cookies: { ignored: 'no' },
      headers: { cookie: 'override=yes' },
    });
    await env.runLoaderChain();
    expect(observed).toBe('override=yes');
  });
});

describe('defer() / resolveDeferred — streaming Server Rendering', () => {
  it('T-NR-016: defer() は DeferredData branded signal を返す', () => {
    const d = defer({ a: 1, b: Promise.resolve(2) });
    expect(isDeferred(d)).toBe(true);
    expect(d[DEFERRED_DATA_SYMBOL]).toBe(true);
    expect(d.data.a).toBe(1);
  });

  it('T-NR-017: resolveDeferred は plain + Promise 両方を resolve、 pendingKeys は Promise のみ', async () => {
    const slow = new Promise<string>((r) => setTimeout(() => r('done'), 1));
    const d = defer({ immediate: 100, async: slow });
    const r = await resolveDeferred(d);
    expect(r.resolved.immediate).toBe(100);
    expect(r.resolved.async).toBe('done');
    expect(r.pendingKeys).toEqual(['async']);
    expect(Object.keys(r.errors)).toHaveLength(0);
  });

  it('T-NR-018: defer() の Promise rejection は errors map で個別追跡 (await は完走)', async () => {
    const d = defer({
      ok: Promise.resolve('ok'),
      fail: Promise.reject(new Error('boom')),
    });
    const r = await resolveDeferred(d);
    expect(r.resolved.ok).toBe('ok');
    expect((r.errors.fail as Error).message).toBe('boom');
    expect(r.pendingKeys).toEqual(['ok', 'fail']);
  });

  it('T-NR-019: defer(data, init) は init をそのまま保持し resolveDeferred に伝播', async () => {
    const d = defer({ x: 1 }, { status: 207, headers: { 'x-tag': 'stream' } });
    const r = await resolveDeferred(d);
    expect(r.init?.status).toBe(207);
    expect((r.init?.headers as Record<string, string>)?.['x-tag']).toBe('stream');
  });

  it('T-NR-020: isDeferred は false 入力で false を返す (null / undefined / 普通 object)', () => {
    expect(isDeferred(null)).toBe(false);
    expect(isDeferred(undefined)).toBe(false);
    expect(isDeferred({ data: { x: 1 } })).toBe(false);
    expect(isDeferred(42)).toBe(false);
    expect(isDeferred('string')).toBe(false);
  });
});

describe('setupRemixNestedRouteEnv — loader returning defer()', () => {
  it('T-NR-021: parent loader が defer() を return すると child の parentData は DeferredData signal、 resolveDeferred で展開可能', async () => {
    let received: unknown;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () =>
        defer({
          critical: 'now',
          slow: Promise.resolve('later'),
        }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ context }) => {
        received = (context as { parentData?: unknown }).parentData;
        return {};
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(isDeferred(received)).toBe(true);
    const r = await resolveDeferred(received as ReturnType<typeof defer>);
    expect(r.resolved.critical).toBe('now');
    expect(r.resolved.slow).toBe('later');
  });
});

describe('setupRemixNestedRouteEnv — type narrowing edge', () => {
  it('T-NR-022: LoaderFunction 型は既存 invokeLoader と互換 (parent / child 共通 sig)', async () => {
    const loader: LoaderFunction<{ ok: boolean }> = async () => ({ ok: true });
    const env = setupRemixNestedRouteEnv({
      parentRoute: { id: 'p', loader },
      childRoute: { id: 'c', loader },
      url: 'http://localhost/p/c',
    });
    const r = await env.runLoaderChain();
    expect(r.parent.result).toEqual({ ok: true });
    expect(r.child.result).toEqual({ ok: true });
  });
});

// v1.1.1 follow-up (Issue #568) — Codex adversarial review で検出した
// 5 MAJOR + 1 MINOR の Remix 仕様乖離 fix を unit test 化する block。
// 1 MAJOR = 1 describe + 1 〜複数 it で構造化、 公式 semantics と integration 同等の挙動を固定する。
describe('setupRemixNestedRouteEnv — MAJOR 1 fix: folded Set-Cookie の split merge', () => {
  it('T-NR-023: parent Headers に comma-folded で combined された複数 Set-Cookie を child に正しく split merge', async () => {
    // ResponseInit.headers に combined `set-cookie` を渡しても Headers の挙動 implementation に依存するが、
    // 実 production では `headers.set("Set-Cookie", "a=1, b=2")` 経路で folded されるケースがあり、
    // 公式 `prependCookies` は `get("Set-Cookie") + splitSetCookieString` でこれを 1 cookie 毎に分解する。
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => {
        // Headers の `append` を 2 回呼ぶと 1 entry に combined される
        const h = new Headers();
        h.append('set-cookie', 'a=1; Path=/');
        h.append('set-cookie', 'b=2; Path=/');
        return new Response(null, { headers: h });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {}),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    const cookies = result.mergedHeaders.getSetCookie();
    // 2 cookie 個別に分解されて merged Headers に乗る (公式互換)
    expect(cookies).toContain('a=1; Path=/');
    expect(cookies).toContain('b=2; Path=/');
  });

  it('T-NR-024: Expires 内の comma (RFC 1123 date format) を境界に誤 split しない', async () => {
    // Expires=Thu, 01 Jan 2099 12:34:56 GMT は内部 comma 1 つを含む date 形式、
    // 公式 splitSetCookieString は `name=` 形式の peek で comma 後 cookie 開始判定するため
    // date 内 comma で split されない。
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => {
        const h = new Headers();
        h.append('set-cookie', 'session=v1; Expires=Thu, 01 Jan 2099 12:34:56 GMT; Path=/');
        h.append('set-cookie', 'extra=v2; Path=/');
        return new Response(null, { headers: h });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {}),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    const cookies = result.mergedHeaders.getSetCookie();
    // session= の Expires 内 comma で誤 split されず、 session 全文 + extra= が独立 cookie になる
    expect(cookies).toEqual(
      expect.arrayContaining([
        'session=v1; Expires=Thu, 01 Jan 2099 12:34:56 GMT; Path=/',
        'extra=v2; Path=/',
      ]),
    );
  });
});

describe('setupRemixNestedRouteEnv — MAJOR 2 fix: defer() の ResponseInit.headers 反映', () => {
  it('T-NR-025: parent loader が defer(data, { headers }) を return すると Set-Cookie が child cookie store / merged Headers に伝播', async () => {
    let childCookieHeader: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () =>
        defer(
          { initial: 'now' },
          {
            headers: {
              'set-cookie': 'deferred=ok; Path=/',
              'x-deferred-tag': 'parent',
            },
          },
        ),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ request }) => {
        childCookieHeader = request.headers.get('cookie');
        return new Response('ok');
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    // deferred loader の Set-Cookie が cookieStore に persist し child request の Cookie header に乗る
    expect(childCookieHeader).toContain('deferred=ok');
    expect(env.cookies.get('deferred')).toBe('ok');
    // merged Headers にも反映される (Remix 公式 getDocumentHeaders 経路と整合)
    expect(result.mergedHeaders.getSetCookie()).toContain('deferred=ok; Path=/');
  });
});

describe('setupRemixNestedRouteEnv — MAJOR 4 fix: child request の explicit cookie precedence', () => {
  it('T-NR-026: options.headers.cookie が指定されていれば child request も cookieStore に上書きされず尊重される', async () => {
    let parentObserved: string | null = null;
    let childObserved: string | null = null;
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        parentObserved = request.headers.get('cookie');
        // Set-Cookie を返して cookieStore を膨らませる
        return new Response(null, { headers: { 'set-cookie': 'newCookie=set; Path=/' } });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async ({ request }) => {
        childObserved = request.headers.get('cookie');
        return new Response('ok');
      },
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
      headers: { cookie: 'override=yes' },
      cookies: { ignored: 'no' },
    });
    await env.runLoaderChain();
    // parent / child 両方で同じ explicit precedence が適用される (inconsistency 解消)
    expect(parentObserved).toBe('override=yes');
    expect(childObserved).toBe('override=yes');
  });
});

describe('setupRemixNestedRouteEnv — MAJOR 5 fix: Max-Age=0 / 期限切れ Expires honor', () => {
  it('T-NR-027: Set-Cookie の Max-Age=0 は cookieStore から削除され次 chain で resurrect しない', async () => {
    const observedCookies: Array<string | null> = [];
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async ({ request }) => {
        observedCookies.push(request.headers.get('cookie'));
        // 1 回目で `session=v1` を set、 2 回目以降は削除指示
        return new Response(null, {
          headers: { 'set-cookie': 'session=v1; Path=/' },
        });
      },
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => new Response(null, {
        // child が同 cookie の削除指示 (Max-Age=0) を返す
        headers: { 'set-cookie': 'session=; Path=/; Max-Age=0' },
      }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    // 1 回目 ... session=v1 が set される (parent loader 経由)、 child は Max-Age=0 で同 cookie を削除
    expect(env.cookies.get('session')).toBeUndefined();
    // 2 回目 ... 削除済の session= が next chain の parent loader request に乗っていない
    await env.runLoaderChain();
    // 2 回 chain したので observedCookies は 2 件、 どちらも session=v1 を含まない (resurrect なし)
    expect(observedCookies.length).toBe(2);
    for (const observed of observedCookies) {
      if (observed !== null) {
        expect(observed).not.toContain('session=v1');
      }
    }
  });

  it('T-NR-028: Set-Cookie の過去 Expires も cookieStore から削除される', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      loader: async () => new Response(null, {
        // 1 回目 ... `flash=tmp` を set
        headers: { 'set-cookie': 'flash=tmp; Path=/' },
      }),
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      // child は過去 Expires で同 cookie を削除
      loader: async () => new Response(null, {
        headers: { 'set-cookie': 'flash=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT' },
      }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    await env.runLoaderChain();
    expect(env.cookies.get('flash')).toBeUndefined();
  });
});

describe('invokeLoader — MAJOR 3 fix: undefined return を throw', () => {
  it('T-NR-029: parent loader が undefined を return すると child は parent.error を経由 (chain は完走、 error は捕捉)', async () => {
    const parent: RemixNestedRouteDefinition = {
      id: 'routes/parent',
      // explicit undefined return ... Remix 公式仕様で禁止 → invokeLoader が throw して error に捕捉される
      loader: async () => undefined as unknown as Record<string, unknown>,
    };
    const child: RemixNestedRouteDefinition = {
      id: 'routes/parent.child',
      loader: async () => ({ ok: true }),
    };
    const env = setupRemixNestedRouteEnv({
      parentRoute: parent,
      childRoute: child,
      url: 'http://localhost/parent/child',
    });
    const result = await env.runLoaderChain();
    // parent.error が公式 Remix の error message と等価 (MAJOR 3 fix)
    expect((result.parent.error as Error).message).toContain('loader');
    expect((result.parent.error as Error).message.toLowerCase()).toContain('return');
    // child は parent.error を素通し走り、 自身の result を返す
    expect(result.child.result).toEqual({ ok: true });
  });
});
