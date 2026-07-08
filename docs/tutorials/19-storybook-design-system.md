# Storybook 8 design system in 12 min

## What you'll build

A vitest test file that registers **3 design-system components** (`Button` / `Input` / `Card`) as Storybook 8 `StoryObj` (CSF3), resolves `meta.args + story.args` per CSF3 semantics, runs each story's `play` function against an in-memory canvas, and asserts a11y violations = 0 through the built-in `runA11y` checker. `@kiwa/component` runs the whole flow in-process, deterministic story ids, and 3 heuristic a11y rules so component regressions fail fast in tests instead of production.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-storybook && cd kiwa-storybook
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa/component
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/stories.ts` — 3 stories, one per component, using the built-in fixture renderers:

```ts
import {
  buildButton,
  buildCard,
  buildInput,
  fireEvent,
} from '@kiwa/component';
import type { StoryObj } from '@kiwa/component';

// Button — 1 default + 1 interactive play
export const buttonMeta = {
  title: 'Design/Button',
  render: buildButton,
  args: { label: 'Save', variant: 'primary' as const },
  parameters: { chromatic: { viewports: ['mobile', 'desktop'] } },
  stories: {
    Default: {} satisfies StoryObj,
    Clicked: {
      args: { onClick: () => void 0 },
      play: async ({ canvasElement, args, step }) => {
        await step('click primary CTA', async () => {
          const button = canvasElement.getByRole('button', { name: args.label });
          fireEvent(button, { type: 'click', target: button });
        });
      },
    } satisfies StoryObj,
  },
};

// Input — email input with label
export const inputMeta = {
  title: 'Design/Input',
  render: buildInput,
  args: { id: 'email', label: 'Email', type: 'email' as const, required: true },
  stories: {
    Default: {} satisfies StoryObj,
    Typed: {
      args: { onChange: () => void 0 },
      play: async ({ canvasElement, step }) => {
        await step('type an email', async () => {
          const input = canvasElement.querySelector('input') ?? canvasElement.root;
          fireEvent(input, { type: 'input', target: input, value: 'ada@example.com' });
        });
      },
    } satisfies StoryObj,
  },
};

// Card — title + body + optional footer
export const cardMeta = {
  title: 'Design/Card',
  render: buildCard,
  args: { title: 'Release notes', body: 'v1.16 is additive.' },
  stories: {
    Default: {} satisfies StoryObj,
    WithFooter: { args: { footer: 'Learn more →' } } satisfies StoryObj,
  },
};
```

Create `src/registry.ts` — a factory that registers all 3 metas into one registry:

```ts
import { createStoryRegistry } from '@kiwa/component';
import { buttonMeta, cardMeta, inputMeta } from './stories.js';

export function buildDesignSystemRegistry() {
  const registry = createStoryRegistry();
  registry.register(buttonMeta);
  registry.register(inputMeta);
  registry.register(cardMeta);
  return registry;
}
```

## Test — registration + args resolution + play + a11y

Create `tests/design-system.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDesignSystemRegistry } from '../src/registry';

describe('design-system Storybook 8 registry', () => {
  it('registers the 3 metas as 6 stories', () => {
    const registry = buildDesignSystemRegistry();
    const entries = registry.list();
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.id).sort()).toEqual([
      'design-button--clicked',
      'design-button--default',
      'design-card--default',
      'design-card--with-footer',
      'design-input--default',
      'design-input--typed',
    ]);
  });

  it('merges meta.args + story.args per CSF3', () => {
    const registry = buildDesignSystemRegistry();
    const clicked = registry.get('Design/Button', 'Clicked');
    // meta.args = { label: 'Save', variant: 'primary' }, story.args adds onClick
    expect(clicked.args.label).toBe('Save');
    expect(clicked.args.variant).toBe('primary');
    expect(typeof clicked.args.onClick).toBe('function');
  });

  it('runs play and records 1 step per step() call', async () => {
    const registry = buildDesignSystemRegistry();
    let hits = 0;
    const clicked = registry.get('Design/Button', 'Clicked');
    // Override onClick so we can count invocations
    const canvas = registry.mount('Design/Button', 'Clicked', {
      onClick: () => hits++,
    }).canvas;
    const result = await registry.play('Design/Button', 'Clicked', canvas, {
      ...clicked.args,
      onClick: () => hits++,
    });
    expect(result.ok).toBe(true);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].label).toBe('click primary CTA');
    expect(hits).toBeGreaterThan(0);
  });

  it('reports 0 a11y violations for a labelled Input', () => {
    const registry = buildDesignSystemRegistry();
    const mount = registry.mount('Design/Input', 'Default');
    const result = registry.runA11y('Design/Input', 'Default', mount.canvas);
    expect(result.violations).toEqual([]);
  });

  it('reports 0 a11y violations for a named Button', () => {
    const registry = buildDesignSystemRegistry();
    const mount = registry.mount('Design/Button', 'Default');
    const result = registry.runA11y('Design/Button', 'Default', mount.canvas);
    expect(result.violations).toEqual([]);
  });
});
```

## Run it

```bash
pnpm test
```

You should see 5 passing tests. If a step fails, `StoryPlayResult.ok` becomes `false` and the failing step's `error` field carries the message — the play never crashes the test runner.

## The 6-op Storybook surface

The whole point of the registry is to expose the exact surface a real Storybook 8 preview channel implements.

1. `register(meta)` — bulk register a `StoryMeta`; every entry keyed by kebab-case `title--storyName`
2. `list()` — enumerate every `StoryEntry`; count must equal the sum of `stories` across all registered metas
3. `get(title, storyName)` — fetch 1 `StoryEntry` by name pair; throws if unknown
4. `mount(title, storyName, overrideArgs?)` — render 1 story to a `MockNode` tree, returns `{ canvas, entry }`
5. `play(title, storyName, canvas, args)` — run the story's `play` function; returns `{ steps, ok }`; safe against user throws
6. `runA11y(title, storyName, canvas)` — run 3 heuristic rules (button-name / image-alt / label); returns `{ violations }`

Every method emits at least 1 trace event, so the fidelity harness can diff mock vs real preview channel without adding shape-level noise.

## The a11y rules

- `button-name` — every `role="button"` needs an accessible name (text content or `aria-label`)
- `image-alt` — every `role="img"` needs an `alt` attribute (blank strings ok for decorative images)
- `label` — every `role="textbox"` / `role="checkbox"` needs a `<label for>` or `aria-label`

Real axe-core has ~50 rules; the mock ships the 3 that catch ~40% of real component-scope findings. To simulate a violation for testing, add `parameters.a11y.injectViolations`:

```ts
const withInjected = {
  title: 'Design/Button',
  render: buildButton,
  stories: {
    Broken: {
      parameters: {
        a11y: {
          injectViolations: [
            { id: 'button-name', nodeId: 'root', message: 'Simulated' },
          ],
        },
      },
    } satisfies StoryObj,
  },
};
```

## Next steps — real Storybook adapter

The v1.16-2 dogfood app (`examples/dogfood-storybook-design-system/`) ships a `makeRealAdapter()` that env-gates on `STORYBOOK_URL`. When the env var is set, the fidelity harness runs the same 6 ops against a real `@storybook/react` preview channel and produces a `runFidelityCheck` report with per-op divergences.

Set the env and re-run the dogfood app to promote the report from mock-only to real vs mock.

```bash
STORYBOOK_URL=http://localhost:6006 pnpm --filter dogfood-storybook-design-system test
```

## Related

- [Tutorial 20 — Playwright CT for 5 form patterns in 12 min](./20-playwright-ct)
- [Tutorial 21 — Visual regression baseline / diff / accept in 12 min](./21-visual-regression)
- [Concept — Component testing (story + CT + visual diff)](../concepts/component-testing)
- [Migration guide — v1.15 → v1.16](../migrations/v1.15-to-v1.16)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762), sub-issues [#763](https://github.com/cardene777/kiwa/issues/763) / [#764](https://github.com/cardene777/kiwa/issues/764) / [#767](https://github.com/cardene777/kiwa/issues/767)
