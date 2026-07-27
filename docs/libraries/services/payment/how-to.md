# @kiwa-lab/payment の使い方

この package は決済を実行しません。provider が送る raw webhook と signature を application がどのように検証し、どの event だけを注文処理へ渡すかを固定します。Stripe、Paddle、Lemon Squeezy は同じ `PaymentAdapter` contract を実装しますが、実 provider API、PCI、card retry、3DS、税、chargeback は別の sandbox または staging test で確認します。

次の file を `tests/checkout.payment.test.ts` として保存してください。正しい署名だけを handler に渡すこと、改ざんと期限切れを止めること、dunning の最終状態を確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  checkoutCompleted,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  dunningAttempt,
  finalizeDunning,
  startDunning,
} from "@kiwa-lab/payment";

describe("payment webhook", () => {
  it("verifies a provider's own signed event before delivery", async () => {
    const adapters = [
      createStripeMock({ secret: "whsec_stripe" }),
      createPaddleMock({ secret: "whsec_paddle" }),
      createLemonSqueezyMock({ secret: "whsec_lemon" }),
    ];

    for (const adapter of adapters) {
      const signed = adapter.signWebhook({
        type: "checkout.completed",
        amountCents: 2000,
        customerId: "cus_1",
      });
      expect(adapter.verifyWebhook(signed)).toMatchObject({ ok: true, reason: "ok" });
    }
  });

  it("does not deliver tampered or stale events", async () => {
    let now = 1_000_000;
    const stripe = createStripeMock({ secret: "whsec_test", now: () => now, toleranceMs: 1_000 });
    const received: string[] = [];
    stripe.onWebhook((event) => received.push(event.id));
    const signed = checkoutCompleted(stripe, {
      amountCents: 2000,
      currency: "usd",
      customerId: "cus_1",
    });
    const tampered = stripe.verifyWebhook({
      rawBody: signed.rawBody.replace('"amountCents":2000', '"amountCents":2001'),
      signature: signed.signature,
    });

    now += 10_000;
    const stale = stripe.verifyWebhook({ rawBody: signed.rawBody, signature: signed.signature });
    if (tampered.ok && tampered.event) await stripe.emit(tampered.event);
    if (stale.ok && stale.event) await stripe.emit(stale.event);

    expect(tampered).toMatchObject({ ok: false, reason: "bad-signature", event: null });
    expect(stale).toMatchObject({ ok: false, reason: "stale-timestamp", event: null });
    expect(received).toEqual([]);
  });

  it("delivers a verified event once and removes its handler", async () => {
    const stripe = createStripeMock({ secret: "whsec_test" });
    const seen: string[] = [];
    const unsubscribe = stripe.onWebhook((event) => seen.push(event.id));
    const signed = checkoutCompleted(stripe, { amountCents: 2000, customerId: "cus_1" });
    const verified = stripe.verifyWebhook({ rawBody: signed.rawBody, signature: signed.signature });

    if (verified.ok && verified.event) await stripe.emit(verified.event);
    unsubscribe();
    await stripe.emit(signed.event);

    expect(seen).toEqual([signed.event.id]);
  });
});

describe("dunning", () => {
  it("moves a failed invoice through its attempts and terminal state", async () => {
    const stripe = createStripeMock({ secret: "whsec_test" });
    const session = startDunning({
      invoiceId: "inv_42",
      amountCents: 5000,
      customerId: "cus_1",
      currency: "usd",
      config: { maxAttempts: 3, gracePeriodMs: 60_000 },
    });

    await dunningAttempt(stripe, session);
    await dunningAttempt(stripe, session);
    const lastAttempt = await dunningAttempt(stripe, session);
    const terminal = await finalizeDunning(stripe, session, { succeed: false });

    expect(lastAttempt).toMatchObject({ state: "in-grace-period", metadata: { remainingAttempts: 0 } });
    expect(terminal).toMatchObject({ neutralEvent: "dunning.exhausted", state: "exhausted", amountCents: 0 });
    expect(session.history).toHaveLength(4);
  });
});
```

```bash
pnpm exec vitest run tests/checkout.payment.test.ts
```

検証に成功しても handler は自動で呼ばれません。`result.ok` と `result.event` を確認した場合だけ `emit` または注文更新へ進めてください。raw body を JSON に再構成すると署名は一致しません。fixture を作った adapter と検証する adapter の secret も同じである必要があります。

dunning API は retry を予約せず、時刻の経過も待ちません。scheduler が `dunningAttempt()` を呼ぶ時刻を決め、最終試行後は `finalizeDunning()` を一度だけ呼びます。`in-grace-period` の session に `dunningAttempt()` を再度呼ぶと exception になります。実 provider の retry schedule、通知、card state は sandbox で検証してください。
