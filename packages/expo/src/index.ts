export {
  createExpoTestEnv,
  type ExpoTestEnv,
  type CreateExpoTestEnvOptions,
} from './env.js';

export {
  mockExpoRouter,
  type ExpoRouterMock,
  type ExpoRouterOptions,
  type RouterNavigation,
} from './router.js';

export {
  mockSecureStore,
  type SecureStoreMock,
  type SecureStoreOptions,
} from './secure-store.js';

export {
  dispatchNotification,
  type NotificationPayload,
  type NotificationDispatchResult,
  type ScheduledNotification,
} from './notifications.js';

export {
  mockFileSystem,
  type FileSystemMock,
  type FileSystemOptions,
  type FileInfo,
} from './file-system.js';

export {
  mockCamera,
  type CameraMock,
  type CameraOptions,
  type CapturedPicture,
  type CapturedVideo,
  type CameraPermissionStatus,
} from './camera.js';

// v2.1 extensions
export {
  mockEASUpdate,
  mockModal,
  retryWithBackoff,
  batchAsync,
  createObservabilityHook,
  withTimeout,
  createRateLimiter,
  createCircuitBreaker,
  type EASUpdateManifest,
  type EASUpdateMock,
  type ModalOptions,
  type ModalMock,
  type RetryOptions,
  type RetryResult,
  type BatchResult,
  type ObservabilityHook,
  type RateLimiter,
  type CircuitState,
  type CircuitBreaker,
} from './extensions.js';
