import { describe, expect, it } from 'vitest';
import {
  defineIsland,
  isIslandDefinition,
  islandPlaceholder,
  mountIsland,
  isIslandMount,
  hydrateIslands,
  simulateInteraction,
  ISLAND_SYMBOL,
  ISLAND_MOUNT_SYMBOL,
} from '../src/islands.js';
import { h, stringify, isFreshVNode, type FreshChild } from '../src/route.js';
import type { SyntheticEvent } from '../src/islands.js';

describe('defineIsland + placeholder', () => {
  it('T-FR-027 defineIsland brands the returned definition', () => {
    const Counter = defineIsland({
      name: 'Counter',
      component: () => h('div', null, 'x'),
    });
    expect(isIslandDefinition(Counter)).toBe(true);
    expect(Counter[ISLAND_SYMBOL]).toBe(true);
    expect(Counter.name).toBe('Counter');
  });

  it('T-FR-028 defineIsland throws when name is missing', () => {
    expect(() =>
      defineIsland({ name: '', component: () => h('div', null) }),
    ).toThrow(/name is required/);
  });

  it('T-FR-029 islandPlaceholder emits data-island + serialized data-props', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
    });
    const ph = islandPlaceholder(Counter, { start: 3 });
    expect(ph.type).toBe('div');
    expect(ph.props['data-island']).toBe('Counter');
    expect(JSON.parse(String(ph.props['data-props']))).toEqual({ start: 3 });
    expect(stringify(ph)).toContain('data-island="Counter"');
  });

  it('T-FR-030 islandPlaceholder merges defaultProps then override', () => {
    const Counter = defineIsland<{ start: number; step: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
      defaultProps: { start: 0, step: 1 },
    });
    const ph = islandPlaceholder(Counter, { start: 10 });
    expect(JSON.parse(String(ph.props['data-props']))).toEqual({ start: 10, step: 1 });
  });
});

describe('mountIsland', () => {
  it('T-FR-031 mountIsland invokes the component with merged props + brands result', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', { class: 'counter' }, `n=${p.start}`),
    });
    const mount = mountIsland(Counter, { start: 5 });
    expect(isIslandMount(mount)).toBe(true);
    expect(mount[ISLAND_MOUNT_SYMBOL]).toBe(true);
    expect(mount.props).toEqual({ start: 5 });
    expect(mount.html).toBe('<span class="counter">n=5</span>');
  });

  it('T-FR-032 mountIsland collects onClick / onInput handlers from tree', () => {
    let clicked = 0;
    const Button = defineIsland({
      name: 'Button',
      component: () => h('button', { onClick: () => (clicked += 1) }, 'go'),
    });
    const mount = mountIsland(Button);
    expect(mount.handlers.get('click')).toHaveLength(1);
    // simulate manually to confirm the collected fn matches
    const fn = mount.handlers.get('click')?.[0];
    fn?.({ type: 'click', target: undefined, value: undefined, defaultPrevented: false, preventDefault: () => {} });
    expect(clicked).toBe(1);
  });
});

describe('hydrateIslands', () => {
  it('T-FR-033 hydrates a placeholder matching a registered island', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, `n=${p.start}`),
    });
    const ssrTree = h('main', null, islandPlaceholder(Counter, { start: 7 }));
    const { hydrated, missing, unregistered, html } = hydrateIslands({
      ssrTree,
      islands: [Counter],
    });
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.name).toBe('Counter');
    expect(hydrated[0]?.mount.props).toEqual({ start: 7 });
    expect(missing).toEqual([]);
    expect(unregistered).toEqual([]);
    expect(html).toBe('<main><span>n=7</span></main>');
  });

  it('T-FR-034 reports missing when a registered island has no placeholder in the tree', () => {
    const Counter = defineIsland({ name: 'Counter', component: () => h('span', null) });
    const Toggle = defineIsland({ name: 'Toggle', component: () => h('button', null) });
    const ssrTree = h('main', null, islandPlaceholder(Counter));
    const { hydrated, missing } = hydrateIslands({ ssrTree, islands: [Counter, Toggle] });
    expect(hydrated).toHaveLength(1);
    expect(missing).toEqual(['Toggle']);
  });

  it('T-FR-035 reports unregistered when a placeholder has no matching island', () => {
    const ssrTree = h('main', null, h('div', { 'data-island': 'Unknown' }));
    const { hydrated, unregistered } = hydrateIslands({ ssrTree, islands: [] });
    expect(hydrated).toEqual([]);
    expect(unregistered).toEqual(['Unknown']);
  });

  it('T-FR-036 decodes data-props back into the mounted island', () => {
    const Greeter = defineIsland<{ name: string }>({
      name: 'Greeter',
      component: (p) => h('p', null, `hello ${p.name}`),
    });
    const ssrTree = h('main', null, islandPlaceholder(Greeter, { name: 'ada' }));
    const { hydrated, html } = hydrateIslands({ ssrTree, islands: [Greeter] });
    expect(hydrated[0]?.mount.props).toEqual({ name: 'ada' });
    expect(html).toContain('<p>hello ada</p>');
  });

  it('T-FR-037 falls back to {} props when data-props is missing or malformed', () => {
    const Empty = defineIsland<{ ok?: boolean }>({
      name: 'Empty',
      component: (p) => h('div', null, p.ok ? 'y' : 'n'),
    });
    const ssrTree: FreshChild = [
      h('div', { 'data-island': 'Empty' }),
      h('div', { 'data-island': 'Empty', 'data-props': 'not-json' }),
    ];
    const { hydrated } = hydrateIslands({ ssrTree, islands: [Empty] });
    expect(hydrated).toHaveLength(2);
    for (const entry of hydrated) expect(entry.mount.props).toEqual({});
  });
});

describe('simulateInteraction', () => {
  it('T-FR-038 dispatches a click event to every collected handler', () => {
    let count = 0;
    const Counter = defineIsland({
      name: 'Counter',
      component: () =>
        h('div', null, [
          h('button', { onClick: () => (count += 1) }, 'a'),
          h('button', { onClick: () => (count += 10) }, 'b'),
        ]),
    });
    const mount = mountIsland(Counter);
    const result = simulateInteraction({ mount, event: 'click' });
    expect(result.invoked).toBe(2);
    expect(count).toBe(11);
  });

  it('T-FR-039 exposes preventDefault + records defaultPrevented on the result', () => {
    const Form = defineIsland({
      name: 'Form',
      component: () => h('form', { onSubmit: (e: SyntheticEvent) => e.preventDefault() }, 'x'),
    });
    const mount = mountIsland(Form);
    const result = simulateInteraction({ mount, event: 'submit' });
    expect(result.invoked).toBe(1);
    expect(result.defaultPrevented).toBe(true);
  });

  it('T-FR-040 targetType filter surfaces the matching node into event.target', () => {
    let seenType: string | undefined;
    const Input = defineIsland({
      name: 'Input',
      component: () =>
        h('div', null, h('input', { onInput: (e: SyntheticEvent) => (seenType = e.target?.type), type: 'text' })),
    });
    const mount = mountIsland(Input);
    const result = simulateInteraction({ mount, event: 'input', targetType: 'input', value: 'x' });
    expect(result.invoked).toBe(1);
    expect(seenType).toBe('input');
  });

  it('T-FR-041 returns invoked=0 when no handler matches the event name', () => {
    const Comp = defineIsland({
      name: 'Comp',
      component: () => h('div', { onClick: () => {} }, 'x'),
    });
    const mount = mountIsland(Comp);
    const result = simulateInteraction({ mount, event: 'submit' });
    expect(result.invoked).toBe(0);
    expect(result.defaultPrevented).toBe(false);
  });
});

describe('renderAttrs — boolean-true bare attribute', () => {
  it('T-FR-041a hydrateIslands emits boolean-true props as bare HTML attributes on the surrounding tree', () => {
    // Closes the `value === true` bare-attribute arm at lines 192-195 in renderAttrs.
    // `renderAttrs` runs on nodes in the SSR tree, so the boolean-true attribute needs
    // to sit on a wrapper element (not inside the island component, whose HTML is
    // pre-baked by mountIsland).
    const Island = defineIsland<{ n: number }>({
      name: 'Bare',
      component: (p) => h('span', null, String(p.n)),
    });
    const ssrTree = h(
      'form',
      { autocomplete: 'off', novalidate: true },
      islandPlaceholder(Island, { n: 1 }),
    );
    const { html } = hydrateIslands({ ssrTree, islands: [Island] });
    expect(html).toContain(' novalidate');
    expect(html).not.toContain(' novalidate="');
  });
});

describe('multi-island scene', () => {
  it('T-FR-042 hydrates 2 islands in the same SSR tree independently', () => {
    const A = defineIsland<{ n: number }>({
      name: 'A',
      component: (p) => h('span', { class: 'a' }, String(p.n)),
    });
    const B = defineIsland<{ n: number }>({
      name: 'B',
      component: (p) => h('span', { class: 'b' }, String(p.n * 2)),
    });
    const ssrTree = h('div', null, islandPlaceholder(A, { n: 3 }), islandPlaceholder(B, { n: 3 }));
    const { hydrated, html } = hydrateIslands({ ssrTree, islands: [A, B] });
    expect(hydrated).toHaveLength(2);
    expect(html).toContain('<span class="a">3</span>');
    expect(html).toContain('<span class="b">6</span>');
    const spans = hydrated.map((h) => h.mount.tree).filter((t): t is import('../src/route.js').FreshVNode => isFreshVNode(t));
    expect(spans).toHaveLength(2);
  });
});
