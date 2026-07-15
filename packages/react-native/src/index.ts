export {
  createRNTestEnv,
  type RNTestEnv,
  type RNPlatformOS,
  type CreateRNTestEnvOptions,
} from './env.js';

export {
  mockAsyncStorage,
  type AsyncStorageMock,
  type AsyncStorageInitial,
} from './async-storage.js';

export {
  mockNavigation,
  type NavigationMock,
  type NavigationRoute,
} from './navigation.js';

export {
  dispatchLinkingUrl,
  type LinkingListener,
  type LinkingEvent,
} from './linking.js';

export {
  setPlatform,
  type PlatformState,
} from './platform.js';

export {
  setDimensions,
  type DimensionsState,
} from './dimensions.js';

// v2.1 extensions
export {
  retryWithBackoff,
  matchDeepLink,
  createNotificationPermissionMock,
  createObservabilityHook,
  withTimeout,
  createRateLimiter,
  createCircuitBreaker,
  batchAsync,
  type RetryOptions,
  type RetryResult,
  type DeepLinkPattern,
  type DeepLinkMatch,
  type NotificationPermission,
  type NotificationPermissionMock,
  type ObservabilityEvent,
  type ObservabilityHook,
  type TimeoutOptions,
  type RateLimitOptions,
  type RateLimiter,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreaker,
  type BatchOptions,
  type BatchResult,
} from './extensions.js';
