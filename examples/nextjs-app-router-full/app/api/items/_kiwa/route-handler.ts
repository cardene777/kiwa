// route-handler.ts — Route Handler (REST API) の pure 実装。
//
// 実 Next.js では app/api/items/route.ts で `export const GET = (req: Request) => handler(req)`
// として thin wrap する。 Next.js v15 の `Request` 互換 API のみ使用。

import { resolveUserFromCookieHeader } from '../../../../lib/_kiwa/auth';

interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'nextjs', tags: ['framework', 'react'] },
  { id: 3, name: 'app-router', tags: ['runtime', 'react'] },
];

/**
 * GET /api/items?tag=&limit=
 *   - session 不在 → 302 redirect to /login?from=/api/items
 *   - session=banned → 403 + { error: 'banned' }
 *   - tag (multi) で OR filter、 limit で件数制限
 *   - cache-control header injection
 */
export async function itemsGetHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const user = resolveUserFromCookieHeader(request.headers.get('cookie'));
  if (user === null) {
    return new Response(null, {
      status: 302,
      headers: { location: `/login?from=${encodeURIComponent(url.pathname)}` },
    });
  }
  if (user.role === 'banned') {
    return new Response(JSON.stringify({ error: 'banned' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  const tagParams = url.searchParams.getAll('tag');
  let filtered: ReadonlyArray<Item> = ITEMS;
  if (tagParams.length > 0) {
    filtered = ITEMS.filter((item) => tagParams.some((t) => item.tags.includes(t)));
  }
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw !== null ? Number.parseInt(limitRaw, 10) : Number.NaN;
  if (Number.isFinite(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  return new Response(JSON.stringify({ items: filtered, count: filtered.length, user: user.id }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
  });
}
