import { describe, expect, it } from 'vitest';
import {
  invokeParallelRoutes,
  PARALLEL_INTERCEPTION_SYMBOL,
  type ParallelLayoutFunction,
  type SlotInput,
} from '../src/invoke-parallel-routes.js';

interface Node {
  readonly tag: string;
  readonly children?: Array<Node | string>;
}

function h(tag: string, ...children: Array<Node | string>): Node {
  return { tag, children };
}

describe('invokeParallelRoutes', () => {
  it('T-PR-001: renders children + multiple named slots into the layout', async () => {
    const layout: ParallelLayoutFunction<'modal' | 'sidebar', Record<string, unknown>, Node> = ({ children, slots }) =>
      h('layout', children as Node, slots.modal as Node, slots.sidebar as Node);
    const result = await invokeParallelRoutes({
      layout,
      children: () => h('page'),
      slots: [
        { slot: 'modal', component: () => h('modal') },
        { slot: 'sidebar', component: () => h('sidebar') },
      ],
    });
    expect(result.tree?.tag).toBe('layout');
    expect(result.slotResults).toHaveLength(2);
    expect(result.layoutError).toBeUndefined();
  });

  it('T-PR-002: renders slots in parallel (fast slots not blocked by slow ones)', async () => {
    const order: string[] = [];
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.fast as Node, slots.slow as Node),
      children: () => h('page'),
      slots: [
        {
          slot: 'slow',
          component: async () => {
            await new Promise((r) => setTimeout(r, 30));
            order.push('slow');
            return h('slow');
          },
        },
        {
          slot: 'fast',
          component: async () => {
            await new Promise((r) => setTimeout(r, 5));
            order.push('fast');
            return h('fast');
          },
        },
      ],
    });
    expect(order).toEqual(['fast', 'slow']);
    expect(result.slotResults.every((s) => s.error === undefined)).toBe(true);
  });

  it('T-PR-003: per-slot error captured, other slots still render', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.broken as Node ?? h('null'), slots.ok as Node),
      children: () => h('page'),
      slots: [
        {
          slot: 'broken',
          component: () => {
            throw new Error('boom');
          },
        },
        { slot: 'ok', component: () => h('ok') },
      ],
    });
    const broken = result.slotResults.find((s) => s.slot === 'broken');
    const ok = result.slotResults.find((s) => s.slot === 'ok');
    expect((broken?.error as Error).message).toBe('boom');
    expect(broken?.tree).toBeNull();
    expect(ok?.error).toBeUndefined();
    expect((ok?.tree as Node).tag).toBe('ok');
  });

  it('T-PR-004: component=null + defaultFallback renders the fallback', async () => {
    const slots: Array<SlotInput<'modal', Node>> = [
      {
        slot: 'modal',
        component: null,
        defaultFallback: () => h('default'),
      },
    ];
    const result = await invokeParallelRoutes({
      layout: ({ slots: s }) => h('layout', s.modal as Node),
      children: () => h('page'),
      slots,
    });
    const modal = result.slotResults[0];
    expect(modal?.usedDefault).toBe(true);
    expect((modal?.tree as Node).tag).toBe('default');
  });

  it('T-PR-005: component=null without defaultFallback surfaces error', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.modal as Node ?? h('null')),
      children: () => h('page'),
      slots: [{ slot: 'modal', component: null }],
    });
    const modal = result.slotResults[0];
    expect((modal?.error as Error).message).toContain('no default.tsx fallback');
  });

  it('T-PR-006: intercepting=intercepted records the interception match', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.modal as Node),
      children: () => h('page'),
      slots: [
        {
          slot: 'modal',
          component: () => h('intercepted-photo'),
          intercepting: { variant: 'intercepted', url: '/feed/photo/1', distance: 'sibling' },
        },
      ],
    });
    const interception = result.slotResults[0]?.interception;
    expect(interception?.variant).toBe('intercepted');
    expect(interception?.url).toBe('/feed/photo/1');
    expect(interception?.distance).toBe('sibling');
    expect(interception?.[PARALLEL_INTERCEPTION_SYMBOL]).toBe(true);
  });

  it('T-PR-007: intercepting=default forces defaultFallback over component', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.modal as Node),
      children: () => h('page'),
      slots: [
        {
          slot: 'modal',
          component: () => h('intercepted'),
          defaultFallback: () => h('hard-nav-photo'),
          intercepting: { variant: 'default', url: '/feed/photo/1' },
        },
      ],
    });
    const modal = result.slotResults[0];
    expect(modal?.usedDefault).toBe(true);
    expect((modal?.tree as Node).tag).toBe('hard-nav-photo');
    expect(modal?.interception?.variant).toBe('default');
  });

  it('T-PR-008: distance defaults to sibling when omitted', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ slots }) => h('layout', slots.modal as Node),
      children: () => h('page'),
      slots: [
        {
          slot: 'modal',
          component: () => h('x'),
          intercepting: { variant: 'intercepted', url: '/y' },
        },
      ],
    });
    expect(result.slotResults[0]?.interception?.distance).toBe('sibling');
  });

  it('T-PR-009: childrenError captured without aborting slot render', async () => {
    const result = await invokeParallelRoutes({
      layout: ({ children, slots }) => h('layout', (children ?? h('null')) as Node, slots.s as Node),
      children: () => {
        throw new Error('children broke');
      },
      slots: [{ slot: 's', component: () => h('s') }],
    });
    expect((result.childrenError as Error).message).toBe('children broke');
    expect(result.slotResults[0]?.tree).toStrictEqual(h('s'));
  });

  it('T-PR-010: layout throw captured in layoutError', async () => {
    const result = await invokeParallelRoutes({
      layout: () => {
        throw new Error('layout broke');
      },
      children: () => h('page'),
      slots: [{ slot: 's', component: () => h('s') }],
    });
    expect((result.layoutError as Error).message).toBe('layout broke');
    expect(result.tree).toBeNull();
    expect(result.slotResults[0]?.tree).toStrictEqual(h('s'));
  });

  it('T-PR-011: layoutProps propagated to the layout function', async () => {
    let captured = '';
    await invokeParallelRoutes({
      layout: (props) => {
        captured = (props as unknown as { theme: string }).theme;
        return h('layout');
      },
      children: () => h('p'),
      slots: [{ slot: 'modal', component: () => h('m') }],
      layoutProps: { theme: 'dark' } as Record<string, unknown>,
    });
    expect(captured).toBe('dark');
  });

  it('T-PR-012: childrenProps + per-slot props propagated', async () => {
    let childrenSeen = '';
    let slotSeen = '';
    await invokeParallelRoutes({
      layout: ({ children, slots }) => h('layout', children as Node, slots.s as Node),
      children: (props) => {
        childrenSeen = props.userId as string;
        return h('p');
      },
      childrenProps: { userId: 'u-1' },
      slots: [
        {
          slot: 's',
          component: (props) => {
            slotSeen = props.tab as string;
            return h('s');
          },
          props: { tab: 'photos' },
        },
      ],
    });
    expect(childrenSeen).toBe('u-1');
    expect(slotSeen).toBe('photos');
  });

  it('T-PR-013: zero slots still renders layout with empty slots map', async () => {
    let slotsSeen: Record<string, unknown> = {};
    const result = await invokeParallelRoutes({
      layout: ({ children, slots }) => {
        slotsSeen = slots as Record<string, unknown>;
        return h('layout', children as Node);
      },
      children: () => h('page'),
      slots: [],
    });
    expect(slotsSeen).toEqual({});
    expect(result.slotResults).toEqual([]);
    expect(result.tree?.tag).toBe('layout');
  });
});
