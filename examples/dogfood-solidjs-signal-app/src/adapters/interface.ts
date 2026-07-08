/**
 * Provider-neutral SolidJS adapter contract for the signal-app dogfood.
 *
 * The dogfood talks to Solid only through this interface. Two implementations
 * exist: {@link makeMockAdapter} (backed by `@kiwa/solidjs` mockSignal +
 * mockEffect + createResourceStub + renderWithSuspense) and
 * {@link makeRealAdapter} (drives a real `solid-js` runtime through
 * `solid-testing-library` when `SOLID_LIVE=1`, else returns a `skipped`
 * variant whose every method records a `SOLID_REAL_ENV_MISSING` trace).
 *
 * Both satisfy the same 6-op surface so behavioural fidelity between real vs
 * mock can be measured side-by-side and fed to `@kiwa/quality-metrics`
 * 7-axis release gate.
 */

/** Rendered markup snapshot — used to compare Signal-driven re-renders. */
export interface RenderSnapshot {
  readonly component: string;
  readonly markup: string;
}

/** Effect-run summary — captures how many times the effect body ran + the
 * ordered value trace. Real-mode returns the same shape from the real
 * `createEffect` runner (via `createRoot` + a manual counter). */
export interface EffectSummary {
  readonly runCount: number;
  readonly values: unknown[];
}

/** Resource lifecycle transition — 1 entry per state change. */
export interface ResourceTransition {
  readonly at: number;
  readonly state: 'unresolved' | 'pending' | 'refreshing' | 'ready' | 'errored';
}

/** Suspense boundary observation — fallback tree markup + resolved tree
 * markup + timedOut flag. */
export interface SuspenseObservation {
  readonly fallbackMarkup: string;
  readonly resolvedMarkup: string | null;
  readonly timedOut: boolean;
}

/** Trace event — every adapter method appends one entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral Solid-driver contract. 6 ops mirror the AC in Issue #808:
 *
 * 1. `mountCounter` — mount the Counter component + observe the initial value
 * 2. `driveCounter` — dispatch N increments, snapshot the effect trace
 * 3. `mountTodos` — mount TodoList + return the summary snapshot
 * 4. `driveTodos` — add / toggle / batch mark-all, snapshot every re-render
 * 5. `mountResource` — invoke `createResource` fetcher, walk state transitions
 * 6. `driveSuspense` — mount a Suspense boundary + wait for resolution
 */
export interface SolidAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  mountCounter(initial: number): Promise<{
    snapshot: RenderSnapshot;
    effect: EffectSummary;
  }>;

  driveCounter(ticks: number): Promise<{
    snapshot: RenderSnapshot;
    effect: EffectSummary;
  }>;

  mountTodos(titles: readonly string[]): Promise<RenderSnapshot>;

  driveTodos(actions: TodoDriveAction[]): Promise<{
    snapshot: RenderSnapshot;
    effect: EffectSummary;
  }>;

  mountResource(fetcher: () => Promise<{
    id: string;
    displayName: string;
    email: string;
  }>): Promise<{
    transitions: ResourceTransition[];
    finalMarkup: string;
  }>;

  driveSuspense(fetchDelayMs: number): Promise<SuspenseObservation>;

  metrics(): {
    latencySamplesMs: number[];
    counterMountCount: number;
    todosMountCount: number;
    resourceMountCount: number;
    suspenseMountCount: number;
  };

  reset(): Promise<void>;
}

/** Union of actions the driveTodos flow supports. */
export type TodoDriveAction =
  | { readonly kind: 'add'; readonly title: string }
  | { readonly kind: 'toggle'; readonly id: string }
  | { readonly kind: 'markAll'; readonly completed: boolean };
