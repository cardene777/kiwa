# @kiwa-lab/webhook をはじめる

ここでは Stripe の raw payload に正しい HMAC を付け、`verified` の outcome、正規化された event、受信記録を同じ test file で確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/webhook vitest
```

## 正しい request を受理する

署名に使う文字列は `<timestamp>.<payload>` です。`createWebhookVerifier` に渡す `now` と `toleranceSec` を固定すると、時間に依存しない test になります。`tests/kiwa/webhook.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { createHmac } from "node:crypto";
import { expect, it } from "vitest";
import { createWebhookVerifier } from "@kiwa-lab/webhook";

it("accepts a Stripe payment completion event", () => {
  const secret = "whsec_test";
  const timestamp = 1_700_000_000;
  const payload = JSON.stringify({
    id: "evt_1",
    type: "payment_intent.succeeded",
    created: timestamp,
    data: { object: { id: "pi_1" } },
  });
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const verifier = createWebhookVerifier({
    provider: "stripe",
    secret,
    now: () => timestamp * 1000,
    toleranceSec: 60,
  });
  const result = verifier.verify({
    payload,
    signature: `t=${timestamp},v1=${digest}`,
  });

  expect(result).toMatchObject({
    id: "evt-1",
    status: "verified",
    event: {
      type: "payment.succeeded",
      eventId: "evt_1",
      resource: "pi_1",
    },
  });
  expect(verifier.listDelivered()).toHaveLength(1);
  expect(verifier.listDelivered()[0]?.signatureResult.valid).toBe(true);
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/webhook.test.ts
```

`verify` は署名検証、JSON parse、イベント変換、受信記録を一度に実行します。受理された request だけに `event` が含まれます。期待と異なる場合は、JSON を parse して再構成した文字列ではなく、受信時の raw body で署名を作っているか、timestamp が tolerance 内かを確認してください。

この test は実 HTTP header、TLS、provider の再送、Stripe sandbox との接続を検証しません。不正な署名の拒否、retry、重複排除は [使い方](./how-to) で確認します。

## skill で test を作る

この library には `/kiwa:kiwa-webhook` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい受信境界を test の形にする入口です。次の例では provider と出力先を固定します。

```text
/kiwa:kiwa-webhook --module payment-webhook --provider stripe --output tests/integration/payment-webhook.webhook.test.ts
```

生成後は `tests/integration/payment-webhook.webhook.test.ts` を読み、Quickstart と同じ成功条件と拒否条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/payment-webhook.webhook.test.ts
```

provider や出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-webhook/SKILL.md) を参照してください。
