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

/**
 * Resolve a VitePress URL-shaped path to its emitted `dist/` HTML file.
 *
 * VitePress `cleanUrls: true` builds:
 * - `/` → `dist/index.html`
 * - `/tutorials/` → `dist/tutorials/index.html`
 * - `/tutorials/01-supabase-auth-first-test` → `dist/tutorials/01-supabase-auth-first-test.html`
 * - `/concepts/ai-llm-testing` → `dist/concepts/ai-llm-testing.html`
 */
function pageUrl(pagePath: string): string {
  const rel = pagePath === '/' ? 'index.html' : pagePath.endsWith('/')
    ? `${pagePath.replace(/\/$/, '')}/index.html`
    : `${pagePath}.html`;
  return `file://${join(distDir, rel)}`;
}

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

// v1.13 pages — new tutorials + concept doc + migration guide added under the
// Realtime 縦軸 milestone (Issue #715). Mirrors the v1.12 anchor-phrase pattern.
// Each phrase is a substring the rendered VitePress <main> will always include.
const V1_13_PAGES = [
  { path: '/tutorials/09-supabase-realtime-chat', title: 'Supabase Realtime chat' },
  { path: '/tutorials/10-ably-collab-cursor', title: 'Ably shared cursor' },
  { path: '/tutorials/11-socketio-notification', title: 'Socket.io notification' },
  { path: '/concepts/realtime-testing', title: 'time axis mocks' },
  { path: '/migrations/v1.12-to-v1.13', title: 'v1.12 → v1.13' },
];

// v1.16 pages — new tutorials + concept doc + migration guide added under the
// Component test 縦軸 milestone (Issue #767). Mirrors the v1.12 / v1.13 anchor
// phrase pattern. Each phrase is a substring the rendered VitePress <main>
// will always include.
const V1_16_PAGES = [
  { path: '/tutorials/19-storybook-design-system', title: 'Storybook 8 design system' },
  { path: '/tutorials/20-playwright-ct', title: 'Playwright CT for 5 form patterns' },
  { path: '/tutorials/21-visual-regression', title: 'Visual regression baseline / diff / accept' },
  { path: '/concepts/component-testing', title: 'story registration, CT mount, visual diff' },
  { path: '/migrations/v1.15-to-v1.16', title: 'v1.15 → v1.16' },
];

// v1.17 pages — new tutorials + concept doc + migration guide added under the
// Observability v2 milestone (Issue #782 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 anchor phrase pattern. Each phrase is a substring the
// rendered VitePress <main> will always include (checked against the actual
// page headings + body text — not frontmatter titles).
const V1_17_PAGES = [
  { path: '/tutorials/22-observability-dashboard', title: 'Observability dashboard' },
  { path: '/tutorials/23-alert-orchestrator', title: 'Alert orchestrator' },
  { path: '/tutorials/24-trace-flame-graph', title: 'Trace flame graph' },
  { path: '/concepts/observability-v2-testing', title: 'Observability v2 testing' },
  { path: '/migrations/v1.16-to-v1.17', title: 'v1.16 → v1.17' },
];

// v1.18 pages — new tutorials + concept doc + migration guide added under the
// Blockchain 深化 milestone (Issue #797 land + this publish PR). Mirrors the
// v1.12 / v1.13 / v1.16 / v1.17 anchor phrase pattern. Each phrase is a
// substring the rendered VitePress <main> will always include (checked
// against the actual page headings + body text — not frontmatter titles).
const V1_18_PAGES = [
  { path: '/tutorials/25-reth-node-test', title: 'Reth node test' },
  { path: '/tutorials/26-foundry-invariant-fuzz', title: 'Foundry invariant + fuzz runner' },
  { path: '/tutorials/27-dapp-e2e-reorg', title: 'dApp e2e reorg' },
  { path: '/concepts/blockchain-testing', title: 'Blockchain testing' },
  { path: '/migrations/v1.17-to-v1.18', title: 'v1.17 → v1.18' },
];

/**
 * VitePress landing pages built from `hero:` frontmatter use the `.VPHome`
 * layout with no `<main>` element; every other layout mounts content into
 * `<main>`. Prefer `.VPContent` — VitePress always emits that around the
 * rendered content, regardless of the layout — as the innerText anchor.
 */
const CONTENT_LOCATOR = '.VPContent';

test.describe('docs site — canonical pages render', () => {
  for (const p of CANONICAL_PAGES) {
    test(`page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
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
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.13 pages render', () => {
  for (const p of V1_13_PAGES) {
    test(`v1.13 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.16 pages render', () => {
  for (const p of V1_16_PAGES) {
    test(`v1.16 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.17 pages render', () => {
  for (const p of V1_17_PAGES) {
    test(`v1.17 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
      expect(body).toContain(p.title);
    });
  }
});

test.describe('docs site — v1.18 pages render', () => {
  for (const p of V1_18_PAGES) {
    test(`v1.18 page ${p.path} renders with expected title`, async ({ page }) => {
      if (!existsSync(join(distDir, 'index.html'))) {
        test.skip(true, 'docs/.vitepress/dist/ not built — run `pnpm docs:build` first');
        return;
      }
      await page.goto(pageUrl(p.path));
      const body = await page.locator(CONTENT_LOCATOR).innerText();
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

  test('search widget mounts on the landing page', async ({ page }) => {
    if (!existsSync(join(distDir, 'index.html'))) {
      test.skip(true, 'dist not built');
      return;
    }
    // VitePress local search backs `#local-search` with a lazy-loaded chunk
    // that pulls a JSON index over `fetch`. Under `file://` the browser
    // enforces same-origin fetch which prevents the modal from populating —
    // asserting the widget is rendered in the navbar is the strongest signal
    // available without a static file server. GitHub Pages (https://) exercises
    // the full search flow in production; this local suite validates mount only.
    await page.goto(`file://${join(distDir, 'index.html')}`);
    const searchButton = page.locator('button.DocSearch, button.VPNavBarSearchButton').first();
    await expect(searchButton).toBeVisible({ timeout: 2000 });
  });
});
