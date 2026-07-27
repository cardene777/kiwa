---
name: kiwa-feature-flag
description: |
  @kiwa-lab/feature-flag を使って feature flag evaluation の application-level test を作る skill。
  default、targeting、percentage rollout、attribute、cache を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-feature-flag feature flag test を作る

`@kiwa-lab/feature-flag` は GrowthBook、LaunchDarkly、PostHog、Unleash の SDK や remote config を起動しない。application が受け取った flag definition と rule の評価順を test する harness である。

## 入力と出力

`--module` は対象名、`--provider` は `growthbook`、`launchdarkly`、`posthog`、`unleash` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.feature-flag.test.ts` を使う。実 application の flag key、variant、default、rule priority、user attributes を input にする。

## 生成する test

client は `createFlagClient` で作り、`evaluateFlag` で default と unknown key を確認する。targeting rule は user id、percentage rule は user id と flag key、attribute rule は user attributes を使う。rule は登録順に評価されるため、最初に一致する rule を assertion に含める。

設定 update がある test は `createIdempotencyCache` と `evaluateIdempotent` の cache boundary を確認する。cache key は flag key と user id だけなので、attributes、rules、definitions を変えた後は cache を clear または作り直す。

## 実行と確認

生成後は output file を読み、flag key、variant、default、rule priority、user segment、configuration update が application の rollout 方針と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

remote config fetch、SDK cache、provider bucket algorithm、analytics exposure は実 provider の integration test で確認する。

## 実行例

```text
/kiwa:kiwa-feature-flag --module new-checkout --provider growthbook --output tests/new-checkout.feature-flag.test.ts
/kiwa:kiwa-feature-flag --module experimental-search --provider unleash --output tests/experimental-search.feature-flag.test.ts
```
