import { describe, expect, it } from 'vitest';
import { invokeEndpoint, type APIRoute } from '../src/index.js';

describe('invokeEndpoint', () => {
  it('T-AS-001 正常系: GET endpoint returns JSON Response', async () => {
    const endpoint: APIRoute = async () => new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
    const { response, redirect } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/health',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(redirect).toBeNull();
  });

  it('T-AS-002 params: route params accessible via context.params', async () => {
    let slug: string | undefined;
    const endpoint: APIRoute<{ slug: string }> = async ({ params }) => {
      slug = params.slug;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/posts/kiwa',
      params: { slug: 'kiwa' },
    });
    expect(slug).toBe('kiwa');
  });

  it('T-AS-003 request.url accessible', async () => {
    let url: string | undefined;
    const endpoint: APIRoute = async ({ request }) => {
      url = request.url;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/x?q=foo',
    });
    expect(url).toBe('http://localhost:4321/api/x?q=foo');
  });

  it('T-AS-004 url + searchParams parsing via context.url', async () => {
    let q: string | null = null;
    const endpoint: APIRoute = async ({ url }) => {
      q = url.searchParams.get('q');
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/search?q=astro',
    });
    expect(q).toBe('astro');
  });

  it('T-AS-005 cookies.get / set / has / delete', async () => {
    const endpoint: APIRoute = async ({ cookies }) => {
      const session = cookies.get('session');
      cookies.set('telemetry', 'tid_1');
      const hadStale = cookies.has('stale');
      cookies.delete('stale');
      return new Response(JSON.stringify({ session: session?.value, hadStale }), {
        headers: { 'content-type': 'application/json' },
      });
    };
    const { response } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/x',
      cookies: { session: 'sid_42', stale: 'gone' },
    });
    expect(await response.json()).toEqual({ session: 'sid_42', hadStale: true });
  });

  it('T-AS-006 redirect via context.redirect()', async () => {
    const endpoint: APIRoute = async ({ redirect: r, cookies }) => {
      if (!cookies.get('session')) return r('/login');
      return new Response('ok');
    };
    const { redirect } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/secure',
    });
    expect(redirect?.url).toBe('/login');
    expect(redirect?.status).toBe(302);
  });

  it('T-AS-007 redirect with explicit status', async () => {
    const endpoint: APIRoute = async ({ redirect: r }) => r('/x', 301);
    const { redirect, response } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/old',
    });
    expect(redirect?.status).toBe(301);
    expect(response.status).toBe(301);
  });

  it('T-AS-008 POST with formData', async () => {
    let email: FormDataEntryValue | null = null;
    const endpoint: APIRoute = async ({ request }) => {
      const fd = await request.formData();
      email = fd.get('email');
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/signup',
      formData: { email: 'user@example.com' },
    });
    expect(email).toBe('user@example.com');
  });

  it('T-AS-009 POST with JSON body', async () => {
    let body: unknown;
    const endpoint: APIRoute = async ({ request }) => {
      body = await request.json();
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/api/x',
      jsonBody: { name: 'astro' },
    });
    expect(body).toEqual({ name: 'astro' });
  });

  it('T-AS-010 method default GET / POST inferred from body presence', async () => {
    let m: string | undefined;
    const endpoint: APIRoute = async ({ request }) => {
      m = request.method;
      return new Response('ok');
    };
    await invokeEndpoint({ endpoint, url: 'http://localhost:4321/x' });
    expect(m).toBe('GET');
    await invokeEndpoint({ endpoint, url: 'http://localhost:4321/x', formData: { x: 'y' } });
    expect(m).toBe('POST');
  });

  it('T-AS-011 explicit method override', async () => {
    let m: string | undefined;
    const endpoint: APIRoute = async ({ request }) => {
      m = request.method;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
      method: 'DELETE',
    });
    expect(m).toBe('DELETE');
  });

  it('T-AS-012 headers seed', async () => {
    let auth: string | null = null;
    const endpoint: APIRoute = async ({ request }) => {
      auth = request.headers.get('authorization');
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
      headers: { authorization: 'Bearer tok' },
    });
    expect(auth).toBe('Bearer tok');
  });

  it('T-AS-013 locals accessible', async () => {
    let user: unknown;
    const endpoint: APIRoute = async ({ locals }) => {
      user = locals.user;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
      locals: { user: { id: 1 } },
    });
    expect(user).toEqual({ id: 1 });
  });

  it('T-AS-014 site seeded as URL', async () => {
    let s: URL | undefined;
    const endpoint: APIRoute = async ({ site }) => {
      s = site;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
      site: 'https://kiwa.example.com',
    });
    expect(s?.href).toBe('https://kiwa.example.com/');
  });

  it('T-AS-015 site default undefined', async () => {
    let s: URL | undefined | null = null;
    const endpoint: APIRoute = async ({ site }) => {
      s = site;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
    });
    expect(s).toBeUndefined();
  });

  it('T-AS-016 default params empty', async () => {
    let p: Record<string, string | undefined> | undefined;
    const endpoint: APIRoute = async ({ params }) => {
      p = params;
      return new Response('ok');
    };
    await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
    });
    expect(p).toEqual({});
  });

  it('T-AS-017 response without redirect status → redirect null', async () => {
    const endpoint: APIRoute = async () => new Response('ok', { status: 200 });
    const { redirect } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
    });
    expect(redirect).toBeNull();
  });

  it('T-AS-018 redirect with no location header → empty string url', async () => {
    const endpoint: APIRoute = async () => new Response(null, { status: 307 });
    const { redirect } = await invokeEndpoint({
      endpoint,
      url: 'http://localhost:4321/x',
    });
    expect(redirect?.url).toBe('');
    expect(redirect?.status).toBe(307);
  });
});
