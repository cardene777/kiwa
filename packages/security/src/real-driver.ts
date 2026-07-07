/**
 * Real driver env-gate — 4 provider (helmet / express-rate-limit / casbin / coraza)
 * の real driver 経路を `KIWA_MODE=real` + testcontainers 起動時のみ有効化。
 *
 * KIWA_MODE=real 未設定時は skip、 mock semantics で PASS する。
 * testcontainers 前提の integration 経路 (real coraza WAF stack、
 * casbin policy engine + PostgreSQL adapter 等) は本 helper 経由で
 * 統一 env 判定する。
 */

import type { SecurityProvider } from './types.js';

export const REAL_DRIVER_REQUIRED_KEYS: Record<SecurityProvider, string[]> = {
  helmet: ['KIWA_MODE'],
  'express-rate-limit': ['KIWA_MODE', 'KIWA_REDIS_URL'],
  casbin: ['KIWA_MODE', 'KIWA_CASBIN_POLICY_PATH'],
  coraza: ['KIWA_MODE', 'KIWA_CORAZA_RULES_PATH'],
};

export interface RealDriverGateInput {
  provider: SecurityProvider;
  env?: NodeJS.ProcessEnv;
}

export interface RealDriverGateResult {
  useRealDriver: boolean;
  missingKeys: string[];
  reason: string;
}

/**
 * env の状態から real driver を使うかどうか判定する。
 * KIWA_MODE=real + provider 別必須 env が揃った時のみ true。
 */
export function resolveRealtimeDriver(input: RealDriverGateInput): RealDriverGateResult {
  const env = input.env ?? process.env;
  const required = REAL_DRIVER_REQUIRED_KEYS[input.provider];
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

export function isKiwaModeReal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

/**
 * vitest 用 skip helper — describe block を real driver 未該当時に
 * skip する経路の SSOT。 return.skip=true なら describe.skip 相当。
 */
export function skipUnlessReal(
  provider: SecurityProvider,
  env: NodeJS.ProcessEnv = process.env,
): { skip: boolean; reason: string } {
  const result = resolveRealtimeDriver({ provider, env });
  if (result.useRealDriver) {
    return { skip: false, reason: result.reason };
  }
  return { skip: true, reason: result.reason };
}

export interface RealDriverEndpoint {
  provider: SecurityProvider;
  endpoint: string | null;
  apiKey: string | null;
}

/**
 * provider 別の endpoint / api key を env から解決する。
 * testcontainers container の host / port 情報を渡す想定。
 */
export function resolveEndpoint(
  provider: SecurityProvider,
  env: NodeJS.ProcessEnv = process.env,
): RealDriverEndpoint {
  switch (provider) {
    case 'helmet':
      return {
        provider,
        endpoint: env.KIWA_HELMET_URL ?? null,
        apiKey: null,
      };
    case 'express-rate-limit':
      return {
        provider,
        endpoint: env.KIWA_REDIS_URL ?? null,
        apiKey: env.KIWA_REDIS_PASSWORD ?? null,
      };
    case 'casbin':
      return {
        provider,
        endpoint: env.KIWA_CASBIN_POLICY_PATH ?? null,
        apiKey: null,
      };
    case 'coraza':
      return {
        provider,
        endpoint: env.KIWA_CORAZA_RULES_PATH ?? null,
        apiKey: null,
      };
  }
}
