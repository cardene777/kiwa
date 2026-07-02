import { defineConfig } from '@playwright/test';

/**
 * Root Playwright config — scopes to `tests/docs-site-e2e/` for the VitePress
 * docs site regression suite. v1.13-7 (Issue #715) adds the `pnpm test:docs-e2e`
 * invocation on top of the existing `tests/docs-site-e2e/site.spec.ts` file so
 * the whole spec set (v1.11 canonical + v1.12 + v1.13) runs from one command.
 *
 * Uses `chromium` only — the docs site is server-rendered static HTML, so
 * cross-browser coverage adds no signal. Kept fully local (no CI, no service
 * dependencies) per `rules/git-workflow.md` § CI 全面禁止規約.
 */

export default defineConfig({
  testDir: 'tests/docs-site-e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: undefined,
  reporter: [['list']],
  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chromium' },
    },
  ],
});
