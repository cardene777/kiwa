# @kiwa-lab/webhook の使い方

このページでは GitHub の push webhook を例に、改変された request を拒否し、受理した event を retry 付きで処理し、同じ delivery を一度だけ扱う test を作ります。コード全体を `tests/github.webhook.how-to.test.ts` に保存してください。省略した import や test wrapper はありません。

## 改変された request を業務処理へ渡さない

最初の test は、正しい raw body で署名を作り、その後に body だけを改変します。署名と本文が対応していなければ `verified` にならず、`event` が渡らないことを確かめます。これは endpoint の JSON parser が body を変更してしまう事故も検出する基準になります。

## 一時失敗を retry して同じ delivery を重複させない

次の test は有効な push event を正規化し、二回失敗した handler が三回目に成功することを検証します。最後の test は同じ delivery ID で二度検証しても、二度目は cached outcome となり、受信記録が増えないことを確認します。

```ts
import { createHmac } from "node:crypto";
import { expect, it } from "vitest";
import {
  createIdempotencyCache,
  createWebhookVerifier,
  dispatchWithRetry,
  verifyIdempotent,
} from "@kiwa-lab/webhook";

const secret = "github-secret";

function signGitHub(payload: string) {
  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${digest}`;
}

it("改変された GitHub request を拒否し event を渡さない", () => {
  const verifier = createWebhookVerifier({ provider: "github", secret });
  const signedPayload = JSON.stringify({
    event: "push",
    delivery: "gh-1",
    timestamp: 1,
    repository: { full_name: "acme/docs" },
  });

  const result = verifier.verify({
    payload: signedPayload.replace("push", "issues"),
    signature: signGitHub(signedPayload),
  });

  expect(result).toMatchObject({
    status: "rejected",
    reason: "digest mismatch",
  });
  expect(result.event).toBeUndefined();
  expect(verifier.listDelivered()).toMatchObject([
    { status: "rejected", signatureResult: { valid: false } },
  ]);
});

it("受理した push を retry して三回目に配送する", async () => {
  const verifier = createWebhookVerifier({ provider: "github", secret });
  const payload = JSON.stringify({
    event: "push",
    delivery: "gh-2",
    timestamp: 2,
    repository: { full_name: "acme/docs" },
  });
  const outcome = verifier.verify({ payload, signature: signGitHub(payload) });

  expect(outcome).toMatchObject({
    status: "verified",
    event: { type: "push", eventId: "gh-2", resource: "acme/docs" },
  });

  let calls = 0;
  const delivery = await dispatchWithRetry(
    async (event) => {
      calls += 1;
      expect(event.type).toBe("push");
      if (calls < 3) throw new Error("subscriber unavailable");
    },
    outcome.event!,
    { maxAttempts: 3, initialDelayMs: 10, sleep: async () => undefined },
  );

  expect(delivery.delivered).toBe(true);
  expect(delivery.attempts.map((attempt) => attempt.ok)).toEqual([
    false,
    false,
    true,
  ]);
});

it("同じ delivery ID は一度だけ検証する", () => {
  const verifier = createWebhookVerifier({ provider: "github", secret });
  const cache = createIdempotencyCache();
  const payload = JSON.stringify({ event: "push", delivery: "gh-3", timestamp: 3 });
  const incoming = { payload, signature: signGitHub(payload) };

  const first = verifyIdempotent(verifier, incoming, "gh-3", cache);
  const second = verifyIdempotent(verifier, incoming, "gh-3", cache);

  expect(first).toMatchObject({ status: "verified", deduplicated: false });
  expect(second).toMatchObject({ status: "verified", deduplicated: true });
  expect(verifier.listDelivered()).toHaveLength(1);
});
```

## 実行して結果を読む

次の command を実行します。

```bash
pnpm exec vitest run tests/github.webhook.how-to.test.ts
```

三つの test が通れば、改変 request は業務 event を持たず、正しい push は三回目の handler 呼び出しで配送され、同じ delivery ID は一度しか verifier を通りません。最初の test が `verified` になる場合は、実際に受信した raw body ではなく parse 後の値で署名を作っている、または `status` を確認せず `event` を利用している可能性があります。

この cache は test process 内だけで有効です。実運用の endpoint では framework が raw body を提供する経路、provider sandbox から届く header、共有ストアによる idempotency、失敗結果を引き渡す queue や DLQ を別の integration test で確認してください。
