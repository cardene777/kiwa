import type { FlagUser, FlagValue } from './client.js';

export interface TargetingRule {
  type: 'targeting';
  userIds: string[];
  value: FlagValue;
}

export interface PercentageRolloutRule {
  type: 'percentage';
  percentage: number;
  value: FlagValue;
  fallback: FlagValue;
}

export interface AttributeMatchRule {
  type: 'attribute';
  attribute: string;
  operator: 'eq' | 'ne' | 'in' | 'gt' | 'lt';
  value: string | number | boolean | string[];
  matchValue: FlagValue;
  fallback: FlagValue;
}

export type FlagRule = TargetingRule | PercentageRolloutRule | AttributeMatchRule;

export interface RuleMatchResult {
  matched: boolean;
  value: FlagValue;
  reason: string;
}

/**
 * rule を registry に登録するための builder。 client 側の rule Map に push される想定。
 */
export function registerRule(rules: Map<string, FlagRule[]>, key: string, rule: FlagRule): void {
  const existing = rules.get(key) ?? [];
  existing.push(rule);
  rules.set(key, existing);
}

/**
 * user + rule 評価 = 最初にヒットした rule の value を返す。 全 rule miss で fallback / defaultValue。
 * percentage は hash(userId + key) % 100 で決定 (再現性)。
 */
export function matchRule(rule: FlagRule, user: FlagUser, key: string): RuleMatchResult {
  if (rule.type === 'targeting') {
    if (rule.userIds.includes(user.id)) {
      return { matched: true, value: rule.value, reason: `targeted:${user.id}` };
    }
    return { matched: false, value: rule.value, reason: 'not-targeted' };
  }
  if (rule.type === 'percentage') {
    const hash = hashUserKey(user.id, key);
    const bucket = hash % 100;
    if (bucket < rule.percentage) {
      return { matched: true, value: rule.value, reason: `bucket:${bucket}<${rule.percentage}` };
    }
    return { matched: false, value: rule.fallback, reason: `bucket:${bucket}>=${rule.percentage}` };
  }
  const attrValue = user.attributes?.[rule.attribute];
  const matched = evalAttribute(rule.operator, attrValue, rule.value);
  return {
    matched,
    value: matched ? rule.matchValue : rule.fallback,
    reason: matched ? `attr-match:${rule.attribute}` : `attr-mismatch:${rule.attribute}`,
  };
}

function hashUserKey(userId: string, key: string): number {
  const s = `${userId}:${key}`;
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function evalAttribute(
  op: AttributeMatchRule['operator'],
  actual: unknown,
  expected: string | number | boolean | string[],
): boolean {
  if (op === 'eq') return actual === expected;
  if (op === 'ne') return actual !== expected;
  if (op === 'in') return Array.isArray(expected) && expected.includes(String(actual));
  if (op === 'gt') return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
  if (op === 'lt') return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
  return false;
}
