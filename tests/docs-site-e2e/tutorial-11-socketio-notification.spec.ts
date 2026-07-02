import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * v1.13 tutorial 11 — Socket.io notification + reconnect + pending replay +
 * backpressure.
 *
 * Companion spec to `site.spec.ts` V1_13_PAGES block. Kept as a standalone
 * file so failures point directly at the tutorial 11 render without depending
 * on the parameterized loop.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');
const pagePath = '/tutorials/11-socketio-notification';

test.describe('v1.13 tutorial 11 — Socket.io notification', () => {
  test('renders headline + reconnect + backpressure anchors', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
      return;
    }
    const url = `file://${join(distDir, `${pagePath.replace(/\/$/, '')}.html`)}`;
    await page.goto(url);
    const body = await page.locator('.VPContent').innerText();
    expect(body).toContain('Socket.io notification');
    expect(body).toContain('reconnect');
    expect(body).toContain('backpressure');
  });
});
