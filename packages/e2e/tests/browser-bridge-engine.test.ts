import { describe, expect, it, vi } from 'vitest';

// Exercise `launchBrowser` when the requested engine is missing on the
// loaded playwright module — `pw[name]` is undefined and the throw branch
// fires. We mock @playwright/test to expose only `chromium`.

const launchCalls: Array<{ name: string; opts: unknown }> = [];

vi.mock('@playwright/test', () => ({
  chromium: {
    launch: async (opts?: unknown) => {
      launchCalls.push({ name: 'chromium', opts });
      return {
        newContext: async () => ({ close: async () => {} }),
        close: async () => {},
      };
    },
  },
  // firefox and webkit declared as undefined so `pw[name]` returns undefined
  // rather than tripping vitest's strict named-export check.
  firefox: undefined,
  webkit: undefined,
}));

describe('launchBrowser - missing engine branch', () => {
  it('T-BB-E001 throws when firefox is not on the loaded playwright module', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.launchBrowser('firefox', { headless: true })).rejects.toThrow(
      /engine "firefox" not available/,
    );
  });

  it('T-BB-E002 throws when webkit is not on the loaded playwright module', async () => {
    const mod = await import('../src/browser-bridge.js');
    await expect(mod.launchBrowser('webkit', { headless: false })).rejects.toThrow(
      /engine "webkit" not available/,
    );
  });

  it('T-BB-E003 chromium engine resolves and receives headless option', async () => {
    launchCalls.length = 0;
    const mod = await import('../src/browser-bridge.js');
    const handle = await mod.launchBrowser('chromium', { headless: true });
    expect(handle).toBeDefined();
    expect(launchCalls).toHaveLength(1);
    const first = launchCalls[0];
    if (!first) throw new Error('expected first launch call');
    expect(first.name).toBe('chromium');
    expect(first.opts).toEqual({ headless: true });
  });

  it('T-BB-E004 chromium engine receives headless=false pass-through', async () => {
    launchCalls.length = 0;
    const mod = await import('../src/browser-bridge.js');
    await mod.launchBrowser('chromium', { headless: false });
    const first = launchCalls[0];
    if (!first) throw new Error('expected first launch call');
    expect(first.opts).toEqual({ headless: false });
  });

  it('T-BB-E005 loadPlaywright returns the mocked module (first-try success)', async () => {
    const mod = await import('../src/browser-bridge.js');
    const pw = await mod.loadPlaywright();
    expect(pw).toBeDefined();
    expect(typeof pw.chromium?.launch).toBe('function');
    expect(pw.firefox).toBeUndefined();
  });
});
