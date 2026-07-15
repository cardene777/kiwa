# @kiwa-lab/feature-flag

Feature flag provider mock harness for kiwa — GrowthBook / LaunchDarkly / PostHog / Unleash の flag evaluation + targeting rules + percentage rollout を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/feature-flag
# or
npm install -D @kiwa-lab/feature-flag
# or
yarn add -D @kiwa-lab/feature-flag
```

## Supported providers

| Provider | Status | Variant support | Rule types |
|---|---|---|---|
| GrowthBook | ✅ | boolean / string / number | targeting / rollout / attr |
| LaunchDarkly | ✅ | boolean / string / number | targeting / rollout / attr |
| PostHog | ✅ | boolean / string / number | targeting / rollout / attr |
| Unleash | ✅ | boolean / string / number | targeting / rollout / attr |

## Quick start

```ts
import { createFlagClient, evaluateFlag, registerRule } from '@kiwa-lab/feature-flag';

const client = createFlagClient({
  provider: 'growthbook',
  flags: [{ key: 'new-checkout', variant: 'boolean', defaultValue: false }],
});

client.registerRule('new-checkout', {
  type: 'targeting',
  match: (user) => user.attributes?.plan === 'pro',
  value: true,
});

const user = { id: 'u1', attributes: { plan: 'pro' } };
const result = evaluateFlag(client, 'new-checkout', user);
// result = { value: true, variant: 'boolean', reason: 'targeting-match', ... }
```

## API reference

- `createFlagClient(options?: CreateFlagClientOptions): FlagClient` — provider mock client 生成
- `FlagClient.registerFlag(def: FlagDefinition): void` — flag 定義追加
- `FlagClient.registerRule(key: string, rule: FlagRule): void` — flag key に rule 追加
- `evaluateFlag(client, key, user): EvaluateFlagResult` — 1 flag 評価
- `evaluateAllFlags(client, user): EvaluateAllFlagsResult` — 全 flag 一括評価
- `registerRule / matchRule` — rule 定義 + 評価 helper (targeting / percentage rollout / attribute match)

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createFlagClient, evaluateFlag } from '@kiwa-lab/feature-flag';

describe('checkout flag', () => {
  it('pro user は new-checkout=true', () => {
    const c = createFlagClient({ provider: 'launchdarkly' });
    c.registerFlag({ key: 'new-checkout', variant: 'boolean', defaultValue: false });
    const res = evaluateFlag(c, 'new-checkout', { id: 'u1' });
    expect(res.value).toBe(false);
  });
});
```

`/kiwa-feature-flag` skill を起動すると targeting / rollout / attribute match 各 rule type の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
