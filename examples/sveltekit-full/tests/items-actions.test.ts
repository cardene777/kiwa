// kiwa unit test for src/routes/items/_kiwa/items-actions.ts
// — invokes the pure action function through @kiwa-test/sveltekit's invokeAction.

import { describe, expect, it } from 'vitest';
import { invokeAction } from '@kiwa-test/sveltekit';
import { createItemAction } from '../src/routes/items/_kiwa/items-actions.js';

describe('createItemAction via @kiwa-test/sveltekit invokeAction', () => {
  it('T-SF-101: session 不在で /login へ 302 redirect', async () => {
    const { redirect, result, fail, error } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create',
      formData: { name: 'svelte' },
    });
    expect(redirect).not.toBeNull();
    expect(redirect?.status).toBe(302);
    expect(redirect?.location).toBe('/login');
    expect(result).toBeUndefined();
    expect(fail).toBeNull();
    expect(error).toBeUndefined();
  });

  it('T-SF-102: name 空で fail(400) + field error', async () => {
    const { fail, result } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create',
      cookies: { session: 'admin' },
      formData: { name: '' },
    });
    expect(fail).not.toBeNull();
    expect(fail?.status).toBe(400);
    expect((fail?.data as { field: string; message: string }).field).toBe('name');
    expect((fail?.data as { field: string; message: string }).message).toBe('name is required');
    expect(result).toBeUndefined();
  });

  it('T-SF-103: name 1 文字で fail(400) + minlength error', async () => {
    const { fail } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create',
      cookies: { session: 'admin' },
      formData: { name: 'a' },
    });
    expect(fail?.status).toBe(400);
    expect((fail?.data as { message: string }).message).toBe('name must be at least 2 characters');
  });

  it('T-SF-104: name=danger で error throw (handleError へ伝播)', async () => {
    const { error, result, fail } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create',
      cookies: { session: 'admin' },
      formData: { name: 'danger' },
    });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('danger forbidden');
    expect(result).toBeUndefined();
    expect(fail).toBeNull();
  });

  it('T-SF-105: 成功時に id 返却 + cookies.last-created を set', async () => {
    const { result, env } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create&seed=200',
      cookies: { session: 'admin' },
      formData: { name: 'svelte' },
    });
    expect(result).toEqual({ id: 206, name: 'svelte' });
    expect(env.cookies.get('last-created')).toBe('206');
  });

  it('T-SF-106: seed 不在 default (100) + name=hello → id=105', async () => {
    const { result } = await invokeAction({
      action: createItemAction,
      url: 'http://localhost/items?/create',
      cookies: { session: 'admin' },
      formData: { name: 'hello' },
    });
    expect(result).toEqual({ id: 105, name: 'hello' });
  });
});
