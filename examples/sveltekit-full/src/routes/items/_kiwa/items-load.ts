// items-load.ts — kiwa-test/sveltekit の invokeLoad が direct invoke する pure load function。
//
// Pattern A (Dependency Injection) — 実 SvelteKit 側は src/routes/items/+page.server.ts で
// export const load = (event) => itemsLoad(event) として thin wrap する。
// この分離により kiwa unit test は SvelteKit runtime 不要、 e2e は実 vite dev + adapter で動作する。

import { error, redirect, type SimulatedLoadEvent } from '@kiwa-lab/sveltekit';

export interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

export interface ItemsLoadResult {
  readonly items: ReadonlyArray<Item>;
  readonly count: number;
  readonly user: string | null;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'sveltekit', tags: ['framework', 'svelte'] },
  { id: 3, name: 'vite', tags: ['runtime', 'bundler'] },
];

/**
 * Items load — /items?tag=&limit=
 *   - cookies.session === 'admin' → user='admin' を含む全件返却
 *   - cookies.session === 'banned' → throw error(403, 'banned')
 *   - cookies.session 不在 → throw redirect(302, '/login?from=/items')
 *   - url.searchParams.tag (string or string[]) で tag filter
 *   - url.searchParams.limit で max 件数
 *   - cache-control header を setHeaders で injection (e2e で確認)
 */
export async function itemsLoad(event: SimulatedLoadEvent): Promise<ItemsLoadResult> {
  const session = event.cookies.get('session');
  if (!session) {
    throw redirect(302, `/login?from=${encodeURIComponent(event.url.pathname)}`);
  }
  if (session === 'banned') {
    throw error(403, 'banned');
  }

  const tagParams = event.url.searchParams.getAll('tag');
  let filtered: ReadonlyArray<Item> = ITEMS;
  if (tagParams.length > 0) {
    filtered = ITEMS.filter((item) => tagParams.some((t) => item.tags.includes(t)));
  }

  const limitRaw = event.url.searchParams.get('limit');
  const limit = limitRaw !== null ? Number.parseInt(limitRaw, 10) : Number.NaN;
  if (Number.isFinite(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  event.setHeaders({ 'cache-control': 'public, max-age=60' });
  return { items: filtered, count: filtered.length, user: session };
}
