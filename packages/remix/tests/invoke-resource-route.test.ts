import { describe, expect, it } from 'vitest';
import { json, redirect } from '../src/invoke-route.js';
import {
  invokeResourceRoute,
  RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL,
} from '../src/invoke-resource-route.js';

describe('invokeResourceRoute', () => {
  it('T-RR-001: GET dispatches to loader and captures JSON Response', async () => {
    const result = await invokeResourceRoute({
      route: { loader: () => json({ ok: true }) },
      url: 'http://x/api/items',
      method: 'GET',
    });
    expect(result.dispatch).toBe('loader');
    expect(result.response?.status).toBe(200);
    await expect(result.response?.json()).resolves.toEqual({ ok: true });
  });

  it('T-RR-002: HEAD also dispatches to loader (Remix semantics)', async () => {
    const result = await invokeResourceRoute({
      route: { loader: () => new Response(null, { status: 200 }) },
      url: 'http://x/api/items',
      method: 'HEAD',
    });
    expect(result.dispatch).toBe('loader');
    expect(result.response?.status).toBe(200);
  });

  it('T-RR-003: POST dispatches to action with formData', async () => {
    const result = await invokeResourceRoute({
      route: {
        action: async ({ request }) => {
          const fd = await request.formData();
          return json({ name: fd.get('name') });
        },
      },
      url: 'http://x/api/items',
      method: 'POST',
      formData: { name: 'kiwa' },
    });
    expect(result.dispatch).toBe('action');
    await expect(result.response?.json()).resolves.toEqual({ name: 'kiwa' });
  });

  it('T-RR-004: PUT / PATCH / DELETE all dispatch to action', async () => {
    for (const method of ['PUT', 'PATCH', 'DELETE'] as const) {
      const result = await invokeResourceRoute({
        route: { action: () => new Response(null, { status: 204 }) },
        url: 'http://x/api/items/1',
        method,
      });
      expect(result.dispatch).toBe('action');
      expect(result.response?.status).toBe(204);
    }
  });

  it('T-RR-005: GET with no loader returns 405 + methodNotAllowed signal', async () => {
    const result = await invokeResourceRoute({
      route: { action: () => new Response('post-only', { status: 200 }) },
      url: 'http://x/api/items',
      method: 'GET',
    });
    expect(result.dispatch).toBe('method-not-allowed');
    expect(result.response?.status).toBe(405);
    expect(result.methodNotAllowed?.method).toBe('GET');
    expect(result.methodNotAllowed?.allow).toEqual(['POST', 'PUT', 'PATCH', 'DELETE']);
    expect(result.methodNotAllowed?.[RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL]).toBe(true);
  });

  it('T-RR-006: POST with no action returns 405 + allow GET/HEAD', async () => {
    const result = await invokeResourceRoute({
      route: { loader: () => new Response('get-only') },
      url: 'http://x/api/items',
      method: 'POST',
    });
    expect(result.dispatch).toBe('method-not-allowed');
    expect(result.response?.status).toBe(405);
    expect(result.response?.headers.get('allow')).toBe('GET, HEAD');
  });

  it('T-RR-007: empty route module returns 405 with empty allow list (no allow header)', async () => {
    const result = await invokeResourceRoute({
      route: {},
      url: 'http://x/api/items',
      method: 'GET',
    });
    expect(result.dispatch).toBe('method-not-allowed');
    expect(result.methodNotAllowed?.allow).toEqual([]);
    expect(result.response?.headers.get('allow')).toBeNull();
  });

  it('T-RR-008: method is case-insensitive (lowercase get works)', async () => {
    const result = await invokeResourceRoute({
      route: { loader: () => json({ method: 'get' }) },
      url: 'http://x/api/items',
      method: 'get',
    });
    expect(result.dispatch).toBe('loader');
  });

  it('T-RR-009: loader returning redirect Response captured into redirect field', async () => {
    const result = await invokeResourceRoute({
      route: { loader: () => redirect('/login', 302) },
      url: 'http://x/api/me',
      method: 'GET',
    });
    expect(result.dispatch).toBe('loader');
    expect(result.redirect?.status).toBe(302);
    expect(result.redirect?.location).toBe('/login');
  });

  it('T-RR-010: action returning octet-stream Response (download) works end-to-end', async () => {
    const buf = new Uint8Array([1, 2, 3, 4]);
    const result = await invokeResourceRoute({
      route: {
        action: () =>
          new Response(buf, {
            status: 200,
            headers: { 'content-type': 'application/octet-stream' },
          }),
      },
      url: 'http://x/api/export',
      method: 'POST',
    });
    expect(result.dispatch).toBe('action');
    expect(result.response?.headers.get('content-type')).toBe('application/octet-stream');
    const recv = new Uint8Array(await result.response!.arrayBuffer());
    expect(Array.from(recv)).toEqual([1, 2, 3, 4]);
  });

  it('T-RR-011: action error captured (non-redirect throw)', async () => {
    const result = await invokeResourceRoute({
      route: {
        action: () => {
          throw new Error('boom');
        },
      },
      url: 'http://x/api/items',
      method: 'POST',
    });
    expect(result.dispatch).toBe('action');
    expect((result.error as Error).message).toBe('boom');
  });

  it('T-RR-012: params + context propagated to loader', async () => {
    let id: string | undefined;
    let ctx: string | undefined;
    await invokeResourceRoute({
      route: {
        loader: ({ params, context }) => {
          id = params.id;
          ctx = (context as { db?: string }).db;
          return new Response('ok');
        },
      },
      url: 'http://x/api/items/42',
      method: 'GET',
      params: { id: '42' },
      context: { db: 'pg' },
    });
    expect(id).toBe('42');
    expect(ctx).toBe('pg');
  });

  it('T-RR-013: jsonBody propagated to action via request.json()', async () => {
    let body: { x?: number } = {};
    await invokeResourceRoute({
      route: {
        action: async ({ request }) => {
          body = (await request.json()) as { x: number };
          return new Response('ok');
        },
      },
      url: 'http://x/api/items',
      method: 'PUT',
      jsonBody: { x: 1 },
    });
    expect(body.x).toBe(1);
  });

  it('T-RR-014: headers propagated to loader request', async () => {
    let auth: string | null = '';
    await invokeResourceRoute({
      route: {
        loader: ({ request }) => {
          auth = request.headers.get('authorization');
          return new Response('ok');
        },
      },
      url: 'http://x/api/me',
      method: 'GET',
      headers: { authorization: 'Bearer abc' },
    });
    expect(auth).toBe('Bearer abc');
  });

  it('T-RR-015: params + context + headers propagated to action (POST)', async () => {
    let id: string | undefined;
    let db: string | undefined;
    let auth: string | null = '';
    await invokeResourceRoute({
      route: {
        action: ({ request, params, context }) => {
          id = params.id;
          db = (context as { db?: string }).db;
          auth = request.headers.get('authorization');
          return new Response('ok');
        },
      },
      url: 'http://x/api/items/42',
      method: 'POST',
      params: { id: '42' },
      context: { db: 'pg' },
      headers: { authorization: 'Bearer xyz' },
    });
    expect(id).toBe('42');
    expect(db).toBe('pg');
    expect(auth).toBe('Bearer xyz');
  });
});
