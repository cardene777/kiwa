/**
 * Provider-neutral story adapter contract for the design-system dogfood.
 *
 * The app talks to Storybook 8 only through this interface. Two implementations
 * exist — {@link makeRealAdapter} (drives a real `@storybook/react` preview via
 * `STORYBOOK_URL` env, else returns a `skipped` adapter whose every method
 * records a `STORYBOOK_REAL_ENV_MISSING` trace) and {@link makeMockAdapter}
 * (backed by `@kiwa/component` `createStoryRegistry`). Both satisfy the
 * same contract so behavioural fidelity between real vs mock can be measured
 * side-by-side and fed to `@kiwa/quality-metrics` 7-axis release gate.
 *
 * The 5 ops this contract supports mirror the AC in Issue #764 — story
 * registration, args resolution, mount, play function trace, a11y check.
 */

import type {
  A11yViolation,
  StoryMeta,
} from '@kiwa/component';

/** Registered story identifier (Storybook 8 SB URL param compatible). */
export interface StoryDescriptor {
  id: string;
  title: string;
  storyName: string;
  args: Record<string, unknown>;
  hasPlay: boolean;
}

/** Resolved-args snapshot after meta + story merge. */
export interface ResolvedArgs {
  storyId: string;
  args: Record<string, unknown>;
}

/** Mount + markup capture — used by story rendering / Chromatic hashing. */
export interface StoryMountSnapshot {
  storyId: string;
  markup: string;
  hash: string;
}

/** Play function trace step — 1 per `step()` call inside the play function. */
export interface PlayTraceStep {
  label: string;
  ok: boolean;
  error?: string | undefined;
}

/** Full play run report — combines steps + terminal state + assertion outcome. */
export interface PlayRunReport {
  storyId: string;
  steps: PlayTraceStep[];
  ok: boolean;
  handlersInvoked: number;
}

/** A11y run report — combines heuristic + injected violations. */
export interface A11yReport {
  storyId: string;
  violations: A11yViolation[];
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (fidelity harness input).
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral story-driver contract. Every method emits at least one
 * trace event so the fidelity harness has a shape to diff.
 */
export interface StorybookAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Bulk-register all 12 primitive metas into the registry. Real mode caches
   * the story loader on first call; mock mode instantiates a fresh
   * `createStoryRegistry` per adapter.
   */
  registerAll(metas: ReadonlyArray<StoryMeta<Record<string, unknown>>>): Promise<StoryDescriptor[]>;

  /**
   * List every registered story descriptor. Used by tests to assert story
   * counts match `countStories()` from `components/stories.ts`.
   */
  listStories(): Promise<StoryDescriptor[]>;

  /**
   * Resolve args for 1 story — the meta.args + story.args merge is a
   * Storybook 8 semantic invariant. Real mode fetches the resolved args via
   * the preview channel; mock mode reads from the in-memory entry.
   */
  resolveArgs(title: string, storyName: string): Promise<ResolvedArgs>;

  /**
   * Mount 1 story and return a markup snapshot. Real mode captures the
   * rendered DOM via the preview iframe; mock mode returns the deterministic
   * pseudo-HTML representation.
   */
  mount(
    title: string,
    storyName: string,
    overrideArgs?: Record<string, unknown>,
  ): Promise<StoryMountSnapshot>;

  /**
   * Run the play function for 1 story and record each `step` invocation.
   * Stories without a play function return `{ steps: [], ok: true }` and are
   * recorded as a `play-skip` trace.
   */
  play(title: string, storyName: string): Promise<PlayRunReport>;

  /**
   * Run the a11y checker for 1 story. Real mode calls the Storybook a11y
   * addon (axe-core); mock mode calls the heuristic checker inside
   * `@kiwa/component` + returns any injected violations.
   */
  runA11y(title: string, storyName: string): Promise<A11yReport>;

  /** Rolling metric aggregate seen since construction / last reset. */
  metrics(): {
    latencySamplesMs: number[];
    playInvocations: number;
    a11yInvocations: number;
    mountInvocations: number;
    handlersInvoked: number;
  };

  reset(): Promise<void>;
}
