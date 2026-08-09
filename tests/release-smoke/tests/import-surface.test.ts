// Smoke test that verifies the public ESM import surface of every published @kiwa-lab/* package.
// If a release accidentally drops or renames an exported symbol, this test fails loudly without
// requiring a fresh npm install — it exercises the same import paths end consumers would use.
import { describe, expect, it } from 'vitest';

describe('@kiwa-lab/core surface', () => {
  it('exports parseSpec + createPool + shared types', async () => {
    const mod = await import('@kiwa-lab/core');
    expect(typeof mod.parseSpec).toBe('function');
    expect(typeof mod.createPool).toBe('function');
    const parsed = mod.parseSpec('- module: x\n- layer: api\n');
    expect(parsed.module).toBe('x');
    expect(parsed.layer).toBe('api');
  });
});

describe('@kiwa-lab/api surface', () => {
  it('exports setupApiServer + createRequestClient', async () => {
    const mod = await import('@kiwa-lab/api');
    expect(typeof mod.setupApiServer).toBe('function');
    expect(typeof mod.createRequestClient).toBe('function');
  });
});

describe('@kiwa-lab/ui surface', () => {
  it('exports setupComponentEnv + setupBrowserComponentEnv', async () => {
    const mod = await import('@kiwa-lab/ui');
    expect(typeof mod.setupComponentEnv).toBe('function');
    expect(typeof mod.setupBrowserComponentEnv).toBe('function');
  });
});

describe('@kiwa-lab/data surface', () => {
  it('exports setupQueueEnv + createFakeClock + expectIdempotent', async () => {
    const mod = await import('@kiwa-lab/data');
    expect(typeof mod.setupQueueEnv).toBe('function');
    expect(typeof mod.createFakeClock).toBe('function');
    expect(typeof mod.expectIdempotent).toBe('function');
  });
});

describe('@kiwa-lab/cli-test surface', () => {
  it('exports setupCliEnv + expectExitCode', async () => {
    const mod = await import('@kiwa-lab/cli-test');
    expect(typeof mod.setupCliEnv).toBe('function');
    expect(typeof mod.expectExitCode).toBe('function');
  });
});

describe('@kiwa-lab/observability surface', () => {
  it('exports collectRunHistory + detectFlaky + analyzeSpecCoverage + renderDashboard', async () => {
    const mod = await import('@kiwa-lab/observability');
    expect(typeof mod.collectRunHistory).toBe('function');
    expect(typeof mod.detectFlaky).toBe('function');
    expect(typeof mod.analyzeSpecCoverage).toBe('function');
    expect(typeof mod.renderDashboard).toBe('function');
    expect(typeof mod.fromVitestJson).toBe('function');
  });
});

describe('@kiwa-lab/e2e surface', () => {
  it('exports setupE2eEnv + startServer', async () => {
    const mod = await import('@kiwa-lab/e2e');
    expect(typeof mod.setupE2eEnv).toBe('function');
    expect(typeof mod.startServer).toBe('function');
  });
});

describe('@kiwa-lab/a11y surface', () => {
  it('exports runAxe + reportViolations + expectNoViolations', async () => {
    const mod = await import('@kiwa-lab/a11y');
    expect(typeof mod.runAxe).toBe('function');
    expect(typeof mod.reportViolations).toBe('function');
    expect(typeof mod.expectNoViolations).toBe('function');
  });
});


describe('@kiwa-lab/nextjs surface', () => {
  it('exports invokeServerAction + REDIRECT_SYMBOL', async () => {
    const mod = await import('@kiwa-lab/nextjs');
    expect(typeof mod.invokeServerAction).toBe('function');
    expect(typeof mod.REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeMiddleware + middlewareActions + MIDDLEWARE_ACTION_SYMBOL (v1.0.2+)', async () => {
    const mod = await import('@kiwa-lab/nextjs');
    expect(typeof mod.invokeMiddleware).toBe('function');
    expect(typeof mod.middlewareActions.next).toBe('function');
    expect(typeof mod.middlewareActions.redirect).toBe('function');
    expect(typeof mod.middlewareActions.rewrite).toBe('function');
    expect(typeof mod.middlewareActions.json).toBe('function');
    expect(typeof mod.MIDDLEWARE_ACTION_SYMBOL).toBe('symbol');
  });

  it('exports renderServerComponent + findAll + textContent + RSC signals (v1.0.3+)', async () => {
    const mod = await import('@kiwa-lab/nextjs');
    expect(typeof mod.renderServerComponent).toBe('function');
    expect(typeof mod.findAll).toBe('function');
    expect(typeof mod.textContent).toBe('function');
    expect(typeof mod.NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.FORBIDDEN_SYMBOL).toBe('symbol');
    expect(typeof mod.RSC_REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeParallelRoutes + PARALLEL_INTERCEPTION_SYMBOL (v1.0.4+)', async () => {
    const mod = await import('@kiwa-lab/nextjs');
    expect(typeof mod.invokeParallelRoutes).toBe('function');
    expect(typeof mod.PARALLEL_INTERCEPTION_SYMBOL).toBe('symbol');
  });

  it('exports setupNextRscEnv + RSC_ERROR_BOUNDARY_SYMBOL (v1.0.6+, Issue #558)', async () => {
    const mod = await import('@kiwa-lab/nextjs');
    expect(typeof mod.setupNextRscEnv).toBe('function');
    expect(typeof mod.RSC_ERROR_BOUNDARY_SYMBOL).toBe('symbol');
  });
});


describe('@kiwa-lab/edge surface', () => {
  it('exports invokeEdgeHandler + createKvNamespace (v1.0.0)', async () => {
    const mod = await import('@kiwa-lab/edge');
    expect(typeof mod.invokeEdgeHandler).toBe('function');
    expect(typeof mod.createKvNamespace).toBe('function');
  });
});

describe('@kiwa-lab/auth surface', () => {
  it('exports setupNextAuthEnv + createInMemoryAdapter + provider factories (v0.1.0, Issue #637)', async () => {
    const mod = await import('@kiwa-lab/auth');
    expect(typeof mod.setupNextAuthEnv).toBe('function');
    expect(typeof mod.createInMemoryAdapter).toBe('function');
    expect(typeof mod.buildProviderRegistry).toBe('function');
    expect(typeof mod.createGoogleProviderMock).toBe('function');
    expect(typeof mod.createGithubProviderMock).toBe('function');
    expect(typeof mod.createEmailProviderMock).toBe('function');
    expect(typeof mod.issueSession).toBe('function');
    expect(typeof mod.upsertUserFromProfile).toBe('function');
  });

  it('setupNextAuthEnv env exposes jwt session strategy defaults + 3 providers', async () => {
    const mod = await import('@kiwa-lab/auth');
    const env = await mod.setupNextAuthEnv();
    expect(env.mode).toBe('mock');
    expect(env.session.strategy).toBe('jwt');
    expect(env.providers.google.id).toBe('google');
    expect(env.providers.github.id).toBe('github');
    expect(env.providers.email.id).toBe('email');
    await env.stop();
  });
});

describe('@kiwa-lab/hono surface', () => {
  it('exports createHonoApp + invokeRoute + createContext + buildRequest + route helpers + brand symbols (v0.1.0, Issue #815)', async () => {
    const mod = await import('@kiwa-lab/hono');
    expect(typeof mod.createHonoApp).toBe('function');
    expect(typeof mod.invokeRoute).toBe('function');
    expect(typeof mod.createContext).toBe('function');
    expect(typeof mod.buildRequest).toBe('function');
    expect(typeof mod.compileRoute).toBe('function');
    expect(typeof mod.matchRoute).toBe('function');
    expect(typeof mod.isHonoApp).toBe('function');
    expect(typeof mod.isHonoContext).toBe('function');
    expect(typeof mod.HONO_APP_SYMBOL).toBe('symbol');
    expect(typeof mod.HONO_CONTEXT_SYMBOL).toBe('symbol');
    expect(typeof mod.HONO_ROUTE_SYMBOL).toBe('symbol');
  });

  it('exports createRpcClient + defineRpcApp + isHcResponse + brand symbols (v0.1.0)', async () => {
    const mod = await import('@kiwa-lab/hono');
    expect(typeof mod.createRpcClient).toBe('function');
    expect(typeof mod.defineRpcApp).toBe('function');
    expect(typeof mod.isHcResponse).toBe('function');
    expect(typeof mod.HC_CLIENT_SYMBOL).toBe('symbol');
    expect(typeof mod.HC_REQUEST_SYMBOL).toBe('symbol');
  });

  it('exports createWorkersEnv + createExecutionContext + KV / D1 / R2 mocks + brand symbols (v0.1.0)', async () => {
    const mod = await import('@kiwa-lab/hono');
    expect(typeof mod.createWorkersEnv).toBe('function');
    expect(typeof mod.createExecutionContext).toBe('function');
    expect(typeof mod.mockKVNamespace).toBe('function');
    expect(typeof mod.mockD1Database).toBe('function');
    expect(typeof mod.mockR2Bucket).toBe('function');
    expect(typeof mod.isWorkersEnv).toBe('function');
    expect(typeof mod.isExecutionContextMock).toBe('function');
    expect(typeof mod.isKVNamespaceMock).toBe('function');
    expect(typeof mod.isD1DatabaseMock).toBe('function');
    expect(typeof mod.isR2BucketMock).toBe('function');
    expect(typeof mod.WORKERS_ENV_SYMBOL).toBe('symbol');
    expect(typeof mod.EXECUTION_CTX_SYMBOL).toBe('symbol');
    expect(typeof mod.KV_NAMESPACE_SYMBOL).toBe('symbol');
    expect(typeof mod.D1_DATABASE_SYMBOL).toBe('symbol');
    expect(typeof mod.R2_BUCKET_SYMBOL).toBe('symbol');
  });
});

describe('cross-package consistency', () => {
  it('spec → api: ApiTestEnv mode is one of the TestMode values from spec', async () => {
    const apiMod = await import('@kiwa-lab/api');
    // Smoke a real mock-mode env to ensure the type/runtime surface is consistent.
    const env = await apiMod.setupApiServer({ mode: 'mock', mockHandlers: [] });
    expect(['mock', 'live', 'hybrid']).toContain(env.mode);
    await env.stop();
  });

  it('spec → data: SetupQueueEnvOptions accepts mock/live modes', async () => {
    const dataMod = await import('@kiwa-lab/data');
    const env = await dataMod.setupQueueEnv({ mode: 'mock' });
    expect(env.mode).toBe('mock');
    expect(env.client.size()).toBe(0);
    await env.stop();
  });

  it('spec → observability: parsed SpecDoc has the same TestLayer values', async () => {
    const specMod = await import('@kiwa-lab/core');
    const apiSpec = specMod.parseSpec('- module: x\n- layer: api\n');
    expect(apiSpec.layer).toBe('api');
    const cliSpec = specMod.parseSpec('- module: x\n- layer: cli\n');
    expect(cliSpec.layer).toBe('cli');
  });
});
