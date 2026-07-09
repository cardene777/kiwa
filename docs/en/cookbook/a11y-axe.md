# Accessibility audit with `@kiwa-lab/a11y`

> [🇬🇧 English](./a11y-axe.md) • [🇯🇵 日本語](../../ja/cookbook/a11y-axe.md)

axe-core wrapped for kiwa — run accessibility (a11y) audits inside Vitest + jsdom or against a live Playwright page, then assert against an impact threshold.

## When to use this

- Component test wants to fail on `critical` / `serious` WCAG violations
- E2E flow wants to scan a real page after auth + nav
- CI wants a deterministic "0 blocking violations" gate, not a vague "looks fine"

## Install

```bash
pnpm add -D @kiwa-lab/a11y axe-core
```

`axe-core` is a peer/optional dep — install it alongside `@kiwa-lab/a11y`.

## Scenario A — Vitest + jsdom

`runAxe()` reuses the global `document`. Make sure `vitest.config.ts` sets `environment: 'jsdom'`.

```ts
import { describe, expect, it } from 'vitest';
import { runAxe, expectNoViolations } from '@kiwa-lab/a11y';

describe('LoginForm a11y', () => {
  it('no serious / critical violations after render', async () => {
    document.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input id="email" type="email" />
        <button type="submit" aria-label="Sign in">→</button>
      </form>
    `;

    const results = await runAxe();
    expectNoViolations(results, expect, { maxImpact: 'serious' });
  });
});
```

If a violation crosses the threshold the assertion throws with the full axe summary (rule id + help + offending nodes).

## Scenario B — Playwright page

`runAxe()` is jsdom-only. For Playwright, inject `axe.min.js` into the page, run it client-side, then pass the result to `reportViolations()`.

```ts
import { test, expect } from '@playwright/test';
import { reportViolations } from '@kiwa-lab/a11y';

test('home page is accessible', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' });
  const results = await page.evaluate(async () => {
    // @ts-expect-error axe is loaded into window by the script tag above
    return await window.axe.run();
  });

  const report = reportViolations(results, { maxImpact: 'serious' });
  expect(report.blocking, report.summary).toEqual([]);
});
```

For locked-down CSP, vendor `axe.min.js` into `public/` and `addScriptTag({ path: 'public/axe.min.js' })` instead of the CDN.

## Tuning thresholds per environment

axe-core impact has four levels — `minor` < `moderate` < `serious` < `critical`. Use a tighter threshold in CI than locally.

```ts
const maxImpact = process.env.CI ? 'moderate' : 'serious';
expectNoViolations(results, expect, { maxImpact });
```

## Filtering specific rules

`runAxe()` forwards `runOptions` straight to `axe.run()`, so you can include / exclude rules the same way.

```ts
const results = await runAxe({
  runOptions: {
    rules: {
      'color-contrast': { enabled: true },
      'region': { enabled: false }, // legacy template, can't fix this PR
    },
  },
});
```

## Related

- Package: [`@kiwa-lab/a11y`](../../../packages/a11y/README.md)
- Visual regression cookbook: [visual-regression.md](./visual-regression.md)
- axe-core rule catalogue: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
