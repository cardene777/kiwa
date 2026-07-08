export {
  providerEventName,
  type AxisStep,
  type NeutralEventName,
  type NextAxis,
  type NextTarget,
} from './types.js';

export {
  redirectAction,
  revalidateActionPath,
  revalidateActionTag,
  startServerActionAdvanced,
  submitFormAction,
  type ServerActionAdvancedSession,
  type ServerActionAdvancedState,
} from './server-action-advanced.js';

export {
  completePartialPrerendering,
  flushStreamingBoundary,
  openDynamicHole,
  renderStaticShell,
  startPartialPrerendering,
  type PartialPrerenderingSession,
  type PartialPrerenderingState,
} from './partial-prerendering.js';

export {
  interceptCurrentSegment,
  interceptParentSegment,
  interceptRootCatchall,
  openInterceptedModal,
  startInterceptionRoutes,
  type InterceptionMatcher,
  type InterceptionRoutesSession,
  type InterceptionRoutesState,
} from './interception-routes.js';

export {
  captureParallelError,
  navigateSlot,
  renderDefaultSlot,
  renderLoadingState,
  startParallelRoutesAdvanced,
  type ParallelRoutesAdvancedSession,
  type ParallelRoutesAdvancedState,
} from './parallel-routes-advanced.js';

export {
  NEXT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';

// v1.49 advanced III (pair 第 6 pair 3 段拡張)
export {
  applyHmrPatch,
  completeFastRefresh,
  findHmrBoundary,
  markModuleUpdated,
  startTurbopackHmr,
  type TurbopackHmrSession,
  type TurbopackHmrState,
} from './turbopack-hmr.js';

export {
  commitTransition,
  interruptTransition,
  markTransitionPending,
  startConcurrentTransition,
  type ConcurrentTransitionSession,
  type ConcurrentTransitionState,
} from './concurrent-transitions.js';
