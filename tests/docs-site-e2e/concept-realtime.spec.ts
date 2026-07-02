import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * v1.13 concept — Realtime testing (time-axis mock SSOT).
 *
 * The concept doc introduces the second axis of non-triviality (time) that
 * v1.13 absorbs after v1.12 established the first (non-determinism / cost).
 * Companion spec to `site.spec.ts` V1_13_PAGES block.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');
const pagePath = '/concepts/realtime-testing';

test.describe('v1.13 concept — Realtime testing', () => {
  test('renders time-axis mock SSOT anchors', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
      return;
    }
    const url = `file://${join(distDir, `${pagePath.replace(/\/$/, '')}.html`)}`;
    await page.goto(url);
    const body = await page.locator('.VPContent').innerText();
    expect(body).toContain('time axis mocks');
    expect(body).toContain('event ordering');
    expect(body).toContain('backpressure');
  });
});
