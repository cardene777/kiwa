import { describe, expect, it } from 'vitest';
import {
  invokeApiRoute,
  json,
  redirectResponse,
  type APIRouteHandler,
} from '../src/invoke-api-route.js';

describe('invokeApiRoute', () => {
  it('T-SS-API-001 正常系: GET handler returns JSON Response', async () => {
    const handler: APIRouteHandler = async () => json({ ok: true });
    const { response, redirect } = await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/api/health',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(redirect).toBeNull();
  });

  it('T-SS-API-002 params accessible via event.params', async () => {
    let slug: string | undefined;
    const handler: APIRouteHandler<{ slug: string }> = async ({ params }) => {
      slug = params.slug;
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/api/posts/kiwa',
      params: { slug: 'kiwa' },
    });
    expect(slug).toBe('kiwa');
  });

  it('T-SS-API-003 request URL accessible', async () => {
    let url: string | undefined;
    const handler: APIRouteHandler = async ({ request }) => {
      url = request.url;
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/api/x?q=foo',
    });
    expect(url).toBe('http://localhost:3000/api/x?q=foo');
  });

  it('T-SS-API-004 POST with formData', async () => {
    let email: FormDataEntryValue | null = null;
    const handler: APIRouteHandler = async ({ request }) => {
      const fd = await request.formData();
      email = fd.get('email');
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/api/signup',
      formData: { email: 'user@example.com' },
    });
    expect(email).toBe('user@example.com');
  });

  it('T-SS-API-005 POST with JSON body', async () => {
    let body: unknown;
    const handler: APIRouteHandler = async ({ request }) => {
      body = await request.json();
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/api/x',
      jsonBody: { name: 'solidstart' },
    });
    expect(body).toEqual({ name: 'solidstart' });
  });

  it('T-SS-API-006 method default inference: GET / POST', async () => {
    let m: string | undefined;
    const handler: APIRouteHandler = async ({ request }) => {
      m = request.method;
      return new Response('ok');
    };
    await invokeApiRoute({ handler, url: 'http://localhost:3000/x' });
    expect(m).toBe('GET');
    await invokeApiRoute({ handler, url: 'http://localhost:3000/x', formData: { x: 'y' } });
    expect(m).toBe('POST');
  });

  it('T-SS-API-007 method override DELETE', async () => {
    let m: string | undefined;
    const handler: APIRouteHandler = async ({ request }) => {
      m = request.method;
      return new Response('ok');
    };
    await invokeApiRoute({ handler, url: 'http://localhost:3000/x', method: 'DELETE' });
    expect(m).toBe('DELETE');
  });

  it('T-SS-API-008 headers seed', async () => {
    let auth: string | null = null;
    const handler: APIRouteHandler = async ({ request }) => {
      auth = request.headers.get('authorization');
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/x',
      headers: { authorization: 'Bearer tok' },
    });
    expect(auth).toBe('Bearer tok');
  });

  it('T-SS-API-009 locals accessible', async () => {
    let user: unknown;
    const handler: APIRouteHandler = async ({ locals }) => {
      user = locals.user;
      return new Response('ok');
    };
    await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/x',
      locals: { user: { id: 1 } },
    });
    expect(user).toEqual({ id: 1 });
  });

  it('T-SS-API-010 redirect via redirectResponse() → redirect captured', async () => {
    const handler: APIRouteHandler = async () => redirectResponse('/login');
    const { redirect } = await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/secure',
    });
    expect(redirect?.url).toBe('/login');
    expect(redirect?.status).toBe(302);
  });

  it('T-SS-API-011 redirect with no location header → empty url', async () => {
    const handler: APIRouteHandler = async () => new Response(null, { status: 307 });
    const { redirect } = await invokeApiRoute({
      handler,
      url: 'http://localhost:3000/x',
    });
    expect(redirect?.url).toBe('');
    expect(redirect?.status).toBe(307);
  });

  it('T-SS-API-012 default params empty', async () => {
    let p: unknown;
    const handler: APIRouteHandler = async ({ params }) => {
      p = params;
      return new Response('ok');
    };
    await invokeApiRoute({ handler, url: 'http://localhost:3000/x' });
    expect(p).toEqual({});
  });

  it('T-SS-API-013 json() helper: Content-Type set automatically', async () => {
    const res = json({ ok: true });
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('T-SS-API-013b json() forwards init.headers and does not overwrite an explicit content-type', async () => {
    // Two branches the previous test never reached:
    //   `init?.headers` when `init` is defined
    //   `!headers.has('content-type')` when the caller already set one
    const res = json(
      { ok: true },
      { status: 201, headers: { 'content-type': 'application/vnd.api+json', 'x-request-id': 'abc' } },
    );
    expect(res.status).toBe(201);
    expect(res.headers.get('content-type')).toBe('application/vnd.api+json');
    expect(res.headers.get('x-request-id')).toBe('abc');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('T-SS-API-014 redirectResponse() default 302 + location header', () => {
    const res = redirectResponse('/x');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/x');
  });
});
