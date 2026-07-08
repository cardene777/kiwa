export {
  providerEventName,
  type AxisStep,
  type ComponentAxis,
  type ComponentTarget,
  type NeutralEventName,
} from './types.js';

export {
  beginRscRender,
  completeRscRender,
  enterSuspenseBoundary,
  failRscRender,
  startRscHarness,
  streamHtmlChunk,
  type RscHarnessSession,
  type RscHarnessState,
} from './rsc-harness.js';

export {
  captureErrorBoundary,
  completeSelectiveHydration,
  markSuspensePending,
  startProgressiveHydration,
  startStreamingSsr,
  type StreamingSsrSession,
  type StreamingSsrState,
} from './streaming-ssr.js';

export {
  assertAnimation,
  finishElementTransition,
  startDocumentTransition,
  startElementTransition,
  startViewTransitionSession,
  type ViewTransitionSession,
  type ViewTransitionState,
} from './view-transitions.js';

export {
  applyOptimisticUpdate,
  enableProgressiveEnhancement,
  markFormStatusPending,
  rejectFormAction,
  resolveFormAction,
  startFormActionSession,
  type FormActionSession,
  type FormActionState,
} from './form-action-advanced.js';

export {
  COMPONENT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';

// v1.49 advanced III (pair 第 6 pair 3 段拡張)
export {
  applyOptimisticUpdate as applyReactActionOptimistic,
  beginActionTransition,
  initializeReactActions,
  resolveAction,
  type ReactActionsSession,
  type ReactActionsState,
} from './react-19-actions.js';

export {
  assertStaticBoundary,
  beginIslandHydration,
  bootstrapIslandsRoute,
  markIslandInteractive,
  registerIsland,
  type IslandsSession,
  type IslandsState,
  type IslandSpec,
} from './islands-architecture.js';
