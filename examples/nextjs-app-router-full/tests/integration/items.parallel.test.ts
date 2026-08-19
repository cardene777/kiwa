// kiwa test for app/items/_kiwa/items-parallel.ts
// — invokes the parallel layout through @kiwa-lab/nextjs's invokeParallelRoutes.

import { describe, expect, it } from 'vitest';
import {
  findAll,
  invokeParallelRoutes,
  textContent,
  type InvokeParallelRoutesOptions,
  type RscNode,
} from '@kiwa-lab/nextjs';

import {
  ItemActivity,
  ItemDetail,
  ItemDetailDefault,
  ItemDetailModal,
  ItemsList,
  ItemsParallelLayout,
  type ItemsSlot,
} from '../../app/items/_kiwa/items-parallel.js';

// spec = tests/spec/integration/test-spec-items.parallel.md

/** 既定の呼出。 slot ごとの差分だけを TC 側で渡す。 */
type Slots = InvokeParallelRoutesOptions<ItemsSlot, { heading?: string }, RscNode>['slots'];

async function render(slots: Slots, layoutProps: { heading?: string } = { heading: 'items' }) {
  // 第 3 引数の `TNode` を明示する = 既定は `unknown` で、 `findAll` / `textContent` に
  // 渡せない。
  return invokeParallelRoutes<ItemsSlot, { heading?: string }, RscNode>({
    layout: ItemsParallelLayout,
    children: ItemsList,
    slots,
    layoutProps,
  });
}

describe('items parallel routes', () => {
  it('T-PAR-001 全 slot が解決すると layout に並ぶ', async () => {
    const { tree, slotResults, layoutError } = await render([
      { slot: 'detail', component: ItemDetail, props: { id: 1 } },
      { slot: 'activity', component: ItemActivity },
    ]);

    expect(layoutError).toBeUndefined();
    expect(slotResults.map((r) => r.slot)).toEqual(['detail', 'activity']);
    expect(findAll(tree, (node) => node.type === 'article')).toHaveLength(1);
    expect(findAll(tree, (node) => node.type === 'aside')).toHaveLength(1);
  });

  it('T-PAR-002 children は slot と別に描画される', async () => {
    const { tree } = await render([
      { slot: 'detail', component: ItemDetail, props: { id: 1 } },
      { slot: 'activity', component: ItemActivity },
    ]);
    // 一覧は slot ではなく children 側から来る。
    expect(findAll(tree, (node) => node.type === 'ul')).toHaveLength(1);
    expect(textContent(findAll(tree, (node) => node.type === 'article')[0]!)).toBe('kiwa');
  });

  it('T-PAR-003 slot の失敗は他 slot に波及しない', async () => {
    // `@activity` だけを落とす。 **並列なので detail は影響を受けない**。
    const { tree, slotResults } = await render([
      { slot: 'detail', component: ItemDetail, props: { id: 1 } },
      { slot: 'activity', component: ItemActivity, props: { fail: true } },
    ]);

    const activity = slotResults.find((r) => r.slot === 'activity');
    expect(activity?.error).toBeInstanceOf(Error);
    expect(activity?.tree).toBeNull();
    // detail は出ている。 layout も落ちていない。
    expect(findAll(tree, (node) => node.type === 'article')).toHaveLength(1);
    expect(findAll(tree, (node) => node.type === 'aside')).toHaveLength(0);
    // **空の枠も残さない**。 中身だけを見ると、 layout が null の slot に空の `section` を
    // 出しても気付けない (実測で変異が素通りした)。
    expect(findAll(tree, (node) => node.type === 'section')).toHaveLength(1);
  });

  it('T-PAR-004 component の失敗は default fallback で埋めない', async () => {
    // **default.tsx は「slot が無い」 ための仕組みで、 「slot が壊れた」 ための仕組みでは
    // ない**。 fallback を渡していても、 component が throw したら error として残る
    // (`renderSlot` の `useDefault` は `component === null` か `variant: 'default'` の
    // 時だけ真)。 埋めてしまうと壊れた slot が正常な既定値に見える。
    const { tree, slotResults } = await render([
      // id を渡さないと `ItemDetail` は throw する。
      { slot: 'detail', component: ItemDetail, defaultFallback: ItemDetailDefault },
      { slot: 'activity', component: ItemActivity },
    ]);

    const detail = slotResults.find((r) => r.slot === 'detail');
    expect(detail?.error).toBeInstanceOf(Error);
    expect(detail?.usedDefault).toBe(false);
    expect(detail?.tree).toBeNull();
    // fallback の markup は出ない。
    expect(findAll(tree, (node) => node.type === 'p')).toHaveLength(0);
  });

  it('T-PAR-005 component が null なら default に落ちる', async () => {
    const { slotResults } = await render([
      { slot: 'detail', component: null, defaultFallback: ItemDetailDefault },
      { slot: 'activity', component: ItemActivity },
    ]);
    const detail = slotResults.find((r) => r.slot === 'detail');
    expect(detail?.usedDefault).toBe(true);
    expect(detail?.error).toBeUndefined();
  });

  it('T-PAR-006 intercepted variant を記録する', async () => {
    const { tree, slotResults } = await render([
      {
        slot: 'detail',
        component: ItemDetailModal,
        props: { id: 2 },
        intercepting: { variant: 'intercepted', url: '/items/2', distance: 'sibling' },
      },
      { slot: 'activity', component: ItemActivity },
    ]);

    const detail = slotResults.find((r) => r.slot === 'detail');
    expect(detail?.interception).toMatchObject({ variant: 'intercepted', url: '/items/2' });
    // 割り込み時は modal が出る = 一覧の上に重なる想定。
    expect(findAll(tree, (node) => node.type === 'dialog')).toHaveLength(1);
  });

  it('T-PAR-007 default variant は component でなく default を描く', async () => {
    // 直接遷移 (`variant: 'default'`) では割り込み用の component を使わず、
    // `default.tsx` 相当を描く = 同じ URL でも遷移の仕方で出るものが変わる。
    const { tree, slotResults } = await render([
      {
        slot: 'detail',
        component: ItemDetailModal,
        props: { id: 1 },
        defaultFallback: ItemDetailDefault,
        intercepting: { variant: 'default', url: '/items/1' },
      },
      { slot: 'activity', component: ItemActivity },
    ]);
    const detail = slotResults.find((r) => r.slot === 'detail');
    expect(detail?.usedDefault).toBe(true);
    expect(detail?.interception).toMatchObject({ variant: 'default' });
    // modal は出ず、 default が出る。
    expect(findAll(tree, (node) => node.type === 'dialog')).toHaveLength(0);
    expect(textContent(findAll(tree, (node) => node.type === 'p')[0]!)).toBe('select an item');
  });

  it('T-PAR-008 layoutProps が layout に届く', async () => {
    const { tree } = await render(
      [
        { slot: 'detail', component: ItemDetail, props: { id: 1 } },
        { slot: 'activity', component: ItemActivity },
      ],
      { heading: 'custom heading' },
    );
    expect(textContent(findAll(tree, (node) => node.type === 'h1')[0]!)).toBe('custom heading');
  });

  it('T-PAR-009 layoutProps 省略時は既定の見出しになる', async () => {
    // 渡した値だけを見ると既定が一度も走らない = 既定を変えても気付けない
    // (実測で変異が素通りした)。
    const { tree } = await render(
      [
        { slot: 'detail', component: ItemDetail, props: { id: 1 } },
        { slot: 'activity', component: ItemActivity },
      ],
      {},
    );
    expect(textContent(findAll(tree, (node) => node.type === 'h1')[0]!)).toBe('items');
  });
});
