// SolidJS Signal + Effect + createResource test helpers for kiwa (Issue #813, v1.19-1a).
//
// SolidJS is a fine-grained reactive framework where `createSignal`, `createEffect`,
// and `createResource` form the core primitives. Real Solid requires a runtime with
// an owner tree + reactive graph. kiwa takes a lighter approach: provide standalone
// mock primitives that model the same accessor / setter / effect-run / resource-fetch
// contract so tests can assert on signal transitions + effect traces + resource state
// without spinning up the Solid runtime.
//
// Out of scope on purpose:
//   - fine-grained dependency tracking that scales beyond direct signal reads
//     (mockEffect only subscribes to signals it reads through the getter)
//   - real `startTransition` concurrent rendering (batched writes go through `batch()`)
//   - true createResource Suspense pause during a render (see route.ts for
//     Suspense boundary capture at the render layer)

export const SIGNAL_SYMBOL = Symbol.for('kiwa.solidjs.signal');
export const EFFECT_SYMBOL = Symbol.for('kiwa.solidjs.effect');
export const RESOURCE_SYMBOL = Symbol.for('kiwa.solidjs.resource');

/** Read accessor for a mockSignal — mirrors Solid's `[getter, setter] = createSignal()`. */
export type SignalGetter<T> = {
  (): T;
  readonly [SIGNAL_SYMBOL]: true;
};

/** Write setter for a mockSignal — accepts a next value or an updater fn. */
export type SignalSetter<T> = (next: T | ((prev: T) => T)) => T;

/** Effect trace entry — captures which signal values the body observed on that run. */
export interface EffectTraceEntry<T> {
  readonly runIndex: number;
  readonly readValues: T[];
}

/** Resource state — mirrors Solid's `resource.state` machine. */
export type ResourceState = 'unresolved' | 'pending' | 'ready' | 'errored' | 'refreshing';

export interface ResourceAccessor<T> {
  (): T | undefined;
  readonly state: ResourceState;
  readonly loading: boolean;
  readonly error: unknown;
  readonly latest: T | undefined;
  readonly [RESOURCE_SYMBOL]: true;
}

export interface ResourceActions<T> {
  readonly refetch: () => Promise<T | undefined>;
  readonly mutate: (value: T | undefined) => T | undefined;
}

export interface ResourceHandle<T> {
  readonly accessor: ResourceAccessor<T>;
  readonly actions: ResourceActions<T>;
  readonly initialFetch: Promise<T | undefined>;
}

interface BatchScope {
  readonly queued: Set<() => void>;
}

let activeBatch: BatchScope | null = null;
let activeEffectRunner: (() => void) | null = null;
let readCapture: SignalGetter<unknown>[] | null = null;

function scheduleRun(runner: () => void): void {
  if (activeBatch) {
    activeBatch.queued.add(runner);
    return;
  }
  runner();
}

/**
 * Create a Solid-shaped Signal without a Solid runtime. Returns `[get, set]`
 * where reading the getter inside a `mockEffect` body subscribes the effect,
 * and writing through the setter re-runs subscribed effects (deduplicated
 * inside `batch()`).
 */
export function mockSignal<T>(initial: T): readonly [SignalGetter<T>, SignalSetter<T>] {
  let value = initial;
  const subscribers = new Set<() => void>();
  const getter = ((): T => {
    if (readCapture) readCapture.push(getter as SignalGetter<T>);
    if (activeEffectRunner) subscribers.add(activeEffectRunner);
    return value;
  }) as SignalGetter<T>;
  Object.defineProperty(getter, SIGNAL_SYMBOL, { value: true, enumerable: false });
  const setter: SignalSetter<T> = (next) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
    if (Object.is(resolved, value)) return value;
    value = resolved;
    // Snapshot to avoid re-entrancy when a runner clears + re-adds itself.
    const snapshot = Array.from(subscribers);
    for (const runner of snapshot) scheduleRun(runner);
    return value;
  };
  return [getter, setter] as const;
}

/**
 * Run `fn` and capture every signal it reads. Useful for asserting a component
 * body reads the expected signals before committing to a full effect subscribe.
 */
export function track<T>(fn: () => T): { result: T; reads: SignalGetter<unknown>[] } {
  const previous = readCapture;
  const reads: SignalGetter<unknown>[] = [];
  readCapture = reads;
  try {
    const result = fn();
    return { result, reads };
  } finally {
    readCapture = previous;
  }
}

export interface EffectHandle<T> {
  readonly [EFFECT_SYMBOL]: true;
  readonly runCount: () => number;
  readonly trace: () => ReadonlyArray<EffectTraceEntry<T>>;
  readonly dispose: () => void;
}

/**
 * Run a Solid-shaped `createEffect(fn)` — the body is invoked immediately and
 * again every time a subscribed signal changes. Every run captures which
 * signal values were read into an ordered trace so tests can assert on the
 * exact sequence of transitions.
 */
export function mockEffect<T>(fn: () => T): EffectHandle<T> {
  let disposed = false;
  const entries: EffectTraceEntry<T>[] = [];
  const runner = (): void => {
    if (disposed) return;
    const capturedReads: SignalGetter<unknown>[] = [];
    const priorCapture = readCapture;
    const priorRunner = activeEffectRunner;
    readCapture = capturedReads;
    activeEffectRunner = runner;
    try {
      const value = fn();
      entries.push({
        runIndex: entries.length,
        readValues: capturedReads.map((g) => g() as T),
      });
      void value;
    } finally {
      activeEffectRunner = priorRunner;
      readCapture = priorCapture;
    }
  };
  runner();
  return {
    [EFFECT_SYMBOL]: true,
    runCount: () => entries.length,
    trace: () => entries,
    dispose: () => {
      disposed = true;
    },
  };
}

/**
 * Group multiple signal writes so subscribed effects run at most once for the
 * whole batch (dedup via Set). Matches Solid's `batch()` semantics for tests.
 */
export function batch<T>(fn: () => T): T {
  if (activeBatch) return fn();
  const scope: BatchScope = { queued: new Set() };
  activeBatch = scope;
  try {
    return fn();
  } finally {
    activeBatch = null;
    for (const runner of scope.queued) runner();
  }
}

interface ResourceInternals<T> {
  state: ResourceState;
  value: T | undefined;
  error: unknown;
  runCount: number;
}

/**
 * Mock Solid's `createResource(fetcher)` — awaits the fetcher, exposes
 * `resource()` accessor + `resource.state` + `refetch()` + `mutate()`. Tests
 * can drive the resource lifecycle explicitly without racing against a real
 * async runtime.
 */
export function createResourceStub<T>(fetcher: () => Promise<T> | T): ResourceHandle<T> {
  const internals: ResourceInternals<T> = {
    state: 'unresolved',
    value: undefined,
    error: undefined,
    runCount: 0,
  };
  const run = async (): Promise<T | undefined> => {
    internals.state = internals.runCount === 0 ? 'pending' : 'refreshing';
    internals.runCount += 1;
    try {
      const result = await fetcher();
      internals.state = 'ready';
      internals.value = result;
      internals.error = undefined;
      return result;
    } catch (err) {
      internals.state = 'errored';
      internals.error = err;
      return undefined;
    }
  };
  const initialFetch = run();
  const accessor = (() => internals.value) as ResourceAccessor<T>;
  Object.defineProperties(accessor, {
    state: { get: () => internals.state, enumerable: true },
    loading: { get: () => internals.state === 'pending' || internals.state === 'refreshing', enumerable: true },
    error: { get: () => internals.error, enumerable: true },
    latest: { get: () => internals.value, enumerable: true },
    [RESOURCE_SYMBOL]: { value: true, enumerable: false },
  });
  const actions: ResourceActions<T> = {
    refetch: () => run(),
    mutate: (value) => {
      internals.value = value;
      internals.state = 'ready';
      internals.error = undefined;
      return value;
    },
  };
  return { accessor, actions, initialFetch };
}

/** Type guard: recognize a mockSignal getter (used by helpers + tests). */
export function isSignal(value: unknown): value is SignalGetter<unknown> {
  return typeof value === 'function' && (value as { [SIGNAL_SYMBOL]?: true })[SIGNAL_SYMBOL] === true;
}

/** Type guard: recognize a mockEffect handle. */
export function isEffectHandle(value: unknown): value is EffectHandle<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [EFFECT_SYMBOL]?: true })[EFFECT_SYMBOL] === true
  );
}

/** Type guard: recognize a createResourceStub accessor. */
export function isResourceAccessor(value: unknown): value is ResourceAccessor<unknown> {
  return typeof value === 'function' && (value as { [RESOURCE_SYMBOL]?: true })[RESOURCE_SYMBOL] === true;
}
