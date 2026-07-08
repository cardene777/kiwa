import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * v1.13 migration guide — v1.12 → v1.13.
 *
 * Verifies the additive-only migration renders the diff blocks + version bump
 * anchors that downstream users copy-paste. Companion spec to `site.spec.ts`
 * V1_13_PAGES block.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');
const pagePath = '/migrations/v1.12-to-v1.13';

test.describe('v1.13 migration — v1.12 → v1.13', () => {
  test('renders headline + @kiwa/realtime anchor', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
      return;
    }
    const url = `file://${join(distDir, `${pagePath.replace(/\/$/, '')}.html`)}`;
    await page.goto(url);
    const body = await page.locator('.VPContent').innerText();
    expect(body).toContain('v1.12 → v1.13');
    expect(body).toContain('@kiwa/realtime');
  });
});
