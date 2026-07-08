# Visual regression baseline / diff / accept in 12 min

## What you'll build

A vitest test file that walks the **Chromatic-style visual regression 4-state machine** — seed the baseline, capture the current markup, detect a diff on an intentional change, and accept the diff to restore the passed state. `@kiwa/component`'s `createChromaticVisualMock` hashes rendered markup (`SHA-256(renderMarkup(canvas.root))`) instead of pixels, so the whole flow runs in Node.js without a browser. The mock exposes the exact same `seedBaseline` / `capture` / `captureAll` / `review` API surface a real Chromatic driver implements, so the same test file works against `chromatic-cli` later.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-visual && cd kiwa-visual
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

Create `src/scenes.ts` — 2 scenes across 2 viewports (light desktop + dark mobile) using the built-in `buildCard`:

```ts
import { buildCard, createStoryRegistry } from '@kiwa/component';
import type { CardArgs, StoryObj } from '@kiwa/component';

// Meta with 2 stories, 2 viewports each = 4 baselines
export const cardMeta = {
  title: 'Scenes/Card',
  render: buildCard,
  parameters: {
    chromatic: {
      viewports: ['mobile', 'desktop'],
      diffThreshold: 0, // hash-exact match
    },
  },
  stories: {
    Light: {
      args: { title: 'Release notes', body: 'v1.16 is additive.' } as CardArgs,
    } satisfies StoryObj<CardArgs>,
    Dark: {
      args: { title: 'Release notes', body: 'v1.16 is additive.', footer: 'dark' } as CardArgs,
    } satisfies StoryObj<CardArgs>,
  },
};

export function buildRegistry() {
  const registry = createStoryRegistry();
  registry.register(cardMeta);
  return registry;
}
```

## Test — 4-state machine + accept + reject

Create `tests/visual.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createChromaticVisualMock } from '@kiwa/component';
import { buildRegistry } from '../src/scenes';

// Deterministic timestamp so review entries are stable in the test output
const chromatic = createChromaticVisualMock({ now: () => 1_000_000 });

beforeEach(() => {
  chromatic.reset();
});

describe('Chromatic visual regression — 4-state machine', () => {
  it('captureAll returns status="new" for a fresh scene (no baseline yet)', () => {
    const registry = buildRegistry();
    const mount = registry.mount('Scenes/Card', 'Light');
    const diffs = chromatic.captureAll({ entry: registry.get('Scenes/Card', 'Light'), canvas: mount.canvas });

    // 2 viewports × 1 story = 2 diffs
    expect(diffs).toHaveLength(2);
    for (const d of diffs) {
      expect(d.status).toBe('new');
      expect(d.pixelDiffRatio).toBe(0);
    }
    // baseline was persisted on the first capture
    expect(chromatic.baselines()).toHaveLength(2);
  });

  it('captureAll returns status="passed" when re-capturing the same markup', () => {
    const registry = buildRegistry();
    const entry = registry.get('Scenes/Card', 'Light');
    const mount = registry.mount('Scenes/Card', 'Light');

    // seed the baseline via the first capture
    chromatic.captureAll({ entry, canvas: mount.canvas });

    // re-capture — same args, same markup, same hash → passed
    const mount2 = registry.mount('Scenes/Card', 'Light');
    const diffs = chromatic.captureAll({ entry, canvas: mount2.canvas });
    for (const d of diffs) {
      expect(d.status).toBe('passed');
      expect(d.changed).toBe(false);
    }
  });

  it('captureAll returns status="failed" after an intentional args change', () => {
    const registry = buildRegistry();
    const entry = registry.get('Scenes/Card', 'Light');

    // seed the baseline with the original args
    const original = registry.mount('Scenes/Card', 'Light');
    chromatic.captureAll({ entry, canvas: original.canvas });

    // capture with an override — the body text changes, so the markup hash changes
    const changed = registry.mount('Scenes/Card', 'Light', { body: 'v1.16 is now stable.' });
    const diffs = chromatic.captureAll({ entry, canvas: changed.canvas });
    for (const d of diffs) {
      expect(d.status).toBe('failed');
      expect(d.changed).toBe(true);
      expect(d.pixelDiffRatio).toBe(1); // hash mismatch = full diff
    }
  });

  it('review action="accept" swaps the baseline; the next capture reads passed', () => {
    const registry = buildRegistry();
    const entry = registry.get('Scenes/Card', 'Light');

    // seed + intentional change → failed
    const original = registry.mount('Scenes/Card', 'Light');
    chromatic.captureAll({ entry, canvas: original.canvas });
    const changed = registry.mount('Scenes/Card', 'Light', { body: 'v1.16 is now stable.' });
    chromatic.captureAll({ entry, canvas: changed.canvas });

    // accept both viewports
    for (const viewport of ['mobile', 'desktop']) {
      const entry = chromatic.review({
        storyId: 'scenes-card--light',
        viewport,
        action: 'accept',
      });
      expect(entry.action).toBe('accept');
    }

    // re-capture the changed markup — should now be passed against the swapped baseline
    const requeue = registry.mount('Scenes/Card', 'Light', { body: 'v1.16 is now stable.' });
    const diffs = chromatic.captureAll({ entry, canvas: requeue.canvas });
    for (const d of diffs) {
      expect(d.status).toBe('passed');
    }
  });

  it('review action="reject" leaves the baseline untouched; a re-capture is still failed', () => {
    const registry = buildRegistry();
    const entry = registry.get('Scenes/Card', 'Light');

    const original = registry.mount('Scenes/Card', 'Light');
    chromatic.captureAll({ entry, canvas: original.canvas });
    const changed = registry.mount('Scenes/Card', 'Light', { body: 'v1.16 is now stable.' });
    chromatic.captureAll({ entry, canvas: changed.canvas });

    for (const viewport of ['mobile', 'desktop']) {
      chromatic.review({
        storyId: 'scenes-card--light',
        viewport,
        action: 'reject',
      });
    }

    // baseline is still the original — a re-capture of the changed markup fails
    const requeue = registry.mount('Scenes/Card', 'Light', { body: 'v1.16 is now stable.' });
    const diffs = chromatic.captureAll({ entry, canvas: requeue.canvas });
    for (const d of diffs) {
      expect(d.status).toBe('failed');
    }
  });
});
```

## Run it

```bash
pnpm test
```

You should see 5 passing tests, one per state transition. The `reset()` in `beforeEach` clears all baselines / currents / review history so each test starts from an empty registry.

## The 4-state machine

Every `(storyId, viewport)` pair moves through 4 states.

| State | Trigger | Field mutations |
|---|---|---|
| `new` | first `capture` or `captureAll` — no baseline yet | `baselines()` gains 1 entry; `pixelDiffRatio = 0`, `status = 'new'` |
| `passed` | re-capture with same markup — hashes match | no change to baselines; `pixelDiffRatio = 0`, `status = 'passed'`, `changed = false` |
| `failed` | re-capture with different markup — hashes differ | pending review entry created; `pixelDiffRatio = 1` (or ratio if threshold > 0), `status = 'failed'`, `changed = true` |
| `accepted` | `review({ action: 'accept' })` on the failed state | baseline swapped to current hash; next capture reads `passed` |
| `rejected` | `review({ action: 'reject' })` on the failed state | baseline untouched; next capture with the same current markup reads `failed` again |

## The 3-op capture surface

The mock's `ChromaticVisualMock` interface exposes exactly what real Chromatic exposes at the capture boundary.

1. `seedBaseline({ storyId, viewport, markup, capturedAt? })` — explicit baseline seed for test setup (bypasses the `capture` flow when you want a specific hash pre-loaded)
2. `capture({ entry, canvas, viewport?, now? })` — capture 1 story × 1 viewport, return `VisualDiff` with `{ storyId, viewport, baselineHash, currentHash, changed, pixelDiffRatio, status, threshold }`
3. `captureAll({ entry, canvas, now? })` — capture 1 story across every viewport in `parameters.chromatic.viewports` (falls back to `defaultViewport` if empty)
4. `review({ storyId, viewport, action, reviewedAt? })` — accept or reject a pending diff, return the review entry

Plus 3 introspection helpers.

- `reset()` — clear all baselines / currents / reviews (test isolation)
- `reviewHistory()` — return all review entries in chronological order
- `baselines()` — return every currently-stored baseline

## What the mock does not model

Real Chromatic captures rendered pixels. The mock hashes rendered markup. The difference matters in 3 known cases.

- **Font metric drift** — macOS ships Helvetica Neue with different subpixel positioning than Linux ships DejaVu Sans; real Chromatic sees the difference, markup-hash mocks do not.
- **Anti-aliasing** — a border-radius change from `4px` → `5px` shows up in the markup hash (both are attribute values), but a change in the anti-aliasing algorithm between browser versions does not.
- **Animation state at capture time** — real Chromatic waits for `parameters.chromatic.delay` ms before snapping; the mock ignores the delay because in-memory nodes have no animation clock.

The v1.16-4 dogfood app (`examples/dogfood-visual-regression/`) reports coverage against a real `chromatic-cli` driver env-gated on `CHROMATIC_PROJECT_TOKEN`, so consumers can see the gap.

## Next steps — real Chromatic driver

Set `CHROMATIC_PROJECT_TOKEN` when running the v1.16-4 dogfood app to promote the report from mock-only to real vs mock. The real adapter uploads the Storybook preview build to chromatic.com and captures baseline / diff / review through the web workflow.

```bash
CHROMATIC_PROJECT_TOKEN=xxx pnpm --filter dogfood-visual-regression test
```

## Related

- [Tutorial 19 — Storybook 8 design system in 12 min](./19-storybook-design-system)
- [Tutorial 20 — Playwright CT for 5 form patterns in 12 min](./20-playwright-ct)
- [Concept — Component testing (story + CT + visual diff)](../concepts/component-testing)
- [Migration guide — v1.15 → v1.16](../migrations/v1.15-to-v1.16)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762), sub-issues [#766](https://github.com/cardene777/kiwa/issues/766) / [#767](https://github.com/cardene777/kiwa/issues/767)
