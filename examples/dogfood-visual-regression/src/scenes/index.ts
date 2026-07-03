import {
  renderCard,
  renderForm,
  renderModal,
  renderTable,
  renderToast,
} from './primitives.js';
import type {
  ScenePrimitive,
  SceneRegistration,
  SceneSpec,
  Theme,
} from './types.js';

/**
 * Canonical scene registry — 5 primitives × 2 themes = 10 scene entries. The
 * flow module iterates this array so the count stays wired into the SSOT (any
 * follow-up scene addition just extends this list; the flow, tests, and report
 * all read from it).
 */

const PRIMITIVES: readonly ScenePrimitive[] = [
  'card',
  'modal',
  'table',
  'toast',
  'form',
] as const;

const THEMES: readonly Theme[] = ['light', 'dark'] as const;

/** Every registered (primitive, theme, sceneId). */
export const SCENE_REGISTRATIONS: readonly SceneRegistration[] = PRIMITIVES.flatMap(
  (primitive) =>
    THEMES.map<SceneRegistration>((theme) => ({
      primitive,
      theme,
      sceneId: `${primitive}-${theme}`,
    })),
);

/** Expected scene count — asserted in tests to keep the SSOT wired. */
export const SCENE_COUNT = SCENE_REGISTRATIONS.length;

/**
 * Per-primitive renderer lookup. Both themes share the same render function —
 * the theme axis flows through `SceneArgs.theme` and materialises as a
 * `data-theme` attr at the scene root.
 */
const RENDERERS = {
  card: renderCard,
  modal: renderModal,
  table: renderTable,
  toast: renderToast,
  form: renderForm,
} as const;

/**
 * Bundle every scene registration into a spec — carries the renderer and 2
 * arg factories (`seedArgs` for baseline seed, `changedArgs` for intent-change
 * diff). Parameters wire the chromatic viewport list so the mock exercises the
 * multi-viewport code path (mobile + desktop) exactly like a real capture.
 */
export const SCENE_SPECS: Record<string, SceneSpec> = Object.fromEntries(
  SCENE_REGISTRATIONS.map<[string, SceneSpec]>((registration) => {
    const { primitive, theme, sceneId } = registration;
    const render = RENDERERS[primitive];
    const spec: SceneSpec = {
      primitive,
      theme,
      sceneId,
      render,
      parameters: {
        chromatic: {
          viewports: ['mobile', 'desktop'],
          diffThreshold: 0,
        },
      },
      seedArgs: () => ({ sceneId, theme }),
      changedArgs: () => ({ sceneId, theme, intentChange: true }),
    };
    return [sceneId, spec];
  }),
);

/** Scene id list — stable order used by tests + fidelity report. */
export const SCENE_IDS: readonly string[] = SCENE_REGISTRATIONS.map(
  (r) => r.sceneId,
);

export type { SceneArgs, SceneRegistration, SceneSpec, Theme } from './types.js';
