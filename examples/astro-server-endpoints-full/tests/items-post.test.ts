// kiwa unit test for src/pages/api/_kiwa/items-endpoint.ts (POST)

import { describe, expect, it } from 'vitest';
import { invokeEndpoint } from '@kiwa-lab/astro';
import { itemsPostEndpoint } from '../src/pages/api/_kiwa/items-endpoint.js';

async function readJson(response: Response): Promise<unknown> {
  return await response.clone().json();
}

describe('itemsPostEndpoint via @kiwa-lab/astro invokeEndpoint', () => {
  it('T-AF-101: session 不在で /login に 302 redirect', async () => {
    const { redirect } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items',
      method: 'POST',
      formData: { name: 'astro' },
    });
    expect(redirect?.status).toBe(302);
    expect(redirect?.url).toBe('/login');
  });

  it('T-AF-102: session=banned で 403', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items',
      method: 'POST',
      cookies: { session: 'banned' },
      formData: { name: 'astro' },
    });
    expect(response.status).toBe(403);
  });

  it('T-AF-103: name 空で 400 + field error', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items',
      method: 'POST',
      cookies: { session: 'admin' },
      formData: { name: '' },
    });
    expect(response.status).toBe(400);
    const body = (await readJson(response)) as { field: string; message: string };
    expect(body.field).toBe('name');
    expect(body.message).toBe('name is required');
  });

  it('T-AF-104: name 1 文字で 400 + minlength error', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items',
      method: 'POST',
      cookies: { session: 'admin' },
      formData: { name: 'a' },
    });
    expect(response.status).toBe(400);
    const body = (await readJson(response)) as { message: string };
    expect(body.message).toBe('name must be at least 2 characters');
  });

  it('T-AF-105: name=danger で error throw', async () => {
    await expect(
      invokeEndpoint({
        endpoint: itemsPostEndpoint,
        url: 'http://localhost/api/items',
        method: 'POST',
        cookies: { session: 'admin' },
        formData: { name: 'danger' },
      }),
    ).rejects.toThrow('danger forbidden');
  });

  it('T-AF-106: 成功時 200 + id 計算 + set-cookie header', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items?seed=200',
      method: 'POST',
      cookies: { session: 'admin' },
      formData: { name: 'astro' },
    });
    expect(response.status).toBe(200);
    const body = (await readJson(response)) as { id: number; name: string };
    expect(body).toEqual({ id: 205, name: 'astro' });
    expect(response.headers.get('set-cookie')).toBe('last-created=205; Path=/');
  });

  it('T-AF-107: seed 不在 default (100) + name=hello → id=105', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsPostEndpoint,
      url: 'http://localhost/api/items',
      method: 'POST',
      cookies: { session: 'admin' },
      formData: { name: 'hello' },
    });
    const body = (await readJson(response)) as { id: number };
    expect(body.id).toBe(105);
  });
});
