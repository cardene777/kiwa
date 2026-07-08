export {
  providerEventName,
  type AxisStep,
  type MobileAxis,
  type MobileTarget,
  type NeutralEventName,
} from './types.js';

export {
  invokeNativeModule,
  mountReactNativeComponent,
  recognizeGesture,
  unmountReactNativeComponent,
  type ReactNativeSession,
  type ReactNativeState,
} from './react-native.js';

export {
  completeExpoBuild,
  loadExpoBuildConfig,
  receivePushNotification,
  resolveDeepLink,
  type ExpoSession,
  type ExpoState,
} from './expo.js';

export {
  applyMetroHmr,
  completeMetroBundle,
  resolveMetroModule,
  startMetroBundle,
  type MetroSession,
  type MetroState,
} from './metro.js';

export {
  MOBILE_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';

// v1.51 advanced II axis exports
export {
  initNavigation,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  switchNavigationTab,
  type NavigationSession,
  type NavigationState,
} from './navigation.js';

export {
  completeReanimatedAnimation,
  executeWorklet,
  initReanimated,
  startReanimatedAnimation,
  updateSharedValue,
  type ReanimatedSession,
  type ReanimatedState,
} from './reanimated.js';

export {
  flushAsyncStorageBatch,
  initAsyncStorage,
  readAsyncStorageItem,
  removeAsyncStorageItem,
  setAsyncStorageItem,
  type AsyncStorageSession,
  type AsyncStorageState,
} from './async-storage.js';

export {
  challengeBiometric,
  initSecureStorage,
  removeCredential,
  retrieveCredential,
  storeCredential,
  type SecureStorageSession,
  type SecureStorageState,
} from './secure-storage.js';

// v1.52 advanced III axis exports (New Architecture)
export {
  commitShadowTree,
  completeFabricMount,
  initFabric,
  scheduleFabricRender,
  updateFabricPriority,
  type FabricSession,
  type FabricState,
} from './fabric.js';

export {
  bindJsiRuntime,
  initTurboModules,
  invokeTurboMethod,
  registerTurboSpec,
  unregisterTurboModule,
  type TurboModulesSession,
  type TurboModulesState,
} from './turbo-modules.js';

export {
  completeCodegenBuild,
  emitCodegenType,
  generateSpec,
  initCodegen,
  loadCodegenSchema,
  type CodegenSession,
  type CodegenState,
} from './codegen.js';

export {
  bridgeLegacyModule,
  enableConcurrentReact,
  initNewArchitecture,
  markNewArchReady,
  startNewArchInit,
  type NewArchitectureSession,
  type NewArchitectureState,
} from './new-architecture.js';
