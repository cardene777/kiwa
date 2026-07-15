export {
  createStore,
  type StateProvider,
  type StateStore,
  type StateStoreOptions,
  type StateSnapshot,
} from './client.js';

export {
  dispatch,
  type DispatchResult,
  type Action,
} from './dispatch.js';

export {
  subscribe,
  type Subscription,
  type StateListener,
  type Unsubscribe,
} from './subscribe.js';

export {
  selectState,
  type Selector,
} from './selector.js';

export {
  mockAction,
  type MockActionCreator,
} from './mockAction.js';

// v2.1 extensions
export {
  composeMiddleware,
  createUndoRedoStack,
  createMemoryPersistence,
  createPersistedStore,
  retryWithBackoff,
  createObservabilityHook,
  type StateMiddleware,
  type UndoRedoStack,
  type PersistenceAdapter,
  type PersistedStore,
  type RetryOptions,
  type RetryResult,
  type ObservabilityHook,
} from './extensions.js';
