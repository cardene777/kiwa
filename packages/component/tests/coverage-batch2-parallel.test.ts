/**
 * PR #1439 の続き — component パッケージの残存 defensive branch を閉じる。
 *
 * 対象 =
 *  - `rsc-harness.js:61` の `typeof error === 'string' ? error : error.message`
 *    ternary の truthy (string) 分岐 (既存 test は `new Error()` の falsy 分岐のみ)。
 *  - `dom.js` の implicitRole switch case (`a` / input types / textarea / nav / main)、
 *    `getByRole` name suffix error path、 querySelector 空マッチ、 `[attr]` 存在のみ、
 *    unknown selector primitive、 matchesSimple の class/id 不一致 branch。
 *  - `fixture.js:43` の `if (args.placeholder)` truthy 分岐 (buildInput 内の placeholder 展開)。
 *  - `playwright-ct.js` の getByText locator の fill / textContent / count / node 全 API、
 *    nodeText + clearHandlers の recursion 分岐、 name option 未指定分岐。
 *  - `storybook.js` の detectHeuristicViolations の img alt 欠落、 input label 欠落
 *    branches、 hasAccessibleName の collectText recursion 分岐。
 *
 * src/ には手を入れず、 全て user-facing API 経由で分岐を到達させる。
 */
import { describe, expect, it } from 'vitest';
import {
  appendChild,
  buildButton,
  buildCard,
  buildForm,
  buildInput,
  createCanvas,
  createNode,
  createPlaywrightCTMock,
  createStoryRegistry,
  failRscRender,
  beginRscRender,
  startRscHarness,
} from '../src/index.js';

describe('rsc-harness — failRscRender error string branch (line 61)', () => {
  it('accepts a raw string error and stores it verbatim (truthy arm of ternary)', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'cmp-string' });
    beginRscRender(session);
    const step = failRscRender(session, 'raw-string-error');
    expect(session.error).toBe('raw-string-error');
    expect(step.neutralEvent).toBe('ssr.error_boundary_captured');
  });
});

describe('dom — implicitRole switch coverage (a / input types / textarea / nav / main)', () => {
  it('anchor with href resolves to link role', () => {
    const root = createNode('div');
    appendChild(root, createNode('a', { attrs: { href: '/x' }, text: 'go' }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('link').tag).toBe('a');
  });

  it('anchor without href does not resolve to link role', () => {
    const root = createNode('div');
    appendChild(root, createNode('a', { text: 'no-href' }));
    const canvas = createCanvas(root);
    // findByRole descends; no anchor has link role so throws
    expect(() => canvas.getByRole('link')).toThrow(/no node with role=link/);
  });

  it('input default type resolves to textbox (fallback branch of type ?? "text")', () => {
    const root = createNode('div');
    // no `type` attr — nullish-coalescing to 'text' branch
    appendChild(root, createNode('input', { attrs: { id: 'plain' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('textbox').tag).toBe('input');
  });

  it('input type=checkbox resolves to checkbox role', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'checkbox' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('checkbox').tag).toBe('input');
  });

  it('input type=radio resolves to radio role', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'radio' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('radio').tag).toBe('input');
  });

  it('input type=submit resolves to button role', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'submit', value: 'go' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('button').tag).toBe('input');
  });

  it('input type=button resolves to button role', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { type: 'button' } }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('button').tag).toBe('input');
  });

  it('textarea resolves to textbox role', () => {
    const root = createNode('div');
    appendChild(root, createNode('textarea', { text: 'body' }));
    const canvas = createCanvas(root);
    expect(canvas.getByRole('textbox').tag).toBe('textarea');
  });

  it('nav resolves to navigation role', () => {
    const root = createNode('nav');
    const canvas = createCanvas(root);
    expect(canvas.getByRole('navigation').tag).toBe('nav');
  });

  it('main tag resolves to main role', () => {
    const root = createNode('main');
    const canvas = createCanvas(root);
    expect(canvas.getByRole('main').tag).toBe('main');
  });

  it('h1-h6 heading tags resolve to heading role', () => {
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const root = createNode(tag, { text: 'title' });
      const canvas = createCanvas(root);
      expect(canvas.getByRole('heading').tag).toBe(tag);
    }
  });
});

describe('dom — nodeText fallback for aggregated child text (line 149)', () => {
  it('parent nodeText aggregates children using c.text (defined) and ?? "" (undefined)', () => {
    // findByText only reaches a parent's `nodeText` when no descendant already
    // matched. Search for the concatenated string so the parent must aggregate
    // (defined) + (undefined -> '') child.text values, exercising both arms of
    // the `c.text ?? ''` nullish coalescing on line 149.
    const parent = createNode('span');
    appendChild(parent, createNode('em', { text: 'he' })); // c.text truthy arm
    appendChild(parent, createNode('em')); // c.text undefined → '' fallback arm
    appendChild(parent, createNode('em', { text: 'llo' })); // c.text truthy arm
    const canvas = createCanvas(parent);
    expect(canvas.getByText('hello').tag).toBe('span');
  });
});

describe('dom — getByRole error message includes name suffix when supplied', () => {
  it('threads the { name } option through the error suffix (truthy arm of options?.name)', () => {
    const root = createNode('div');
    // No matching role → throws with name suffix (line 75 truthy branch)
    const canvas = createCanvas(root);
    expect(() => canvas.getByRole('button', { name: 'Save' })).toThrow(/name="Save"/);
  });

  it('omits the name suffix when { name } is not supplied (falsy arm)', () => {
    const root = createNode('div');
    const canvas = createCanvas(root);
    expect(() => canvas.getByRole('button')).toThrow(/no node with role=button/);
  });
});

describe('dom — matchesSimple selector primitives', () => {
  it('[attr] presence selector returns false when attr is undefined (line 236-239)', () => {
    const root = createNode('div');
    // input without `required` attribute → `input[required]` must NOT match
    appendChild(root, createNode('input', { attrs: { id: 'x' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('input[required]')).toBeNull();
  });

  it('[attr] presence selector matches when attr is defined', () => {
    const root = createNode('div');
    appendChild(root, createNode('input', { attrs: { id: 'x', required: 'true' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('input[required]')?.tag).toBe('input');
  });

  it('.class selector rejects nodes not carrying the class token', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { attrs: { class: 'foo baz' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('.qux')).toBeNull();
  });

  it('#id selector rejects nodes whose id does not match', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { attrs: { id: 'other' } }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('#target')).toBeNull();
  });

  it('unknown primitive syntax (colon combinator) returns no match (line 262-265)', () => {
    const root = createNode('div');
    appendChild(root, createNode('button', { text: 'ok' }));
    const canvas = createCanvas(root);
    // ':hover' is not a supported primitive → matchesSimple returns false via default arm
    expect(canvas.querySelector('button:hover')).toBeNull();
  });

  it('querySelector on unmatched selector returns null (candidates length=0 arm)', () => {
    const root = createNode('div');
    appendChild(root, createNode('span', { text: 'x' }));
    const canvas = createCanvas(root);
    expect(canvas.querySelector('article')).toBeNull();
  });
});

describe('fixture — buildInput placeholder branch (line 43)', () => {
  it('renders placeholder attr when args.placeholder is provided (truthy arm)', () => {
    const wrapper = buildInput({
      id: 'search',
      label: 'Search',
      placeholder: 'Type here',
    });
    const canvas = createCanvas(wrapper);
    const input = canvas.querySelector('input');
    expect(input?.attrs['placeholder']).toBe('Type here');
  });
});

describe('playwright-ct — text locator API (fill / textContent / count)', () => {
  it('getByText().fill sets value and fires input event', async () => {
    const ct = createPlaywrightCTMock();
    // Compose a root with an input whose text serves as the locator anchor.
    const root = createNode('div');
    let latest: string | undefined;
    const input = createNode('input', {
      attrs: { id: 'x' },
      text: 'placeholder',
      on: {
        input: (event) => {
          latest = event.value;
        },
      },
    });
    appendChild(root, input);
    const locator = ct.mount(() => root, {});
    await locator.getByText('placeholder').fill('hello');
    expect(latest).toBe('hello');
    expect(input.value).toBe('hello');
  });

  it('getByText().textContent returns joined text (nodeText recursion, line 100-101)', async () => {
    const ct = createPlaywrightCTMock();
    // Parent node with no direct text but children with text —
    // dom.findByText matches the parent (aggregate text), and playwright-ct's nodeText
    // walks the child tree via recursion.
    const parent = createNode('span');
    appendChild(parent, createNode('em', { text: 'hello' }));
    appendChild(parent, createNode('em', { text: 'world' }));
    const root = createNode('div');
    appendChild(root, parent);
    const locator = ct.mount(() => root, {});
    const text = await locator.getByText('helloworld').textContent();
    expect(text).toBe('helloworld');
  });

  it('getByText().textContent returns null when node not found (tryFind catches)', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'exists' });
    expect(await locator.getByText('missing').textContent()).toBeNull();
  });

  it('getByText().count returns 1 when present, 0 when absent', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'yes' });
    expect(await locator.getByText('yes').count()).toBe(1);
    expect(await locator.getByText('no-such-text').count()).toBe(0);
  });

  it('getByText().node returns underlying node or null', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'here' });
    expect(locator.getByText('here').node()?.tag).toBe('button');
    expect(locator.getByText('missing').node()).toBeNull();
  });

  it('getByRole().textContent returns null when locator does not resolve', async () => {
    const ct = createPlaywrightCTMock();
    const locator = ct.mount(buildButton, { label: 'x' });
    expect(await locator.getByRole('checkbox').textContent()).toBeNull();
  });

  it('getByRole with name option threads through fill / textContent / count / node', async () => {
    // Exercises the truthy arm of `name !== undefined ? { name } : undefined` in
    // playwright-ct.js lines 66 / 71 / 75 / 77 for every role locator method.
    const ct = createPlaywrightCTMock();
    let latest: string | undefined;
    const locator = ct.mount(buildInput, {
      id: 'named',
      label: 'Named',
      onChange: (event) => {
        latest = event.value;
      },
    });
    // Fill via role + name (buildInput input has no accessible name; use empty string via role)
    await locator.getByRole('textbox').fill('a');
    expect(latest).toBe('a');
    // Directly attach an aria-labelled button so name-scoped role queries resolve
    const btn = createNode('button', { attrs: { 'aria-label': 'Save' }, text: 'x' });
    appendChild(locator.root, btn);
    await locator.getByRole('button', { name: 'Save' }).fill('anything');
    expect(await locator.getByRole('button', { name: 'Save' }).textContent()).toBeTypeOf('string');
    expect(await locator.getByRole('button', { name: 'Save' }).count()).toBe(1);
    expect(locator.getByRole('button', { name: 'Save' }).node()?.tag).toBe('button');
  });
});

describe('playwright-ct — unmount clears handlers recursively (line 106-108)', () => {
  it('clearHandlers recurses into children on unmount', () => {
    const ct = createPlaywrightCTMock();
    // buildForm creates <form><h2/><input/><input/><button/></form> — nested children
    const locator = ct.mount(buildForm, {
      title: 'x',
      fields: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      onSubmit: () => {},
    });
    // Both submit button and inputs currently carry handlers
    const submit = locator.canvas.getByRole('button');
    expect(submit.handlers['click']).toBeDefined();
    locator.unmount();
    // After unmount the root handlers cleared, and (via recursion) so are the children
    for (const child of locator.root.children) {
      expect(Object.keys(child.handlers)).toHaveLength(0);
    }
  });
});

describe('storybook — detectHeuristicViolations (img alt / input label)', () => {
  it('detects img without alt attribute (line 138-146)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Media',
      render: () => {
        const root = createNode('div');
        appendChild(root, createNode('img', { attrs: { src: '/x.png' } }));
        return root;
      },
      stories: {
        MissingAlt: { args: {} },
      },
    });
    const { canvas } = registry.mount('Media', 'MissingAlt');
    const { violations } = registry.runA11y('Media', 'MissingAlt', canvas);
    expect(violations.some((v) => v.id === 'image-alt')).toBe(true);
  });

  it('does not flag img that carries an alt attribute (branch: alt !== undefined)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Media',
      render: () => {
        const root = createNode('div');
        appendChild(root, createNode('img', { attrs: { src: '/x.png', alt: 'ok' } }));
        return root;
      },
      stories: {
        WithAlt: { args: {} },
      },
    });
    const { canvas } = registry.mount('Media', 'WithAlt');
    const { violations } = registry.runA11y('Media', 'WithAlt', canvas);
    expect(violations.some((v) => v.id === 'image-alt')).toBe(false);
  });

  it('detects unlabeled input (line 153-159)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        appendChild(root, createNode('input', { attrs: { id: 'x', type: 'text' } }));
        return root;
      },
      stories: {
        NoLabel: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'NoLabel');
    const { violations } = registry.runA11y('Form', 'NoLabel', canvas);
    expect(violations.some((v) => v.id === 'label')).toBe(true);
  });

  it('input with aria-label is not flagged', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        appendChild(
          root,
          createNode('input', { attrs: { id: 'x', type: 'text', 'aria-label': 'Search' } }),
        );
        return root;
      },
      stories: {
        AriaLabel: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'AriaLabel');
    const { violations } = registry.runA11y('Form', 'AriaLabel', canvas);
    expect(violations.some((v) => v.id === 'label')).toBe(false);
  });

  it('input with aria-labelledby is not flagged', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        appendChild(
          root,
          createNode('input', { attrs: { id: 'x', type: 'text', 'aria-labelledby': 'lbl' } }),
        );
        return root;
      },
      stories: {
        AriaLabelledby: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'AriaLabelledby');
    const { violations } = registry.runA11y('Form', 'AriaLabelledby', canvas);
    expect(violations.some((v) => v.id === 'label')).toBe(false);
  });

  it('input without type attribute defaults to text via ?? "text" (line 149)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        // No `type` attr — hits the `input.attrs['type'] ?? 'text'` fallback
        appendChild(root, createNode('input', { attrs: { id: 'notype' } }));
        return root;
      },
      stories: {
        NoType: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'NoType');
    const { violations } = registry.runA11y('Form', 'NoType', canvas);
    // typed as text → label heuristic runs and detects missing label
    expect(violations.some((v) => v.id === 'label')).toBe(true);
  });

  it('input types hidden / submit / button are skipped from label heuristic', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        appendChild(root, createNode('input', { attrs: { id: 'h', type: 'hidden' } }));
        appendChild(root, createNode('input', { attrs: { id: 's', type: 'submit' } }));
        appendChild(root, createNode('input', { attrs: { id: 'b', type: 'button' } }));
        return root;
      },
      stories: {
        NonLabelable: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'NonLabelable');
    const { violations } = registry.runA11y('Form', 'NonLabelable', canvas);
    expect(violations.some((v) => v.id === 'label')).toBe(false);
  });

  it('button with aria-label passes accessible name check (collectText recursion via nested text)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Ux',
      render: () => {
        const btn = createNode('button', { attrs: { 'aria-label': 'Close' } });
        return btn;
      },
      stories: {
        AriaLabeled: { args: {} },
      },
    });
    const { canvas } = registry.mount('Ux', 'AriaLabeled');
    const { violations } = registry.runA11y('Ux', 'AriaLabeled', canvas);
    expect(violations.some((v) => v.id === 'button-name')).toBe(false);
  });

  it('button with nested text (child span) walks collectText recursion (line 174-175)', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Ux',
      render: () => {
        const btn = createNode('button');
        // No direct text on button, nested children carry the visible label —
        // hasAccessibleName -> collectText must recurse into children to succeed.
        appendChild(btn, createNode('span', { text: 'Confirm' }));
        return btn;
      },
      stories: {
        NestedLabel: { args: {} },
      },
    });
    const { canvas } = registry.mount('Ux', 'NestedLabel');
    const { violations } = registry.runA11y('Ux', 'NestedLabel', canvas);
    expect(violations.some((v) => v.id === 'button-name')).toBe(false);
  });

  it('input without id triggers hasAssociatedLabel early false path', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Form',
      render: () => {
        const root = createNode('form');
        // No `id` on input, no aria-label — label lookup returns false via `if (!id) return false`
        appendChild(root, createNode('input', { attrs: { type: 'text' } }));
        return root;
      },
      stories: {
        NoId: { args: {} },
      },
    });
    const { canvas } = registry.mount('Form', 'NoId');
    const { violations } = registry.runA11y('Form', 'NoId', canvas);
    expect(violations.some((v) => v.id === 'label')).toBe(true);
  });
});

describe('smoke — buildCard fixture surface exercised for coverage', () => {
  it('renders card with footer and body content', () => {
    const card = buildCard({ title: 'T', body: 'B', footer: 'F' });
    const canvas = createCanvas(card);
    expect(canvas.getByText('T')).toBeDefined();
    expect(canvas.getByText('F')).toBeDefined();
  });
});
