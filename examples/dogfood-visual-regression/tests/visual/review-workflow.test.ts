import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import type { VisualRegressionAdapter } from '../../src/adapters/interface.js';
import { SCENE_COUNT, SCENE_IDS, SCENE_SPECS } from '../../src/scenes/index.js';
import {
  acceptAllPendingChanges,
  captureAllScenesChanged,
  captureAllScenesNeutral,
  rejectAllPendingChanges,
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

/**
 * Covers the AC "accept で PASS" axis + the reject branch of the workflow.
 * The mock's `review` op mutates the baseline on accept and leaves it intact
 * on reject; these tests assert the mutation semantics match a real Chromatic
 * review workflow.
 */
describe('dogfood-visual-regression — accept branch (accept → baseline swaps)', () => {
  it('T-DFVR-REV-001 accepting after a changed capture makes the changed markup the new baseline', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    const accepts = await acceptAllPendingChanges(adapter);
    // 10 scenes × 2 viewports = 20 accept outcomes.
    expect(accepts).toHaveLength(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    // A re-capture of the *changed* args now passes (new baseline is the
    // changed markup).
    const rerunChanged = await captureAllScenesChanged(adapter);
    for (const o of rerunChanged) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport} rerun`).toBe('passed');
      }
    }
    // A capture of the *neutral* (original seed) args now fails because it
    // diverges from the new (accepted) baseline.
    const rerunNeutral = await captureAllScenesNeutral(adapter);
    for (const o of rerunNeutral) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport} rerun`).toBe('failed');
      }
    }
  });

  it('T-DFVR-REV-002 accept trace records ok=true with action=accept', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    await acceptAllPendingChanges(adapter);
    const reviewTraces = adapter.traces().filter((t) => t.op === 'review');
    expect(reviewTraces).toHaveLength(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    for (const t of reviewTraces) {
      expect(t.ok).toBe(true);
      expect(t.detail!['action']).toBe('accept');
    }
  });

  it('T-DFVR-REV-003 review history reads every accept entry in call order', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    const outcomes = await acceptAllPendingChanges(adapter);
    const history = adapter.reviewHistory();
    expect(history).toHaveLength(outcomes.length);
    // Every entry must be an accept.
    expect(history.every((h) => h.action === 'accept')).toBe(true);
    // Order must be stable across scene ids + viewport pairs. The underlying
    // VisualReviewEntry uses `storyId` (the mock harness's key) which the
    // adapter passes through unchanged, so it equals the scene id the flow
    // supplied.
    for (let i = 0; i < outcomes.length; i += 1) {
      expect(history[i]!.storyId).toBe(outcomes[i]!.sceneId);
      expect(history[i]!.viewport).toBe(outcomes[i]!.viewport);
    }
  });

  it('T-DFVR-REV-004 metrics.reviewInvocations counts every accept call', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    await acceptAllPendingChanges(adapter);
    expect(adapter.metrics().reviewInvocations).toBe(
      SCENE_COUNT * VIEWPORTS_PER_SCENE,
    );
  });

  it('T-DFVR-REV-005 accept without a prior current capture throws', async () => {
    // reject without a prior capture is legal (mock allows it), but accept
    // must throw because there is no current markup to swap into.
    await expect(
      adapter.review({
        sceneId: 'card-light',
        viewport: 'mobile',
        action: 'accept',
      }),
    ).rejects.toThrowError(/no current capture found/);
  });
});

describe('dogfood-visual-regression — reject branch (reject leaves baseline intact)', () => {
  it('T-DFVR-REV-006 rejecting after a changed capture keeps the original baseline', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    const rejects = await rejectAllPendingChanges(adapter);
    expect(rejects).toHaveLength(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    // A re-capture of the *changed* args still fails (the baseline is still
    // the seeded, neutral markup).
    const rerunChanged = await captureAllScenesChanged(adapter);
    for (const o of rerunChanged) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('failed');
      }
    }
    // A re-capture of the neutral args passes (baseline unchanged).
    const rerunNeutral = await captureAllScenesNeutral(adapter);
    for (const o of rerunNeutral) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('passed');
      }
    }
  });

  it('T-DFVR-REV-007 reject trace records action=reject and does not mutate the baseline', async () => {
    await seedAllBaselines(adapter);
    await captureAllScenesChanged(adapter);
    await rejectAllPendingChanges(adapter);
    const reviewTraces = adapter.traces().filter((t) => t.op === 'review');
    expect(reviewTraces).toHaveLength(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    for (const t of reviewTraces) {
      expect(t.detail!['action']).toBe('reject');
    }
  });

  it('T-DFVR-REV-008 review history distinguishes accept and reject in order', async () => {
    await seedAllBaselines(adapter);
    // Alternating accept + reject + accept on 1 scene / viewport 3 times.
    const spec = SCENE_SPECS['card-light']!;
    await adapter.captureOne(spec, spec.changedArgs());
    await adapter.review({
      sceneId: spec.sceneId,
      viewport: 'mobile',
      action: 'accept',
    });
    await adapter.captureOne(spec, spec.seedArgs());
    await adapter.review({
      sceneId: spec.sceneId,
      viewport: 'mobile',
      action: 'reject',
    });
    await adapter.captureOne(spec, spec.changedArgs());
    await adapter.review({
      sceneId: spec.sceneId,
      viewport: 'mobile',
      action: 'accept',
    });
    const history = adapter.reviewHistory();
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.action)).toEqual(['accept', 'reject', 'accept']);
  });

  it('T-DFVR-REV-009 selectively accepting only 1 viewport leaves the other with the original baseline', async () => {
    await seedAllBaselines(adapter);
    // Capture 1 scene as changed → accept only the mobile viewport.
    const spec = SCENE_SPECS['modal-light']!;
    await adapter.captureOne(spec, spec.changedArgs());
    await adapter.review({
      sceneId: spec.sceneId,
      viewport: 'mobile',
      action: 'accept',
    });
    // Rerun neutral — mobile must now fail (new baseline is changed),
    // desktop must still pass (baseline unchanged).
    const rerunNeutral = await adapter.captureOne(spec, spec.seedArgs());
    const mobile = rerunNeutral.diffs.find((d) => d.viewport === 'mobile')!;
    const desktop = rerunNeutral.diffs.find((d) => d.viewport === 'desktop')!;
    expect(mobile.status).toBe('failed');
    expect(desktop.status).toBe('passed');
  });
});

describe('dogfood-visual-regression — review workflow invariants', () => {
  it('T-DFVR-REV-010 every scene id in SCENE_IDS is targetable by review', async () => {
    await seedAllBaselines(adapter);
    // Trigger a captureAll so every scene has a current entry, then accept
    // every (scene × viewport) — this asserts SCENE_IDS is complete and every
    // id survives round-trip through the review op.
    await captureAllScenesChanged(adapter);
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const viewports = spec.parameters.chromatic?.viewports ?? ['default'];
      for (const viewport of viewports) {
        const outcome = await adapter.review({
          sceneId: id,
          viewport,
          action: 'accept',
        });
        expect(outcome.sceneId).toBe(id);
        expect(outcome.viewport).toBe(viewport);
      }
    }
  });
});
