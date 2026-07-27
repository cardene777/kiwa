# AI LLM の境界を検証する

LLM を使う application では、モデルが正しい文章を返すかではなく、SDK から受け取る completion、stream、tool call をどのように処理するかをまず固定します。この page は OpenAI、Anthropic、Vercel AI SDK、LangChain の response shape を同じ fixture table から確認する一つの test file です。実際に使う SDK の test を残し、他の SDK の戻り値を混ぜないでください。

## provider ごとの response contract を確認する

`tests/llm-provider-boundaries.test.ts` を作り、次の内容を保存します。

```ts
import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
  type OpenAiChatCompletionsResponse,
  type OpenAiStreamChunk,
} from "@kiwa-lab/ai-llm";
import { describe, expect, it } from "vitest";

describe("LLM provider boundaries", () => {
  it("returns an OpenAI-shaped completion for a registered fixture", async () => {
    const client = createOpenAIMock({ responses: { ping: { content: "pong" } } });
    const response = (await client.chat.completions.create({
      messages: [{ role: "user", content: "ping" }],
    })) as OpenAiChatCompletionsResponse;

    expect(response.choices[0]?.message.content).toBe("pong");
  });

  it("keeps OpenAI stream chunks in their delivery order", async () => {
    const client = createOpenAIMock({
      responses: { greeting: { content: "hello world", chunks: ["hello ", "world"] } },
    });
    const stream = client.chat.completions.create({
      stream: true,
      messages: [{ role: "user", content: "greeting" }],
    }) as AsyncIterable<OpenAiStreamChunk>;
    const received: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta.content;
      if (content) {
        received.push(content);
      }
    }

    expect(received).toEqual(["hello ", "world"]);
    expect(received.join("")).toBe("hello world");
  });

  it("makes an Anthropic tool use block available to the application", async () => {
    const client = createAnthropicMock({
      responses: {
        weather: {
          content: "",
          toolCalls: [{ id: "toolu_1", name: "get_weather", arguments: "{\"city\":\"tokyo\"}" }],
        },
      },
    });
    const response = await client.messages.create({
      tools: [
        {
          name: "get_weather",
          description: "weather",
          input_schema: { type: "object", properties: { city: { type: "string" } } },
        },
      ],
      messages: [{ role: "user", content: "weather" }],
    });
    const tool = response.content.find((block) => block.type === "tool_use");

    expect(response.stop_reason).toBe("tool_use");
    expect(tool).toMatchObject({ name: "get_weather", input: { city: "tokyo" } });
  });

  it("keeps Vercel AI and LangChain response shapes separate", async () => {
    const vercel = createVercelAiMock({ responses: { hi: { content: "hello" } } });
    const langchain = createLangchainMock({ responses: { hi: { content: "hello" } } });

    const generated = await vercel.generateText({ messages: [{ role: "user", content: "hi" }] });
    const message = await langchain.invoke([{ role: "human", content: "hi" }]);

    expect(generated).toMatchObject({ text: "hello", finishReason: "stop" });
    expect(message).toMatchObject({ _type: "AIMessage", content: "hello" });
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/llm-provider-boundaries.test.ts
```

OpenAI mock の `chat.completions.create` は `stream` の指定によって completion または async iterable を返す union type です。`stream: true` の call は `OpenAiStreamChunk` として、通常の call は `OpenAiChatCompletionsResponse` として扱います。最終文字列だけではなく、各 chunk の順序を assertion にすると、欠落や逆順を検出できます。

Anthropic の tool use は `content` 内の `tool_use` block と `stop_reason` を確認します。mock は tool を実行しません。application は name の allowlist、arguments の JSON schema、利用者の認可を確認してから実 tool を呼び出し、その結果を次の model call へ渡します。

fixture key は最後の user message です。未登録 prompt は `defaultResponse` を使うため、重要な prompt を fallback に任せないでください。mock instance は test ごとに作るか、共有するときは `reset()` を呼び、前の request、metrics、tool call が次の assertion に残らないようにします。

## 実 provider へ渡す確認

この mock は API key、network、実モデルの回答品質、tool 実行、provider の rate limit、安全設定、課金を保証しません。model 更新による差や provider の response を確認する場合は、`runFidelityCheck` または実 provider を明示した integration test を別に置きます。画像、音声、transcription の token はテスト用の近似値であり、実際の billing を再現しません。

期待した fixture が返らない場合は、最後の user message が `responses` の key と一致しているかを確認します。stream を消費できない TypeScript error は、`stream: true` の response を `AsyncIterable<OpenAiStreamChunk>` として扱っているかを確認します。Anthropic tool use が見つからない場合は、fixture の `toolCalls`、tool 名、`input_schema.properties` を確認してください。
