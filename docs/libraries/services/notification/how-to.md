# @kiwa-lab/notification の使い方

この client は push、SMS、in-app を provider 名と送信結果ごとに記録します。`queued` は provider が受理した状態を模したもので、端末に表示された状態ではありません。実際の到達や開封は、後で受け取る provider event を application が検証してから関連付けます。

次の file を `tests/order.notification.test.ts` として保存してください。複数 channel の順序、provider 拒否、重複送信の防止、delivery event の関連付けを確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  createIdempotencyCache,
  createNotificationClient,
  parseNotificationEvent,
  sendPushIdempotent,
} from "@kiwa-lab/notification";

describe("order notification", () => {
  it("records each requested channel in dispatch order", async () => {
    const client = createNotificationClient({ pushProvider: "apns", smsProvider: "sns" });
    const results = await client.dispatch(["push", "sms", "in-app"], {
      push: { deviceToken: "ios-token", title: "発送しました", body: "配送状況を確認できます" },
      sms: { to: "+15550000001", from: "+15550000002", body: "注文を発送しました" },
      inApp: { userId: "u-1", title: "発送しました", body: "配送状況を確認できます" },
    });

    expect(results.map((result) => [result.channel, result.provider, result.status])).toEqual([
      ["push", "apns", "queued"],
      ["sms", "sns", "queued"],
      ["in-app", "in-app", "queued"],
    ]);
  });

  it("retains a provider rejection as a failed result", async () => {
    const client = createNotificationClient({ failOn: (channel) => channel === "sms" });
    const result = await client.sendSMS({
      to: "+15550000001",
      from: "+15550000002",
      body: "確認コード 1234",
    });

    expect(result).toMatchObject({ channel: "sms", status: "failed", reason: "provider rejected" });
    expect(client.listSent()).toHaveLength(1);
  });

  it("does not queue the same idempotency key twice", async () => {
    const client = createNotificationClient();
    const cache = createIdempotencyCache();
    const message = { deviceToken: "device-1", title: "更新", body: "新着があります" };

    const first = await sendPushIdempotent(client, message, "order-o-1", cache);
    const second = await sendPushIdempotent(client, message, "order-o-1", cache);

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(client.listSent()).toHaveLength(1);
  });

  it("matches a normalized delivery event to a sent notification", async () => {
    const client = createNotificationClient({ pushProvider: "fcm", idSeed: 0 });
    const sent = await client.sendPush({
      deviceToken: "device-1",
      title: "発送しました",
      body: "配送状況を確認できます",
    });
    const event = parseNotificationEvent({
      provider: "fcm",
      raw: {
        event: "delivered",
        notification_id: sent.id,
        timestamp: 1_720_000_000_000,
        recipient: "device-1",
      },
    });

    expect(event).toMatchObject({
      type: "delivered",
      channel: "push",
      notificationId: sent.id,
      recipient: "device-1",
    });
  });
});
```

```bash
pnpm exec vitest run tests/order.notification.test.ts
```

dispatch に payload がない channel は result を作りません。必須の連絡経路がある場合は、期待する channel と件数を assertion に含めてください。`failOn` は provider 拒否を再現する hook であり、invalid device token、SMS opt-out、certificate error、rate limit の詳細は再現しません。

idempotency cache は process 内にだけ存在します。複数 worker や長い TTL を扱う production では共有 store を使います。delivery event の署名検証、重複 event の保存、端末 token の失効、実 webhook の再送も application の endpoint と provider sandbox で別に確認してください。
