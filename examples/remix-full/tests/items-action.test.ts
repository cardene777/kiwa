// kiwa unit test for app/lib/_kiwa/items-action.ts
// — invokes the pure action through @kiwa-lab/remix's invokeAction.

import { describe, expect, it } from 'vitest';
import { invokeAction } from '@kiwa-lab/remix';
import { createItemAction } from '../app/lib/_kiwa/items-action.js';
import type { CreateItemFailure, CreateItemSuccess } from '../app/lib/_kiwa/items-action.js';

async function readJson(response: Response | null): Promise<unknown> {
  if (response === null) return undefined;
  return await response.clone().json();
}

describe('createItemAction via @kiwa-lab/remix invokeAction', () => {
  it('T-RF-101: session 不在で /login に 302 redirect', async () => {
    const { redirect } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      formData: { name: 'remix' },
    });
    expect(redirect?.status).toBe(302);
    expect(redirect?.location).toBe('/login');
  });

  it('T-RF-102: session=banned で 403 + error JSON', async () => {
    const { response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      headers: { cookie: 'session=banned' },
      formData: { name: 'remix' },
    });
    expect(response?.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: 'banned' });
  });

  it('T-RF-103: name 空で 400 + field error', async () => {
    const { response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      headers: { cookie: 'session=admin' },
      formData: { name: '' },
    });
    expect(response?.status).toBe(400);
    const body = (await readJson(response)) as CreateItemFailure;
    expect(body.field).toBe('name');
    expect(body.message).toBe('name is required');
  });

  it('T-RF-104: name 1 文字で 400 + minlength error', async () => {
    const { response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      headers: { cookie: 'session=admin' },
      formData: { name: 'a' },
    });
    expect(response?.status).toBe(400);
    const body = (await readJson(response)) as CreateItemFailure;
    expect(body.message).toBe('name must be at least 2 characters');
  });

  it('T-RF-105: name=danger で error throw (entry.server で 500 化)', async () => {
    const { error, response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      headers: { cookie: 'session=admin' },
      formData: { name: 'danger' },
    });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('danger forbidden');
    expect(response).toBeNull();
  });

  it('T-RF-106: 成功時 200 + id 計算 + set-cookie header', async () => {
    const { response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?seed=200',
      headers: { cookie: 'session=admin' },
      formData: { name: 'remix' },
    });
    expect(response?.status).toBe(200);
    const body = (await readJson(response)) as CreateItemSuccess;
    expect(body).toEqual({ id: 205, name: 'remix' });
    expect(response?.headers.get('set-cookie')).toBe('last-created=205; Path=/');
  });

  it('T-RF-107: seed 不在 default (100) + name=hello → id=105', async () => {
    const { response } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items',
      headers: { cookie: 'session=admin' },
      formData: { name: 'hello' },
    });
    const body = (await readJson(response)) as CreateItemSuccess;
    expect(body).toEqual({ id: 105, name: 'hello' });
  });
});
