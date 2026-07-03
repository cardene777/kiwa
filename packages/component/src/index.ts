/**
 * `@kiwa-test/component` v0.1 — 3 integration 統一 mock harness (Storybook 8 +
 * Playwright Component Testing + Chromatic)。 v1.16 milestone (Issue #762,
 * sub #763) で新設、 SaaS frontend の component test 層を 1 API で扱う。
 *
 * 3 integration の統合思想 ...
 * - Storybook 8 = story registration + args resolution + play function runner
 * - Playwright CT = mount + interact (real-DOM 相当の click / fill)
 * - Chromatic = baseline / diff / accept workflow
 *
 * 全て framework agnostic (React / Vue / Svelte / Solid のどれで書いても
 * ComponentRender = (args) => MockNode に統一)。
 */

// ---- types ----
export type {
  A11yViolation,
  CanvasElement,
  ComponentLocator,
  ComponentProvider,
  ComponentRender,
  MockEvent,
  MockNode,
  NodeLocator,
  PlayContext,
  StoryEntry,
  StoryObj,
  StoryParameters,
  VisualBaseline,
  VisualDiff,
  VisualReviewAction,
  VisualReviewEntry,
} from './types.js';

// ---- DOM primitives (framework agnostic) ----
export {
  addHandler,
  appendChild,
  createCanvas,
  createNode,
  fireEvent,
  findByRole,
  findByText,
  hashMarkup,
  query,
  renderMarkup,
} from './dom.js';
export type { NodeOptions } from './dom.js';

// ---- Storybook 8 mock ----
export { createStoryRegistry } from './storybook.js';
export type {
  StoryMeta,
  StoryMountResult,
  StoryPlayResult,
  StoryRegistry,
} from './storybook.js';

// ---- Playwright Component Testing mock ----
export { createPlaywrightCTMock } from './playwright-ct.js';
export type { PlaywrightCTMock } from './playwright-ct.js';

// ---- Chromatic visual regression mock ----
export { createChromaticVisualMock } from './chromatic.js';
export type { ChromaticConfig, ChromaticVisualMock } from './chromatic.js';

// ---- 5 component fixtures ----
export {
  buildButton,
  buildCard,
  buildForm,
  buildInput,
  buildModal,
  componentFixtures,
} from './fixture.js';
export type {
  ButtonArgs,
  CardArgs,
  FormArgs,
  FormField,
  InputArgs,
  ModalArgs,
} from './fixture.js';
