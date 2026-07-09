import { mockSignal, mockEffect, type EffectHandle, type SignalGetter, type SignalSetter } from '@kiwa-lab/solidjs';

/**
 * Counter store — a single Signal + a derived effect that mirrors the
 * numeric value into an observable trace. This is the smallest reactive
 * store the dogfood ships and it doubles as the effect-trace fixture for
 * fidelity comparison against a real Solid runtime.
 *
 * The store is created eagerly (the effect subscribes on construction) so
 * the trace length after N `set(...)` calls is exactly `N + 1` (initial
 * mount + N re-runs), which is the invariant every test asserts on.
 */
export interface CounterStore {
  readonly count: SignalGetter<number>;
  readonly setCount: SignalSetter<number>;
  readonly effect: EffectHandle<number>;
  /** Snapshot the last N observed values (initial + all re-runs). */
  readonly observed: () => number[];
  /** Convenience wrapper for `count() + 1` writes. */
  readonly increment: (by?: number) => number;
  /** Convenience wrapper for resetting to 0. */
  readonly reset: () => number;
  readonly dispose: () => void;
}

export function createCounterStore(initial = 0): CounterStore {
  const [count, setCount] = mockSignal<number>(initial);
  const observed: number[] = [];
  const effect = mockEffect<number>(() => {
    const next = count();
    observed.push(next);
    return next;
  });
  return {
    count,
    setCount,
    effect,
    observed: () => [...observed],
    increment: (by = 1) => setCount((prev) => prev + by),
    reset: () => setCount(0),
    dispose: () => effect.dispose(),
  };
}
