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

// v1.12 pages — new tutorials + concept doc + migration guide added under the
// AI-LLM 縦軸 milestone (Issue #700). Same skip-if-dist-missing pattern as the
// canonical suite above so the tests pass on a fresh clone without a full docs
// build. Each page asserts an anchor phrase that a rendered VitePress build
// will always include in <main>.
const V1_12_PAGES = [
  { path: '/tutorials/06-anthropic-chatbot-streaming', title: 'Anthropic chatbot streaming' },
  { path: '/tutorials/07-openai-tool-agent', title: 'OpenAI tool-use agent' },
  { path: '/tutorials/08-vercel-ai-rag', title: 'Vercel AI SDK' },
  { path: '/concepts/ai-llm-testing', title: 'non-determinism' },
  { path: '/migrations/v1.11-to-v1.12', title: 'v1.11 → v1.12' },
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

test.describe('docs site — v1.12 pages render', () => {
  for (const p of V1_12_PAGES) {
    test(`v1.12 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      const url = `file://${join(distDir, `${p.path.replace(/\/$/, '')}.html`)}`;
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
