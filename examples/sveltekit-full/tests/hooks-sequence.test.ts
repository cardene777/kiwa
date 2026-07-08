// kiwa unit test — sequence(requestIdHandle, authHandle) chain。
//
// `@kiwa/sveltekit` v1.1 の sequence + setupSvelteKitHooksEnv を直接使い、
// hook chain 内 locals 書込 / header 注入 / short-circuit を検証する。

import { beforeEach, describe, expect, it } from 'vitest';
import { setupSvelteKitHooksEnv, sequence } from '@kiwa/sveltekit';
import { authHandle, type AuthLocals } from '../src/lib/_kiwa/auth-handle.js';
import {
  requestIdHandle,
  resetRequestIdCounter,
  type RequestIdLocals,
} from '../src/lib/_kiwa/request-id-handle.js';

describe('hooks.server sequence(requestIdHandle, authHandle)', () => {
  beforeEach(() => {
    resetRequestIdCounter(0);
  });

  it('T-SF-301: requestId が locals に注入 + x-request-id header 付与', async () => {
    const env = setupSvelteKitHooksEnv<RequestIdLocals>({
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
      locals: { user: null, requestId: '' },
      headers: {},
    });
    const { response, localsAtResolve } = await env.runHandle(
      sequence<RequestIdLocals>(requestIdHandle, authHandle as typeof requestIdHandle),
    );
    expect(localsAtResolve?.requestId).toBe('req-1');
    expect(localsAtResolve?.user).toEqual({ id: 'u1', role: 'admin' });
    expect(response.headers.get('x-request-id')).toBe('req-1');
    expect(response.headers.get('x-kiwa-handle')).toBe('passed');
  });

  it('T-SF-302: sequence outer (requestIdHandle) は inner short-circuit でも after 処理が走る', async () => {
    const env = setupSvelteKitHooksEnv<RequestIdLocals>({
      url: 'http://localhost/items',
      cookies: { session: 'banned' },
      locals: { user: null, requestId: '' },
    });
    const { response, resolveCalled, localsAtResolve } = await env.runHandle(
      sequence<RequestIdLocals>(requestIdHandle, authHandle as typeof requestIdHandle),
    );
    // inner (authHandle) が 403 即返却 → 最終 resolve(env) は呼ばれない。
    expect(resolveCalled).toBe(false);
    expect(response.status).toBe(403);
    expect(localsAtResolve).toBeNull();
    // outer (requestIdHandle) は counter インクリメント + after で
    // 403 response にも x-request-id header を付与する (sequence 設計の正常挙動)。
    expect(response.headers.get('x-request-id')).toBe('req-1');
  });

  it('T-SF-303: 連続 request で counter が増えて requestId が変わる', async () => {
    const env = setupSvelteKitHooksEnv<RequestIdLocals>({
      url: 'http://localhost/items',
      locals: { user: null, requestId: '' },
    });
    const seq = sequence<RequestIdLocals>(requestIdHandle, authHandle as typeof requestIdHandle);
    const r1 = await env.runHandle(seq);
    const r2 = await env.runHandle(seq);
    expect(r1.localsAtResolve?.requestId).toBe('req-1');
    expect(r2.localsAtResolve?.requestId).toBe('req-2');
  });
});
