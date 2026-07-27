# @kiwa-lab/email をはじめる

Resend 名の result shape を使う client で、通常のメールを queued として記録し、未登録 template を failed として扱います。この client は Resend API へ接続しません。アプリケーションの送信 adapter に渡す message と、送信要求を受理した後の分岐を、外部 credential や inbox なしで固定する test fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/email vitest
```

## 送信と失敗を確認する

`tests/kiwa/email.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { createEmailClient } from "@kiwa-lab/email";

describe("welcome email", () => {
  it("queues a message and records the recipient", async () => {
    const client = createEmailClient({ provider: "resend" });

    const result = await client.send({
      from: "noreply@example.test",
      to: "user@example.test",
      subject: "Welcome",
      text: "Hello",
    });

    expect(result).toMatchObject({
      provider: "resend",
      status: "queued",
      id: expect.stringMatching(/^re-/),
    });
    expect(client.listSent()).toEqual([
      expect.objectContaining({
        message: expect.objectContaining({ to: "user@example.test" }),
      }),
    ]);
  });

  it("does not treat an unknown template as a successful send", async () => {
    const client = createEmailClient({ provider: "resend" });

    const result = await client.send({
      from: "noreply@example.test",
      to: "user@example.test",
      subject: "Welcome",
      templateId: "welcome",
      templateData: { displayName: "Kiwa user" },
    });

    expect(result).toMatchObject({
      status: "failed",
      reason: "template not found: welcome",
    });
    expect(client.listSent()).toHaveLength(1);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/email.test.ts
```

`queued` はこの client が送信要求を受け付け、履歴へ記録した状態です。受信者の inbox に届いた状態ではありません。result の ID は provider ごとの prefix を持つため、固定値ではなく prefix、status、recipient のようにアプリケーションの判断に関係する値を assertion します。

失敗も履歴に残るため、送信件数だけで成功を判定しないでください。想定と異なる場合は、`templateId` と `templates` の key が一致するか、test ごとに新しい client を作っているかを確認します。実 provider への接続や inbox 到達は、この command では検証しません。

## skill で test を作る

この library には `/kiwa:kiwa-email` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい送信境界を test の形にする入口です。plugin の導入方法と更新方法は [kiwa の skill を使う](../../../guides/skills) にもまとめています。

次の例では、対象を表す名前を `--module` に渡し、生成先を `--output` で固定します。

```text
/kiwa:kiwa-email --module login --output tests/integration/login.email.test.ts
```

生成後は `tests/integration/login.email.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/login.email.test.ts
```

provider や対象の種類を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-email/SKILL.md) を参照してください。template rendering と delivery event は [使い方](./how-to) で確認します。
