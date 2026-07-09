// kiwa unit test — apiFetchHandle (handleFetch hook)。

import { describe, expect, it } from 'vitest';
import { setupSvelteKitHooksEnv } from '@kiwa-lab/sveltekit';
import { apiFetchHandle } from '../src/lib/_kiwa/api-fetch-handle.js';
import type { AuthLocals } from '../src/lib/_kiwa/auth-handle.js';

describe('apiFetchHandle via setupSvelteKitHooksEnv.runHandleFetch', () => {
  it('T-SF-401: public host → internal mirror に rewrite', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/items',
      locals: { user: null },
    });
    const { downstreamRequest } = await env.runHandleFetch(apiFetchHandle, {
      fetchUrl: 'https://public.api.example.com/v1/items',
    });
    expect(downstreamRequest).not.toBeNull();
    const downstreamUrl = new URL(downstreamRequest!.url);
    expect(downstreamUrl.host).toBe('internal.api.example.com');
    expect(downstreamUrl.pathname).toBe('/v1/items');
  });

  it('T-SF-402: admin locals.user → authorization header 自動付与', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/items',
      locals: { user: { id: 'u1', role: 'admin' } },
    });
    const { downstreamRequest } = await env.runHandleFetch(apiFetchHandle, {
      fetchUrl: 'https://public.api.example.com/v1/items',
    });
    expect(downstreamRequest?.headers.get('authorization')).toBe('Bearer admin-u1');
  });

  it('T-SF-403: guest / null user → authorization header 未付与', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/items',
      locals: { user: null },
    });
    const { downstreamRequest } = await env.runHandleFetch(apiFetchHandle, {
      fetchUrl: 'https://public.api.example.com/v1/items',
    });
    expect(downstreamRequest?.headers.get('authorization')).toBeNull();
  });

  it('T-SF-404: 非 public host は rewrite せずに passthrough', async () => {
    const env = setupSvelteKitHooksEnv<AuthLocals>({
      url: 'http://localhost/items',
      locals: { user: null },
    });
    const { downstreamRequest } = await env.runHandleFetch(apiFetchHandle, {
      fetchUrl: 'https://other.example.com/v1/items',
    });
    const downstreamUrl = new URL(downstreamRequest!.url);
    expect(downstreamUrl.host).toBe('other.example.com');
  });
});
