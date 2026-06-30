// kiwa unit test for src/utils/_kiwa/auth.ts
// — verifies the pure session resolver against the simulated cookie jar.

import { describe, expect, it } from 'vitest';
import type { SimulatedAPIContext } from '@kiwa-test/astro';
import { resolveUser } from '../src/utils/_kiwa/auth.js';

function buildCookieJar(initial: Record<string, string>): SimulatedAPIContext['cookies'] {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get(name) {
      const value = store.get(name);
      return typeof value === 'undefined' ? undefined : { value };
    },
    set(name, value) {
      store.set(name, value);
    },
    delete(name) {
      store.delete(name);
    },
    has(name) {
      return store.has(name);
    },
  };
}

describe('resolveUser via @kiwa-test/astro cookies jar', () => {
  it('T-AF-301: cookie 不在で session=null', () => {
    expect(resolveUser(buildCookieJar({}))).toBeNull();
  });

  it('T-AF-302: session=admin で admin user', () => {
    expect(resolveUser(buildCookieJar({ session: 'admin' }))).toEqual({ id: 'u1', role: 'admin' });
  });

  it('T-AF-303: session=banned で banned user', () => {
    expect(resolveUser(buildCookieJar({ session: 'banned' }))).toEqual({ id: 'u2', role: 'banned' });
  });

  it('T-AF-304: 未知 session 値で guest user (default)', () => {
    expect(resolveUser(buildCookieJar({ session: 'other' }))).toEqual({ id: 'guest', role: 'guest' });
  });
});
