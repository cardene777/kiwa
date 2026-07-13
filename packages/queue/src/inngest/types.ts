import type { TestEnvBase, TestMode } from '@kiwa-lab/core';

/**
 * Inngest backend selection.
 * - `stub`: fully in-process. Functions register by name + event key, and
 *   `sendEvent` invokes them directly without going through the Inngest wire
 *   protocol. Fast, offline, deterministic. Suitable for unit tests that need
 *   to exercise retry / step / concurrency semantics without a dev-server.
 * - `dev-server`: talks to a real Inngest dev-server (either an externally
 *   managed one supplied via `devServer.url` or one spawned by the helper).
 *   Exercises the actual event dispatch + function execution round-trip. Best
 *   for integration lanes that need prod-shape parity.
 */
export type InngestMode = 'stub' | 'dev-server';

export const INNGEST_MODES: readonly InngestMode[] = ['stub', 'dev-server'];

export function isInngestMode(value: string): value is InngestMode {
  return INNGEST_MODES.includes(value as InngestMode);
}

/** Terminal + intermediate states an Inngest function run can reach. */
export type InngestRunState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Structural mirror of an Inngest event — decoupled from the `inngest` SDK
 * types so tests can build events without importing from the SDK.
 */
export interface InngestEvent<TData = unknown> {
  /** Event name — Inngest routes events to functions by matching this field. */
  name: string;
  /** Arbitrary event payload. */
  data: TData;
  /** Optional event id — dev-server assigns one when omitted. */
  id?: string | undefined;
  /** Optional ISO timestamp — defaults to the send time. */
  ts?: number | undefined;
  /** Optional user object — matches the `user` field on real Inngest events. */
  user?: Record<string, unknown> | undefined;
}

/**
 * Shape passed to a step's handler. Mirrors the surface the `step` object on a
 * real Inngest function exposes for the pieces of the API we honour.
 */
export interface InngestStepContext {
  /**
   * Run a named step. The `run` name is what tests observe through
   * `assertStepRan(functionId, stepId)`.
   */
  run: <T>(stepId: string, fn: () => Promise<T> | T) => Promise<T>;
  /** Sleep for `ms` milliseconds — stub mode advances a virtual clock. */
  sleep: (stepId: string, ms: number) => Promise<void>;
}

/** Context surfaced to an Inngest function handler. */
export interface InngestFunctionContext<TData = unknown> {
  event: InngestEvent<TData>;
  step: InngestStepContext;
  attempt: number;
}

/** Function handler signature — mirrors the `handler` parameter of `inngest.createFunction`. */
export type InngestFunctionHandler<TData = unknown, TResult = unknown> = (
  ctx: InngestFunctionContext<TData>,
) => Promise<TResult> | TResult;

/**
 * Registered function definition. Structural mirror of the
 * `inngest.createFunction` argument set.
 */
export interface InngestFunctionDefinition<TData = unknown, TResult = unknown> {
  /** Stable identifier for the function — matches `id` in `inngest.createFunction`. */
  id: string;
  /** Event that triggers this function. Matches `event.name` on send. */
  event: string;
  /**
   * Retry count — total number of attempts including the first. Defaults to 1
   * (no retries). Matches the `retries` field on `inngest.createFunction`.
   */
  retries?: number | undefined;
  /**
   * Optional concurrency cap. `stub` mode enforces this by queuing extra events
   * behind the cap and running them sequentially. Defaults to unbounded.
   */
  concurrency?: number | undefined;
  /** Function body — receives `event` + `step` + `attempt`. */
  handler: InngestFunctionHandler<TData, TResult>;
}

/** Snapshot of a single function run — the shape assertion helpers observe. */
export interface InngestRunSnapshot<TData = unknown, TResult = unknown> {
  runId: string;
  functionId: string;
  event: InngestEvent<TData>;
  state: InngestRunState;
  attemptsMade: number;
  returnValue?: TResult | undefined;
  failedReason?: string | undefined;
  /** Ordered list of step ids the run executed (including sleeps). */
  stepsRun: string[];
}

/**
 * Options for the `dev-server` backend. Either supply `url` to point at an
 * externally managed dev-server, or leave `url` undefined to let the helper
 * spawn one via `npx inngest-cli@latest dev`.
 */
export interface InngestDevServerOptions {
  /** Existing dev-server URL (e.g. `http://127.0.0.1:8288`). */
  url?: string | undefined;
  /** Port for the auto-spawned dev-server. Defaults to `8288`. */
  port?: number | undefined;
  /**
   * Milliseconds to wait for the auto-spawned dev-server before timing out.
   * Defaults to `15000`.
   */
  startupTimeoutMs?: number | undefined;
}

/** Common options for the `setupInngestEnv` factory. */
export interface SetupInngestEnvOptions {
  /** Backend selector. Defaults to `'stub'`. */
  mode?: InngestMode | undefined;
  /**
   * Function definitions registered against the env. Registering a duplicate
   * `id` overwrites the previous one.
   */
  functions?: InngestFunctionDefinition[] | undefined;
  /** dev-server overrides. Ignored when `mode === 'stub'`. */
  devServer?: InngestDevServerOptions | undefined;
  /**
   * Inngest app name — mirrors `new Inngest({ id })` on the real SDK. Defaults
   * to `'kiwa-test-app'`.
   */
  appId?: string | undefined;
}

/**
 * Return type of {@link setupInngestEnv}. Same surface across both backends so
 * consumer tests can switch modes with a one-argument change.
 */
export interface InngestTestEnv<TMode extends TestMode = TestMode>
  extends TestEnvBase<TMode> {
  /** Chosen backend — mirrors the `mode` parameter. */
  backend: InngestMode;
  /** App id in use. */
  appId: string;
  /** Optional dev-server URL — undefined in stub mode. */
  devServerUrl: string | undefined;

  /** Register (or replace) a function definition after env creation. */
  registerFunction: <TData = unknown, TResult = unknown>(
    fn: InngestFunctionDefinition<TData, TResult>,
  ) => void;

  /**
   * Send an event by name + data. Returns the event id. The env dispatches
   * matching functions asynchronously — use `assertFunctionRan` / etc. to await
   * outcomes.
   */
  sendEvent: <TData = unknown>(name: string, data: TData) => Promise<string>;

  /**
   * Await the first run of `functionId` reaching a terminal state
   * (`completed` / `failed` / `cancelled`). Rejects on timeout (default 5s).
   */
  waitForRun: <TData = unknown, TResult = unknown>(
    functionId: string,
    opts?: { timeoutMs?: number | undefined },
  ) => Promise<InngestRunSnapshot<TData, TResult>>;

  /** Assertion — the first run of `functionId` reached `completed`. */
  assertFunctionRan: <TData = unknown, TResult = unknown>(
    functionId: string,
    expected?: { returnValue?: TResult | undefined } | undefined,
  ) => Promise<InngestRunSnapshot<TData, TResult>>;

  /** Assertion — the first run of `functionId` failed. */
  assertFunctionFailed: <TData = unknown>(
    functionId: string,
    expected?:
      | { attempts?: number | undefined; reasonMatch?: RegExp | undefined }
      | undefined,
  ) => Promise<InngestRunSnapshot<TData>>;

  /** Assertion — the first run of `functionId` ran `expectedAttempts` times. */
  assertRetried: <TData = unknown>(
    functionId: string,
    expectedAttempts: number,
  ) => Promise<InngestRunSnapshot<TData>>;

  /** Assertion — the first run of `functionId` executed `stepId`. */
  assertStepRan: <TData = unknown>(
    functionId: string,
    stepId: string,
  ) => Promise<InngestRunSnapshot<TData>>;

  /**
   * Assertion — the queue has no queued / running runs. Waits up to 250ms for
   * inflight runs to settle, then throws if any remain.
   */
  assertQueueDrained: () => Promise<void>;

  /** Introspection helper — every run snapshot the env has ever seen. */
  listRuns: () => InngestRunSnapshot[];
}
