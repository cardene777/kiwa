import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import type { VisualRegressionAdapter } from '../../src/adapters/interface.js';
import { SCENE_COUNT, SCENE_IDS, SCENE_SPECS } from '../../src/scenes/index.js';
import {
  captureAllScenesChanged,
  captureAllScenesNeutral,
  seedAllBaselines,
} from '../../src/flows/visual-flows.js';

let adapter: VisualRegressionAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

/**
 * Covers the AC "diff 検知 (意図的変更で FAIL)" axis — after seeding neutral
 * baselines the intent-changed capture must fail every scene / viewport diff.
 */
describe('dogfood-visual-regression — diff detect axis (intent change → FAIL)', () => {
  it('T-DFVR-DIF-001 changed capture reports every diff status=failed', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesChanged(adapter);
    expect(outcomes).toHaveLength(SCENE_COUNT);
    for (const o of outcomes) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('failed');
        expect(diff.changed).toBe(true);
        expect(diff.pixelDiffRatio).toBe(1);
      }
    }
  });

  it('T-DFVR-DIF-002 each failed diff pins baselineHash to the seeded snapshot', async () => {
    const seed = await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesChanged(adapter);
    // Every changed diff must reference the seeded baseline hash, not the
    // freshly captured one.
    for (const o of outcomes) {
      const seededOutcome = seed.find((s) => s.sceneId === o.sceneId)!;
      for (const diff of o.diffs) {
        expect(diff.baselineHash).toBe(seededOutcome.hashes[diff.viewport]);
        // The current hash must differ from the baseline (the whole point of
        // the intent change is that the hash changes).
        expect(diff.currentHash).not.toBe(diff.baselineHash);
      }
    }
  });

  it('T-DFVR-DIF-003 intent change flips at least 1 attr the renderer wired', async () => {
    await seedAllBaselines(adapter);
    // Capture 1 scene without the intent change and 1 with — the resulting
    // hashes must differ for every viewport.
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      // Neutral capture first — becomes the baseline for the mock (was
      // already seeded by seedAllBaselines).
      const neutral = await adapter.captureOne(spec, spec.seedArgs());
      const changed = await adapter.captureOne(spec, spec.changedArgs());
      // Neutral capture must confirm passed; changed must fail every viewport.
      for (const d of neutral.diffs) {
        expect(d.status, `${id}/${d.viewport} neutral status`).toBe('passed');
      }
      for (const d of changed.diffs) {
        expect(d.status, `${id}/${d.viewport} changed status`).toBe('failed');
      }
    }
  });

  it('T-DFVR-DIF-004 changed capture trace records the failed count as sceneCount × viewports', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    const trace = adapter
      .traces()
      .filter((t) => t.op === 'captureAll' && t.detail?.['intentChange'] === true);
    expect(trace).toHaveLength(1);
    // 10 scenes × 2 viewports = 20 failed diffs.
    expect(trace[0]!.detail!['failedDiffCount']).toBe(20);
  });

  it('T-DFVR-DIF-005 a neutral re-capture after a failed changed capture still passes', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    // The failed capture must not corrupt the baseline — re-running neutral
    // still passes (the baseline is only mutated by an `accept` review).
    const reCapture = await captureAllScenesNeutral(adapter);
    for (const o of reCapture) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('passed');
      }
    }
  });

  it('T-DFVR-DIF-006 first neutral capture (no seed) reads new; subsequent changed reads failed', async () => {
    // Alternative branch — never call seedBaselines, but the first captureOne
    // implicitly seeds the baseline. A follow-up changed capture must still
    // fail.
    const spec = SCENE_SPECS['card-light']!;
    const first = await adapter.captureOne(spec, spec.seedArgs());
    for (const d of first.diffs) {
      expect(d.status, `card-light/${d.viewport} first status`).toBe('new');
    }
    const changed = await adapter.captureOne(spec, spec.changedArgs());
    for (const d of changed.diffs) {
      expect(d.status, `card-light/${d.viewport} changed status`).toBe('failed');
    }
  });

  it('T-DFVR-DIF-007 both viewports independently report the intent change', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesChanged(adapter);
    // For every scene both mobile and desktop diffs must be failed — the
    // renderer's intent change is content-level, not viewport-scoped, so
    // both must diverge.
    for (const o of outcomes) {
      const failedViewports = new Set(
        o.diffs.filter((d) => d.status === 'failed').map((d) => d.viewport),
      );
      expect(failedViewports.size).toBe(2);
      expect(failedViewports.has('mobile')).toBe(true);
      expect(failedViewports.has('desktop')).toBe(true);
    }
  });
});
