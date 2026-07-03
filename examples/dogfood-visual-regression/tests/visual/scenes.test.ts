import { describe, expect, it } from 'vitest';
import {
  SCENE_COUNT,
  SCENE_IDS,
  SCENE_REGISTRATIONS,
  SCENE_SPECS,
} from '../../src/scenes/index.js';
import type { SceneRegistration } from '../../src/scenes/index.js';

/**
 * Static registry contract — proves the SSOT (5 primitives × 2 themes = 10)
 * and every scene entry carries the parameters the mock relies on
 * (viewports + diffThreshold).
 */
describe('dogfood-visual-regression — scene registry contract', () => {
  it('T-DFVR-SCN-001 registration list has exactly 10 entries', () => {
    expect(SCENE_REGISTRATIONS).toHaveLength(10);
    expect(SCENE_COUNT).toBe(10);
    expect(SCENE_IDS).toHaveLength(10);
  });

  it('T-DFVR-SCN-002 every registration follows `{primitive}-{theme}` naming', () => {
    for (const r of SCENE_REGISTRATIONS) {
      expect(r.sceneId).toBe(`${r.primitive}-${r.theme}`);
    }
  });

  it('T-DFVR-SCN-003 registry covers every (primitive, theme) tuple exactly once', () => {
    const seen = new Set<string>();
    for (const r of SCENE_REGISTRATIONS) {
      const key = `${r.primitive}::${r.theme}`;
      expect(seen.has(key), `duplicate registration ${key}`).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(10);
  });

  it('T-DFVR-SCN-004 every scene spec declares mobile + desktop viewports', () => {
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const viewports = spec.parameters.chromatic?.viewports;
      expect(viewports, `${id} viewports`).toEqual(['mobile', 'desktop']);
    }
  });

  it('T-DFVR-SCN-005 every scene spec declares diffThreshold=0 for hash-exact matching', () => {
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      expect(spec.parameters.chromatic?.diffThreshold, `${id} diffThreshold`).toBe(0);
    }
  });

  it('T-DFVR-SCN-006 seedArgs echoes the sceneId + theme back untouched', () => {
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const args = spec.seedArgs();
      expect(args.sceneId).toBe(spec.sceneId);
      expect(args.theme).toBe(spec.theme);
      expect(args.intentChange).toBeUndefined();
    }
  });

  it('T-DFVR-SCN-007 changedArgs sets intentChange=true and preserves sceneId + theme', () => {
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const args = spec.changedArgs();
      expect(args.sceneId).toBe(spec.sceneId);
      expect(args.theme).toBe(spec.theme);
      expect(args.intentChange).toBe(true);
    }
  });

  it('T-DFVR-SCN-008 every renderer returns a MockNode with a data-theme attr matching the theme', () => {
    for (const id of SCENE_IDS) {
      const spec = SCENE_SPECS[id]!;
      const root = spec.render(spec.seedArgs());
      expect(root.attrs['data-theme'], `${id} data-theme`).toBe(spec.theme);
      expect(root.attrs['data-scene']).toBe(spec.sceneId);
    }
  });

  it('T-DFVR-SCN-009 registered primitives cover the 5 required kinds', () => {
    const primitives = new Set(SCENE_REGISTRATIONS.map((r: SceneRegistration) => r.primitive));
    expect([...primitives].sort()).toEqual([
      'card',
      'form',
      'modal',
      'table',
      'toast',
    ]);
  });

  it('T-DFVR-SCN-010 registered themes cover the 5 primitives twice each (light + dark)', () => {
    const themesByPrimitive = new Map<string, string[]>();
    for (const r of SCENE_REGISTRATIONS) {
      const themes = themesByPrimitive.get(r.primitive) ?? [];
      themes.push(r.theme);
      themesByPrimitive.set(r.primitive, themes);
    }
    for (const [primitive, themes] of themesByPrimitive) {
      expect([...themes].sort(), `${primitive} themes`).toEqual(['dark', 'light']);
    }
  });
});
