import { SCENE_IDS, SCENE_SPECS } from '../scenes/index.js';
import type { SceneSpec } from '../scenes/index.js';
import type {
  BaselineSeedOutcome,
  CaptureOutcome,
  ReviewOutcome,
  VisualRegressionAdapter,
} from '../adapters/interface.js';

/**
 * User-facing flow implementations — the "what the app actually does" that
 * both mock and real adapters must satisfy. Each flow drives 1 op across all
 * 10 scenes and returns the per-scene outcome so tests + fidelity harness can
 * assert on the aggregate without re-implementing the adapter contract in-line.
 *
 * The 4 flows exercise the 4 axes named in Issue #766 AC — baseline seed /
 * diff detection on intent change / accept restores baseline / reject leaves
 * it broken. All 4 are invoked in sequence for a full visual-regression
 * round-trip.
 */

/** Ordered list of every scene spec (2 themes × 5 primitives = 10). */
export function allSceneSpecs(): SceneSpec[] {
  return SCENE_IDS.map((id) => {
    const spec = SCENE_SPECS[id];
    if (!spec) {
      throw new Error(
        `visual-flows: SCENE_SPECS is missing id ${id}, registration list drifted from SSOT.`,
      );
    }
    return spec;
  });
}

/** Flow 1 — seed every scene baseline. Callers assert the returned outcomes
 *  cover all 10 scenes and each carries 2 viewports (mobile + desktop). */
export async function seedAllBaselines(
  adapter: VisualRegressionAdapter,
): Promise<BaselineSeedOutcome[]> {
  const specs = allSceneSpecs();
  return adapter.seedBaselines(specs);
}

/** Flow 2 — capture every scene with its neutral `seedArgs`. When the
 *  baseline is already seeded, every diff should carry `status='passed'` and
 *  `changed=false`. */
export async function captureAllScenesNeutral(
  adapter: VisualRegressionAdapter,
): Promise<CaptureOutcome[]> {
  const specs = allSceneSpecs();
  return adapter.captureAll(specs, false);
}

/** Flow 3 — capture every scene with its `changedArgs` (intent change flag).
 *  Every diff should carry `changed=true` and `status='failed'` because the
 *  seeded baseline uses the neutral markup. This is where the mock proves it
 *  detects a real change (the AC "diff 検知 (意図的変更で FAIL)" axis). */
export async function captureAllScenesChanged(
  adapter: VisualRegressionAdapter,
): Promise<CaptureOutcome[]> {
  const specs = allSceneSpecs();
  return adapter.captureAll(specs, true);
}

/** Flow 4 — accept every currently-captured (scene × viewport) so the next
 *  neutral capture reads as `passed` (the AC "accept で PASS" axis). Returns
 *  the accept trace for callers to assert the review history matches. */
export async function acceptAllPendingChanges(
  adapter: VisualRegressionAdapter,
): Promise<ReviewOutcome[]> {
  const specs = allSceneSpecs();
  const outcomes: ReviewOutcome[] = [];
  for (const spec of specs) {
    const viewports = spec.parameters.chromatic?.viewports ?? ['default'];
    for (const viewport of viewports) {
      outcomes.push(
        await adapter.review({
          sceneId: spec.sceneId,
          viewport,
          action: 'accept',
        }),
      );
    }
  }
  return outcomes;
}

/** Bonus flow — reject every currently-captured (scene × viewport). Rejected
 *  scenes retain the original baseline so the next neutral capture stays
 *  `passed` and the next changed capture stays `failed`. Useful to prove the
 *  review workflow branches. */
export async function rejectAllPendingChanges(
  adapter: VisualRegressionAdapter,
): Promise<ReviewOutcome[]> {
  const specs = allSceneSpecs();
  const outcomes: ReviewOutcome[] = [];
  for (const spec of specs) {
    const viewports = spec.parameters.chromatic?.viewports ?? ['default'];
    for (const viewport of viewports) {
      outcomes.push(
        await adapter.review({
          sceneId: spec.sceneId,
          viewport,
          action: 'reject',
        }),
      );
    }
  }
  return outcomes;
}

/** Convenience for the fidelity harness — drives all 4 flows and returns them
 *  as an object. Failures propagate so a mock-side regression cannot silently
 *  pass the release gate. */
export async function runAllScenes(adapter: VisualRegressionAdapter): Promise<{
  seed: BaselineSeedOutcome[];
  neutralCapture: CaptureOutcome[];
  changedCapture: CaptureOutcome[];
  accept: ReviewOutcome[];
  neutralReCapture: CaptureOutcome[];
}> {
  const seed = await seedAllBaselines(adapter);
  const neutralCapture = await captureAllScenesNeutral(adapter);
  const changedCapture = await captureAllScenesChanged(adapter);
  const accept = await acceptAllPendingChanges(adapter);
  // After accept, the new baseline is the changed markup. A neutral re-capture
  // now diverges from that new baseline, so it must be reported as `failed` —
  // the flow returns this last capture so tests can assert the semantics.
  const neutralReCapture = await captureAllScenesNeutral(adapter);
  return { seed, neutralCapture, changedCapture, accept, neutralReCapture };
}

/** Viewport count per scene — the current dogfood uses 2 viewports for every
 *  scene (mobile + desktop) so 10 scenes × 2 viewports = 20 diff samples per
 *  full capture. Exposed for tests to assert without re-reading the specs. */
export const VIEWPORTS_PER_SCENE = 2;
