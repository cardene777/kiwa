# @kiwa-lab/data を始める

このチュートリアルでは、同じ message が nack のあと再配送され、三回目に ack されることを確認します。完了すると、worker の at-least-once delivery を待ち時間に依存せずに検証する test が一つできます。

## 依存関係を追加する

`@kiwa-lab/data` は Vitest を peer dependency として使います。test project に追加します。

```bash
pnpm add -D @kiwa-lab/data vitest
```

## 最初の test を書く

`tests/queue-delivery.test.ts` を作成します。`expectAtLeastOnce` は consumer を登録して message を送り、指定回数に達するまで nack、最後に ack します。内部で delivery の完了を待つため、この最小ケースで任意の `setTimeout` を書く必要はありません。

```ts
import { expect, it } from "vitest";
import { expectAtLeastOnce, setupQueueEnv } from "@kiwa-lab/data";

it("retries a message before acknowledging it", async () => {
  const env = await setupQueueEnv<string>({
    mode: "mock",
    maxReceiveCount: 3,
  });

  try {
    const deliveries = await expectAtLeastOnce(
      env.client,
      "refresh",
      3,
      expect,
    );

    expect(deliveries).toBe(3);
    expect(env.client.size()).toBe(0);
    expect(env.client.dlqSize()).toBe(0);
  } finally {
    await env.stop();
  }
});
```

`stop()` は現在の in-memory implementation では resource を閉じませんが、test environment の lifecycle を同じ形に保つために必ず `finally` で呼びます。実 provider に切り替えた将来の test でも cleanup の位置を変えずに済みます。

## 実行して結果を読む

```bash
pnpm exec vitest run tests/queue-delivery.test.ts
```

成功時は Vitest が `1 passed` と表示し、delivery count は三、queue と DLQ はどちらも空です。`maxReceiveCount` を二に下げると三回目は配信されず、entry は DLQ へ移ります。`mode` の typo で失敗した場合は `mock` または `live` を指定してください。どちらを選んでもこの package 単体では外部 queue へ接続しません。

## skill から仕様ベースの test を作る

Claude Code を使う場合は、[skills guide](/guides/skills) の導入後に data layer の specification から test の下書きを生成できます。

初回は plugin を導入して再読込します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer data --module daily-sync
/kiwa:kiwa-data --module daily-sync
```

生成後は message body、retry 回数、DLQ の期待結果をアプリの契約に合わせて確認します。出力先を変更していなければ、生成 file だけを実行してから採用してください。

```bash
pnpm exec vitest run tests/spec/data/daily-sync.test.ts
```

layer の入力と出力先は [kiwa-data の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-data/SKILL.md) に従います。
