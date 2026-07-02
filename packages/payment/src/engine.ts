import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  PaymentAdapter,
  PaymentProvider,
  PaymentWebhookEvent,
  WebhookVerifyResult,
} from './types.js';

/**
 * Shared engine used by all 3 provider adapters. Handles the HMAC signing +
 * verify + registered handler dispatch. Provider-specific bits (signature
 * scheme, timestamp format, event id prefix, payload shape) are injected
 * via the {@link EngineConfig}.
 *
 * All 3 real providers use HMAC-SHA256 over some canonical serialization
 * of `{timestamp}.{body}` — Stripe's `Stripe-Signature` header is the
 * canonical example, Paddle uses `Paddle-Signature`, Lemon Squeezy uses
 * `X-Signature`. The mock exercises the same bytes.
 */
export interface EngineConfig {
  provider: PaymentProvider;
  secret: string;
  idPrefix: string;
  toleranceMs: number;
  now(): number;
  buildRawBody(event: PaymentWebhookEvent): string;
}

export class PaymentEngine implements PaymentAdapter {
  readonly provider: PaymentProvider;
  private readonly config: EngineConfig;
  private readonly handlers = new Set<(event: PaymentWebhookEvent) => void | Promise<void>>();
  private idCounter = 0;

  constructor(config: EngineConfig) {
    this.provider = config.provider;
    this.config = config;
  }

  signWebhook(input: {
    type: string;
    amountCents: number;
    currency?: string;
    customerId: string;
    timestamp?: number;
  }): { rawBody: string; signature: string; event: PaymentWebhookEvent } {
    const timestamp = input.timestamp ?? this.config.now();
    const event: PaymentWebhookEvent = {
      provider: this.provider,
      id: `${this.config.idPrefix}_${++this.idCounter}`,
      type: input.type,
      amountCents: input.amountCents,
      currency: input.currency ?? 'usd',
      customerId: input.customerId,
      timestamp,
      raw: '',
    };
    const rawBody = this.config.buildRawBody(event);
    event.raw = rawBody;
    const signature = this.computeSignature(rawBody, timestamp);
    return { rawBody, signature, event };
  }

  verifyWebhook(input: {
    rawBody: string;
    signature: string;
    toleranceMs?: number;
  }): WebhookVerifyResult {
    let parsed: PaymentWebhookEvent | null = null;
    try {
      const json = JSON.parse(input.rawBody) as { timestamp?: number };
      if (typeof json.timestamp !== 'number') {
        return { ok: false, event: null, reason: 'malformed-body' };
      }
      parsed = { ...(json as unknown as PaymentWebhookEvent), raw: input.rawBody };
    } catch {
      return { ok: false, event: null, reason: 'malformed-body' };
    }
    const tolerance = input.toleranceMs ?? this.config.toleranceMs;
    const nowMs = this.config.now();
    if (Math.abs(nowMs - parsed.timestamp) > tolerance) {
      return { ok: false, event: null, reason: 'stale-timestamp' };
    }
    const expected = this.computeSignature(input.rawBody, parsed.timestamp);
    const expectedBuf = Buffer.from(expected);
    const gotBuf = Buffer.from(input.signature);
    if (expectedBuf.length !== gotBuf.length || !timingSafeEqual(expectedBuf, gotBuf)) {
      return { ok: false, event: null, reason: 'bad-signature' };
    }
    return { ok: true, event: parsed, reason: 'ok' };
  }

  onWebhook(handler: (event: PaymentWebhookEvent) => void | Promise<void>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async emit(event: PaymentWebhookEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }

  private computeSignature(rawBody: string, timestamp: number): string {
    const hmac = createHmac('sha256', this.config.secret);
    hmac.update(`${timestamp}.${rawBody}`);
    return hmac.digest('hex');
  }
}
