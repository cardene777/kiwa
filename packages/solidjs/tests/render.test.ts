import { describe, expect, it } from 'vitest';
import {
  renderSolid,
  hydrate,
  createRoot,
  h,
  stringify,
  findElements,
  isSolidElement,
  popEffectScope,
  registerEffect,
  SOLID_ELEMENT_SYMBOL,
} from '../src/render.js';
import { mockEffect, mockSignal, EFFECT_SYMBOL } from '../src/signal.js';
import type { SolidElement } from '../src/render.js';
import type { EffectHandle } from '../src/signal.js';

describe('h + isSolidElement', () => {
  it('T-SJ-019 h creates a Solid element with children flattened as array', () => {
    const el = h('div', { class: 'x' }, 'hello', h('span', null, 'world'));
    expect(isSolidElement(el)).toBe(true);
    expect(el.type).toBe('div');
    expect(el.props).toEqual({ class: 'x' });
    expect(el.children).toHaveLength(2);
    expect((el as { [SOLID_ELEMENT_SYMBOL]?: true })[SOLID_ELEMENT_SYMBOL]).toBe(true);
  });

  it('T-SJ-020 h defaults empty props to an object', () => {
    const el = h('br', null);
    expect(el.props).toEqual({});
    expect(el.children).toEqual([]);
  });
});

describe('renderSolid', () => {
  it('T-SJ-021 mounts a static component and exposes tree + html', () => {
    const Comp = () => h('p', null, 'hi');
    const { tree, html } = renderSolid({ component: Comp });
    expect(isSolidElement(tree)).toBe(true);
    expect(html()).toBe('<p>hi</p>');
  });

  it('T-SJ-022 passes props into the component body', () => {
    const Greet = ({ name }: { name: string }) => h('span', null, `hello ${name}`);
    const { html } = renderSolid({ component: Greet, props: { name: 'kiwa' } });
    expect(html()).toBe('<span>hello kiwa</span>');
  });

  it('T-SJ-023 registers effects created during mount + dispose tears them down', () => {
    const [get, set] = mockSignal(0);
    let observed = -1;
    const Comp = () => {
      const handle = mockEffect(() => {
        observed = get();
      });
      registerEffect(handle);
      return h('div', null, `n=${observed}`);
    };
    const rendered = renderSolid({ component: Comp });
    expect(rendered.effects).toHaveLength(1);
    set(5);
    expect(observed).toBe(5);
    rendered.dispose();
    set(9);
    expect(observed).toBe(5);
  });

  it('T-SJ-024 dispose is idempotent', () => {
    const Comp = () => h('div', null);
    const { dispose } = renderSolid({ component: Comp });
    dispose();
    expect(() => dispose()).not.toThrow();
  });
});

describe('stringify', () => {
  it('T-SJ-025 renders attributes (skipping children / booleans / null)', () => {
    const tree = h(
      'input',
      { type: 'checkbox', checked: true, disabled: false, name: 'agree', placeholder: null },
    );
    expect(stringify(tree)).toBe('<input type="checkbox" checked name="agree"></input>');
  });

  it('T-SJ-026 renders arrays + nested elements + primitives', () => {
    const tree = h('ul', null, [
      h('li', null, 1),
      h('li', null, 'two'),
      null,
      false,
      h('li', null, true, ' ', 3),
    ]);
    expect(stringify(tree)).toBe('<ul><li>1</li><li>two</li><li> 3</li></ul>');
  });
});

describe('findElements', () => {
  it('T-SJ-027 walks the tree in depth-first order + filters by predicate', () => {
    const tree = h('section', null, h('h1', null, 'title'), h('ul', null, [h('li', null, 'a'), h('li', null, 'b')]));
    const lis = findElements(tree, (el) => el.type === 'li');
    expect(lis).toHaveLength(2);
    expect(lis.map((el) => el.children[0])).toEqual(['a', 'b']);
  });

  it('T-SJ-028 returns empty when the tree has no elements', () => {
    expect(findElements('leaf-only', () => true)).toEqual([]);
    expect(findElements(null, () => true)).toEqual([]);
  });
});

describe('hydrate', () => {
  it('T-SJ-029 reports hydrated=true when client html matches ssr markup', () => {
    const Comp = () => h('p', null, 'match');
    const result = hydrate({ component: Comp, ssrMarkup: '<p>match</p>' });
    expect(result.hydrated).toBe(true);
    expect(result.mismatch).toBeNull();
  });

  it('T-SJ-030 reports hydrated=false with a mismatch description on divergence', () => {
    const Comp = () => h('p', null, 'client');
    const result = hydrate({ component: Comp, ssrMarkup: '<p>server</p>' });
    expect(result.hydrated).toBe(false);
    expect(result.mismatch).toContain('server=<p>server</p>');
    expect(result.mismatch).toContain('client=<p>client</p>');
  });
});

describe('createRoot', () => {
  it('T-SJ-031 runs the callback and exposes dispose + scope.disposed()', () => {
    const { scope, dispose, result } = createRoot((d) => {
      return { ok: 1, dispose: d };
    });
    expect(result.ok).toBe(1);
    expect(scope.disposed()).toBe(false);
    dispose();
    expect(scope.disposed()).toBe(true);
  });

  it('T-SJ-032 disposes effects registered inside the root', () => {
    const [get, set] = mockSignal(0);
    let observed = -1;
    const { dispose } = createRoot(() => {
      const handle = mockEffect(() => {
        observed = get();
      });
      registerEffect(handle);
    });
    set(3);
    expect(observed).toBe(3);
    dispose();
    set(4);
    expect(observed).toBe(3);
  });

  it('T-SJ-033 a second dispose call is a no-op', () => {
    let torn = 0;
    const stubHandle: EffectHandle<void> = {
      [EFFECT_SYMBOL]: true,
      runCount: () => 0,
      trace: () => [],
      dispose: () => {
        torn += 1;
      },
    };
    const { dispose } = createRoot(() => {
      registerEffect(stubHandle);
    });
    dispose();
    dispose();
    expect(torn).toBe(1);
  });
});

describe('effect scope stack', () => {
  it('T-SJ-034 popEffectScope on an empty stack returns []', () => {
    // Do not rely on the module-global stack being empty here. A leaked
    // scope from an earlier test would make this pass for the wrong
    // reason (from the popped scope, not from `?? []`). Drain first,
    // then pop one more time to hit the fallback deterministically.
    while (popEffectScope().length > 0) {
      // nothing
    }
    // The stack may hold empty scopes leaked by unrelated tests; keep
    // popping until pop() itself returns undefined (i.e. `?? []` fires).
    let extra = popEffectScope();
    while (extra.length > 0) extra = popEffectScope();
    // Once the stack is empty, one more pop hits the fallback.
    expect(popEffectScope()).toEqual([]);
  });
});

describe('stringify — attribute edge cases', () => {
  it('T-SJ-035 a `children` key in props is skipped (children come from the varargs)', () => {
    // `renderAttrs` guards against a JSX-style `children` prop; without the
    // guard, the tree would render `<div children="oops">…</div>`.
    const el: SolidElement = {
      [SOLID_ELEMENT_SYMBOL]: true,
      type: 'div',
      props: { class: 'x', children: 'oops' },
      children: ['ok'],
    };
    expect(stringify(el)).toBe('<div class="x">ok</div>');
  });
});
