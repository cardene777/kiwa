import { describe, expect, it } from 'vitest';
import {
  invokeEndpoint,
  QWIK_ENDPOINT_REDIRECT_SYMBOL,
  type EndpointHandler,
} from '../src/invoke-endpoint.js';

describe('invokeEndpoint', () => {
  it('T-QE-001 正常系: onGet calls json() → response.kind=json + body', async () => {
    const handler: EndpointHandler = async ({ json }) => {
      json(200, { ok: true });
    };
    const { response, redirect, error } = await invokeEndpoint({
      handler,
      url: 'http://localhost:5173/api/health',
    });
    expect(error).toBeUndefined();
    expect(redirect).toBeNull();
    expect(response.kind).toBe('json');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('T-QE-002 text() response captured', async () => {
    const handler: EndpointHandler = async ({ text }) => {
      text(200, 'plain');
    };
    const { response } = await invokeEndpoint({ handler, url: 'http://localhost:5173/api/x' });
    expect(response.kind).toBe('text');
    expect(response.body).toBe('plain');
  });

  it('T-QE-003 params accessible', async () => {
    let id: string | undefined;
    const handler: EndpointHandler<{ id: string }> = async ({ params, json }) => {
      id = params.id;
      json(200, {});
    };
    await invokeEndpoint({
      handler,
      url: 'http://localhost:5173/api/users/42',
      params: { id: '42' },
    });
    expect(id).toBe('42');
  });

  it('T-QE-004 redirect() throws and is captured', async () => {
    const handler: EndpointHandler = async ({ redirect }) => {
      redirect(307, '/elsewhere');
    };
    const { redirect } = await invokeEndpoint({ handler, url: 'http://localhost:5173/api/x' });
    expect(redirect?.[QWIK_ENDPOINT_REDIRECT_SYMBOL]).toBe(true);
    expect(redirect?.status).toBe(307);
    expect(redirect?.location).toBe('/elsewhere');
  });

  it('T-QE-005 status() + setHeader() reflected in response', async () => {
    const handler: EndpointHandler = async ({ status, setHeader, json }) => {
      status(201);
      setHeader('X-Trace', 't_1');
      json(201, { created: true });
    };
    const { response } = await invokeEndpoint({ handler, url: 'http://localhost:5173/api/x' });
    expect(response.status).toBe(201);
    expect(response.headers.get('x-trace')).toBe('t_1');
  });

  it('T-QE-006 POST formData parsed via request.formData()', async () => {
    let email: FormDataEntryValue | null = null;
    const handler: EndpointHandler = async ({ request, json }) => {
      const fd = await request.formData();
      email = fd.get('email');
      json(200, {});
    };
    await invokeEndpoint({
      handler,
      url: 'http://localhost:5173/api/signup',
      formData: { email: 'user@example.com' },
    });
    expect(email).toBe('user@example.com');
  });

  it('T-QE-007 POST JSON body parsed via request.json()', async () => {
    let body: unknown;
    const handler: EndpointHandler = async ({ request, json }) => {
      body = await request.json();
      json(200, {});
    };
    await invokeEndpoint({
      handler,
      url: 'http://localhost:5173/api/x',
      jsonBody: { name: 'qwik' },
    });
    expect(body).toEqual({ name: 'qwik' });
  });

  it('T-QE-008 method default GET / POST inferred from body', async () => {
    let m: string | undefined;
    const handler: EndpointHandler = async ({ request, json }) => {
      m = request.method;
      json(200, {});
    };
    await invokeEndpoint({ handler, url: 'http://localhost:5173/x' });
    expect(m).toBe('GET');
    await invokeEndpoint({ handler, url: 'http://localhost:5173/x', formData: { x: 'y' } });
    expect(m).toBe('POST');
  });

  it('T-QE-009 method override DELETE', async () => {
    let m: string | undefined;
    const handler: EndpointHandler = async ({ request, json }) => {
      m = request.method;
      json(200, {});
    };
    await invokeEndpoint({ handler, url: 'http://localhost:5173/x', method: 'DELETE' });
    expect(m).toBe('DELETE');
  });

  it('T-QE-010 異常系: non-redirect throw surfaces via error', async () => {
    const handler: EndpointHandler = async () => {
      throw new Error('boom');
    };
    const { error } = await invokeEndpoint({ handler, url: 'http://localhost:5173/x' });
    expect((error as Error).message).toBe('boom');
  });

  it('T-QE-011 noop response when handler does not call json/text/redirect', async () => {
    const handler: EndpointHandler = async () => {
      /* noop */
    };
    const { response } = await invokeEndpoint({ handler, url: 'http://localhost:5173/x' });
    expect(response.kind).toBe('noop');
    expect(response.status).toBe(200);
    expect(response.body).toBeUndefined();
  });

  it('T-QE-012 headers seed normalized to lowercase, accessible via event.headers', async () => {
    let auth: string | undefined;
    const handler: EndpointHandler = async ({ headers, json }) => {
      auth = headers.get('authorization');
      json(200, {});
    };
    await invokeEndpoint({
      handler,
      url: 'http://localhost:5173/x',
      headers: { Authorization: 'Bearer tok' },
    });
    expect(auth).toBe('Bearer tok');
  });
});
