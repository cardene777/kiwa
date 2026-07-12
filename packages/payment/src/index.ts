export type {
  PaymentAdapter,
  PaymentProvider,
  PaymentWebhookEvent,
  WebhookVerifyResult,
} from './types.js';
export { PAYMENT_PROVIDERS } from './types.js';
export { PaymentEngine, type EngineConfig } from './engine.js';
export { createStripeMock } from './stripe.js';
export { createPaddleMock } from './paddle.js';
export { createLemonSqueezyMock } from './lemonsqueezy.js';
export {
  checkoutCompleted,
  subscriptionCreated,
  paymentFailed,
  refunded,
} from './fixture.js';

// v0.3 advanced billing semantics — 9 axis SSOT
// v0.4 advanced billing II semantics — 8 axis SSOT (orchestration / recovery /
// refund-advanced / dispute / webhook-idempotency-advanced / tax-localization /
// subscription-state-machine / payment-method-vault)
export * from './semantics/index.js';

// v0.4 real-driver env-gate — KIWA_MODE=real + STRIPE_KEY / PADDLE_KEY / LEMONSQUEEZY_KEY
export type { PaymentMode, ResolvedMode } from './real-driver.js';
export { resolveMode, resolveAllModes, assertMode } from './real-driver.js';
