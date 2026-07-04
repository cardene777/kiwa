import type { FreshAdapter, FreshMethod } from '../adapters/interface.js';

/**
 * User-facing Fresh flow implementations — "what the Fresh app actually
 * does" that both mock and real adapters must satisfy. Each flow drives 1
 * or more adapter ops end-to-end and returns a light summary so tests +
 * fidelity harness can assert on the outcome without re-implementing the
 * adapter contract in-line.
 *
 * The 4 flows selected are enough to exercise the full v1.19-3 AC set —
 * Route Handler dispatch + defineRoute page tree + Island mount +
 * interaction + Head merge + edge runtime env mock.
 */

/**
 * Flow 1 — mount the defineRoute page under a given pathname and dispatch
 * the Handler for the requested HTTP method. Fidelity harness cross-checks:
 * the same route responds to both defineRoute (server-side render only)
 * and Handler (HTTP boundary) surfaces.
 */
export async function driveRouteFlow(
  adapter: FreshAdapter,
  pathname: string,
  method: FreshMethod,
): Promise<{
  routeHtml: string;
  handlerStatus: number;
  handlerHtml: string;
  renderData: unknown;
}> {
  const routeSnapshot = await adapter.mountRoute(pathname);
  const handlerSnapshot = await adapter.driveHandler(method);
  return {
    routeHtml: routeSnapshot.html,
    handlerStatus: handlerSnapshot.status,
    handlerHtml: handlerSnapshot.html,
    renderData: handlerSnapshot.renderData,
  };
}

/**
 * Flow 2 — mount an island with seed props, dispatch 1 or more synthetic
 * events, and return a summary of the interaction trace. Fidelity harness
 * cross-checks: every handler collected during mount is invoked exactly
 * once by `simulateInteraction`.
 */
export async function driveIslandFlow(
  adapter: FreshAdapter,
  name: 'Counter' | 'TodoList',
  seedProps: Record<string, unknown>,
  events: readonly {
    event: 'click' | 'input' | 'submit';
    value?: unknown;
  }[],
): Promise<{
  islandHtml: string;
  totalInvocations: number;
  totalPreventedDefault: number;
}> {
  const mountSnapshot = await adapter.mountIsland(name, seedProps);
  let totalInvocations = 0;
  let totalPreventedDefault = 0;
  for (const event of events) {
    const summary = await adapter.driveInteraction(name, event.event, event.value);
    totalInvocations += summary.invoked;
    if (summary.defaultPrevented) totalPreventedDefault += 1;
  }
  return {
    islandHtml: mountSnapshot.html,
    totalInvocations,
    totalPreventedDefault,
  };
}

/**
 * Flow 3 — merge N head fragments (site + route + island) into a canonical
 * head and return the merged shape. Fidelity harness cross-checks: dedup
 * rules (title last-wins, meta name-dedup, link rel+href-dedup) apply the
 * same in mock and real.
 */
export async function driveHeadFlow(
  adapter: FreshAdapter,
  fragments: readonly {
    title?: string;
    meta?: readonly { name?: string; property?: string; content?: string }[];
    link?: readonly { rel: string; href: string }[];
  }[],
): Promise<{
  mergedTitle: string | null;
  mergedMetaCount: number;
  mergedLinkCount: number;
  html: string;
}> {
  const snapshot = await adapter.mountHead(fragments);
  return {
    mergedTitle: snapshot.title,
    mergedMetaCount: snapshot.metaCount,
    mergedLinkCount: snapshot.linkCount,
    html: snapshot.html,
  };
}

/**
 * Flow 4 — dispatch a handler under a mocked edge runtime env. Fidelity
 * harness cross-checks: `Deno.env.get(...)` reads reflect the injected env
 * and `Deno.serve(...)` is invoked at least once.
 */
export async function driveEdgeEnvFlow(
  adapter: FreshAdapter,
  env: Record<string, string>,
  handlerPath: string,
): Promise<{
  serveCalls: number;
  envReadKeys: string[];
  denoInstalled: boolean;
}> {
  const observation = await adapter.driveEdgeEnv(env, handlerPath);
  return {
    serveCalls: observation.serveCalls,
    envReadKeys: Object.keys(observation.envRead),
    denoInstalled: observation.denoInstalled,
  };
}
