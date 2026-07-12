import { afterEach, describe, expect, it, vi } from 'vitest';

// This file exercises the `loadPlaywright` fallback error path — both
// @playwright/test and 'playwright' unavailable. Since @playwright/test is
// installed in devDependencies, we mock both imports to throw.
//
// Note: `vi.mock` calls at the top level are hoisted by vitest — but the
// compiled .vitest-dist/src/browser-bridge.js references '@playwright/test'
// directly and 'playwright' via a dynamic string. Mocking both here isolates
// the failure to this test file (a separate module registry) and does not
// leak into setup-e2e-env.test.ts which needs the real @playwright/test.

vi.mock('@playwright/test', () => {
  throw new Error('mock-playwright-test-missing');
});

vi.mock('playwright', () => {
  throw new Error('mock-playwright-missing');
});

afterEach(() => {
  vi.resetModules();
});

describe('loadPlaywright fallback error branch', () => {
  it('T-BB-B001 throws with helpful install message when neither module resolves', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.loadPlaywright()).rejects.toThrow(/setupE2eEnv requires/);
    await expect(mod.loadPlaywright()).rejects.toThrow(/@playwright\/test/);
    await expect(mod.loadPlaywright()).rejects.toThrow(/playwright/);
  });

  it('T-BB-B002 error message includes install command hint', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.loadPlaywright()).rejects.toThrow(/pnpm add -D/);
  });

  it('T-BB-B003 launchBrowser propagates loader failure', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.launchBrowser('chromium', { headless: true })).rejects.toThrow(
      /setupE2eEnv requires/,
    );
  });
});
