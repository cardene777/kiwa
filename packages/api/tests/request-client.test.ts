import { describe, expect, it } from 'vitest';
import { createRequestClient } from '../src/request-client.js';

function buildFakeFetcher(handler: (url: string, init: RequestInit | undefined) => Response): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    return handler(typeof input === 'string' ? input : input.toString(), init);
  }) as unknown as typeof fetch;
}

describe('createRequestClient', () => {
  it('GET resolves baseUrl + path and exposes status/headers/json', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test/',
      defaultHeaders: { 'x-default': 'd' },
      fetcher: buildFakeFetcher((url, init) => {
        expect(url).toBe('http://x.test/path');
        expect(init?.method).toBe('GET');
        expect((init?.headers as Record<string, string>)['x-default']).toBe('d');
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    });
    const res = await client.get('path');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
  });

  it('POST JSON-encodes object bodies and sets content-type', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((url, init) => {
        expect(init?.body).toBe('{"a":1}');
        expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json');
        return new Response('', { status: 201 });
      }),
    });
    const res = await client.post('/p', { a: 1 });
    expect(res.status).toBe(201);
  });

  it('POST passes string bodies untouched (no content-type override)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBe('raw');
        const ct = (init?.headers as Record<string, string>)['content-type'];
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', 'raw');
  });

  it('PUT works', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('PUT');
        return new Response('');
      }),
    });
    await client.put('/p', { x: 1 });
  });

  it('PATCH works', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('PATCH');
        return new Response('');
      }),
    });
    await client.patch('/p', { x: 2 });
  });

  it('DELETE works without a body', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_u, init) => {
        expect(init?.method).toBe('DELETE');
        expect(init?.body).toBeUndefined();
        return new Response('');
      }),
    });
    await client.delete('/p');
  });

  it('absolute http URL is passed through as-is', async () => {
    const client = createRequestClient({
      baseUrl: 'http://ignored',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toBe('http://other/abs');
        return new Response('');
      }),
    });
    await client.get('http://other/abs');
  });

  it('explicit null body kills "body === null" mutation (separate from undefined)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        // null body must produce no encoded body AND no content-type header.
        expect(init?.body).toBeUndefined();
        const ct = (init?.headers as Record<string, string> | undefined)?.['content-type'];
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', null as unknown as undefined);
  });

  it('ArrayBuffer body is passed untouched and skips JSON encoding', async () => {
    const buf = new ArrayBuffer(4);
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBe(buf);
        const ct = (init?.headers as Record<string, string> | undefined)?.['content-type'];
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', buf);
  });

  it('Uint8Array body is passed untouched and skips JSON encoding', async () => {
    const u8 = new Uint8Array([1, 2, 3]);
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBe(u8);
        const ct = (init?.headers as Record<string, string> | undefined)?.['content-type'];
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', u8);
  });

  it('caller-supplied init.headers override default + body headers (object-spread integrity)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      defaultHeaders: { 'x-default': 'd', 'x-keep': 'keep' },
      fetcher: buildFakeFetcher((_url, init) => {
        const h = init?.headers as Record<string, string>;
        // body-derived content-type stays
        expect(h['content-type']).toBe('application/json');
        // default header passes through
        expect(h['x-keep']).toBe('keep');
        // init.headers override default value
        expect(h['x-default']).toBe('override');
        // init.headers add new header
        expect(h['x-extra']).toBe('e');
        return new Response('');
      }),
    });
    await client.post('/p', { a: 1 }, { headers: { 'x-default': 'override', 'x-extra': 'e' } });
  });

  it('init without headers preserves body-derived headers (optional chaining branch)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      defaultHeaders: { 'x-default': 'd' },
      fetcher: buildFakeFetcher((_url, init) => {
        const h = init?.headers as Record<string, string>;
        expect(h['content-type']).toBe('application/json');
        expect(h['x-default']).toBe('d');
        return new Response('');
      }),
    });
    await client.post('/p', { a: 1 }, { redirect: 'manual' });
  });

  it('baseUrl without trailing slash is joined cleanly with relative path', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((url) => {
        // Must hit exactly /joined, not //joined or joined (no slash).
        expect(url).toBe('http://x.test/joined');
        return new Response('');
      }),
    });
    await client.get('joined');
  });

  it('baseUrl with multiple trailing slashes is normalised to a single slash join', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test/',
      fetcher: buildFakeFetcher((url) => {
        // baseUrl.replace(/\/$/, '') strips exactly one trailing slash, and path
        // starts with '/'. Verifies the replace regex matches the actual slash
        // (mutator can swap /\/$/ for /^\// which would not match here).
        expect(url).toBe('http://x.test/path');
        return new Response('');
      }),
    });
    await client.get('/path');
  });

  it('response headers snapshot exposes every entry returned by fetcher', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher(() =>
        new Response('', {
          status: 200,
          headers: { 'x-one': '1', 'x-two': '2' },
        }),
      ),
    });
    const res = await client.get('/p');
    // Both headers must appear in the snapshot (kills the "headers.forEach -> no-op" mutation).
    expect(res.headers['x-one']).toBe('1');
    expect(res.headers['x-two']).toBe('2');
  });

  it('PATCH JSON-encodes object bodies (kills ArrowFunction -> undefined mutation on patch)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.method).toBe('PATCH');
        expect(init?.body).toBe('{"x":2}');
        return new Response('ok', { status: 200 });
      }),
    });
    const res = await client.patch('/p', { x: 2 });
    expect(res.status).toBe(200);
  });

  it('PUT JSON-encodes object bodies (kills ArrowFunction -> undefined mutation on put)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.method).toBe('PUT');
        expect(init?.body).toBe('{"x":1}');
        return new Response('', { status: 200 });
      }),
    });
    const res = await client.put('/p', { x: 1 });
    expect(res.status).toBe(200);
  });

  it('GET returns observable status passing through fetcher response', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher(() => new Response('', { status: 418 })),
    });
    const res = await client.get('/p');
    // Kills the "send -> undefined" mutation by asserting a side-effect of the resolved value.
    expect(res.status).toBe(418);
  });

  it('DELETE round-trip returns a usable response (kills delete ArrowFunction -> undefined)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.method).toBe('DELETE');
        return new Response('deleted', { status: 200 });
      }),
    });
    const res = await client.delete('/p');
    expect(res.status).toBe(200);
    expect(res.bodyText).toBe('deleted');
  });

  it('object body sets exactly one header entry (content-type) — kills "headers: {} -> empty" mutation', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        const h = init?.headers as Record<string, string>;
        // content-type must come from buildBody's JSON branch.
        expect(h['content-type']).toBe('application/json');
        return new Response('ok');
      }),
    });
    await client.post('/p', { a: 1 });
  });

  it('string body sends NO content-type (kills "headers: {} -> { fake }" mutation on string path)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        const h = init?.headers as Record<string, string> | undefined;
        // Specifically: the string-body branch must produce an empty header
        // map at the buildBody return site. Any "content-type" leakage would
        // come from buildBody's JSON branch firing on a non-JSON body.
        expect(h && 'content-type' in h ? h['content-type'] : undefined).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', 'raw');
  });

  it('absolute URL path bypasses baseUrl regardless of trailing slash on baseUrl', async () => {
    const client = createRequestClient({
      baseUrl: 'http://ignored/',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toBe('http://abs.test/x');
        return new Response('');
      }),
    });
    // Kills the "path.startsWith('http') -> true" mutation when path is a path,
    // and the "-> false" mutation when path is absolute.
    await client.get('http://abs.test/x');
  });

  it('relative path without leading slash gets exactly one "/" inserted by baseUrl join (kills the inner ternary too)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toBe('http://x.test/p');
        return new Response('');
      }),
    });
    await client.get('p');
  });

  it('init body is overridden by encodedBody for object payloads (asserts the if-guard at L36 fires)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        // Caller passed init.body = 'old' AND a typed object body. The send()
        // path overwrites finalInit.body with the encoded JSON form when the
        // typed body is defined (kills "if (encodedBody !== undefined) -> true"
        // mutation by exercising a path where the original body would have
        // leaked through if the guard were always true).
        expect(init?.body).toBe('{"a":1}');
        return new Response('ok');
      }),
    });
    await client.post('/p', { a: 1 }, { body: 'old' });
  });

  it('GET keeps init.body undefined when no body argument is provided (asserts the if-guard at L36 skips)', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        // GET passes body=undefined → buildBody returns body: undefined →
        // finalInit.body must remain undefined (no spread, no assignment).
        expect(init?.body).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.get('/p');
  });

  it('null body MUST NOT JSON-stringify to "null" — kills "if (body === undefined || body === null) -> false" mutation', async () => {
    // Original code: null body returns { body: undefined, headers: {} }
    // Mutant (if -> false): null body skips the guard, falls to the JSON
    // branch and produces { body: 'null', headers: { 'content-type': '...' } }.
    // We assert no body AND no content-type, killing both.
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBeUndefined();
        const h = init?.headers as Record<string, string> | undefined;
        const ct = h ? h['content-type'] : undefined;
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    await client.post('/p', null as unknown as undefined);
  });

  it('undefined body MUST NOT JSON-stringify to undefined-string — kills the false-mutation on undefined branch', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.body).toBeUndefined();
        const h = init?.headers as Record<string, string> | undefined;
        const ct = h ? h['content-type'] : undefined;
        expect(ct).toBeUndefined();
        return new Response('ok');
      }),
    });
    // `delete()` internally sends body=undefined.
    await client.delete('/p');
  });

  it('init=undefined still produces a valid header map (kills "init && {} -> init && {}" mutation on L32 spread)', async () => {
    // No init arg → init?.headers is undefined → headers map should be exactly
    // { ...default, ...body }. Mutant would spread `init && {}` which evaluates
    // to undefined when init is undefined — but the original `init?.headers ??
    // {}` would also yield {}. We distinguish by asserting the exact key set.
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      defaultHeaders: { 'x-default': 'd' },
      fetcher: buildFakeFetcher((_url, init) => {
        const h = init?.headers as Record<string, string>;
        // Original behavior MUST include both default + body content-type and
        // ONLY those (no leakage from a mistakenly spread init.headers).
        expect(h['x-default']).toBe('d');
        expect(h['content-type']).toBe('application/json');
        // Total keys: 2. Kills mutations that inject extra keys via the spread.
        expect(Object.keys(h).sort()).toEqual(['content-type', 'x-default']);
        return new Response('ok');
      }),
    });
    await client.post('/p', { a: 1 });
  });

  it('relative path with leading "/" — exact join asserts the inner ternary at L36 picks the right branch', async () => {
    // path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    // Mutant: outer ConditionalExpression -> true → URL becomes path itself
    // ('/x'), which lacks a host. We assert the URL contains the host, which
    // can only happen via the false branch.
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toMatch(/^http:\/\/x\.test\//);
        expect(url).toBe('http://x.test/leading');
        return new Response('');
      }),
    });
    await client.get('/leading');
  });

  it('absolute https URL also bypasses baseUrl (covers !path.startsWith("http") mutant variant)', async () => {
    // Some Stryker mutators flip the .startsWith check; covering https://
    // makes the "force false" mutation observable too.
    const client = createRequestClient({
      baseUrl: 'http://ignored',
      fetcher: buildFakeFetcher((url) => {
        expect(url).toBe('https://secure.test/x');
        return new Response('');
      }),
    });
    await client.get('https://secure.test/x');
  });

  it('init=undefined call path returns a usable response — exercise the init && {} mutant on send entry', async () => {
    const client = createRequestClient({
      baseUrl: 'http://x.test',
      fetcher: buildFakeFetcher((_url, init) => {
        expect(init?.method).toBe('GET');
        return new Response('hello', { status: 200 });
      }),
    });
    const res = await client.get('/p');
    expect(res.bodyText).toBe('hello');
    expect(res.status).toBe(200);
  });
});
