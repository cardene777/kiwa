import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * v1.13 tutorial 10 — Ably shared cursor + 60 fps throttle + history rewind.
 *
 * Companion spec to `site.spec.ts` V1_13_PAGES block. Kept as a standalone
 * file so failures point directly at the tutorial 10 render without depending
 * on the parameterized loop.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');
const pagePath = '/tutorials/10-ably-collab-cursor';

test.describe('v1.13 tutorial 10 — Ably shared cursor', () => {
  test('renders headline + throttle + history rewind anchors', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
      return;
    }
    const url = `file://${join(distDir, `${pagePath.replace(/\/$/, '')}.html`)}`;
    await page.goto(url);
    const body = await page.locator('.VPContent').innerText();
    expect(body).toContain('Ably shared cursor');
    expect(body).toContain('throttle');
    expect(body).toContain('history rewind');
  });
});
