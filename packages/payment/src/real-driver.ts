import type { PaymentProvider } from './types.js';

/**
 * Real-driver env-gate — inspects `process.env` to decide whether the
 * @kiwa/payment adapter should behave like a mock (default) or defer
 * to a real provider driver (Stripe test mode, Paddle sandbox, Lemon
 * Squeezy sandbox). The gate combines two flags per provider:
 *
 * 1. `KIWA_MODE=real` — global switch that opts every adapter into real
 *    driver behaviour when possible.
 * 2. Provider secret env vars — one of `STRIPE_KEY` / `PADDLE_KEY` /
 *    `LEMONSQUEEZY_KEY`. When the corresponding key is missing the
 *    adapter silently falls back to mock mode even under `KIWA_MODE=real`.
 *
 * The real driver path itself is not shipped in this milestone — the
 * env-gate exposes the resolved mode + reason so downstream applications
 * (dogfood-stripe-marketplace-app / dogfood-paddle-subscription-app /
 * dogfood-lemonsqueezy-license-app) can pick the correct adapter.
 */
export type PaymentMode = 'mock' | 'real';

export interface ResolvedMode {
  mode: PaymentMode;
  provider: PaymentProvider;
  reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}

const PROVIDER_KEY_ENV: Record<PaymentProvider, string> = {
  stripe: 'STRIPE_KEY',
  paddle: 'PADDLE_KEY',
  lemonsqueezy: 'LEMONSQUEEZY_KEY',
};

/**
 * Resolve the effective mode for a provider given a live env snapshot.
 * `env` defaults to `process.env` so callers can inject a synthetic env
 * for unit tests.
 */
export function resolveMode(
  provider: PaymentProvider,
  env: Record<string, string | undefined> = process.env,
): ResolvedMode {
  const rawMode = env.KIWA_MODE?.toLowerCase();
  if (rawMode !== undefined && rawMode !== 'real' && rawMode !== 'mock') {
    return { provider, mode: 'mock', reason: 'invalid-mode' };
  }
  if (rawMode !== 'real') {
    return { provider, mode: 'mock', reason: 'default-mock' };
  }
  const keyEnv = PROVIDER_KEY_ENV[provider];
  const keyValue = env[keyEnv];
  if (typeof keyValue !== 'string' || keyValue.length === 0) {
    return { provider, mode: 'mock', reason: 'missing-key' };
  }
  return { provider, mode: 'real', reason: 'kiwa-mode-real' };
}

/**
 * Convenience — resolve modes for all 3 providers in one pass. Used by
 * release-gate + fidelity harness to report which combinations are live.
 */
export function resolveAllModes(
  env: Record<string, string | undefined> = process.env,
): ResolvedMode[] {
  const providers: PaymentProvider[] = ['stripe', 'paddle', 'lemonsqueezy'];
  return providers.map((p) => resolveMode(p, env));
}

/**
 * Assert that a provider is in a specific mode. Used by dogfood apps
 * that expect real driver mode in CI + fail loudly if the env is not
 * configured.
 */
export function assertMode(
  provider: PaymentProvider,
  expected: PaymentMode,
  env: Record<string, string | undefined> = process.env,
): void {
  const resolved = resolveMode(provider, env);
  if (resolved.mode !== expected) {
    throw new Error(
      `expected ${provider} in ${expected} mode but resolved ${resolved.mode} (${resolved.reason})`,
    );
  }
}
