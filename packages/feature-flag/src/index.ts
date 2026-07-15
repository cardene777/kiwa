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
