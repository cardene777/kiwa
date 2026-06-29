// items-handler.ts — kiwa-test/nuxt の invokeEventHandler が direct invoke する pure handler。
//
// Pattern A (Dependency Injection) — 実 Nuxt 側は server/api/items.get.ts で
// defineEventHandler(event => itemsHandler(event)) として thin wrap する。
// この分離により kiwa unit test は H3 runtime 不要、 e2e は実 Nuxt + Nitro で動作する。

export interface ItemsHandlerEvent {
  readonly query: Readonly<Record<string, string | string[]>>;
  readonly headers: ReadonlyMap<string, string>;
  setHeader(name: string, value: string): void;
  setStatusCode(code: number): void;
}

export interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'nuxt', tags: ['framework', 'vue'] },
  { id: 3, name: 'nitro', tags: ['runtime', 'server'] },
];

/**
 * Items API — GET /api/items
 *   - query.tag (string | string[]) で tag filter
 *   - query.limit (string number) で max 件数
 *   - headers.authorization 必須 (kiwa-poc-token)、 不在/不正は 401
 *
 * 動作上の特徴:
 *   - setStatusCode(401) を投げず、 cache-control header を inject (kiwa test では env.responseHeaders で捕捉)
 *   - 配列形式 query を JSON 配列にして返却
 */
export function itemsHandler(event: ItemsHandlerEvent): { items: ReadonlyArray<Item>; count: number } | { error: string } {
  const auth = event.headers.get('authorization');
  if (auth !== 'Bearer kiwa-poc-token') {
    event.setStatusCode(401);
    return { error: 'unauthorized' };
  }
  let tags: ReadonlyArray<string> = [];
  const tagQuery = event.query.tag;
  if (typeof tagQuery === 'string') tags = [tagQuery];
  else if (Array.isArray(tagQuery)) tags = tagQuery;

  let filtered: ReadonlyArray<Item> = ITEMS;
  if (tags.length > 0) {
    filtered = ITEMS.filter((item) => tags.some((t) => item.tags.includes(t)));
  }

  const limitRaw = event.query.limit;
  const limit = typeof limitRaw === 'string' ? Number.parseInt(limitRaw, 10) : Number.NaN;
  if (Number.isFinite(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  event.setHeader('cache-control', 'public, max-age=60');
  event.setStatusCode(200);
  return { items: filtered, count: filtered.length };
}
