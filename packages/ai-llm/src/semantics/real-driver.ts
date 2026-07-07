/**
 * Real driver env-gate for ai-llm v0.4.
 *
 * Provides KIWA_MODE=real-based helpers for testing against actual LLM
 * backends (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK
 * + LangChain). Consumers gate a describe block on `isKiwaModeReal()`, and
 * use `resolveLlmEndpoint()` + `resolveApiKey()` to fetch backend URLs / keys.
 * When KIWA_MODE != 'real', tests should skip.
 *
 * Budget guard は必須。 KIWA_LLM_BUDGET_USD で $ 上限を強制する SSOT。
 */

export type LlmBackend = 'anthropic' | 'openai' | 'vercel-ai' | 'langchain';

export function isKiwaModeReal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

const DEFAULT_ENDPOINTS: Record<LlmBackend, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com',
  'vercel-ai': 'https://api.openai.com',
  langchain: 'https://api.openai.com',
};

export function resolveLlmEndpoint(
  backend: LlmBackend,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = env[endpointEnvKey(backend)];
  if (explicit && explicit.length > 0) return explicit;
  return DEFAULT_ENDPOINTS[backend];
}

export function endpointEnvKey(backend: LlmBackend): string {
  switch (backend) {
    case 'anthropic':
      return 'KIWA_ANTHROPIC_URL';
    case 'openai':
      return 'KIWA_OPENAI_URL';
    case 'vercel-ai':
      return 'KIWA_VERCEL_AI_URL';
    case 'langchain':
      return 'KIWA_LANGCHAIN_URL';
  }
}

export function apiKeyEnvVar(backend: LlmBackend): string {
  switch (backend) {
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'vercel-ai':
      return 'OPENAI_API_KEY';
    case 'langchain':
      return 'OPENAI_API_KEY';
  }
}

export function resolveApiKey(
  backend: LlmBackend,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = env[apiKeyEnvVar(backend)];
  return key && key.length > 0 ? key : null;
}

export interface BudgetGuardConfig {
  limitUsd: number;
  spentUsd: number;
  perCallCapUsd: number;
}

export function resolveBudgetGuard(env: NodeJS.ProcessEnv = process.env): BudgetGuardConfig {
  const limitUsd = Number(env.KIWA_LLM_BUDGET_USD ?? '5.0');
  const perCallCapUsd = Number(env.KIWA_LLM_PER_CALL_CAP_USD ?? '0.5');
  if (!Number.isFinite(limitUsd) || limitUsd < 0) {
    throw new Error('resolveBudgetGuard: KIWA_LLM_BUDGET_USD must be a non-negative number');
  }
  if (!Number.isFinite(perCallCapUsd) || perCallCapUsd < 0) {
    throw new Error('resolveBudgetGuard: KIWA_LLM_PER_CALL_CAP_USD must be a non-negative number');
  }
  return { limitUsd, spentUsd: 0, perCallCapUsd };
}

export function chargeBudget(
  guard: BudgetGuardConfig,
  costUsd: number,
): { allowed: boolean; reason: string; remaining: number } {
  if (costUsd < 0) {
    return { allowed: false, reason: 'negative cost', remaining: guard.limitUsd - guard.spentUsd };
  }
  if (costUsd > guard.perCallCapUsd) {
    return {
      allowed: false,
      reason: `per-call cap ${guard.perCallCapUsd} exceeded by ${costUsd}`,
      remaining: guard.limitUsd - guard.spentUsd,
    };
  }
  if (guard.spentUsd + costUsd > guard.limitUsd) {
    return {
      allowed: false,
      reason: `budget ${guard.limitUsd} exceeded`,
      remaining: guard.limitUsd - guard.spentUsd,
    };
  }
  guard.spentUsd += costUsd;
  return { allowed: true, reason: 'ok', remaining: guard.limitUsd - guard.spentUsd };
}

export interface RealDriverConfig {
  backend: LlmBackend;
  endpoint: string;
  apiKey: string | null;
  timeoutMs: number;
  budget: BudgetGuardConfig;
}

export function buildRealDriverConfig(
  backend: LlmBackend,
  overrides: Partial<Omit<RealDriverConfig, 'backend'>> = {},
  env: NodeJS.ProcessEnv = process.env,
): RealDriverConfig {
  return {
    backend,
    endpoint: overrides.endpoint ?? resolveLlmEndpoint(backend, env),
    apiKey: overrides.apiKey !== undefined ? overrides.apiKey : resolveApiKey(backend, env),
    timeoutMs: overrides.timeoutMs ?? Number(env.KIWA_LLM_TIMEOUT_MS ?? 30000),
    budget: overrides.budget ?? resolveBudgetGuard(env),
  };
}

export function skipUnlessReal(env: NodeJS.ProcessEnv = process.env): {
  skip: boolean;
  reason: string;
} {
  if (isKiwaModeReal(env)) {
    return { skip: false, reason: 'KIWA_MODE=real detected' };
  }
  return {
    skip: true,
    reason: 'KIWA_MODE!=real — skip real-driver tests (mock semantics apply)',
  };
}
