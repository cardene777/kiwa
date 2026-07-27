# @kiwa-lab/feature-flag の使い方

この harness は application が受け取った definition と rule を評価します。provider SDK、remote config、analytics exposure は起動しません。rule は登録順に評価され、最初に一致した値を返します。設定の優先順位を変更するときは rule の順番も test してください。

次の file を `tests/checkout.feature-flag.test.ts` として保存してください。targeting、percentage rollout、attribute、未知 key、設定変更後の idempotency cache を確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  createFlagClient,
  createIdempotencyCache,
  evaluateFlag,
  evaluateIdempotent,
} from "@kiwa-lab/feature-flag";

describe("new checkout", () => {
  it("evaluates targeting, attribute, and a full rollout in rule order", () => {
    const client = createFlagClient({
      provider: "growthbook",
      flags: [{ key: "new-checkout", variant: "boolean", defaultValue: false }],
    });
    client.registerRule("new-checkout", {
      type: "targeting",
      userIds: ["u-vip"],
      value: true,
    });
    client.registerRule("new-checkout", {
      type: "attribute",
      attribute: "plan",
      operator: "eq",
      value: "pro",
      matchValue: true,
      fallback: false,
    });
    client.registerRule("new-checkout", {
      type: "percentage",
      percentage: 100,
      value: true,
      fallback: false,
    });

    expect(evaluateFlag(client, "new-checkout", { id: "u-vip" })).toMatchObject({ value: true, reason: "targeted:u-vip" });
    expect(evaluateFlag(client, "new-checkout", { id: "u-pro", attributes: { plan: "pro" } })).toMatchObject({ value: true, reason: "attr-match:plan" });
    expect(evaluateFlag(client, "new-checkout", { id: "u-free", attributes: { plan: "free" } })).toMatchObject({ value: true, reason: expect.stringMatching(/^bucket:/) });
  });

  it("returns a safe false value for an unknown key", () => {
    const client = createFlagClient({ provider: "growthbook", idSeed: 10 });
    const result = evaluateFlag(client, "removed-checkout", { id: "u-1" });

    expect(result).toMatchObject({
      value: false,
      reason: "flag-not-found",
      record: { id: "gb-11", variant: "boolean" },
    });
  });

  it("creates a new cache after a rule or definition changes", () => {
    const client = createFlagClient({
      flags: [{ key: "new-checkout", variant: "boolean", defaultValue: false }],
    });
    const cache = createIdempotencyCache();
    const first = evaluateIdempotent(client, "new-checkout", { id: "u-1" }, cache);
    client.registerRule("new-checkout", { type: "targeting", userIds: ["u-1"], value: true });
    const stale = evaluateIdempotent(client, "new-checkout", { id: "u-1" }, cache);
    cache.clear();
    const fresh = evaluateIdempotent(client, "new-checkout", { id: "u-1" }, cache);

    expect(first).toMatchObject({ value: false, cached: false });
    expect(stale).toMatchObject({ value: false, cached: true });
    expect(fresh).toMatchObject({ value: true, cached: false });
  });
});
```

```bash
pnpm exec vitest run tests/checkout.feature-flag.test.ts
```

percentage rule は user id と flag key から決まるため、同じ組み合わせなら毎回同じ結果です。unmatched percentage と attribute rule の `fallback` は最終値にならず、次の rule または flag default へ進みます。unknown key は throw せず `flag-not-found` と boolean false を返します。

idempotency cache の key は flag key と user id だけです。attribute、rule、definition を変えても古い result が残るため、config update を test するときは cache を clear または作り直してください。GrowthBook、LaunchDarkly、PostHog、Unleash の remote config fetch、SDK cache、provider 固有 bucket、analytics event は実 provider の integration test で確認します。
