# @kiwa-lab/feature-flag

Feature flag provider mock harness for kiwa — GrowthBook / LaunchDarkly / PostHog / Unleash を統一 interface で invoke する in-process mock。

## API

- `createFlagClient(options)` = provider mock client (evaluateFlag / evaluateAllFlags / registerRule / listEvaluated)
- `evaluateFlag(client, key, user)` = boolean / string / number variant 別 flag 評価
- `registerRule(client, key, rule)` = targeting rule / percentage rollout / user attribute matching
- `evaluateAllFlags(client, user)` = 全 flag を bulk evaluate
