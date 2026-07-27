# @kiwa-lab/notification をはじめる

ここでは FCM 名の provider で push notification を送信し、結果と送信履歴を検証します。この client は Firebase や端末 token へ接続しません。アプリケーションが provider adapter に渡す通知内容と、受理後にどう状態を扱うかを process 内で固定する test fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/notification vitest
```

## push を送る

`createNotificationClient` は provider、時刻、id seed、失敗条件をテスト用に受け取れます。既定の push provider は `fcm`、SMS provider は `twilio` です。

```ts
import { expect, it } from "vitest";
import { createNotificationClient } from "@kiwa-lab/notification";

it("FCM push を queue する", async () => {
  const client = createNotificationClient({
    pushProvider: "fcm",
    now: () => 1000,
    idSeed: 0,
  });

  const result = await client.sendPush({
    deviceToken: "device-1",
    title: "注文を発送しました",
    body: "配送状況を確認できます",
    data: { orderId: "o-1" },
  });

  expect(result).toEqual({
    id: "fcm-1",
    channel: "push",
    provider: "fcm",
    status: "queued",
    acceptedAt: 1000,
  });
  expect(client.listSent()).toHaveLength(1);
  expect(client.listSent()[0]?.message).toMatchObject({ deviceToken: "device-1" });
});
```

`listSent()` は result のコピーではなく、送った message も含む `SentNotificationRecord` を返します。テストの期待値は送信の依頼だけでなく、実際に保持された channel と provider も確認してください。

## 後始末

client は in-memory の送信履歴を持ちます。テストごとに新しく作るか、同じ client を使う必要があるなら `clear()` を呼んで履歴を分離します。

## 次に進む

SMS とアプリ内通知をまとめて送る例、provider 拒否を確認する例は [使い方](./how-to) に進んでください。

## テストを実行する

この例を `tests/kiwa/notification.test.ts` に保存して、次を実行します。

```bash
pnpm exec vitest run tests/kiwa/notification.test.ts
```

成功すると、push request は `queued` として一件の送信履歴に残ります。`queued` は端末に表示された意味ではありません。期待と異なる場合は、`now` と `idSeed` を固定した client を使っているか、`pushProvider` が期待する `fcm` または `apns` かを確認してください。

<!-- skill-guide -->
## skill で test を作る

この library には `/kiwa:kiwa-notification` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませてください。skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい境界を test の形にする入口です。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の例では、対象を表す名前を `--module` に渡し、生成先を `--output` で固定します。

```text
/kiwa:kiwa-notification --module order-confirm --channel all --output tests/integration/order-confirm.notification.test.ts
```

生成後は `tests/integration/order-confirm.notification.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、次の command で runner を実行します。

```bash
pnpm exec vitest run tests/integration/order-confirm.notification.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-notification/SKILL.md) を参照してください。
