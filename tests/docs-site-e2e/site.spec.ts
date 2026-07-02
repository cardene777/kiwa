import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Playwright docs-site E2E. Runs against the local VitePress build output
 * (`docs/.vitepress/dist/`) so it stays independent of GitHub Pages
 * provisioning. When the dist directory is missing, every test is skipped
 * so the suite passes on a fresh clone without a full docs build.
 */

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', '..', 'docs', '.vitepress', 'dist');

const CANONICAL_PAGES = [
  { path: '/', title: 'kiwa' },
  { path: '/tutorials/', title: 'kiwa tutorials' },
  { path: '/tutorials/01-supabase-auth-first-test', title: 'Your first Supabase Auth' },
  { path: '/migrations/v1.10-to-v1.11', title: 'v1.10 → v1.11' },
  { path: '/quality/release-gate', title: 'kiwa release gate' },
];

test.describe('docs site — canonical pages render', () => {
  for (const p of CANONICAL_PAGES) {
    test(`page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const url = `file://${join(distDir, p.path === '/' ? 'index.html' : `${p.path.replace(/\/$/, '')}.html`)}`;
      await page.goto(url);
      const body = await page.locator('main').innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — nav + search', () => {
  test('nav bar links to all trunk sections', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'dist not built');
      return;
    }
    await page.goto(`file://${join(distDir, 'index.html')}`);
    for (const label of ['Home', 'Tutorials', 'Migrations', 'Quality', 'API Reference']) {
      const link = page.locator(`nav a >> text="${label}"`).first();
      await expect(link).toBeVisible({ timeout: 2000 });
    }
  });

  test('search widget accepts input and returns hits', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'dist not built');
      return;
    }
    await page.goto(`file://${join(distDir, 'index.html')}`);
    const searchButton = page.locator('button.DocSearch, button.VPNavBarSearchButton').first();
    await searchButton.click();
    const searchInput = page.locator('input[type="search"], input.DocSearch-Input').first();
    await searchInput.fill('Supabase');
    // The local search plugin renders hits within 500ms.
    await expect(
      page.locator('a >> text="Your first Supabase Auth"').first(),
    ).toBeVisible({ timeout: 2000 });
  });
});
