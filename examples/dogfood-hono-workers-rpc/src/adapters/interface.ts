/**
 * Provider-neutral Cloudflare Workers + Hono adapter contract for the
 * hono-workers-rpc dogfood.
 *
 * The dogfood talks to Hono only through this interface. Two implementations
 * exist: {@link makeMockAdapter} (backed by `@kiwa-lab/hono` createHonoApp
 * + invokeRoute + createRpcClient + createWorkersEnv + createExecutionContext)
 * and {@link makeRealAdapter} (drives a real `miniflare` runtime when
 * `CF_ACCOUNT_ID=1` is set, else returns a `skipped` variant whose every
 * method records a `HONO_REAL_ENV_MISSING` trace).
 *
 * Both satisfy the same 6-op surface so behavioural fidelity between real vs
 * mock can be measured side-by-side and fed to `@kiwa-lab/quality-metrics`
 * 7-axis release gate.
 */

/** Route dispatch snapshot — HTTP status + JSON body + captured middleware log. */
export interface RouteSnapshot {
  readonly status: number;
  readonly body: unknown;
  readonly middlewareLog: readonly string[];
}

/** hc RPC snapshot — status + parsed json body + the ok flag. */
export interface RpcSnapshot {
  readonly status: number;
  readonly ok: boolean;
  readonly json: unknown;
}

/** KV op observation — key writes / reads observable after a request. */
export interface KvObservation {
  readonly writes: Record<string, string>;
  readonly reads: Record<string, string | null>;
}

/** D1 op observation — captured statement + first row. */
export interface D1Observation {
  readonly sql: string;
  readonly rowCount: number;
  readonly rows: readonly Record<string, unknown>[];
}

/** R2 op observation — captured put + list. */
export interface R2Observation {
  readonly keysWritten: readonly string[];
  readonly keysListed: readonly string[];
}

/** ExecutionContext observation — pending count + didPassThrough. */
export interface ExecutionCtxObservation {
  readonly waitUntilCount: number;
  readonly pending: number;
  readonly passedThrough: boolean;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/** HTTP methods driveRoute / driveRpc supports. */
export type HonoMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Provider-neutral Hono / Workers driver. 6 ops map to the AC in Issue
 * #810 (Hono app 5 route + 5 middleware / hc RPC / KV + D1 + R2 mock).
 *
 * 1. `driveRoute` — invoke a raw path via `app.request` and capture the
 *    resulting spec + middleware chain trace
 * 2. `driveRpc`   — invoke the same path via a type-safe hc client
 * 3. `driveKv`    — invoke `/kv-counter` and observe KV writes
 * 4. `driveD1`    — invoke `/d1-list` and observe D1 statement + rows
 * 5. `driveR2`    — invoke `/r2-upload` and observe R2 writes / listing
 * 6. `driveExecutionCtx` — invoke a handler that schedules `waitUntil` and
 *    observe the pending count before / after `waitUntilAll()`
 */
export interface HonoAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveRoute(
    method: HonoMethod,
    path: string,
    opts?: {
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<RouteSnapshot>;

  driveRpc(
    method: HonoMethod,
    path: string,
    opts?: {
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<RpcSnapshot>;

  driveKv(iterations: number): Promise<KvObservation>;

  driveD1(seed: readonly { id: number; title: string }[]): Promise<D1Observation>;

  driveR2(
    uploads: readonly { key: string; contents: string }[],
  ): Promise<R2Observation>;

  driveExecutionCtx(scheduleCount: number): Promise<ExecutionCtxObservation>;

  metrics(): {
    latencySamplesMs: number[];
    routeInvokeCount: number;
    rpcInvokeCount: number;
    kvOpCount: number;
    d1OpCount: number;
    r2OpCount: number;
    execCtxCount: number;
  };

  reset(): Promise<void>;
}
