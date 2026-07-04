import type { SolidAdapter } from '../adapters/interface.js';

/**
 * User-facing signal flow implementations — "what the app actually does"
 * that both mock and real adapters must satisfy. Each flow drives 1 or
 * more adapter ops end-to-end and returns a light summary so tests +
 * fidelity harness can assert on the outcome without re-implementing the
 * adapter contract in-line.
 *
 * The 4 flows selected are enough to exercise the full v1.19-2 AC set —
 * Counter Signal + TodoList Signal batch + createResource lifecycle +
 * Suspense boundary + fine-grained update trace.
 */

/**
 * Flow 1 — mount Counter with initial value 0, drive N increments, and
 * return the observed values so tests can assert on the exact trace.
 * Fidelity harness cross-checks: effect runCount must equal ticks + 1.
 */
export async function driveCounterFlow(
  adapter: SolidAdapter,
  ticks: number,
): Promise<{
  finalMarkup: string;
  observedValues: number[];
  effectRunCount: number;
}> {
  await adapter.mountCounter(0);
  const drove = await adapter.driveCounter(ticks);
  return {
    finalMarkup: drove.snapshot.markup,
    observedValues: drove.effect.values.map((v) => Number(v)),
    effectRunCount: drove.effect.runCount,
  };
}

/**
 * Flow 2 — mount TodoList with seed items, apply a mix of add / toggle /
 * markAll batch operations, and return the final render. Fidelity
 * harness cross-checks: batched markAll must produce exactly 1 extra
 * effect run regardless of item count.
 */
export async function driveTodosFlow(
  adapter: SolidAdapter,
  seed: readonly string[],
  actions: Parameters<SolidAdapter['driveTodos']>[0],
): Promise<{
  finalMarkup: string;
  finalEffectRunCount: number;
}> {
  await adapter.mountTodos(seed);
  const drove = await adapter.driveTodos(actions);
  return {
    finalMarkup: drove.snapshot.markup,
    finalEffectRunCount: drove.effect.runCount,
  };
}

/**
 * Flow 3 — invoke `createResource` fetcher, wait for the state to settle,
 * and return the transition list. Fidelity harness cross-checks: state
 * must transition through `unresolved` (initial) -> `pending` -> `ready`
 * (or `errored` on the erroring fetcher path). The exact intermediate
 * transitions may collapse in the mock (setTimeout ordering) so we only
 * assert on the terminal state + a strictly increasing timestamp order.
 */
export async function driveResourceFlow(
  adapter: SolidAdapter,
  fetcher: () => Promise<{ id: string; displayName: string; email: string }>,
): Promise<{
  terminalState: string;
  finalMarkup: string;
  transitionCount: number;
}> {
  const result = await adapter.mountResource(fetcher);
  const terminal = result.transitions[result.transitions.length - 1];
  return {
    terminalState: terminal ? terminal.state : 'unresolved',
    finalMarkup: result.finalMarkup,
    transitionCount: result.transitions.length,
  };
}

/**
 * Flow 4 — mount a Suspense boundary that waits `fetchDelayMs` before
 * resolving. The mock returns `fallbackMarkup` + `resolvedMarkup` with
 * `timedOut = false` on the happy path. The fidelity harness asserts on
 * the swap (fallback -> resolved) and on the safety-gate `timedOut` flag.
 */
export async function driveSuspenseFlow(
  adapter: SolidAdapter,
  fetchDelayMs: number,
): Promise<{
  hadFallback: boolean;
  hadResolved: boolean;
  timedOut: boolean;
}> {
  const observation = await adapter.driveSuspense(fetchDelayMs);
  return {
    hadFallback: observation.fallbackMarkup.length > 0,
    hadResolved: observation.resolvedMarkup !== null && observation.resolvedMarkup.length > 0,
    timedOut: observation.timedOut,
  };
}
