import type { FlagClient, FlagUser, FlagValue, FlagDefinition, EvaluatedFlagRecord } from './client.js';
import { matchRule } from './rules.js';

export interface EvaluateFlagResult {
  key: string;
  value: FlagValue;
  reason: string;
  record: EvaluatedFlagRecord;
}

export interface EvaluateAllFlagsResult {
  user: FlagUser;
  results: EvaluateFlagResult[];
}

/**
 * flag key + user から value を決定。 rule chain を順次評価し、 最初に matched した rule の
 * value を採用。 全 rule miss / 未登録 flag は defaultValue に fallback。
 */
export function evaluateFlag(client: FlagClient, key: string, user: FlagUser): EvaluateFlagResult {
  const flagDef = client.getFlags().find((f) => f.key === key);
  if (!flagDef) {
    const record = client.recordEvaluation({
      key,
      value: false,
      variant: 'boolean',
      user,
      reason: 'flag-not-found',
    });
    return { key, value: false, reason: 'flag-not-found', record };
  }
  const rules = client.getRules(key);
  for (const rule of rules) {
    const match = matchRule(rule, user, key);
    if (match.matched) {
      const record = client.recordEvaluation({
        key,
        value: match.value,
        variant: flagDef.variant,
        user,
        reason: match.reason,
      });
      return { key, value: match.value, reason: match.reason, record };
    }
  }
  const record = client.recordEvaluation({
    key,
    value: flagDef.defaultValue,
    variant: flagDef.variant,
    user,
    reason: 'default',
  });
  return { key, value: flagDef.defaultValue, reason: 'default', record };
}

/**
 * 全登録 flag を user 1 人に対して bulk evaluate。 SPA/mobile client の起動時に 1 回だけ
 * 全 flag を pre-fetch する pattern を再現。
 */
export function evaluateAllFlags(client: FlagClient, user: FlagUser): EvaluateAllFlagsResult {
  const results: EvaluateFlagResult[] = [];
  for (const flag of client.getFlags()) {
    results.push(evaluateFlag(client, flag.key, user));
  }
  return { user, results };
}
