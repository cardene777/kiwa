import { describe, expect, it } from 'vitest';
import {
  invokeLoader,
  invokeAction,
  redirect,
  json,
  REMIX_REDIRECT_SYMBOL,
  type LoaderFunction,
  type ActionFunction,
} from '../src/index.js';

describe('invokeLoader', () => {
  it('T-RX-001 正常系: loader returns data, response is null', async () => {
    const loader: LoaderFunction = async () => ({ ok: true });
    const r = await invokeLoader({ loader, url: 'http://localhost/items' });
    expect(r.result).toEqual({ ok: true });
    expect(r.response).toBeNull();
    expect(r.redirect).toBeNull();
    expect(r.error).toBeUndefined();
  });

  it('T-RX-002 loader returns Response: response captured, result undefined', async () => {
    const loader: LoaderFunction = async () => json({ name: 'kiwa' });
    const r = await invokeLoader({ loader, url: 'http://localhost/x' });
    expect(r.result).toBeUndefined();
    expect(r.response?.status).toBe(200);
    expect(await r.response?.json()).toEqual({ name: 'kiwa' });
    expect(r.response?.headers.get('content-type')).toContain('application/json');
  });

  it('T-RX-003 loader returns 302 Response → redirect captured', async () => {
    const loader: LoaderFunction = async () => redirect('/login');
    const r = await invokeLoader({ loader, url: 'http://localhost/dashboard' });
    expect(r.redirect?.location).toBe('/login');
    expect(r.redirect?.status).toBe(302);
    expect(r.redirect?.[REMIX_REDIRECT_SYMBOL]).toBe(true);
  });

  it('T-RX-004 loader params accessible', async () => {
    let id: string | undefined;
    const loader: LoaderFunction = async ({ params }) => {
      id = params.id;
      return {};
    };
    await invokeLoader({ loader, url: 'http://localhost/users/42', params: { id: '42' } });
    expect(id).toBe('42');
  });

  it('T-RX-005 loader request.url accessible via args.request', async () => {
    let url: string | undefined;
    const loader: LoaderFunction = async ({ request }) => {
      url = request.url;
      return {};
    };
    await invokeLoader({ loader, url: 'http://localhost/x?q=foo' });
    expect(url).toBe('http://localhost/x?q=foo');
  });

  it('T-RX-006 loader headers seeded into request', async () => {
    let auth: string | null = null;
    const loader: LoaderFunction = async ({ request }) => {
      auth = request.headers.get('authorization');
      return {};
    };
    await invokeLoader({ loader, url: 'http://localhost/x', headers: { authorization: 'Bearer tok' } });
    expect(auth).toBe('Bearer tok');
  });

  it('T-RX-007 loader context accessible', async () => {
    let ctx: unknown;
    const loader: LoaderFunction = async ({ context }) => {
      ctx = context;
      return {};
    };
    await invokeLoader({ loader, url: 'http://localhost/', context: { db: 'main' } });
    expect(ctx).toEqual({ db: 'main' });
  });

  it('T-RX-008 異常系: non-redirect throw surfaces as error', async () => {
    const loader: LoaderFunction = async () => {
      throw new Error('boom');
    };
    const r = await invokeLoader({ loader, url: 'http://localhost/x' });
    expect((r.error as Error).message).toBe('boom');
  });

  it('T-RX-009 redirect signal throw also captured (not just Response)', async () => {
    const loader: LoaderFunction = async () => {
      throw { [REMIX_REDIRECT_SYMBOL]: true, status: 307, location: '/elsewhere' };
    };
    const r = await invokeLoader({ loader, url: 'http://localhost/' });
    expect(r.redirect?.status).toBe(307);
    expect(r.redirect?.location).toBe('/elsewhere');
  });
});

describe('invokeLoader edge cases', () => {
  it('T-RX-009a redirect Response without location header → empty location string', async () => {
    const loader: LoaderFunction = async () => new Response(null, { status: 301 });
    const r = await invokeLoader({ loader, url: 'http://localhost/' });
    expect(r.redirect?.status).toBe(301);
    expect(r.redirect?.location).toBe('');
  });

  it('T-RX-009b 異常系: loader returns undefined → throws Remix-compatible error (MAJOR 3 fix, Issue #568)', async () => {
    // Remix 公式 callRouteLoader 仕様 ... explicit undefined return は throw する。
    // kiwa env でも同 semantics に揃えて、 loader 実装漏れを unit test で fail 検出可能にする。
    const loader: LoaderFunction = async () => undefined as unknown as Record<string, unknown>;
    const r = await invokeLoader({ loader, url: 'http://localhost/' });
    expect(r.error).toBeInstanceOf(Error);
    const msg = (r.error as Error).message;
    expect(msg).toContain('loader');
    expect(msg.toLowerCase()).toContain('return');
  });

  it('T-RX-009c 異常系: loader returns null は OK (undefined と区別、 公式仕様 RR 6.11+)', async () => {
    // null return は React Router 6.11+ では explicit 許容、 undefined のみが禁止対象。
    const loader: LoaderFunction = async () => null;
    const r = await invokeLoader({ loader, url: 'http://localhost/' });
    expect(r.error).toBeUndefined();
    expect(r.result).toBeNull();
  });
});

describe('invokeAction', () => {
  it('T-RX-010 action with formData: parsed via request.formData()', async () => {
    let email: FormDataEntryValue | null = null;
    const action: ActionFunction = async ({ request }) => {
      const fd = await request.formData();
      email = fd.get('email');
      return {};
    };
    await invokeAction({
      action,
      url: 'http://localhost/login',
      formData: { email: 'user@example.com' },
    });
    expect(email).toBe('user@example.com');
  });

  it('T-RX-011 action with JSON body', async () => {
    let body: unknown;
    const action: ActionFunction = async ({ request }) => {
      body = await request.json();
      return {};
    };
    await invokeAction({
      action,
      url: 'http://localhost/x',
      jsonBody: { name: 'kiwa' },
    });
    expect(body).toEqual({ name: 'kiwa' });
  });

  it('T-RX-012 action redirect via Response.redirect', async () => {
    const action: ActionFunction = async () => redirect('/success');
    const r = await invokeAction({ action, url: 'http://localhost/x' });
    expect(r.redirect?.location).toBe('/success');
  });

  it('T-RX-012a action thrown redirect signal captured as redirect (not error)', async () => {
    const action: ActionFunction = async () => {
      throw { [REMIX_REDIRECT_SYMBOL]: true, status: 307, location: '/after-thrown' };
    };
    const r = await invokeAction({ action, url: 'http://localhost/x' });
    expect(r.redirect?.location).toBe('/after-thrown');
    expect(r.redirect?.status).toBe(307);
    expect(r.error).toBeUndefined();
  });

  it('T-RX-012b action thrown non-redirect surfaces as error', async () => {
    const action: ActionFunction = async () => {
      throw new Error('boom-action');
    };
    const r = await invokeAction({ action, url: 'http://localhost/x' });
    expect(r.redirect).toBeNull();
    expect((r.error as Error).message).toBe('boom-action');
  });

  it('T-RX-013 action method default POST', async () => {
    let m: string | undefined;
    const action: ActionFunction = async ({ request }) => {
      m = request.method;
      return {};
    };
    await invokeAction({ action, url: 'http://localhost/x', formData: { x: 'y' } });
    expect(m).toBe('POST');
  });

  it('T-RX-014 explicit method override', async () => {
    let m: string | undefined;
    const action: ActionFunction = async ({ request }) => {
      m = request.method;
      return {};
    };
    await invokeAction({ action, url: 'http://localhost/x', method: 'DELETE' });
    expect(m).toBe('DELETE');
  });
});

describe('Response helpers', () => {
  it('T-RX-015 json() sets Content-Type when missing', async () => {
    const res = json({ ok: true });
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('T-RX-016 json() preserves explicit Content-Type', async () => {
    const res = json({ ok: true }, { headers: { 'content-type': 'application/vnd.kiwa+json' } });
    expect(res.headers.get('content-type')).toBe('application/vnd.kiwa+json');
  });

  it('T-RX-017 redirect() uses 302 by default', () => {
    const res = redirect('/x');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/x');
  });
});
