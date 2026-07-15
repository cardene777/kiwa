export {
  createMacAppEnv,
  type MacAppMode,
  type MacAppEnv,
  type CreateMacAppEnvOptions,
  type BundleInfo,
  type ViewNode,
  type WindowInfo,
} from './env.js';

export {
  simulateUserInteraction,
  type InteractionEvent,
  type InteractionResult,
  type InteractionType,
} from './interaction.js';

export {
  captureAccessibilityTree,
  type AccessibilityTree,
  type AccessibilityNode,
  type AccessibilityRole,
} from './accessibility.js';

export {
  mockScreencap,
  type ScreencapOptions,
  type ScreencapResult,
  type Rect,
} from './screencap.js';

export {
  emitUserNotification,
  type UserNotification,
  type NotificationAction,
  type NotificationResult,
} from './notification.js';

export {
  withRetry,
  withTimeout,
  withRateLimit,
  withCircuitBreaker,
  withObservability,
  withIdempotencyKey,
  batchOperate,
  type RetryOptions,
  type TimeoutOptions,
  type RateLimitOptions,
  type CircuitBreakerOptions,
  type ObservabilityHook,
  type BatchItem,
  type BatchResult,
} from './resilience.js';
