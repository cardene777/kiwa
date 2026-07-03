import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { VisualRegressionAdapter } from '../src/adapters/interface.js';
import {
  runAllScenes,
  VIEWPORTS_PER_SCENE,
} from '../src/flows/visual-flows.js';
import { SCENE_COUNT } from '../src/scenes/index.js';

let adapter: VisualRegressionAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

/**
 * End-to-end trace coherence — the full round trip (seed → neutral capture
 * → changed capture → accept → neutral re-capture) must satisfy the state
 * transitions required by a real Chromatic review workflow.
 */
describe('dogfood-visual-regression — e2e mock-mode full round trip', () => {
  it('T-DFVR-E2E-001 runAllScenes returns 5 buckets covering the 4 AC axes + rerun', async () => {
    const result = await runAllScenes(adapter);
    expect(result.seed).toHaveLength(SCENE_COUNT);
    expect(result.neutralCapture).toHaveLength(SCENE_COUNT);
    expect(result.changedCapture).toHaveLength(SCENE_COUNT);
    expect(result.accept).toHaveLength(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    expect(result.neutralReCapture).toHaveLength(SCENE_COUNT);
  });

  it('T-DFVR-E2E-002 neutral capture after seed reports all diffs passed', async () => {
    const result = await runAllScenes(adapter);
    for (const o of result.neutralCapture) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('passed');
      }
    }
  });

  it('T-DFVR-E2E-003 changed capture reports every diff failed', async () => {
    const result = await runAllScenes(adapter);
    for (const o of result.changedCapture) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('failed');
      }
    }
  });

  it('T-DFVR-E2E-004 accept swaps baseline: neutral re-capture reports every diff failed', async () => {
    const result = await runAllScenes(adapter);
    // After accept the accepted (changed) markup is the new baseline, so the
    // neutral args (original seed markup) now diverge and produce `failed`
    // diffs on every scene.
    for (const o of result.neutralReCapture) {
      for (const diff of o.diffs) {
        expect(diff.status, `${o.sceneId}/${diff.viewport}`).toBe('failed');
      }
    }
  });

  it('T-DFVR-E2E-005 trace contains the 4 ops in ordered sequence per scene', async () => {
    await runAllScenes(adapter);
    const trace = adapter.traces();
    const opSequence = trace.map((t) => t.op);
    // Expected top-level flow: seedBaselines, captureAll (neutral), captureAll
    // (changed), review × (SCENE_COUNT × VIEWPORTS_PER_SCENE), captureAll
    // (neutral re-capture).
    expect(opSequence[0]).toBe('seedBaselines');
    expect(opSequence[1]).toBe('captureAll');
    expect(opSequence[2]).toBe('captureAll');
    const reviewCount = opSequence.filter((op) => op === 'review').length;
    expect(reviewCount).toBe(SCENE_COUNT * VIEWPORTS_PER_SCENE);
    expect(opSequence[opSequence.length - 1]).toBe('captureAll');
  });

  it('T-DFVR-E2E-006 latency samples span every op boundary', async () => {
    await runAllScenes(adapter);
    const samples = adapter.metrics().latencySamplesMs;
    // 1 seed + 3 captureAll + 20 review = 24 timed calls minimum.
    expect(samples.length).toBeGreaterThanOrEqual(24);
    // Every sample must be >= 0 (defensive against clock skew).
    for (const s of samples) {
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });

  it('T-DFVR-E2E-007 metrics.reviewInvocations matches the accept branch fan-out', async () => {
    const result = await runAllScenes(adapter);
    expect(adapter.metrics().reviewInvocations).toBe(result.accept.length);
  });
});
