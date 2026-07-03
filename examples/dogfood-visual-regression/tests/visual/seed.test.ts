import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import type { VisualRegressionAdapter } from '../../src/adapters/interface.js';
import { SCENE_COUNT, SCENE_IDS, SCENE_SPECS } from '../../src/scenes/index.js';
import {
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

describe('dogfood-visual-regression — baseline seed axis', () => {
  it('T-DFVR-SEED-001 seedAllBaselines returns 10 outcomes (5 primitives × 2 themes)', async () => {
    const outcomes = await seedAllBaselines(adapter);
    expect(outcomes).toHaveLength(SCENE_COUNT);
    expect(outcomes).toHaveLength(10);
  });

  it('T-DFVR-SEED-002 every outcome carries the mobile + desktop viewport pair', async () => {
    const outcomes = await seedAllBaselines(adapter);
    for (const o of outcomes) {
      expect(o.viewports, `${o.sceneId} viewports`).toEqual([
        'mobile',
        'desktop',
      ]);
      expect(Object.keys(o.hashes).sort()).toEqual(['desktop', 'mobile']);
    }
  });

  it('T-DFVR-SEED-003 every seeded hash is non-empty and 16 hex chars', async () => {
    const outcomes = await seedAllBaselines(adapter);
    for (const o of outcomes) {
      for (const [viewport, hash] of Object.entries(o.hashes)) {
        expect(hash, `${o.sceneId}/${viewport} hash length`).toHaveLength(16);
        expect(hash, `${o.sceneId}/${viewport} hex chars`).toMatch(/^[0-9a-f]{16}$/);
      }
    }
  });

  it('T-DFVR-SEED-004 light and dark themes hash distinctly for the same primitive', async () => {
    await seedAllBaselines(adapter);
    // For every primitive assert the light and dark hashes differ (the
    // data-theme attr flows into the rendered markup so the hash must
    // diverge).
    const primitives = new Set(SCENE_IDS.map((id) => id.split('-')[0]!));
    for (const primitive of primitives) {
      const lightSpec = SCENE_SPECS[`${primitive}-light`]!;
      const darkSpec = SCENE_SPECS[`${primitive}-dark`]!;
      const lightCapture = await adapter.captureOne(
        lightSpec,
        lightSpec.seedArgs(),
      );
      const darkCapture = await adapter.captureOne(
        darkSpec,
        darkSpec.seedArgs(),
      );
      // The captured hashes must differ between light + dark for the same
      // primitive (both viewports).
      for (let i = 0; i < lightCapture.diffs.length; i += 1) {
        const lightHash = lightCapture.diffs[i]!.currentHash;
        const darkHash = darkCapture.diffs[i]!.currentHash;
        expect(lightHash, `${primitive} light hash defined`).not.toBe('');
        expect(darkHash, `${primitive} dark hash defined`).not.toBe('');
        expect(
          lightHash,
          `${primitive} light vs dark hash must differ (viewport index ${i})`,
        ).not.toBe(darkHash);
      }
    }
  });

  it('T-DFVR-SEED-005 seed trace records ok=true once with the correct pair count', async () => {
    await seedAllBaselines(adapter);
    const seedTraces = adapter.traces().filter((t) => t.op === 'seedBaselines');
    expect(seedTraces).toHaveLength(1);
    expect(seedTraces[0]!.ok).toBe(true);
    expect(seedTraces[0]!.detail!['sceneCount']).toBe(SCENE_COUNT);
    expect(seedTraces[0]!.detail!['seededPairs']).toBe(
      SCENE_COUNT * VIEWPORTS_PER_SCENE,
    );
  });

  it('T-DFVR-SEED-006 metrics.seedInvocations counts every (scene × viewport) pair', async () => {
    await seedAllBaselines(adapter);
    expect(adapter.metrics().seedInvocations).toBe(
      SCENE_COUNT * VIEWPORTS_PER_SCENE,
    );
  });

  it('T-DFVR-SEED-007 seeding twice overwrites the baseline hash idempotently', async () => {
    const first = await seedAllBaselines(adapter);
    const second = await seedAllBaselines(adapter);
    // Same input args produce the same hash — re-seeding must not change it.
    for (let i = 0; i < first.length; i += 1) {
      expect(second[i]!.hashes).toEqual(first[i]!.hashes);
    }
  });

  it('T-DFVR-SEED-008 seeded baselines survive across capture round trips', async () => {
    await seedAllBaselines(adapter);
    // Capture every scene with neutral args — every diff must read `passed`
    // because the baseline is exactly the seeded markup.
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const outcome = await adapter.captureOne(spec, spec.seedArgs());
      for (const diff of outcome.diffs) {
        expect(diff.status, `${id}/${diff.viewport} status`).toBe('passed');
        expect(diff.changed, `${id}/${diff.viewport} changed`).toBe(false);
      }
    }
  });
});
