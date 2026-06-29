// Smoke test that verifies the public ESM import surface of every published @kiwa-test/* package.
// If a release accidentally drops or renames an exported symbol, this test fails loudly without
// requiring a fresh npm install — it exercises the same import paths end consumers would use.
import { describe, expect, it } from 'vitest';

describe('@kiwa-test/core surface', () => {
  it('exports parseSpec + createPool + shared types', async () => {
    const mod = await import('@kiwa-test/core');
    expect(typeof mod.parseSpec).toBe('function');
    expect(typeof mod.createPool).toBe('function');
    const parsed = mod.parseSpec('- module: x\n- layer: api\n');
    expect(parsed.module).toBe('x');
    expect(parsed.layer).toBe('api');
  });
});

describe('@kiwa-test/api surface', () => {
  it('exports setupApiServer + createRequestClient', async () => {
    const mod = await import('@kiwa-test/api');
    expect(typeof mod.setupApiServer).toBe('function');
    expect(typeof mod.createRequestClient).toBe('function');
  });
});

describe('@kiwa-test/ui surface', () => {
  it('exports setupComponentEnv + setupBrowserComponentEnv', async () => {
    const mod = await import('@kiwa-test/ui');
    expect(typeof mod.setupComponentEnv).toBe('function');
    expect(typeof mod.setupBrowserComponentEnv).toBe('function');
  });
});

describe('@kiwa-test/data surface', () => {
  it('exports setupQueueEnv + createFakeClock + expectIdempotent', async () => {
    const mod = await import('@kiwa-test/data');
    expect(typeof mod.setupQueueEnv).toBe('function');
    expect(typeof mod.createFakeClock).toBe('function');
    expect(typeof mod.expectIdempotent).toBe('function');
  });
});

describe('@kiwa-test/cli-test surface', () => {
  it('exports setupCliEnv + expectExitCode', async () => {
    const mod = await import('@kiwa-test/cli-test');
    expect(typeof mod.setupCliEnv).toBe('function');
    expect(typeof mod.expectExitCode).toBe('function');
  });
});

describe('@kiwa-test/observability surface', () => {
  it('exports collectRunHistory + detectFlaky + analyzeSpecCoverage + renderDashboard', async () => {
    const mod = await import('@kiwa-test/observability');
    expect(typeof mod.collectRunHistory).toBe('function');
    expect(typeof mod.detectFlaky).toBe('function');
    expect(typeof mod.analyzeSpecCoverage).toBe('function');
    expect(typeof mod.renderDashboard).toBe('function');
    expect(typeof mod.fromVitestJson).toBe('function');
  });
});

describe('@kiwa-test/e2e surface', () => {
  it('exports setupE2eEnv + startServer', async () => {
    const mod = await import('@kiwa-test/e2e');
    expect(typeof mod.setupE2eEnv).toBe('function');
    expect(typeof mod.startServer).toBe('function');
  });
});

describe('@kiwa-test/a11y surface', () => {
  it('exports runAxe + reportViolations + expectNoViolations', async () => {
    const mod = await import('@kiwa-test/a11y');
    expect(typeof mod.runAxe).toBe('function');
    expect(typeof mod.reportViolations).toBe('function');
    expect(typeof mod.expectNoViolations).toBe('function');
  });
});

describe('@kiwa-test/visual surface', () => {
  it('exports comparePngBuffers + expectNoVisualDiff', async () => {
    const mod = await import('@kiwa-test/visual');
    expect(typeof mod.comparePngBuffers).toBe('function');
    expect(typeof mod.expectNoVisualDiff).toBe('function');
  });
});

describe('@kiwa-test/nextjs surface', () => {
  it('exports invokeServerAction + REDIRECT_SYMBOL', async () => {
    const mod = await import('@kiwa-test/nextjs');
    expect(typeof mod.invokeServerAction).toBe('function');
    expect(typeof mod.REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeMiddleware + middlewareActions + MIDDLEWARE_ACTION_SYMBOL (v1.0.2+)', async () => {
    const mod = await import('@kiwa-test/nextjs');
    expect(typeof mod.invokeMiddleware).toBe('function');
    expect(typeof mod.middlewareActions.next).toBe('function');
    expect(typeof mod.middlewareActions.redirect).toBe('function');
    expect(typeof mod.middlewareActions.rewrite).toBe('function');
    expect(typeof mod.middlewareActions.json).toBe('function');
    expect(typeof mod.MIDDLEWARE_ACTION_SYMBOL).toBe('symbol');
  });

  it('exports renderServerComponent + findAll + textContent + RSC signals (v1.0.3+)', async () => {
    const mod = await import('@kiwa-test/nextjs');
    expect(typeof mod.renderServerComponent).toBe('function');
    expect(typeof mod.findAll).toBe('function');
    expect(typeof mod.textContent).toBe('function');
    expect(typeof mod.NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.FORBIDDEN_SYMBOL).toBe('symbol');
    expect(typeof mod.RSC_REDIRECT_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa-test/nuxt surface', () => {
  it('exports invokeEventHandler + NUXT_REDIRECT_SYMBOL (v1.0.0)', async () => {
    const mod = await import('@kiwa-test/nuxt');
    expect(typeof mod.invokeEventHandler).toBe('function');
    expect(typeof mod.NUXT_REDIRECT_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa-test/sveltekit surface', () => {
  it('exports invokeLoad + invokeAction + redirect + error + fail + 3 signals (v1.0.0)', async () => {
    const mod = await import('@kiwa-test/sveltekit');
    expect(typeof mod.invokeLoad).toBe('function');
    expect(typeof mod.invokeAction).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.error).toBe('function');
    expect(typeof mod.fail).toBe('function');
    expect(typeof mod.SK_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.SK_ERROR_SYMBOL).toBe('symbol');
    expect(typeof mod.SK_FAIL_SYMBOL).toBe('symbol');
  });
});

describe('cross-package consistency', () => {
  it('spec → api: ApiTestEnv mode is one of the TestMode values from spec', async () => {
    const apiMod = await import('@kiwa-test/api');
    // Smoke a real mock-mode env to ensure the type/runtime surface is consistent.
    const env = await apiMod.setupApiServer({ mode: 'mock', mockHandlers: [] });
    expect(['mock', 'live', 'hybrid']).toContain(env.mode);
    await env.stop();
  });

  it('spec → data: SetupQueueEnvOptions accepts mock/live modes', async () => {
    const dataMod = await import('@kiwa-test/data');
    const env = await dataMod.setupQueueEnv({ mode: 'mock' });
    expect(env.mode).toBe('mock');
    expect(env.client.size()).toBe(0);
    await env.stop();
  });

  it('spec → observability: parsed SpecDoc has the same TestLayer values', async () => {
    const specMod = await import('@kiwa-test/core');
    const apiSpec = specMod.parseSpec('- module: x\n- layer: api\n');
    expect(apiSpec.layer).toBe('api');
    const cliSpec = specMod.parseSpec('- module: x\n- layer: cli\n');
    expect(cliSpec.layer).toBe('cli');
  });
});
