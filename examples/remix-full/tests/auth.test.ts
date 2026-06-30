// kiwa unit test for app/utils/_kiwa/auth.ts
// — verifies the pure session resolver in isolation.

import { describe, expect, it } from 'vitest';
import { readSessionCookie, resolveUser } from '../app/utils/_kiwa/auth.js';

function buildRequest(cookie: string | null): Request {
  const headers = new Headers();
  if (cookie !== null) headers.set('cookie', cookie);
  return new Request('http://localhost/', { headers });
}

describe('readSessionCookie + resolveUser', () => {
  it('T-RF-301: cookie 不在で session=null', () => {
    expect(readSessionCookie(buildRequest(null))).toBeNull();
    expect(resolveUser(buildRequest(null))).toBeNull();
  });

  it('T-RF-302: cookie に session=admin で admin user', () => {
    expect(readSessionCookie(buildRequest('session=admin'))).toBe('admin');
    expect(resolveUser(buildRequest('session=admin'))).toEqual({ id: 'u1', role: 'admin' });
  });

  it('T-RF-303: cookie に session=banned で banned user', () => {
    expect(resolveUser(buildRequest('session=banned'))).toEqual({ id: 'u2', role: 'banned' });
  });

  it('T-RF-304: 未知 session 値で guest user (default)', () => {
    expect(resolveUser(buildRequest('session=other'))).toEqual({ id: 'guest', role: 'guest' });
  });

  it('T-RF-305: 複数 cookie 混在でも session を抽出', () => {
    expect(readSessionCookie(buildRequest('foo=bar; session=admin; baz=qux'))).toBe('admin');
  });
});
