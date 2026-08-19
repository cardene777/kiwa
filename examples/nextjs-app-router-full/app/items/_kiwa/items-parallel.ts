// items-parallel.ts — Parallel Routes / Intercepting Routes の pure 実装。
//
// 実 Next.js では app/items/layout.tsx が `@detail` / `@activity` の 2 slot を受け、
// slot ごとに `default.tsx` を fallback として持つ。 kiwa invokeParallelRoutes は
// layout と slot を直接受けるので、 file 規約 (`@slot` dir / `default.tsx`) を
// 再現せずに描画順と失敗の隔離だけを見られる。

import type { RscNode } from '@kiwa-lab/nextjs';

import { type Item } from './items-rsc';

/** layout が受け取る slot の名前。 実 Next.js の `@detail` / `@activity` に対応する。 */
export type ItemsSlot = 'detail' | 'activity';

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'nextjs', tags: ['framework', 'react'] },
];

/** `RscElement` を組む。 children は props の中に入る (`key` は必須)。 */
function el(type: string, props: Record<string, unknown>): RscNode {
  return { type, key: null, props };
}

/** slot を縦に並べる layout。 children は常に先頭に置く。 */
export function ItemsParallelLayout(props: {
  readonly children: RscNode;
  // 失敗した slot には `null` が入る。 `RscNode` は `null` を含むので型は 1 つで足りる。
  readonly slots: Readonly<Record<ItemsSlot, RscNode>>;
  readonly heading?: string;
}): RscNode {
  const children: RscNode[] = [
    el('h1', { children: props.heading ?? 'items' }),
    props.children,
  ];
  // null の slot は描画しない = default fallback も無い slot は「無かった」 ことにする。
  for (const slot of ['detail', 'activity'] as const) {
    const tree = props.slots[slot];
    if (tree !== null && tree !== undefined) {
      children.push(el('section', { 'data-slot': slot, children: tree }));
    }
  }
  return el('div', { 'data-testid': 'items-layout', children });
}

/** children slot。 一覧を出す。 */
export function ItemsList(): RscNode {
  return el('ul', {
    'data-testid': 'items-list',
    children: ITEMS.map((item) => ({
      type: 'li',
      key: String(item.id),
      props: { children: item.name },
    })),
  });
}

/** `@detail` slot。 id が解決できなければ throw し、 slot error として捕捉される。 */
export function ItemDetail(props: { readonly id?: number }): RscNode {
  const item = ITEMS.find((candidate) => candidate.id === props.id);
  if (item === undefined) throw new Error(`item ${String(props.id)} not found`);
  return el('article', { 'data-testid': 'item-detail', children: item.name });
}

/** `@detail` の `default.tsx` 相当。 slot が解決できない時に出る。 */
export function ItemDetailDefault(): RscNode {
  return el('p', { 'data-testid': 'detail-default', children: 'select an item' });
}

/** modal で割り込む時の `@detail`。 一覧の上に重ねる想定。 */
export function ItemDetailModal(props: { readonly id?: number }): RscNode {
  return el('dialog', {
    'data-testid': 'item-modal',
    open: true,
    children: `item ${String(props.id ?? 0)}`,
  });
}

/** `@activity` slot。 失敗の隔離を見せるため、 意図的に落とせる。 */
export function ItemActivity(props: { readonly fail?: boolean }): RscNode {
  if (props.fail === true) throw new Error('activity feed unavailable');
  return el('aside', { 'data-testid': 'item-activity', children: 'recent activity' });
}
