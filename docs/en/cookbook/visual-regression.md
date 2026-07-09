# Visual regression with `@kiwa-lab/visual`

> [🇬🇧 English](./visual-regression.md) • [🇯🇵 日本語](../../ja/cookbook/visual-regression.md)

Pixel-level PNG diff backed by pixelmatch + pngjs — assert that a rendered screenshot still matches its committed baseline, fail with a diff PNG when it doesn't.

## When to use this

- Component / page should look identical until you explicitly say otherwise
- Reviewer wants a one-glance diff image attached to the PR
- You already use Playwright / Vitest, don't want a separate visual-testing platform

## Install

```bash
pnpm add -D @kiwa-lab/visual pixelmatch pngjs
```

`pixelmatch` and `pngjs` are peer/optional — install them next to `@kiwa-lab/visual`.

## Scenario A — Playwright screenshot vs baseline PNG

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { expectNoVisualDiff } from '@kiwa-lab/visual';

const fixtureDir = join(__dirname, 'fixtures');

test('header matches baseline', async ({ page }) => {
  await page.goto('/');
  const actual = await page.locator('header').screenshot();
  const baseline = readFileSync(join(fixtureDir, 'header.baseline.png'));

  expectNoVisualDiff({ baseline, actual }, expect, {
    threshold: 0.1,
    maxDiffPixels: 50,
    diffOutputPath: join(fixtureDir, 'header.diff.png'),
  });
});
```

`threshold` is forwarded to pixelmatch (0–1, lower = stricter). `maxDiffPixels` is the kiwa-side hard limit — exceed it and the assertion throws with the diff PNG location in the message.

## Scenario B — Vitest + jsdom snapshot of a canvas / SVG

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { comparePngBuffers } from '@kiwa-lab/visual';

test('rendered chart matches baseline', () => {
  const baseline = readFileSync('tests/fixtures/chart.baseline.png');
  const actual = readFileSync('tests/fixtures/chart.actual.png');

  const result = comparePngBuffers(baseline, actual, { threshold: 0.05 });

  expect(result.diffPixels).toBeLessThan(10);
});
```

`comparePngBuffers` returns the diff stats so you can layer your own assertions (percent change, region-of-interest mask, etc.).

## Updating a baseline

1. Initial — produce `actual.png`, commit it as `baseline.png` next to the test
2. Regression — open the generated diff PNG, decide if the change is intentional
3. Accept — overwrite `baseline.png` with the new `actual.png` and commit, ideally in the same PR as the underlying change

For repos with many baselines, push them through git LFS or a dedicated baseline branch to keep history light.

## Anti-aliasing pain

Cross-platform AA differences (macOS vs Linux CI) are the #1 cause of false positives. Two defenses:

- `includeAA: false` (default) — pixelmatch already skips AA pixels
- Render through a deterministic engine — Playwright (Chromium) is more stable than Firefox/WebKit for visual diff

## Related

- Package: [`@kiwa-lab/visual`](../../../packages/visual/README.md)
- A11y cookbook: [a11y-axe.md](./a11y-axe.md)
- pixelmatch docs: https://github.com/mapbox/pixelmatch
