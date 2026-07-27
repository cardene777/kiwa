# @kiwa-lab/email 使い方

この library は provider SDK と inbox を起動せず、application が送信する message、template、provider の webhook、再試行と重複防止を process 内で確認します。`queued` は送信要求を記録した状態であり、受信者に届いた状態ではありません。delivery state は署名を検証済みの webhook から更新します。

次の file を `tests/welcome.email.test.ts` として保存してください。template の render、未登録 template、delivery webhook、retry、idempotency を一つの test file で確認します。

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createEmailClient,
  createIdempotencyCache,
  parseDeliveryEvent,
  sendIdempotent,
  sendWithRetry,
  verifyWebhookSignature,
} from "@kiwa-lab/email";

describe("welcome email", () => {
  it("renders a registered template and rejects an unknown template", async () => {
    const client = createEmailClient({
      provider: "resend",
      templates: { welcome: "<h1>Welcome \{\{displayName\}\}</h1>" },
      now: () => 1_720_000_000_000,
    });
    const sent = await client.send({
      from: "noreply@example.test",
      to: "new-user@example.test",
      subject: "Welcome to Kiwa",
      templateId: "welcome",
      templateData: { displayName: "Kiwa user" },
    });
    const missing = await client.send({
      from: "noreply@example.test",
      to: "new-user@example.test",
      subject: "Welcome to Kiwa",
      templateId: "missing",
      templateData: { displayName: "Kiwa user" },
    });

    expect(sent).toMatchObject({ provider: "resend", status: "queued", acceptedAt: 1_720_000_000_000 });
    expect(client.listSent()[0]).toMatchObject({ renderedHtml: "<h1>Welcome Kiwa user</h1>" });
    expect(missing).toMatchObject({ status: "failed", reason: "template not found: missing" });
  });

  it("verifies a raw delivery webhook before normalizing it", () => {
    const secret = "whsec_local_test";
    const payload = JSON.stringify({
      type: "email.delivered",
      email_id: "re-1",
      timestamp: 1_720_000_000_500,
      recipient: "new-user@example.test",
    });
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    const verification = verifyWebhookSignature(payload, signature, secret, "resend");

    expect(verification.valid).toBe(true);
    expect(parseDeliveryEvent({ provider: "resend", raw: JSON.parse(payload) })).toMatchObject({
      type: "delivered",
      emailId: "re-1",
      recipient: "new-user@example.test",
    });
    expect(verifyWebhookSignature(payload, "invalid", secret, "resend").valid).toBe(false);
  });

  it("retries a transient failure and keeps a duplicate event idempotent", async () => {
    let attempts = 0;
    const client = createEmailClient({
      provider: "resend",
      failOn: () => {
        attempts += 1;
        return attempts < 3;
      },
    });
    const message = {
      from: "noreply@example.test",
      to: "new-user@example.test",
      subject: "Your account is ready",
      text: "Welcome",
    };
    const retry = await sendWithRetry(client, message, { maxAttempts: 3, initialDelayMs: 1 });
    const cache = createIdempotencyCache();
    const first = await sendIdempotent(client, message, { cache, idempotencyKey: "account-created:user-42" });
    const duplicate = await sendIdempotent(client, message, { cache, idempotencyKey: "account-created:user-42" });

    expect(retry).toMatchObject({ status: "queued", attempts: 3 });
    expect(first.cached).toBe(false);
    expect(duplicate).toMatchObject({ cached: true, id: first.id });
    expect(client.listSent()).toHaveLength(4);
  });
});
```

```bash
pnpm exec vitest run tests/welcome.email.test.ts
```

`parseDeliveryEvent` は signature を検証しません。HTTP endpoint では raw body のまま `verifyWebhookSignature` を実行し、成功した場合だけ parse と database update へ進めます。Resend と Postmark は SHA-256 hex、SendGrid は SHA-256 base64、SES は SHA-1 hex の signature を使います。

retry は一時的な failure だけに使います。template 不備や恒久的な recipient error を無条件に再試行しないでください。idempotency cache は process 内だけにあり、複数 worker の production では database や Redis へ差し替えます。実 provider の credential、suppression list、DNS、inbox rendering、配信率、実 webhook 再送は sandbox integration test で確認してください。
