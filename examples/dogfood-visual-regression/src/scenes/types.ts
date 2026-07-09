import type { MockNode, StoryParameters } from '@kiwa-lab/component';

/**
 * Theme axis — a scene is registered twice, once per theme, so the mock harness
 * exercises the light + dark side-by-side (Chromatic themes addon parity). The
 * theme is passed to the renderer and materialises as a `data-theme` attr on
 * the scene root so the pseudo-HTML hash diverges between the two variants.
 */
export type Theme = 'light' | 'dark';

/**
 * Primitive scene identity. 5 primitives × 2 themes = 10 scenes total, matching
 * the AC in Issue #766 (10 UI scene, light / dark each 5).
 */
export type ScenePrimitive =
  | 'card'
  | 'modal'
  | 'table'
  | 'toast'
  | 'form';

/**
 * Scene args — every scene renderer receives a `theme` field so the mock can
 * hash the light + dark variants distinctly. Optional `intentChange` toggles a
 * scene-specific tweak the diff-on-intent-change test asserts causes a hash
 * mismatch (button label swap / table cell reword / modal header rename).
 */
export interface SceneArgs {
  /** Stable id for the scene (e.g. `card-light`, `modal-dark`). */
  sceneId: string;
  /** Theme to render — the renderer wires the value onto `data-theme` at root. */
  theme: Theme;
  /**
   * Intent-change flag — when true, the renderer swaps a small visible bit
   * (button label / heading text / cell content) so the hash mismatches
   * against the seeded baseline. Used by the diff test.
   */
  intentChange?: boolean;
}

/**
 * Registered scene tuple — pairs the primitive kind with its theme so the
 * flow module can enumerate all 10 scenes in a stable order.
 */
export interface SceneRegistration {
  primitive: ScenePrimitive;
  theme: Theme;
  sceneId: string;
}

/**
 * Renderer contract — every scene primitive exposes `render(args)` that
 * returns a MockNode tree the Chromatic mock can hash. The mock harness is
 * framework-agnostic (`(args) => MockNode`), so React / Vue / Svelte would
 * plug in the same shape.
 */
export type SceneRender = (args: SceneArgs) => MockNode;

/**
 * Per-scene metadata bundled with the renderer. `story` is the (mock) Storybook
 * entry the Chromatic capture consumes — it carries the parameters (viewports /
 * diffThreshold) that steer the mock's diff behaviour.
 */
export interface SceneSpec {
  primitive: ScenePrimitive;
  theme: Theme;
  sceneId: string;
  render: SceneRender;
  parameters: StoryParameters;
  /**
   * Neutral args for baseline seed — the seed test snapshots this variant so
   * every subsequent capture measures against a known-good pseudo-HTML.
   */
  seedArgs: () => SceneArgs;
  /**
   * Intent-changed args — flips `intentChange=true` so the renderer swaps
   * a small visible bit and the hash mismatches vs the seeded baseline.
   */
  changedArgs: () => SceneArgs;
}
