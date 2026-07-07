/**
 * Real driver env-gate for security v0.2 advanced axes.
 *
 * Provides KIWA_MODE=real-based helpers for testing against actual security
 * providers (Istio + OPA + Splunk + Vault). Consumers gate a describe block
 * on `isKiwaAdvModeReal()`, and use `resolveAdvEndpoint()` +
 * `resolveAdvApiKey()` to fetch backend URLs / keys. When KIWA_MODE != 'real',
 * tests should skip and mock semantics apply.
 */

import type { SecurityAdvTarget } from './types.js';

export function isKiwaAdvModeReal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

export const ADV_ENDPOINT_ENV_KEY: Record<SecurityAdvTarget, string> = {
  istio: 'KIWA_ISTIO_URL',
  opa: 'KIWA_OPA_URL',
  'siem-splunk': 'KIWA_SPLUNK_HEC_URL',
  vault: 'KIWA_VAULT_URL',
};

export const ADV_API_KEY_ENV_KEY: Record<SecurityAdvTarget, string> = {
  istio: 'KIWA_ISTIO_TOKEN',
  opa: 'KIWA_OPA_TOKEN',
  'siem-splunk': 'KIWA_SPLUNK_HEC_TOKEN',
  vault: 'KIWA_VAULT_TOKEN',
};

export const ADV_REQUIRED_KEYS: Record<SecurityAdvTarget, string[]> = {
  istio: ['KIWA_MODE', 'KIWA_ISTIO_URL'],
  opa: ['KIWA_MODE', 'KIWA_OPA_URL'],
  'siem-splunk': ['KIWA_MODE', 'KIWA_SPLUNK_HEC_URL', 'KIWA_SPLUNK_HEC_TOKEN'],
  vault: ['KIWA_MODE', 'KIWA_VAULT_URL', 'KIWA_VAULT_TOKEN'],
};

export interface AdvRealDriverGateInput {
  provider: SecurityAdvTarget;
  env?: NodeJS.ProcessEnv;
}

export interface AdvRealDriverGateResult {
  useRealDriver: boolean;
  missingKeys: string[];
  reason: string;
}

export function resolveAdvRealDriver(
  input: AdvRealDriverGateInput,
): AdvRealDriverGateResult {
  const env = input.env ?? process.env;
  const required = ADV_REQUIRED_KEYS[input.provider];
  if (env.KIWA_MODE !== 'real') {
    return {
      useRealDriver: false,
      missingKeys: [],
      reason: `KIWA_MODE!=real (got "${env.KIWA_MODE ?? 'unset'}") — mock driver`,
    };
  }
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    return {
      useRealDriver: false,
      missingKeys: missing,
      reason: `KIWA_MODE=real but required env missing: ${missing.join(', ')}`,
    };
  }
  return {
    useRealDriver: true,
    missingKeys: [],
    reason: `KIWA_MODE=real + ${required.join(' + ')} present — real driver`,
  };
}

export function resolveAdvEndpoint(
  provider: SecurityAdvTarget,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = ADV_ENDPOINT_ENV_KEY[provider];
  const value = env[key];
  return value && value.length > 0 ? value : null;
}

export function resolveAdvApiKey(
  provider: SecurityAdvTarget,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = ADV_API_KEY_ENV_KEY[provider];
  const value = env[key];
  return value && value.length > 0 ? value : null;
}

export interface AdvRealDriverConfig {
  provider: SecurityAdvTarget;
  endpoint: string | null;
  apiKey: string | null;
  timeoutMs: number;
}

export function buildAdvRealDriverConfig(
  provider: SecurityAdvTarget,
  env: NodeJS.ProcessEnv = process.env,
): AdvRealDriverConfig {
  return {
    provider,
    endpoint: resolveAdvEndpoint(provider, env),
    apiKey: resolveAdvApiKey(provider, env),
    timeoutMs: Number(env.KIWA_SEC_ADV_TIMEOUT_MS ?? 15000),
  };
}

export function skipUnlessAdvReal(
  provider: SecurityAdvTarget,
  env: NodeJS.ProcessEnv = process.env,
): { skip: boolean; reason: string } {
  const result = resolveAdvRealDriver({ provider, env });
  if (result.useRealDriver) {
    return { skip: false, reason: result.reason };
  }
  return { skip: true, reason: result.reason };
}
