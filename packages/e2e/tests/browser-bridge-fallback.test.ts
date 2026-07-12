import { describe, expect, it, vi } from 'vitest';

// Exercises the `playwright` fallback happy path in loadPlaywright:
// when @playwright/test resolution fails but the 'playwright' package
// resolves. We mock the primary to throw and virtually provide 'playwright'.

vi.mock('@playwright/test', () => {
  throw new Error('primary-missing-for-fallback');
});

vi.mock('playwright', () => ({
  chromium: {
    launch: async (opts?: unknown) => ({
      newContext: async () => ({ close: async () => {} }),
      close: async () => {},
      __launchOpts: opts,
    }),
  },
  firefox: undefined,
  webkit: undefined,
}));

describe('loadPlaywright - fallback branch (secondary success)', () => {
  it('T-BB-F001 falls back to bare "playwright" import when @playwright/test is unavailable', async () => {
    const mod = await import('../src/browser-bridge.js');
    const pw = await mod.loadPlaywright();
    expect(pw).toBeDefined();
    expect(typeof pw.chromium?.launch).toBe('function');
  });

  it('T-BB-F002 launchBrowser resolves via fallback playwright', async () => {
    const mod = await import('../src/browser-bridge.js');
    const handle = await mod.launchBrowser('chromium', { headless: true });
    expect(handle).toBeDefined();
    expect(typeof handle.close).toBe('function');
  });

  it('T-BB-F003 launchBrowser via fallback still enforces the missing-engine branch', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.launchBrowser('firefox', { headless: true })).rejects.toThrow(
      /engine "firefox" not available/,
    );
  });
});
