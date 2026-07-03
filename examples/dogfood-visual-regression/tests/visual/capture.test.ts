import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import type { VisualRegressionAdapter } from '../../src/adapters/interface.js';
import { SCENE_COUNT, SCENE_IDS, SCENE_SPECS } from '../../src/scenes/index.js';
import {
  captureAllScenesNeutral,
  seedAllBaselines,
  VIEWPORTS_PER_SCENE,
} from '../../src/flows/visual-flows.js';

let adapter: VisualRegressionAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-visual-regression — capture axis (multi-viewport neutral)', () => {
  it('T-DFVR-CAP-001 capturing without a prior seed reports every diff status=new', async () => {
    // No `seedBaselines` upfront — every scene's first capture is treated
    // as the baseline itself and returns `status='new'`.
    const outcomes = await captureAllScenesNeutral(adapter);
    expect(outcomes).toHaveLength(SCENE_COUNT);
    for (const o of outcomes) {
      expect(o.diffs).toHaveLength(VIEWPORTS_PER_SCENE);
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport} status`).toBe('new');
        expect(diff.changed, `${o.sceneId}/${diff.viewport} changed`).toBe(false);
      }
    }
  });

  it('T-DFVR-CAP-002 seeded scene neutral re-capture reports status=passed', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesNeutral(adapter);
    for (const o of outcomes) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport} status`).toBe('passed');
        expect(diff.changed).toBe(false);
        expect(diff.pixelDiffRatio).toBe(0);
      }
    }
  });

  it('T-DFVR-CAP-003 captureAll returns 1 outcome per scene, 2 diffs per outcome', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesNeutral(adapter);
    expect(outcomes).toHaveLength(SCENE_COUNT);
    const totalDiffs = outcomes.reduce((sum, o) => sum + o.diffs.length, 0);
    expect(totalDiffs).toBe(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    // 20 diffs total when both viewports fire for every scene.
    expect(totalDiffs).toBe(20);
  });

  it('T-DFVR-CAP-004 captureOne runs both viewports for a single scene', async () => {
    await seedAllBaselines(adapter);
    const spec = SCENE_SPECS['card-light']!;
    const outcome = await adapter.captureOne(spec, spec.seedArgs());
    expect(outcome.diffs).toHaveLength(2);
    const viewports = outcome.diffs.map((d) => d.viewport).sort();
    expect(viewports).toEqual(['desktop', 'mobile']);
  });

  it('T-DFVR-CAP-005 every diff carries the threshold field wired from parameters', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesNeutral(adapter);
    for (const o of outcomes) {
      for (const diff of o.diffs) {
        // Every scene declares diffThreshold=0 in parameters.
        expect(diff.threshold, `${o.sceneId}/${diff.viewport} threshold`).toBe(0);
      }
    }
  });

  it('T-DFVR-CAP-006 capture trace records ok=true for every captureAll invocation', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesNeutral(adapter);
    await captureAllScenesNeutral(adapter);
    const captureTraces = adapter.traces().filter((t) => t.op === 'captureAll');
    expect(captureTraces).toHaveLength(2);
    expect(captureTraces.every((t) => t.ok)).toBe(true);
    expect(captureTraces[0]!.detail!['sceneCount']).toBe(SCENE_COUNT);
  });

  it('T-DFVR-CAP-007 metrics.captureInvocations increments per scene, not per viewport', async () => {
    await seedAllBaselines(adapter);
    const before = adapter.metrics().captureInvocations;
    await captureAllScenesNeutral(adapter);
    const after = adapter.metrics().captureInvocations;
    // 10 scenes → +10 invocations, viewport iteration is inside captureAll
    // of the underlying visual mock and does not double-count invocations.
    expect(after - before).toBe(SCENE_COUNT);
  });

  it('T-DFVR-CAP-008 captureOne returns sceneId matching the input spec', async () => {
    await seedAllBaselines(adapter);
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const outcome = await adapter.captureOne(spec, spec.seedArgs());
      expect(outcome.sceneId).toBe(spec.sceneId);
    }
  });

  it('T-DFVR-CAP-009 currentHash is populated for every diff (viewport hashes captured)', async () => {
    await seedAllBaselines(adapter);
    const outcomes = await captureAllScenesNeutral(adapter);
    for (const o of outcomes) {
      for (const diff of o.diffs) {
        expect(diff.currentHash, `${o.sceneId}/${diff.viewport}`).toMatch(
          /^[0-9a-f]{16}$/,
        );
        expect(diff.baselineHash, `${o.sceneId}/${diff.viewport} baseline`).toBe(
          diff.currentHash,
        );
      }
    }
  });
});
