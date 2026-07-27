# @kiwa-lab/ai-llm はじめる

OpenAI Chat Completions 互換の mock に fixture を登録し、アプリケーションが completion の本文を受け取るところまでを確認します。fixture key は最後の user message の内容です。

## インストール

```bash
pnpm add -D @kiwa-lab/ai-llm vitest
```

品質レポートへ渡す場合だけ `@kiwa-lab/quality-metrics` も追加します。

## 固定応答を検証する

```ts
import { expect, it } from "vitest";
import {
  createOpenAIMock,
  type OpenAiChatCompletionsResponse,
} from "@kiwa-lab/ai-llm";

it("登録した prompt へ fixture を返す", async () => {
  const client = createOpenAIMock({
    responses: {
      ping: { content: "pong" },
    },
  });

  const response = (await client.chat.completions.create({
    messages: [{ role: "user", content: "ping" }],
  })) as OpenAiChatCompletionsResponse;

  expect(response.choices[0]?.message.content).toBe("pong");
});
```

response table に登録していない prompt は `defaultResponse` を使います。重要な prompt を fallback に任せると、fixture の登録漏れと意図した既定応答を区別できません。テスト対象の prompt は `responses` に明示してください。

この例を `tests/openai-chat.test.ts` に保存し、`pnpm exec vitest run tests/openai-chat.test.ts` を実行します。成功は OpenAI SDK 形式の completion をアプリが読めたことを示します。実モデルの品質や API key、rate limit は確認していません。

## metrics を確認する

各 mock は累積の request、token、cost、latency を `getMetrics()` で返します。本文の assertion と同じ test で利用量を固定する必要がある場合は、fixture の usage と `costPer1kTokens` を明示します。test 間で同じ mock を共有する場合は、`reset()` で metrics と履歴を初期化します。

次は [使い方](./how-to) で stream と未登録 prompt の扱いを確認します。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、fixture key、期待する completion、実 provider で確認すべき事項を直接確認してください。仕様から test の土台を作る場合は、初回だけ kiwa plugin を導入し、対象が unit、API、UI、E2E のどれかに合う skill を選びます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

会話仕様から unit test の土台を作るなら、次の二つを順に実行します。`kiwa-design` が prompt と期待応答を仕様として整理し、`kiwa-vitest` が Vitest の test file を作ります。生成物をそのまま信頼せず、fixture key が最後の user message と一致すること、stream の chunk 順序、tool call の name と arguments、期待応答をこの Quickstart と照合してください。

```text
/kiwa:kiwa-design --layer unit --module chat-response
/kiwa:kiwa-vitest --module chat-response
```

既定の出力先を使った場合は、次で生成された file だけを実行します。

```bash
pnpm exec vitest run test/unit/chat-response.test.ts
```

この確認で保証できるのは SDK との結合です。モデルの品質、tool の実行、API key、rate limit は実 provider を接続した fidelity または integration test で別に確認します。
