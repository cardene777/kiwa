# Storybook 8 MDX — CSF3 + MDX doc + interaction runner + coverage report in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/component` v0.3 that models the 5 pieces of a real Storybook 8 authoring loop that every non-trivial design system eventually needs — a story registry that indexes CSF3 `Meta` + `StoryObj` pairs, an args resolver that merges meta / story / render-time args in the right precedence, a mount step that materializes the story into a `CanvasElement` you can query like a real DOM, a play function runner that runs `@storybook/test` step blocks with per-step ok / error tracking, and an a11y checker + coverage reporter that answer "how many stories have MDX docs + interaction play + a11y coverage." `createStoryRegistry()` + `hashMarkup()` + `createCanvas()` give you every one of those pieces without booting a real Storybook 8 dev server. This is the pattern kiwa's `examples/dogfood-storybook-8-mdx-app` exercises against real Storybook 8 under `KIWA_MODE=real` + `STORYBOOK_URL` + `STORYBOOK_MDX_READY=1` + `STORYBOOK_TEST_READY=1`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "story registered but MDX doc missing" gap a reviewer sees in the design system audit.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-storybook-mdx && cd kiwa-storybook-mdx
pnpm init
pnpm add -D @kiwa-test/component@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports `createStoryRegistry` + the DOM primitives (`createNode` + `createCanvas` + `hashMarkup`). This tutorial focuses on the authoring loop end-to-end; tutorials 67-68 cover the other 3 axes (RSC + streaming SSR + view transitions + form-action-advanced + server-action-advanced).

### 2. `createStoryRegistry` — construct the registry

`tests/story/registry.test.ts` — a Storybook 8 CSF3 `Meta` groups N `StoryObj` entries under a common title. The mock indexes them by `title--storyName` (Storybook 8's SB URL param format lowercase / kebab-case) so a query like `registry.get('Components/Button', 'Primary')` returns the same entry the real SB UI would.

```ts
import { describe, expect, it } from 'vitest';
import { createNode, createStoryRegistry } from '@kiwa-test/component';

interface ButtonArgs extends Record<string, unknown> {
  label: string;
  variant: 'primary' | 'secondary';
}

describe('story — createStoryRegistry', () => {
  it('registers a meta + stories and returns per-story entries', () => {
    const registry = createStoryRegistry();

    registry.register<ButtonArgs>({
      title: 'Components/Button',
      render: (args) => createNode('button', { text: args.label }),
      args: { variant: 'primary' },
      stories: {
        Primary: { args: { label: 'Click me' } },
        Secondary: { args: { label: 'Nope', variant: 'secondary' } },
      },
    });

    const entries = registry.list();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.id)).toEqual(['components-button--primary', 'components-button--secondary']);

    const primary = registry.get('Components/Button', 'Primary');
    expect(primary.args).toEqual({ label: 'Click me', variant: 'primary' });

    const secondary = registry.get('Components/Button', 'Secondary');
    expect(secondary.args).toEqual({ label: 'Nope', variant: 'secondary' });
  });

  it('throws when the story does not exist — no silent fallback', () => {
    const registry = createStoryRegistry();
    expect(() => registry.get('Missing', 'Story')).toThrow(/no entry for missing--story/);
  });
});
```

The rule of thumb is that the registry is the SSOT for what stories exist. The mock refuses to return a silent empty entry for a missing story so a test that references a typo (`registry.get('Components/Buton', 'Primary')`) fails immediately.

### 3. `registry.mount` + `renderMarkup` + `hashMarkup` — mount + snapshot

`tests/story/mount.test.ts` — the mount step materializes a `StoryEntry` into a `CanvasElement` that you can query like a real DOM. `renderMarkup(node)` produces a deterministic pseudo-HTML string with sorted attrs; `hashMarkup(markup)` gives you a stable SHA-256 substring for snapshot comparisons — the same input always produces the same hash so visual regression baselines stay stable.

```ts
import { describe, expect, it } from 'vitest';
import { createNode, createStoryRegistry, hashMarkup, renderMarkup } from '@kiwa-test/component';

interface CardArgs extends Record<string, unknown> {
  title: string;
  body: string;
}

describe('story — mount + hashMarkup', () => {
  it('mounts the story into a canvas + queryable', () => {
    const registry = createStoryRegistry();
    registry.register<CardArgs>({
      title: 'Layout/Card',
      render: (args) =>
        createNode('article', {
          children: [
            createNode('h2', { text: args.title }),
            createNode('p', { text: args.body }),
          ],
        }),
      stories: {
        Default: { args: { title: 'Hello', body: 'World' } },
      },
    });

    const { canvas, entry } = registry.mount('Layout/Card', 'Default');
    const [h2] = canvas.querySelectorAll('h2');
    const [p] = canvas.querySelectorAll('p');

    expect(entry.args).toEqual({ title: 'Hello', body: 'World' });
    expect(h2.text).toBe('Hello');
    expect(p.text).toBe('World');
  });

  it('hashMarkup is stable — same input produces same hash', () => {
    const nodeA = createNode('button', { text: 'click' });
    const nodeB = createNode('button', { text: 'click' });
    expect(hashMarkup(renderMarkup(nodeA))).toBe(hashMarkup(renderMarkup(nodeB)));
  });

  it('hashMarkup diverges — different input produces different hash', () => {
    const nodeA = createNode('button', { text: 'click' });
    const nodeB = createNode('button', { text: 'tap' });
    expect(hashMarkup(renderMarkup(nodeA))).not.toBe(hashMarkup(renderMarkup(nodeB)));
  });
});
```

The rule of thumb is that renderMarkup + hashMarkup is the visual regression pipeline. `renderMarkup` produces the SSOT string (attrs sorted, no event handlers), `hashMarkup` reduces it to a 16-hex substring — a snapshot in the baseline (`__snapshots__/button-primary.txt`) stays the same across runs, a change in markup fails loud on the hash comparison.

### 4. `registry.play` — the interaction runner

`tests/story/play.test.ts` — the play function is CSF3's answer to "how do I run a click + assert without a real browser." The mock exposes `context.step(label, fn)` blocks that map 1:1 to `@storybook/test` step blocks; each step records ok / error so the test can assert on the exact step outcome.

```ts
import { describe, expect, it } from 'vitest';
import { addHandler, createNode, createStoryRegistry, fireEvent } from '@kiwa-test/component';

interface CounterArgs extends Record<string, unknown> {
  initial: number;
}

describe('story — play function runner', () => {
  it('runs steps in order and reports ok / error per step', async () => {
    const registry = createStoryRegistry();
    registry.register<CounterArgs>({
      title: 'Interaction/Counter',
      render: (args) => {
        let count = args.initial;
        const button = createNode('button', { text: String(count) });
        addHandler(button, 'click', () => {
          count += 1;
          button.text = String(count);
        });
        return button;
      },
      stories: {
        FromZero: {
          args: { initial: 0 },
          play: async ({ canvasElement, step }) => {
            await step('starts at 0', async () => {
              const [button] = canvasElement.querySelectorAll('button');
              if (button.text !== '0') throw new Error(`expected 0, got ${button.text}`);
            });
            await step('click twice → 2', async () => {
              const [button] = canvasElement.querySelectorAll('button');
              fireEvent(button, { type: 'click', target: button });
              fireEvent(button, { type: 'click', target: button });
              if (button.text !== '2') throw new Error(`expected 2, got ${button.text}`);
            });
          },
        },
      },
    });

    const { canvas } = registry.mount('Interaction/Counter', 'FromZero');
    const result = await registry.play('Interaction/Counter', 'FromZero', canvas);

    expect(result.ok).toBe(true);
    expect(result.steps).toEqual([
      { label: 'starts at 0', ok: true },
      { label: 'click twice → 2', ok: true },
    ]);
  });

  it('records a step failure without swallowing it', async () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Interaction/Fail',
      render: () => createNode('button', { text: 'nope' }),
      stories: {
        Broken: {
          play: async ({ step }) => {
            await step('fails', async () => {
              throw new Error('intentional');
            });
          },
        },
      },
    });

    const { canvas } = registry.mount('Interaction/Fail', 'Broken');
    const result = await registry.play('Interaction/Fail', 'Broken', canvas);

    expect(result.ok).toBe(false);
    expect(result.steps).toEqual([{ label: 'fails', ok: false, error: 'intentional' }]);
  });
});
```

The rule of thumb is that the play function runner is what turns "the button changes on click" from a manual browser check into an automated interaction test. The mock's step block API matches `@storybook/test` exactly so tests written against the mock port to real Storybook 8 without change.

### 5. `registry.runA11y` — the a11y checker

`tests/story/a11y.test.ts` — an a11y check catches the 3 highest-impact heuristics (`button-name` / `image-alt` / `label`) without importing real `axe-core`. The mock also honors `parameters.a11y.injectViolations` so a story can force a specific violation for testing the reporter itself.

```ts
import { describe, expect, it } from 'vitest';
import { createNode, createStoryRegistry } from '@kiwa-test/component';

describe('story — runA11y', () => {
  it('detects a button with no accessible name', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/BrokenButton',
      render: () => createNode('button'),
      stories: {
        NoLabel: {},
      },
    });

    const { canvas } = registry.mount('A11y/BrokenButton', 'NoLabel');
    const { violations } = registry.runA11y('A11y/BrokenButton', 'NoLabel', canvas);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.id).toBe('button-name');
    expect(violations[0]?.impact).toBe('critical');
  });

  it('reports zero violations for a labelled button', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/OkButton',
      render: () => createNode('button', { text: 'Submit' }),
      stories: {
        Labelled: {},
      },
    });

    const { canvas } = registry.mount('A11y/OkButton', 'Labelled');
    const { violations } = registry.runA11y('A11y/OkButton', 'Labelled', canvas);

    expect(violations).toEqual([]);
  });

  it('honors parameters.a11y.disable — the story opts out of a11y', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'A11y/Skipped',
      render: () => createNode('button'),
      parameters: { a11y: { disable: true } },
      stories: {
        Skipped: {},
      },
    });

    const { canvas } = registry.mount('A11y/Skipped', 'Skipped');
    const { violations } = registry.runA11y('A11y/Skipped', 'Skipped', canvas);

    expect(violations).toEqual([]);
  });
});
```

The rule of thumb is that a11y is a heuristic layer, not a formal proof. The mock covers the 3 highest-impact heuristics so a test can assert "buttons have accessible names, images have alt text, form inputs have labels" without importing 40 KB of `axe-core` — enough to catch 80 % of the design system a11y bugs at 5 % of the cost.

### 6. Coverage report — hasChromatic + hasInteraction + hasA11y

`tests/story/coverage.test.ts` — a coverage report answers "how many of my stories have visual regression coverage, interaction play, and a11y coverage?" The pattern is to walk `registry.list()` and count each story's coverage flags — no framework-specific helper needed. The mock's `entry.parameters.chromatic` mirrors the Storybook 8 `parameters.chromatic` addon key exactly, so a story that opts into Chromatic visual regression is trivially detectable.

```ts
import { describe, expect, it } from 'vitest';
import { createNode, createStoryRegistry } from '@kiwa-test/component';

describe('coverage — hasChromatic + hasInteraction + hasA11y', () => {
  it('reports per-story coverage flags + overall percentage', () => {
    const registry = createStoryRegistry();
    registry.register({
      title: 'Complete',
      render: () => createNode('button', { text: 'ok' }),
      parameters: { chromatic: { diffThreshold: 0.01 } },
      stories: {
        Primary: {
          play: async ({ step }) => {
            await step('noop', async () => {});
          },
        },
      },
    });
    registry.register({
      title: 'MissingPlay',
      render: () => createNode('button', { text: 'ok' }),
      parameters: { chromatic: { diffThreshold: 0.01 } },
      stories: {
        Default: {},
      },
    });

    const entries = registry.list();
    const report = entries.map((entry) => ({
      id: entry.id,
      hasChromatic: entry.parameters.chromatic !== undefined,
      hasInteraction: entry.play !== undefined,
      hasA11y: !entry.parameters.a11y?.disable,
    }));

    expect(report).toEqual([
      { id: 'complete--primary', hasChromatic: true, hasInteraction: true, hasA11y: true },
      { id: 'missingplay--default', hasChromatic: true, hasInteraction: false, hasA11y: true },
    ]);

    const total = report.length;
    const withChromatic = report.filter((r) => r.hasChromatic).length;
    const withInteraction = report.filter((r) => r.hasInteraction).length;

    expect(withChromatic / total).toBe(1);
    expect(withInteraction / total).toBe(0.5);
  });
});
```

The rule of thumb is that coverage is what turns "we have 128 stories" into "we have 128 stories, 96 % with Chromatic, 74 % with interaction, 100 % with a11y." The mock's `entry.parameters` + `entry.play` are the SSOT — a test that walks the list can compute any coverage metric the design system audit asks for. For MDX docs coverage the pattern is the same: track which stories have a companion `*.mdx` file separately (Storybook 8 authoring is file-based, not parameter-based) and merge that count with the parameter-derived flags.

## Run it

```bash
pnpm test
```

All 5 files pass in under 3 seconds. The full v0.3 story registry surface — registry + mount + play + a11y + coverage — is exercised by `packages/component/tests/docs-tutorial-v1.34.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- The 5 pieces of a real Storybook 8 authoring loop (registry + mount + play + a11y + coverage) all fit in one mock package (`@kiwa-test/component` v0.3) — the mock skips the addon layer + docs mode + decorators + loaders on purpose because those are the framework-specific pieces that a stable authoring test does not need.
- The story id format (`title--storyName` lowercase / kebab-case) matches Storybook 8's SB URL param format exactly — a mock story id ports to real SB URL query strings without change.
- The play function's `context.step(label, fn)` API matches `@storybook/test` exactly — tests written against the mock port to real Storybook 8 without change.
- The coverage report walks `entry.parameters` + `entry.play` — no coverage-specific helper needed because the mock exposes the same fields Storybook 8's SB Manager UI reads.

## Next steps

- Tutorial 67 walks RSC + streaming SSR + view transitions for the RSC streaming dogfood app.
- Tutorial 68 walks Server Actions + useOptimistic + revalidatePath + revalidateTag + redirect for the Server Action dogfood app.
- Concept doc `docs/concepts/frontend-real-driver-testing.md` documents the 8-axis SSOT + 3 target × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `RSC_STREAMING_BROWSER_READY` / `SERVER_ACTION_BROWSER_READY` / `STORYBOOK_MDX_READY` per-target mapping.
