# @kiwa-lab/feature-flag API reference

## Overview

`@kiwa-lab/feature-flag` は GrowthBook / LaunchDarkly / PostHog / Unleash 4 provider を統一 interface で mock する feature flag evaluation test infra。 boolean / string / number variant + targeting rule + percentage rollout + attribute matching を in-process で叩ける。

## Supported providers

| provider | variant type | targeting form | rollout precision |
|---|---|---|---|
| growthbook | boolean/string/number | rules array | 0.1% |
| launchdarkly | boolean/string/number/json | segment + rules | 1% |
| posthog | boolean/multivariate | property + cohort | 0.01% |
| unleash | boolean/variant | strategies | 1% |

## Main API

### `createFlagClient(options: CreateFlagClientOptions): FlagClient`

provider 別 mock client を生成、 `flags` で initial definition 登録、 `defaultUser` で default user 属性。

### `evaluateFlag<T>(client, flagKey, user?): EvaluateFlagResult<T>`

flag を user context で評価、 `{ value, reason, ruleMatched?, rolloutBucket? }` を返す。 reason = `default | rule_match | percentage_rollout | disabled | not_found`。

### `evaluateAllFlags(client, user?): EvaluateAllFlagsResult`

登録された全 flag を一括評価、 `{ [flagKey]: EvaluateFlagResult }` を返す。 admin dashboard mock に使う。

### `registerRule(client, flagKey, rule: FlagRule): void`

flag に targeting rule 追加。 `TargetingRule` (attribute match) / `PercentageRolloutRule` (bucket 割合) / `AttributeMatchRule` (email suffix / country 等)。

### `matchRule(rule: FlagRule, user: FlagUser): RuleMatchResult`

rule を user 単独評価、 `{ matched, reason, bucket? }` を返す。 test で「特定 user が rule に該当するか」 を単独 verify する。

## Types

- `FlagProvider = 'growthbook' | 'launchdarkly' | 'posthog' | 'unleash'`
- `FlagUser` = `{ id: string, attributes?: Record<string, string | number | boolean> }`
- `FlagValue = boolean | string | number`
- `FlagVariant` = `{ key: string, value: FlagValue, weight?: number }`
- `FlagDefinition` = `{ key, defaultValue, variants?, rules? }`

## Usage examples

### Boolean flag + attribute-based targeting

```typescript
import { createFlagClient, evaluateFlag, registerRule } from '@kiwa-lab/feature-flag';
import { describe, expect, it } from 'vitest';

describe('new checkout flow flag', () => {
  it('beta user のみ有効', () => {
    const client = createFlagClient({
      provider: 'launchdarkly',
      flags: [{ key: 'new-checkout', defaultValue: false }],
    });
    registerRule(client, 'new-checkout', {
      type: 'attribute-match',
      attribute: 'plan',
      operator: 'equals',
      value: 'beta',
      variant: true,
    });
    const beta = evaluateFlag(client, 'new-checkout', { id: 'u1', attributes: { plan: 'beta' } });
    const free = evaluateFlag(client, 'new-checkout', { id: 'u2', attributes: { plan: 'free' } });
    expect(beta.value).toBe(true);
    expect(free.value).toBe(false);
  });
});
```

### Percentage rollout

```typescript
import { createFlagClient, evaluateFlag, registerRule } from '@kiwa-lab/feature-flag';

const client = createFlagClient({ provider: 'growthbook', flags: [{ key: 'dark-mode', defaultValue: false }] });
registerRule(client, 'dark-mode', { type: 'percentage-rollout', percent: 20, variant: true });
const result = evaluateFlag(client, 'dark-mode', { id: 'user-42' });
console.log(result.reason, result.rolloutBucket); // percentage_rollout 18 (deterministic hash)
```

## Related skills

- [`/kiwa-feature-flag`](../skills/kiwa-feature-flag) — feature flag test 生成 skill
