// kiwa unit test for src/lib/_kiwa/auth-handle.ts
// — invokes the pure handle hook through @kiwa-test/sveltekit's invokeHandle.

import { describe, expect, it } from 'vitest';
import { invokeHandle } from '@kiwa-test/sveltekit';
import { authHandle, type AuthLocals } from '../src/lib/_kiwa/auth-handle.js';

describe('authHandle via @kiwa-test/sveltekit invokeHandle', () => {
  it('T-SF-201: session=admin で locals.user 注入 + downstream に到達 + header attach', async () => {
    const { response, resolveCalled, localsAtResolve } = await invokeHandle<AuthLocals>({
      handle: authHandle,
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
      locals: { user: null },
      resolveResponse: new Response('items', { status: 200 }),
    });
    expect(resolveCalled).toBe(true);
    expect(localsAtResolve?.user).toEqual({ id: 'u1', role: 'admin' });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-kiwa-handle')).toBe('passed');
    expect(await response.text()).toBe('items');
  });

  it('T-SF-202: session 不在で locals.user=null + downstream 到達 + header attach', async () => {
    const { response, resolveCalled, localsAtResolve } = await invokeHandle<AuthLocals>({
      handle: authHandle,
      url: 'http://localhost/items',
      locals: { user: null },
    });
    expect(resolveCalled).toBe(true);
    expect(localsAtResolve?.user).toBeNull();
    expect(response.headers.get('x-kiwa-handle')).toBe('passed');
  });

  it('T-SF-203: session=banned は 403 を即返却 + resolve 呼ばれない', async () => {
    const { response, resolveCalled } = await invokeHandle<AuthLocals>({
      handle: authHandle,
      url: 'http://localhost/items',
      cookies: { session: 'banned' },
      locals: { user: null },
    });
    expect(response.status).toBe(403);
    expect(resolveCalled).toBe(false);
    expect(response.headers.get('x-kiwa-handle')).toBeNull();
    expect(await response.text()).toBe('banned');
  });

  it('T-SF-204: resolveResponse を function で動的生成 — locals 反映後の値を観測', async () => {
    const { response } = await invokeHandle<AuthLocals>({
      handle: authHandle,
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
      locals: { user: null },
      resolveResponse: (innerEvent) => {
        const user = innerEvent.locals.user;
        return new Response(user ? `hi ${user.role}` : 'no-user', { status: 200 });
      },
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hi admin');
  });

  it('T-SF-205: session=guest 等 unknown role でも user=null (admin 以外を default 化)', async () => {
    const { localsAtResolve } = await invokeHandle<AuthLocals>({
      handle: authHandle,
      url: 'http://localhost/items',
      cookies: { session: 'guest' },
      locals: { user: null },
    });
    expect(localsAtResolve?.user).toBeNull();
  });
});
