export {
  createEmailClient,
  type EmailProvider,
  type EmailClient,
  type EmailMessage,
  type EmailSendResult,
  type EmailTemplateContext,
  type SentEmailRecord,
} from './client.js';

export {
  verifyWebhookSignature,
  type SignatureVerifyResult,
} from './signature.js';

export {
  parseDeliveryEvent,
  type NormalizedDeliveryEvent,
  type RawDeliveryEvent,
  type DeliveryEventType,
} from './delivery.js';

export {
  renderTemplate,
  type TemplateRenderResult,
} from './template.js';

export {
  sendWithRetry,
  type RetryOptions,
  type RetrySendResult,
} from './retry.js';

export {
  sendBatch,
  type BatchSendOptions,
  type BatchSendResult,
} from './batch.js';

export {
  createIdempotencyCache,
  sendIdempotent,
  type IdempotencyCache,
  type IdempotentSendOptions,
} from './idempotency.js';

export {
  createHookRegistry,
  sendObservable,
  type HookRegistry,
  type HookCallback,
  type HookContext,
  type SendHookEvent,
} from './observability.js';

export {
  createCircuitBreaker,
  type CircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitState,
} from './circuit-breaker.js';
