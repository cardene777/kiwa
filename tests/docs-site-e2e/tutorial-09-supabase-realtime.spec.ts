import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * v1.13 tutorial 09 — Supabase Realtime chat.
 *
 * Companion spec to `site.spec.ts` V1_13_PAGES block. Kept as a standalone
 * file so failures point directly at the tutorial 09 render without depending
 * on the parameterized loop. Follows the same skip-if-dist-missing pattern
 * so the suite passes on a fresh clone without a docs build.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');
const pagePath = '/tutorials/09-supabase-realtime-chat';

test.describe('v1.13 tutorial 09 — Supabase Realtime chat', () => {
  test('renders headline + Supabase Realtime + presence + typing debounce anchors', async ({
    page,
  }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
      return;
    }
    const url = `file://${join(distDir, `${pagePath.replace(/\/$/, '')}.html`)}`;
    await page.goto(url);
    const body = await page.locator('.VPContent').innerText();
    expect(body).toContain('Supabase Realtime chat');
    expect(body).toContain('presence');
    expect(body).toContain('typing');
  });
});
