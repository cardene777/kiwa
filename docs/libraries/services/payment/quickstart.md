# @kiwa-lab/payment をはじめる

ここでは Stripe mock から checkout 完了 Webhook を作り、正しい raw body と署名だけを handler に配送します。この package は決済 API やカード情報へ接続しません。webhook receiver が受け取る raw body、署名、業務 handler の境界を、外部の認証情報なしで test するための harness です。

## インストール

```bash
pnpm add -D @kiwa-lab/payment vitest
```

## 正しい event だけを配送する

`checkoutCompleted` は adapter の `signWebhook` を呼ぶ fixture です。返された `rawBody` と `signature` は変更せずに `verifyWebhook` へ渡します。`tests/kiwa/payment.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { checkoutCompleted, createStripeMock } from "@kiwa-lab/payment";

describe("checkout webhook", () => {
  it("verifies and delivers a signed checkout event", async () => {
    const stripe = createStripeMock({
      secret: "whsec_test",
      now: () => 1_700_000_000_000,
    });
    const seen: string[] = [];
    const unsubscribe = stripe.onWebhook((event) => {
      seen.push(`${event.type}:${event.customerId}`);
    });

    const signed = checkoutCompleted(stripe, {
      amountCents: 2000,
      currency: "usd",
      customerId: "cus_test",
    });
    const result = stripe.verifyWebhook({
      rawBody: signed.rawBody,
      signature: signed.signature,
    });

    expect(result).toMatchObject({
      ok: true,
      reason: "ok",
      event: {
        provider: "stripe",
        type: "checkout.completed",
        amountCents: 2000,
        customerId: "cus_test",
      },
    });

    if (result.ok && result.event) {
      await stripe.emit(result.event);
    }
    expect(seen).toEqual(["checkout.completed:cus_test"]);
    unsubscribe();
  });

  it("does not deliver an event whose amount was changed after signing", async () => {
    const stripe = createStripeMock({ secret: "whsec_test" });
    const handled: string[] = [];
    stripe.onWebhook((event) => handled.push(event.id));
    const signed = checkoutCompleted(stripe, {
      amountCents: 2000,
      customerId: "cus_test",
    });

    const result = stripe.verifyWebhook({
      rawBody: signed.rawBody.replace('"amountCents":2000', '"amountCents":2001'),
      signature: signed.signature,
    });
    if (result.ok && result.event) {
      await stripe.emit(result.event);
    }

    expect(result).toMatchObject({ ok: false, reason: "bad-signature" });
    expect(handled).toEqual([]);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/payment.test.ts
```

`verifyWebhook` が成功しても handler は自動では呼ばれません。`result.ok` と `result.event` を両方確認した後にだけ `emit` することで、改ざん済み payload や期限切れ event を注文処理へ流さない受信分岐を test できます。

失敗する場合は、`rawBody` を JSON として組み直していないか、fixture を作った adapter と検証に使う adapter の secret が同じかを確認してください。`bad-signature`、`stale-timestamp`、`malformed-body` は受信を拒否する理由です。どれも再署名や再試行によって勝手に成功へ変換せず、HTTP endpoint では 4xx を返し、注文や subscription の状態を更新しないでください。

頻出の event には `checkoutCompleted`、`subscriptionCreated`、`paymentFailed`、`refunded` を使えます。拒否結果と請求失敗から dunning を進める例は [使い方](./how-to) に進んでください。

## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。payment provider の実際の課金手順を推測して生成する skill もありません。

HTTP webhook receiver の仕様から test を設計する場合だけ、初回に kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

受信する raw body、署名失敗時の status、検証成功時の状態更新を先に仕様化してから API test を作ります。

```text
/kiwa:kiwa-design --layer integration --module checkout-webhook
/kiwa:kiwa-api --module checkout-webhook
```

生成物を読み、`verifyWebhook` が成功した場合だけ `emit` または注文更新へ進む assertion があることを確認してから、生成された file だけを実行します。

```bash
pnpm exec vitest run test/integration/checkout-webhook.test.ts
```

画面を含む checkout 完了フローには `/kiwa:kiwa-e2e` を使えます。生成物は payment library を実行した結果ではありません。実際の請求、provider header、replay protection は sandbox または staging の integration test で確認してください。導入と各 skill の引数は [kiwa の skill を使う](../../../guides/skills) を参照してください。
