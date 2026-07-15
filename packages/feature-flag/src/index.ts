export {
  createFlagClient,
  type FlagProvider,
  type FlagClient,
  type FlagUser,
  type FlagValue,
  type FlagVariant,
  type FlagDefinition,
  type EvaluatedFlagRecord,
  type CreateFlagClientOptions,
} from './client.js';

export {
  evaluateFlag,
  evaluateAllFlags,
  type EvaluateFlagResult,
  type EvaluateAllFlagsResult,
} from './evaluator.js';

export {
  registerRule,
  matchRule,
  type FlagRule,
  type TargetingRule,
  type PercentageRolloutRule,
  type AttributeMatchRule,
  type RuleMatchResult,
} from './rules.js';

export {
  providerIdPrefix,
  normalizeProviderConfig,
  type ProviderConfig,
} from './provider.js';

export { evaluateWithRetry, type RetryOptions } from './retry.js';
export { evaluateBatch, type BatchEvaluateResult } from './batch.js';
export { createIdempotencyCache, evaluateIdempotent, type IdempotencyCache } from './idempotency.js';
export { createHookRegistry, evaluateObservable, type HookRegistry, type HookCallback, type HookContext, type EvalHookEvent } from './observability.js';
export { createCircuitBreaker, type CircuitBreaker, type CircuitBreakerOptions, type CircuitState } from './circuit-breaker.js';
