// items-loader.ts — kiwa-test/remix の invokeLoader が direct invoke する pure loader。
//
// Pattern A (Dependency Injection) — 実 Remix 側は app/routes/items.tsx で
// export const loader = (args) => itemsLoader(args) として thin wrap する。

import { json, redirect, type SimulatedRouteArgs } from '@kiwa-lab/remix';
import { resolveUser } from '../../utils/_kiwa/auth.js';

export interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

export interface ItemsLoaderData {
  readonly items: ReadonlyArray<Item>;
  readonly count: number;
  readonly user: string | null;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'remix', tags: ['framework', 'react'] },
  { id: 3, name: 'vite', tags: ['runtime', 'bundler'] },
];

/**
 * itemsLoader — /items?tag=&limit=
 *   - session 不在 → redirect(302, '/login?from=/items')
 *   - session=banned → json({ error: 'banned' }, { status: 403 })
 *   - tag (multi) で OR filter、 limit で件数制限
 *   - cache-control header injection (e2e 検証用)
 */
export async function itemsLoader(args: SimulatedRouteArgs): Promise<Response> {
  const url = new URL(args.request.url);
  const user = resolveUser(args.request);
  if (user === null) {
    return redirect(`/login?from=${encodeURIComponent(url.pathname)}`, 302);
  }
  if (user.role === 'banned') {
    return json({ error: 'banned' }, { status: 403 });
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

  const data: ItemsLoaderData = { items: filtered, count: filtered.length, user: user.id };
  return json(data, { headers: { 'cache-control': 'public, max-age=60' } });
}
