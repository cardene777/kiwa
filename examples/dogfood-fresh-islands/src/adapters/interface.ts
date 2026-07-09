/**
 * Provider-neutral Deno Fresh adapter contract for the fresh-islands dogfood.
 *
 * The dogfood talks to Fresh only through this interface. Two implementations
 * exist: {@link makeMockAdapter} (backed by `@kiwa-lab/fresh`
 * invokeFreshHandler + invokeDefineRoute + hydrateIslands + simulateInteraction
 * + mergeHead) and {@link makeRealAdapter} (drives a real Deno Fresh runtime
 * through `fresh-testing-library` when `DENO_INSTALLED=1`, else returns a
 * `skipped` variant whose every method records a `FRESH_REAL_ENV_MISSING`
 * trace).
 *
 * Both satisfy the same 6-op surface so behavioural fidelity between real vs
 * mock can be measured side-by-side and fed to `@kiwa-lab/quality-metrics`
 * 7-axis release gate.
 */

/** Route dispatch snapshot — HTTP status + rendered HTML + captured render data. */
export interface RouteSnapshot {
  readonly status: number;
  readonly html: string;
  readonly renderData: unknown;
}

/** Island mount snapshot — the hydrated island name + rendered island HTML. */
export interface IslandSnapshot {
  readonly name: string;
  readonly html: string;
  readonly propsJson: string;
}

/** Interaction summary — how many handlers ran + whether preventDefault was
 * called. */
export interface InteractionSummary {
  readonly invoked: number;
  readonly defaultPrevented: boolean;
}

/** Head merge observation — the canonical head fragment shape. */
export interface HeadSnapshot {
  readonly title: string | null;
  readonly metaCount: number;
  readonly linkCount: number;
  readonly html: string;
}

/** Edge runtime env observation — reflects the mocked Deno.env / Deno.serve
 * shape. */
export interface EdgeEnvObservation {
  readonly denoInstalled: boolean;
  readonly envRead: Record<string, string | undefined>;
  readonly serveCalls: number;
}

/** Trace event — every adapter method appends one entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/** Union of HTTP methods the driveHandler flow supports. */
export type FreshMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Provider-neutral Fresh-driver contract. 6 ops mirror the AC in Issue #809:
 *
 * 1. `mountRoute` — invoke a `defineRoute`-wrapped page + capture the tree
 * 2. `driveHandler` — dispatch a Fresh Handler for the given HTTP method
 * 3. `mountIsland` — render an island placeholder + hydrate the mount
 * 4. `driveInteraction` — dispatch a synthetic event against a mounted island
 * 5. `mountHead` — merge N Head fragments (title / meta / link)
 * 6. `driveEdgeEnv` — invoke a Fresh handler under a mocked edge runtime env
 */
export interface FreshAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  mountRoute(pathname: string): Promise<RouteSnapshot>;

  driveHandler(
    method: FreshMethod,
    body?: unknown,
  ): Promise<RouteSnapshot>;

  mountIsland(
    name: 'Counter' | 'TodoList',
    seedProps: Record<string, unknown>,
  ): Promise<IslandSnapshot>;

  driveInteraction(
    name: 'Counter' | 'TodoList',
    event: 'click' | 'input' | 'submit',
    value?: unknown,
  ): Promise<InteractionSummary>;

  mountHead(fragments: readonly {
    title?: string;
    meta?: readonly { name?: string; property?: string; content?: string }[];
    link?: readonly { rel: string; href: string }[];
  }[]): Promise<HeadSnapshot>;

  driveEdgeEnv(
    env: Record<string, string>,
    handlerPath: string,
  ): Promise<EdgeEnvObservation>;

  metrics(): {
    latencySamplesMs: number[];
    routeMountCount: number;
    handlerDispatchCount: number;
    islandMountCount: number;
    interactionCount: number;
    headMergeCount: number;
    edgeEnvCount: number;
  };

  reset(): Promise<void>;
}
