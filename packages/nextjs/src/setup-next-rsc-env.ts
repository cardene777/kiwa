// Next.js React Server Components (RSC) streaming + Suspense boundary test
// helper for kiwa (Issue #558, v1.3-1).
//
// Why this is a separate helper:
//
//   `renderServerComponent` (Issue #494) handles the leaf-level "await an async
//   server component and inspect the returned tree" case. It does not model
//   streaming chunks (RSC payload arrives over multiple network frames) or
//   Suspense boundaries (a `<Suspense fallback={...}>` shows the fallback
//   first, then swaps to the resolved subtree once the data promise settles).
//
//   `setupNextRscEnv` extends the testing seam to those two dimensions while
//   staying in the same "no real React renderer / no Next.js dev server"
//   philosophy: streaming is simulated as a flat array of chunks the component
//   yields in order, and Suspense is simulated as a two-phase
//   (fallback → resolved) transition that the helper drives deterministically.
//
// Out of scope (still):
//   - flight payload byte format / `react-server-dom-webpack` wire protocol
//   - actual React `renderToReadableStream` rendering
//   - client-side hydration after a chunk arrives
//   - concurrent multi-Suspense interleaving (one boundary per call)

import type { RscNode } from './render-server-component.js';

export const RSC_ERROR_BOUNDARY_SYMBOL = Symbol.for('kiwa.next.rsc.errorBoundary');

export interface RscErrorBoundarySignal {
  readonly [RSC_ERROR_BOUNDARY_SYMBOL]: true;
  readonly error: unknown;
}

/**
 * An async source the helper consumes chunk-by-chunk. Each yielded value is
 * one streaming frame; the helper appends it to `env.chunks` in arrival order
 * and uses the last chunk as `env.resolved` once the source completes.
 *
 * Use a plain async generator for most cases:
 *
 *   async function* source() {
 *     yield <Spinner />;            // initial chunk
 *     yield <Skeleton rows={3} />;  // partial data
 *     yield <Items list={data} />;  // final resolved chunk
 *   }
 */
export type RscStreamSource = AsyncIterable<RscNode>;

export interface SetupNextRscEnvOptions {
  /**
   * The async server component under test. If `dataSource` is omitted, the
   * helper awaits this function once and treats its return value as the only
   * (resolved) chunk — equivalent to a synchronous resolution.
   *
   * The component may throw to trigger the error boundary path. See
   * `injectError` for the test-side variant.
   */
  readonly component?: (props: Record<string, unknown>) => Promise<RscNode> | RscNode;
  /**
   * Optional props forwarded to `component`. Defaults to `{}`.
   */
  readonly props?: Record<string, unknown>;
  /**
   * Explicit streaming source. When provided, the helper iterates this and
   * ignores `component`. Useful when the production code already produces a
   * stream and the test wants to feed a deterministic sequence.
   */
  readonly dataSource?: RscStreamSource;
  /**
   * Markup shown while the (first) chunk is pending. Captured as
   * `env.fallback` so tests can assert that `<Suspense fallback={...}>`
   * surfaces the right loading state before the data arrives.
   */
  readonly suspenseFallback?: RscNode;
  /**
   * Hard timeout (ms) for the whole stream. If the source has not completed
   * by this deadline, the helper resolves with `env.timedOut = true` and the
   * chunks collected so far. Default 5000ms.
   */
  readonly streamingTimeout?: number;
  /**
   * Test-side error injection. When set, the helper short-circuits before
   * iterating the source and routes the error into `env.errorBoundary` —
   * the same shape a production `error.tsx` boundary would see.
   */
  readonly injectError?: unknown;
}

export interface SetupNextRscEnvResult {
  /**
   * Streaming chunks in arrival order. For a Suspense boundary, the first
   * chunk is typically the fallback markup and the last chunk is the
   * resolved subtree.
   */
  readonly chunks: RscNode[];
  /**
   * The fallback markup captured before the source produced its first
   * non-fallback chunk. `null` when the test did not pass `suspenseFallback`
   * or when the source resolved synchronously without an explicit fallback.
   */
  readonly fallback: RscNode | null;
  /**
   * The last chunk yielded by the source — the markup a real Next.js page
   * would settle on after streaming finishes. `null` when the source threw
   * or timed out before producing any chunk.
   */
  readonly resolved: RscNode | null;
  /**
   * Set when the component or source threw, or when `injectError` was
   * provided. Mirrors the value a production `error.tsx` boundary receives.
   * `null` for happy-path streams.
   */
  readonly errorBoundary: RscErrorBoundarySignal | null;
  /**
   * `true` when `streamingTimeout` elapsed before the source completed.
   * `chunks` still contains any chunks that arrived before the deadline.
   */
  readonly timedOut: boolean;
}

const DEFAULT_STREAMING_TIMEOUT_MS = 5000;

function buildErrorBoundary(error: unknown): RscErrorBoundarySignal {
  return { [RSC_ERROR_BOUNDARY_SYMBOL]: true, error };
}

async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<{ value: T | null; timedOut: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ value: null; timedOut: true }>((resolve) => {
    timer = setTimeout(() => resolve({ value: null, timedOut: true }), timeoutMs);
  });
  try {
    const value = await Promise.race([
      promise.then((v) => ({ value: v, timedOut: false as const })),
      timeout,
    ]);
    return value;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function collectStream(
  source: RscStreamSource,
  fallback: RscNode | null,
): Promise<{ chunks: RscNode[]; resolved: RscNode | null; thrown: unknown }> {
  const chunks: RscNode[] = [];
  // The fallback is the visible markup before the first real chunk arrives —
  // we record it as chunk 0 so tests can `expect(chunks[0]).toBe(fallback)`.
  if (typeof fallback !== 'undefined' && fallback !== null) {
    chunks.push(fallback);
  }
  try {
    for await (const chunk of source) {
      chunks.push(chunk);
    }
  } catch (err) {
    return { chunks, resolved: null, thrown: err };
  }
  const resolved = chunks.length > 0 ? (chunks[chunks.length - 1] ?? null) : null;
  // If the only chunk we have is the fallback, the source produced nothing —
  // resolved is null so tests can distinguish "fallback shown forever" from
  // "fallback then resolved subtree".
  const fallbackOnly =
    chunks.length === 1 && fallback !== null && Object.is(chunks[0], fallback);
  return { chunks, resolved: fallbackOnly ? null : resolved, thrown: undefined };
}

async function* singleChunkSource(
  component: NonNullable<SetupNextRscEnvOptions['component']>,
  props: Record<string, unknown>,
): AsyncGenerator<RscNode, void, unknown> {
  const result = await component(props);
  yield result;
}

/**
 * Drive an async RSC stream through a single Suspense boundary and capture
 * every chunk + the fallback + the resolved subtree + any error-boundary
 * trigger. The helper is deterministic — chunks arrive in the order the
 * source yields them, and the timeout is wall-clock-bounded so tests cannot
 * hang on a stuck stream.
 *
 * Typical usage:
 *
 *   const env = await setupNextRscEnv({
 *     dataSource: streamItems(),
 *     suspenseFallback: <Skeleton />,
 *     streamingTimeout: 1000,
 *   });
 *   expect(env.fallback).toEqual(<Skeleton />);
 *   expect(env.chunks).toHaveLength(3);
 *   expect(env.resolved).toEqual(<ItemList items={items} />);
 *   expect(env.errorBoundary).toBeNull();
 *   expect(env.timedOut).toBe(false);
 */
export async function setupNextRscEnv(
  opts: SetupNextRscEnvOptions = {},
): Promise<SetupNextRscEnvResult> {
  const timeoutMs = opts.streamingTimeout ?? DEFAULT_STREAMING_TIMEOUT_MS;
  const fallback = opts.suspenseFallback ?? null;

  // streamingTimeout: 0 (or negative) means "fail fast" — used by tests that
  // want to assert the helper does not hang when a deadline is set to zero.
  // A microtask-resolved source would otherwise beat a 0ms setTimeout in
  // Promise.race, hiding the timeout path.
  if (timeoutMs <= 0 && (opts.dataSource || opts.component)) {
    return {
      chunks: fallback !== null ? [fallback] : [],
      fallback,
      resolved: null,
      errorBoundary: null,
      timedOut: true,
    };
  }

  // Test-side error injection short-circuits everything — no chunks, no
  // resolved tree, just the boundary signal.
  if (typeof opts.injectError !== 'undefined') {
    return {
      chunks: fallback !== null ? [fallback] : [],
      fallback,
      resolved: null,
      errorBoundary: buildErrorBoundary(opts.injectError),
      timedOut: false,
    };
  }

  if (!opts.dataSource && !opts.component) {
    // Nothing to render — return an empty env so the caller can assert on it.
    return {
      chunks: fallback !== null ? [fallback] : [],
      fallback,
      resolved: null,
      errorBoundary: null,
      timedOut: false,
    };
  }

  const source: RscStreamSource = opts.dataSource
    ? opts.dataSource
    : singleChunkSource(opts.component!, opts.props ?? {});

  const { value, timedOut } = await runWithTimeout(collectStream(source, fallback), timeoutMs);

  if (timedOut || value === null) {
    return {
      chunks: fallback !== null ? [fallback] : [],
      fallback,
      resolved: null,
      errorBoundary: null,
      timedOut: true,
    };
  }

  const { chunks, resolved, thrown } = value;

  if (typeof thrown !== 'undefined') {
    return {
      chunks,
      fallback,
      resolved: null,
      errorBoundary: buildErrorBoundary(thrown),
      timedOut: false,
    };
  }

  return {
    chunks,
    fallback,
    resolved,
    errorBoundary: null,
    timedOut: false,
  };
}
