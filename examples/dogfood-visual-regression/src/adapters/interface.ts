import type { VisualDiff, VisualReviewEntry } from '@kiwa/component';
import type { SceneSpec } from '../scenes/index.js';

/**
 * Provider-neutral Chromatic-style visual-regression adapter for the 10-scene
 * dogfood. The app talks to Chromatic only through this interface. Two
 * implementations exist —
 *
 * - `makeMockAdapter` (backed by `@kiwa/component` `createChromaticVisualMock`
 *   + `hashMarkup`) — pseudo-HTML → SHA-256 hex substring → hash diff. No
 *   browser, no image bitmap.
 * - `makeRealAdapter` (drives `chromatic-cli` when `CHROMATIC_PROJECT_TOKEN`
 *   is set, else returns a `skipped` variant whose every method records a
 *   `CHROMATIC_REAL_ENV_MISSING` trace)
 *
 * Both satisfy the same contract so behavioural fidelity between real vs
 * mock can be measured side-by-side and fed to `@kiwa/quality-metrics`
 * 7-axis release gate. Ops match the AC in Issue #766 — baseline seed +
 * capture (multi-viewport) + diff detection on intent change + accept /
 * reject review workflow, generalised across the 10 scenes.
 *
 * The **fidelity surface** is 3 ops — `seedBaselines`, `captureAll`, `review`.
 * `captureOne` is an ergonomic single-scene wrapper the tests use to set up
 * per-scene fixtures; the fidelity harness's `opsUnderTest` list intentionally
 * omits it so the fidelity ratio measures the flow surface, not the ad-hoc
 * setup surface.
 */

/**
 * Baseline seed outcome — reported by `seedBaselines`. `seededCount` counts
 * every (scene, viewport) tuple written; the flow test asserts this equals
 * `SCENE_COUNT * viewportCount` when every scene declares 2 viewports.
 */
export interface BaselineSeedOutcome {
  sceneId: string;
  viewports: string[];
  hashes: Record<string, string>;
}

/** Return shape of `captureAll`. */
export interface CaptureOutcome {
  sceneId: string;
  diffs: VisualDiff[];
}

/** Return shape of `review`. */
export interface ReviewOutcome {
  sceneId: string;
  viewport: string;
  entry: VisualReviewEntry;
}

/** Trace event — every adapter method appends one entry to a shared trace
 *  buffer. Downstream tests diff the trace across the two adapters to detect
 *  behavioural divergences (fidelity harness input). */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface VisualRegressionAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Seed baselines for every (scene × viewport) tuple using the scene's
   * `seedArgs()`. Idempotent — repeat calls overwrite the recorded hash but
   * still record 1 trace event per seed.
   */
  seedBaselines(specs: SceneSpec[]): Promise<BaselineSeedOutcome[]>;

  /**
   * Capture a single scene against every viewport declared in its
   * `parameters.chromatic.viewports`. Returns 1 `VisualDiff` per viewport.
   * If a baseline is missing the mock reports `status='new'`; the real
   * driver would upload the current capture as the seed.
   */
  captureOne(
    spec: SceneSpec,
    args: ReturnType<SceneSpec['seedArgs']>,
  ): Promise<CaptureOutcome>;

  /**
   * Capture every scene in the input list against every viewport declared
   * for the scene. Used by the flow module to run the full 10-scene sweep.
   */
  captureAll(specs: SceneSpec[], useIntentChange: boolean): Promise<CaptureOutcome[]>;

  /**
   * Accept or reject a (scene, viewport) diff. Accept swaps the baseline for
   * the currently captured hash; reject records the review without touching
   * the baseline so a second capture would still fail.
   */
  review(input: {
    sceneId: string;
    viewport: string;
    action: 'accept' | 'reject';
  }): Promise<ReviewOutcome>;

  /**
   * Read the full review history — used by tests to assert accept / reject
   * are recorded in order.
   */
  reviewHistory(): VisualReviewEntry[];

  metrics(): {
    latencySamplesMs: number[];
    seedInvocations: number;
    captureInvocations: number;
    reviewInvocations: number;
  };

  reset(): Promise<void>;
}
