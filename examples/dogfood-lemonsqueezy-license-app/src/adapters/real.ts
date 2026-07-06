/**
 * Real adapter skeleton — env-gated via
 * `KIWA_MODE=real` + `LEMONSQUEEZY_KEY` +
 * `KIWA_LEMONSQUEEZY_REAL_READY=1`. When the environment cannot reach
 * a Lemon Squeezy sandbox, every operation returns
 * `KIWA_LEMONSQUEEZY_ENV_MISSING` so tests can pin the fallback path.
 *
 * The real driver body is intentionally left as a skeleton — v1.33-4b
 * (follow-up) lands the Lemon Squeezy sandbox fixture that flips
 * `KIWA_LEMONSQUEEZY_REAL_READY=1` inside the test setup. Until then the
 * dogfood app exercises the env-gate + fallback contract only.
 */

import { resolveMode } from '@kiwa-test/payment';
import type {
  AffiliateConvertInput,
  AffiliateRegisterInput,
  CheckoutInput,
  CheckoutResult,
  LemonSqueezyLicenseAdapter,
  LicenseActivateInput,
  LicenseDeactivateInput,
  LicenseIssueInput,
  RefundInput,
  RefundResult,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from './interface.js';

export interface MakeRealAdapterOptions {
  /** override the env — defaults to process.env */
  env?: Record<string, string | undefined>;
}

/**
 * Real adapter that will drive a Lemon Squeezy sandbox when the env is
 * wired. Until then every op surfaces `KIWA_LEMONSQUEEZY_ENV_MISSING`.
 */
export function makeRealAdapter(
  options?: MakeRealAdapterOptions,
): LemonSqueezyLicenseAdapter {
  const env = options?.env ?? process.env;
  const resolved = resolveMode('lemonsqueezy', env);
  const ready = env.KIWA_LEMONSQUEEZY_REAL_READY === '1';

  const isReal = resolved.mode === 'real' && ready;

  const guard = (op: string): never => {
    if (!isReal) throw new Error(`KIWA_LEMONSQUEEZY_ENV_MISSING:${op}`);
    // real driver body — v1.33-4b follow-up
    throw new Error(`KIWA_LEMONSQUEEZY_REAL_NOT_IMPLEMENTED:${op}`);
  };

  return {
    mode: 'real',
    async checkout(_input: CheckoutInput): Promise<CheckoutResult> {
      return guard('checkout');
    },
    async receiveWebhook(_input: WebhookReceiveInput): Promise<WebhookReceiveResult> {
      return guard('receiveWebhook');
    },
    signWebhookForTest() {
      throw new Error('KIWA_LEMONSQUEEZY_REAL_SIGN_NOT_SUPPORTED');
    },
    async issueLicenseKey(_input: LicenseIssueInput) {
      return guard('issueLicenseKey');
    },
    async activateLicense(_input: LicenseActivateInput) {
      return guard('activateLicense');
    },
    async deactivateLicense(_input: LicenseDeactivateInput) {
      return guard('deactivateLicense');
    },
    async refund(_input: RefundInput): Promise<RefundResult> {
      return guard('refund');
    },
    async registerAffiliate(_input: AffiliateRegisterInput) {
      guard('registerAffiliate');
    },
    async recordAffiliateConversion(_input: AffiliateConvertInput) {
      return guard('recordAffiliateConversion');
    },
    async refundAffiliateCommission(_orderId: string) {
      return guard('refundAffiliateCommission');
    },
  };
}

/**
 * Snapshot the env-gate resolution so tests can pin the exact fallback
 * reason without touching the adapter body.
 */
export function inspectRealAdapterEnv(
  env: Record<string, string | undefined> = process.env,
): {
  mode: 'mock' | 'real';
  reason: string;
  ready: boolean;
  effective: 'mock' | 'real';
} {
  const resolved = resolveMode('lemonsqueezy', env);
  const ready = env.KIWA_LEMONSQUEEZY_REAL_READY === '1';
  const effective = resolved.mode === 'real' && ready ? 'real' : 'mock';
  return { mode: resolved.mode, reason: resolved.reason, ready, effective };
}
