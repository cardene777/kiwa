// kiwa unit test for app/items/_kiwa/items-action.ts
// — invokes the pure Server Action through @kiwa-lab/nextjs's invokeServerAction.

import { describe, expect, it } from 'vitest';
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-lab/nextjs';
import { buildDefaultEnv, createItemAction } from '../app/items/_kiwa/items-action.js';

function buildFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('createItemAction via @kiwa-lab/nextjs invokeServerAction', () => {
  it('T-NF-001: session 不在で /login redirect (REDIRECT_SYMBOL)', async () => {
    const fd = buildFormData({ name: 'nextjs' });
    const { env, result } = await invokeServerAction({
      action: async (formData: FormData) => {
        const cookieJar = {
          get: () => undefined,
          set: () => undefined,
          delete: () => undefined,
          entries: () => [],
        };
        const e = buildDefaultEnv(cookieJar, () => undefined);
        return createItemAction(formData, e);
      },
      formData: fd,
    });
    expect(env.redirect).not.toBeNull();
    expect(env.redirect?.[REDIRECT_SYMBOL]).toBe(true);
    expect(env.redirect?.url).toBe('/login');
    expect(result).toBeUndefined();
  });

  it('T-NF-002: session=banned で Error throw', async () => {
    const fd = buildFormData({ name: 'nextjs' });
    const { error, env } = await invokeServerAction({
      action: async (formData: FormData) => {
        let lastSetPath: string | undefined;
        const cookieJar = {
          get: (n: string) => (n === 'session' ? 'banned' : undefined),
          set: () => undefined,
          delete: () => undefined,
          entries: () => [],
        };
        const revalidate = (path: string) => {
          lastSetPath = path;
        };
        return createItemAction(formData, buildDefaultEnv(cookieJar, revalidate));
      },
      formData: fd,
    });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('banned');
    expect(env.redirect).toBeNull();
  });

  it('T-NF-003: name 空で { ok: false, field, message }', async () => {
    const fd = buildFormData({ name: '' });
    const { result } = await invokeServerAction({
      action: async (formData: FormData) => {
        const cookieJar = {
          get: (n: string) => (n === 'session' ? 'admin' : undefined),
          set: () => undefined,
          delete: () => undefined,
          entries: () => [],
        };
        return createItemAction(formData, buildDefaultEnv(cookieJar, () => undefined));
      },
      formData: fd,
    });
    expect(result).toEqual({ ok: false, field: 'name', message: 'name is required' });
  });

  it('T-NF-004: name 1 文字で { ok: false, minlength }', async () => {
    const fd = buildFormData({ name: 'a' });
    const { result } = await invokeServerAction({
      action: async (formData: FormData) => {
        const cookieJar = {
          get: (n: string) => (n === 'session' ? 'admin' : undefined),
          set: () => undefined,
          delete: () => undefined,
          entries: () => [],
        };
        return createItemAction(formData, buildDefaultEnv(cookieJar, () => undefined));
      },
      formData: fd,
    });
    expect((result as { ok: boolean; message: string }).ok).toBe(false);
    expect((result as { message: string }).message).toBe('name must be at least 2 characters');
  });

  it('T-NF-005: name=danger で Error throw', async () => {
    const fd = buildFormData({ name: 'danger' });
    const { error } = await invokeServerAction({
      action: async (formData: FormData) => {
        const cookieJar = {
          get: (n: string) => (n === 'session' ? 'admin' : undefined),
          set: () => undefined,
          delete: () => undefined,
          entries: () => [],
        };
        return createItemAction(formData, buildDefaultEnv(cookieJar, () => undefined));
      },
      formData: fd,
    });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('danger forbidden');
  });

  it('T-NF-006: 成功時に { ok: true, id, name } + cookies.set("last-created") + revalidatePath', async () => {
    const fd = buildFormData({ name: 'nextjs', seed: '200' });
    const cookieSets: Array<[string, string]> = [];
    const revalidated: string[] = [];
    const { result } = await invokeServerAction({
      action: async (formData: FormData) => {
        const cookieJar = {
          get: (n: string) => (n === 'session' ? 'admin' : undefined),
          set: (n: string, v: string) => cookieSets.push([n, v]),
          delete: () => undefined,
          entries: () => [],
        };
        return createItemAction(formData, buildDefaultEnv(cookieJar, (p) => revalidated.push(p)));
      },
      formData: fd,
    });
    expect(result).toEqual({ ok: true, id: 206, name: 'nextjs' });
    expect(cookieSets).toContainEqual(['last-created', '206']);
    expect(revalidated).toContain('/items');
  });
});
