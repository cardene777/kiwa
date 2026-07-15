---
name: kiwa-feature-flag
description: |
  @kiwa-lab/feature-flag (GrowthBook / LaunchDarkly / PostHog / Unleash 統一 mock harness) を使った feature flag 評価経路の test 生成 skill。
  `createFlagClient` + `evaluateFlag` で boolean/string/number variant、 `registerRule` で targeting rule / percentage rollout / user attribute matching を in-process で叩ける。 real SDK 差替なしで A/B test / kill switch / gradual rollout の test を書く。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-feature-flag — feature flag 評価 test 生成

`@kiwa-lab/feature-flag` の 4 provider (GrowthBook / LaunchDarkly / PostHog / Unleash) 統一 mock を使った flag test を Vitest 形式で生成する。 実 provider に接続せず flag evaluation / targeting rule / rollout percentage の test を書く。

## 目的

A/B test / kill switch / gradual rollout / user segment 別 experience で「flag 切替時に想定挙動が返る」 test を書く。 provider 差 (GrowthBook JSON rules / LaunchDarkly variation / PostHog conditions / Unleash strategies) を吸収した抽象で test 化。

## 前提

- `pnpm add -D @kiwa-lab/feature-flag` install 済
- Vitest 環境
- 対象 module に flag consumer (React `useFlag` hook / server middleware / cron job 分岐 等) が存在

## オプション

- `--module {name}` — test 対象 module (new-checkout / dark-mode / experimental-search 等)
- `--provider {growthbook|launchdarkly|posthog|unleash}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: basic evaluation test 生成

`createFlagClient({ provider, flags: { new_checkout: false } })` で client を立て、 `evaluateFlag(client, 'new_checkout', user)` で default 値を assert。 boolean / string / number 3 variant を it.each で網羅。

### Step 2: targeting rule test 生成

`registerRule(client, 'new_checkout', { targets: [{ userId: 'u-1', value: true }] })` で user 指定 rule 登録、 targeted user と non-target user で異なる評価結果を assert。 percentage rollout (50% roll) + attribute matching (country=JP) も cover。

### Step 3: bulk evaluation test 生成

`evaluateAllFlags(client, user)` で全 flag の bulk 評価、 return object の shape + flag 数を assert。 未登録 flag の fallback 挙動も追加。

## 使用例

```bash
/kiwa-feature-flag --module new-checkout --provider growthbook
/kiwa-feature-flag --module dark-mode --output tests/integration/dark-mode.flag.test.ts
```
