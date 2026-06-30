// kiwa unit test for lib/_kiwa/auth-middleware.ts
// — invokes the pure middleware through @kiwa-test/nextjs's invokeMiddleware.

import { describe, expect, it } from 'vitest';
import { invokeMiddleware } from '@kiwa-test/nextjs';
import { authMiddleware } from '../lib/_kiwa/auth-middleware.js';

describe('authMiddleware via @kiwa-test/nextjs invokeMiddleware', () => {
  it('T-NF-101: session=banned で 403 JSON action', async () => {
    const { env } = await invokeMiddleware({
      middleware: authMiddleware,
      url: 'http://localhost/items',
      cookies: { session: 'banned' },
    });
    expect(env.action.kind).toBe('json');
    expect(env.action.status).toBe(403);
    expect(env.action.body).toEqual({ error: 'banned' });
  });

  it('T-NF-102: session 不在 + /items → /login へ 307 redirect (from クエリ付き)', async () => {
    const { env } = await invokeMiddleware({
      middleware: authMiddleware,
      url: 'http://localhost/items?tag=framework',
    });
    expect(env.action.kind).toBe('redirect');
    expect(env.action.url).toBe('/login?from=%2Fitems');
    expect(env.action.status).toBe(307);
  });

  it('T-NF-103: session 不在 + /api/items → matcher 外なので next() (redirect されない)', async () => {
    const { env } = await invokeMiddleware({
      middleware: authMiddleware,
      url: 'http://localhost/api/items',
    });
    // pure middleware の logic は /items* prefix のみ redirect、 /api/items は next()
    expect(env.action.kind).toBe('next');
    expect(env.responseHeaders.get('x-kiwa-request-id')).toBe('next-default');
  });

  it('T-NF-104: session=admin で next() + x-kiwa-request-id header (default 値)', async () => {
    const { env } = await invokeMiddleware({
      middleware: authMiddleware,
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
    });
    expect(env.action.kind).toBe('next');
    expect(env.responseHeaders.get('x-kiwa-request-id')).toBe('next-default');
  });

  it('T-NF-105: x-request-id header inject 時 x-kiwa-request-id にそのまま echo', async () => {
    const { env } = await invokeMiddleware({
      middleware: authMiddleware,
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
      headers: { 'x-request-id': 'abc-123' },
    });
    expect(env.responseHeaders.get('x-kiwa-request-id')).toBe('abc-123');
  });
});
