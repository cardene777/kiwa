// Smoke test that verifies the public ESM import surface of every published @kiwa/* package.
// If a release accidentally drops or renames an exported symbol, this test fails loudly without
// requiring a fresh npm install — it exercises the same import paths end consumers would use.
import { describe, expect, it } from 'vitest';

describe('@kiwa/core surface', () => {
  it('exports parseSpec + createPool + shared types', async () => {
    const mod = await import('@kiwa/core');
    expect(typeof mod.parseSpec).toBe('function');
    expect(typeof mod.createPool).toBe('function');
    const parsed = mod.parseSpec('- module: x\n- layer: api\n');
    expect(parsed.module).toBe('x');
    expect(parsed.layer).toBe('api');
  });
});

describe('@kiwa/api surface', () => {
  it('exports setupApiServer + createRequestClient', async () => {
    const mod = await import('@kiwa/api');
    expect(typeof mod.setupApiServer).toBe('function');
    expect(typeof mod.createRequestClient).toBe('function');
  });
});

describe('@kiwa/ui surface', () => {
  it('exports setupComponentEnv + setupBrowserComponentEnv', async () => {
    const mod = await import('@kiwa/ui');
    expect(typeof mod.setupComponentEnv).toBe('function');
    expect(typeof mod.setupBrowserComponentEnv).toBe('function');
  });
});

describe('@kiwa/data surface', () => {
  it('exports setupQueueEnv + createFakeClock + expectIdempotent', async () => {
    const mod = await import('@kiwa/data');
    expect(typeof mod.setupQueueEnv).toBe('function');
    expect(typeof mod.createFakeClock).toBe('function');
    expect(typeof mod.expectIdempotent).toBe('function');
  });
});

describe('@kiwa/cli-test surface', () => {
  it('exports setupCliEnv + expectExitCode', async () => {
    const mod = await import('@kiwa/cli-test');
    expect(typeof mod.setupCliEnv).toBe('function');
    expect(typeof mod.expectExitCode).toBe('function');
  });
});

describe('@kiwa/observability surface', () => {
  it('exports collectRunHistory + detectFlaky + analyzeSpecCoverage + renderDashboard', async () => {
    const mod = await import('@kiwa/observability');
    expect(typeof mod.collectRunHistory).toBe('function');
    expect(typeof mod.detectFlaky).toBe('function');
    expect(typeof mod.analyzeSpecCoverage).toBe('function');
    expect(typeof mod.renderDashboard).toBe('function');
    expect(typeof mod.fromVitestJson).toBe('function');
  });
});

describe('@kiwa/e2e surface', () => {
  it('exports setupE2eEnv + startServer', async () => {
    const mod = await import('@kiwa/e2e');
    expect(typeof mod.setupE2eEnv).toBe('function');
    expect(typeof mod.startServer).toBe('function');
  });
});

describe('@kiwa/a11y surface', () => {
  it('exports runAxe + reportViolations + expectNoViolations', async () => {
    const mod = await import('@kiwa/a11y');
    expect(typeof mod.runAxe).toBe('function');
    expect(typeof mod.reportViolations).toBe('function');
    expect(typeof mod.expectNoViolations).toBe('function');
  });
});

describe('@kiwa/visual surface', () => {
  it('exports comparePngBuffers + expectNoVisualDiff', async () => {
    const mod = await import('@kiwa/visual');
    expect(typeof mod.comparePngBuffers).toBe('function');
    expect(typeof mod.expectNoVisualDiff).toBe('function');
  });
});

describe('@kiwa/nextjs surface', () => {
  it('exports invokeServerAction + REDIRECT_SYMBOL', async () => {
    const mod = await import('@kiwa/nextjs');
    expect(typeof mod.invokeServerAction).toBe('function');
    expect(typeof mod.REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeMiddleware + middlewareActions + MIDDLEWARE_ACTION_SYMBOL (v1.0.2+)', async () => {
    const mod = await import('@kiwa/nextjs');
    expect(typeof mod.invokeMiddleware).toBe('function');
    expect(typeof mod.middlewareActions.next).toBe('function');
    expect(typeof mod.middlewareActions.redirect).toBe('function');
    expect(typeof mod.middlewareActions.rewrite).toBe('function');
    expect(typeof mod.middlewareActions.json).toBe('function');
    expect(typeof mod.MIDDLEWARE_ACTION_SYMBOL).toBe('symbol');
  });

  it('exports renderServerComponent + findAll + textContent + RSC signals (v1.0.3+)', async () => {
    const mod = await import('@kiwa/nextjs');
    expect(typeof mod.renderServerComponent).toBe('function');
    expect(typeof mod.findAll).toBe('function');
    expect(typeof mod.textContent).toBe('function');
    expect(typeof mod.NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.FORBIDDEN_SYMBOL).toBe('symbol');
    expect(typeof mod.RSC_REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeParallelRoutes + PARALLEL_INTERCEPTION_SYMBOL (v1.0.4+)', async () => {
    const mod = await import('@kiwa/nextjs');
    expect(typeof mod.invokeParallelRoutes).toBe('function');
    expect(typeof mod.PARALLEL_INTERCEPTION_SYMBOL).toBe('symbol');
  });

  it('exports setupNextRscEnv + RSC_ERROR_BOUNDARY_SYMBOL (v1.0.6+, Issue #558)', async () => {
    const mod = await import('@kiwa/nextjs');
    expect(typeof mod.setupNextRscEnv).toBe('function');
    expect(typeof mod.RSC_ERROR_BOUNDARY_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/nuxt surface', () => {
  it('exports invokeEventHandler + NUXT_REDIRECT_SYMBOL (v1.0.0)', async () => {
    const mod = await import('@kiwa/nuxt');
    expect(typeof mod.invokeEventHandler).toBe('function');
    expect(typeof mod.NUXT_REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeRouteMiddleware + NUXT_MIDDLEWARE_REDIRECT_SYMBOL + NUXT_MIDDLEWARE_ABORT_SYMBOL (v1.0.2+)', async () => {
    const mod = await import('@kiwa/nuxt');
    expect(typeof mod.invokeRouteMiddleware).toBe('function');
    expect(typeof mod.NUXT_MIDDLEWARE_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.NUXT_MIDDLEWARE_ABORT_SYMBOL).toBe('symbol');
  });

  it('exports invokeNitroPlugin (v1.0.3+)', async () => {
    const mod = await import('@kiwa/nuxt');
    expect(typeof mod.invokeNitroPlugin).toBe('function');
  });
});

describe('@kiwa/sveltekit surface', () => {
  it('exports invokeLoad + invokeAction + redirect + error + fail + 3 signals (v1.0.0)', async () => {
    const mod = await import('@kiwa/sveltekit');
    expect(typeof mod.invokeLoad).toBe('function');
    expect(typeof mod.invokeAction).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.error).toBe('function');
    expect(typeof mod.fail).toBe('function');
    expect(typeof mod.SK_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.SK_ERROR_SYMBOL).toBe('symbol');
    expect(typeof mod.SK_FAIL_SYMBOL).toBe('symbol');
  });

  it('exports invokeHandle + invokeHandleFetch + invokeHandleError (v1.0.1+)', async () => {
    const mod = await import('@kiwa/sveltekit');
    expect(typeof mod.invokeHandle).toBe('function');
    expect(typeof mod.invokeHandleFetch).toBe('function');
    expect(typeof mod.invokeHandleError).toBe('function');
  });

  it('exports setupSvelteKitHooksEnv + sequence (v1.1+)', async () => {
    const mod = await import('@kiwa/sveltekit');
    expect(typeof mod.setupSvelteKitHooksEnv).toBe('function');
    expect(typeof mod.sequence).toBe('function');
  });
});

describe('@kiwa/remix surface', () => {
  it('exports invokeLoader + invokeAction + redirect + json + REMIX_REDIRECT_SYMBOL (v1.0.0)', async () => {
    const mod = await import('@kiwa/remix');
    expect(typeof mod.invokeLoader).toBe('function');
    expect(typeof mod.invokeAction).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.json).toBe('function');
    expect(typeof mod.REMIX_REDIRECT_SYMBOL).toBe('symbol');
  });

  it('exports invokeResourceRoute + RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL (v1.0.2+)', async () => {
    const mod = await import('@kiwa/remix');
    expect(typeof mod.invokeResourceRoute).toBe('function');
    expect(typeof mod.RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL).toBe('symbol');
  });

  it('exports setupRemixNestedRouteEnv + defer + resolveDeferred + isDeferred + DEFERRED_DATA_SYMBOL (v1.1+)', async () => {
    const mod = await import('@kiwa/remix');
    expect(typeof mod.setupRemixNestedRouteEnv).toBe('function');
    expect(typeof mod.defer).toBe('function');
    expect(typeof mod.resolveDeferred).toBe('function');
    expect(typeof mod.isDeferred).toBe('function');
    expect(typeof mod.DEFERRED_DATA_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/astro surface', () => {
  it('exports invokeEndpoint (v1.0.0)', async () => {
    const mod = await import('@kiwa/astro');
    expect(typeof mod.invokeEndpoint).toBe('function');
  });

  it('exports renderAstroPage + kiwaAstroNotFound + 3 signals (v1.0.2+)', async () => {
    const mod = await import('@kiwa/astro');
    expect(typeof mod.renderAstroPage).toBe('function');
    expect(typeof mod.kiwaAstroNotFound).toBe('function');
    expect(typeof mod.ASTRO_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.ASTRO_NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.ASTRO_REWRITE_SYMBOL).toBe('symbol');
  });

  it('exports setupAstroViewTransitionEnv (v1.1.0+)', async () => {
    const mod = await import('@kiwa/astro');
    expect(typeof mod.setupAstroViewTransitionEnv).toBe('function');
  });
});

describe('@kiwa/solidstart surface', () => {
  it('exports invokeServerFunction + invokeApiRoute + helpers (v1.0.0)', async () => {
    const mod = await import('@kiwa/solidstart');
    expect(typeof mod.invokeServerFunction).toBe('function');
    expect(typeof mod.invokeApiRoute).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.redirectResponse).toBe('function');
    expect(typeof mod.json).toBe('function');
    expect(typeof mod.SOLIDSTART_REDIRECT_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/qwikcity surface', () => {
  it('exports invokeRouteAction + invokeRouteLoader + invokeEndpoint + 3 signals (v1.0.0)', async () => {
    const mod = await import('@kiwa/qwikcity');
    expect(typeof mod.invokeRouteAction).toBe('function');
    expect(typeof mod.invokeRouteLoader).toBe('function');
    expect(typeof mod.invokeEndpoint).toBe('function');
    expect(typeof mod.QWIK_FAIL_SYMBOL).toBe('symbol');
    expect(typeof mod.QWIK_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.QWIK_ENDPOINT_REDIRECT_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/edge surface', () => {
  it('exports invokeEdgeHandler + createKvNamespace (v1.0.0)', async () => {
    const mod = await import('@kiwa/edge');
    expect(typeof mod.invokeEdgeHandler).toBe('function');
    expect(typeof mod.createKvNamespace).toBe('function');
  });
});

describe('@kiwa/solidjs surface', () => {
  it('exports mockSignal + mockEffect + batch + track + createResourceStub + brand symbols (v0.1.0, Issue #813)', async () => {
    const mod = await import('@kiwa/solidjs');
    expect(typeof mod.mockSignal).toBe('function');
    expect(typeof mod.mockEffect).toBe('function');
    expect(typeof mod.batch).toBe('function');
    expect(typeof mod.track).toBe('function');
    expect(typeof mod.createResourceStub).toBe('function');
    expect(typeof mod.SIGNAL_SYMBOL).toBe('symbol');
    expect(typeof mod.EFFECT_SYMBOL).toBe('symbol');
    expect(typeof mod.RESOURCE_SYMBOL).toBe('symbol');
  });

  it('exports renderSolid + hydrate + createRoot + h + stringify + findElements (v0.1.0)', async () => {
    const mod = await import('@kiwa/solidjs');
    expect(typeof mod.renderSolid).toBe('function');
    expect(typeof mod.hydrate).toBe('function');
    expect(typeof mod.createRoot).toBe('function');
    expect(typeof mod.h).toBe('function');
    expect(typeof mod.stringify).toBe('function');
    expect(typeof mod.findElements).toBe('function');
    expect(typeof mod.SOLID_ELEMENT_SYMBOL).toBe('symbol');
  });

  it('exports invokeSolidRoute + renderWithSuspense + errorBoundary + redirect + notFound + suspense/error signals (v0.1.0)', async () => {
    const mod = await import('@kiwa/solidjs');
    expect(typeof mod.invokeSolidRoute).toBe('function');
    expect(typeof mod.renderWithSuspense).toBe('function');
    expect(typeof mod.errorBoundary).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.notFound).toBe('function');
    expect(typeof mod.SOLID_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.SOLID_NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.SUSPENSE_BOUNDARY_SYMBOL).toBe('symbol');
    expect(typeof mod.ERROR_BOUNDARY_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/auth surface', () => {
  it('exports setupNextAuthEnv + createInMemoryAdapter + provider factories (v0.1.0, Issue #637)', async () => {
    const mod = await import('@kiwa/auth');
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
    const mod = await import('@kiwa/auth');
    const env = await mod.setupNextAuthEnv();
    expect(env.mode).toBe('mock');
    expect(env.session.strategy).toBe('jwt');
    expect(env.providers.google.id).toBe('google');
    expect(env.providers.github.id).toBe('github');
    expect(env.providers.email.id).toBe('email');
    await env.stop();
  });
});

describe('@kiwa/fresh surface', () => {
  it('exports invokeFreshHandler + defineRoute + redirect + notFound + h + stringify + findNodes (v0.1.0, Issue #814)', async () => {
    const mod = await import('@kiwa/fresh');
    expect(typeof mod.invokeFreshHandler).toBe('function');
    expect(typeof mod.invokeDefineRoute).toBe('function');
    expect(typeof mod.defineRoute).toBe('function');
    expect(typeof mod.redirect).toBe('function');
    expect(typeof mod.notFound).toBe('function');
    expect(typeof mod.h).toBe('function');
    expect(typeof mod.stringify).toBe('function');
    expect(typeof mod.findNodes).toBe('function');
    expect(typeof mod.FRESH_REDIRECT_SYMBOL).toBe('symbol');
    expect(typeof mod.FRESH_NOT_FOUND_SYMBOL).toBe('symbol');
    expect(typeof mod.FRESH_ROUTE_SYMBOL).toBe('symbol');
  });

  it('exports defineIsland + mountIsland + hydrateIslands + simulateInteraction + islandPlaceholder + brand symbols (v0.1.0)', async () => {
    const mod = await import('@kiwa/fresh');
    expect(typeof mod.defineIsland).toBe('function');
    expect(typeof mod.mountIsland).toBe('function');
    expect(typeof mod.hydrateIslands).toBe('function');
    expect(typeof mod.simulateInteraction).toBe('function');
    expect(typeof mod.islandPlaceholder).toBe('function');
    expect(typeof mod.isIslandDefinition).toBe('function');
    expect(typeof mod.isIslandMount).toBe('function');
    expect(typeof mod.ISLAND_SYMBOL).toBe('symbol');
    expect(typeof mod.ISLAND_MOUNT_SYMBOL).toBe('symbol');
  });

  it('exports defineHead + mergeHead + renderHead + extractHead + HEAD_SYMBOL (v0.1.0)', async () => {
    const mod = await import('@kiwa/fresh');
    expect(typeof mod.defineHead).toBe('function');
    expect(typeof mod.mergeHead).toBe('function');
    expect(typeof mod.renderHead).toBe('function');
    expect(typeof mod.extractHead).toBe('function');
    expect(typeof mod.isHeadFragment).toBe('function');
    expect(typeof mod.HEAD_SYMBOL).toBe('symbol');
  });
});

describe('@kiwa/hono surface', () => {
  it('exports createHonoApp + invokeRoute + createContext + buildRequest + route helpers + brand symbols (v0.1.0, Issue #815)', async () => {
    const mod = await import('@kiwa/hono');
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
    const mod = await import('@kiwa/hono');
    expect(typeof mod.createRpcClient).toBe('function');
    expect(typeof mod.defineRpcApp).toBe('function');
    expect(typeof mod.isHcResponse).toBe('function');
    expect(typeof mod.HC_CLIENT_SYMBOL).toBe('symbol');
    expect(typeof mod.HC_REQUEST_SYMBOL).toBe('symbol');
  });

  it('exports createWorkersEnv + createExecutionContext + KV / D1 / R2 mocks + brand symbols (v0.1.0)', async () => {
    const mod = await import('@kiwa/hono');
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
    const apiMod = await import('@kiwa/api');
    // Smoke a real mock-mode env to ensure the type/runtime surface is consistent.
    const env = await apiMod.setupApiServer({ mode: 'mock', mockHandlers: [] });
    expect(['mock', 'live', 'hybrid']).toContain(env.mode);
    await env.stop();
  });

  it('spec → data: SetupQueueEnvOptions accepts mock/live modes', async () => {
    const dataMod = await import('@kiwa/data');
    const env = await dataMod.setupQueueEnv({ mode: 'mock' });
    expect(env.mode).toBe('mock');
    expect(env.client.size()).toBe(0);
    await env.stop();
  });

  it('spec → observability: parsed SpecDoc has the same TestLayer values', async () => {
    const specMod = await import('@kiwa/core');
    const apiSpec = specMod.parseSpec('- module: x\n- layer: api\n');
    expect(apiSpec.layer).toBe('api');
    const cliSpec = specMod.parseSpec('- module: x\n- layer: cli\n');
    expect(cliSpec.layer).toBe('cli');
  });
});
