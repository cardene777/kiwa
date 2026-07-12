/**
 * Payment provider identifier — provider prefix used by release-gate to
 * dispatch axis evaluation. All @kiwa-lab/payment mocks emit provider =
 * `@kiwa-lab/payment/{stripe|paddle|lemonsqueezy}` so downstream harnesses
 * can filter without pulling in this package.
 */
export type PaymentProvider = 'stripe' | 'paddle' | 'lemonsqueezy';

/**
 * Runtime tuple of every payment provider, kept in sync with the
 * `PaymentProvider` union above via `satisfies`. Downstream consumers use
 * this to iterate provider ids at runtime (release-gate axis dispatch,
 * fixture registration) without duplicating the string literals or
 * reaching for reflection.
 */
export const PAYMENT_PROVIDERS = ['stripe', 'paddle', 'lemonsqueezy'] as const satisfies readonly PaymentProvider[];

/**
 * A canonical webhook event shape shared across the three providers. Real
 * providers emit slightly different payloads (Stripe uses `data.object`,
 * Paddle uses `data.attributes`, Lemon Squeezy nests under `data.attributes`
 * too but with different keys). This shape captures the intersection that
 * kiwa mocks assert on — id, event type, amount + currency, customer, and
 * a timestamp. The provider-specific `raw` field carries the exact raw
 * webhook body a real client would sign, so signature verify tests exercise
 * the actual bytes.
 */
export interface PaymentWebhookEvent {
  provider: PaymentProvider;
  id: string;
  type: string;
  amountCents: number;
  currency: string;
  customerId: string;
  timestamp: number;
  raw: string;
}

/**
 * Signature verify result — returned by every provider's `verifyWebhook`.
 * Includes the parsed event on success and a reason string on failure so
 * kiwa tests can assert on specific rejection paths without string-matching
 * the whole error message.
 */
export interface WebhookVerifyResult {
  ok: boolean;
  event: PaymentWebhookEvent | null;
  reason: 'ok' | 'bad-signature' | 'stale-timestamp' | 'malformed-body';
}

/**
 * Adapter contract every provider mock implements. The 3 ops are the
 * intersection kiwa tests actually assert on:
 * - `signWebhook` — build a raw payload + signature pair (fixture)
 * - `verifyWebhook` — verify signature + parse (mock server)
 * - `emit` — synchronous fake webhook dispatch to registered handlers
 */
export interface PaymentAdapter {
  readonly provider: PaymentProvider;
  signWebhook(input: {
    type: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    timestamp?: number;
  }): { rawBody: string; signature: string; event: PaymentWebhookEvent };
  verifyWebhook(input: { rawBody: string; signature: string; toleranceMs?: number }): WebhookVerifyResult;
  onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void;
  emit(event: PaymentWebhookEvent): Promise<void>;
}
