# Agent を使う

agent の test では、モデルが正しい文章を返すことではなく、アプリケーションが管理する状態遷移を確認します。tool が必要な run は `requires_action` で止まり、アプリケーションが検証済みの tool output を返した後だけ次の `poll()` で完了します。handler が失敗した場合と利用者が中止した場合も、thread に誤った message を残さないことを確認します。

## run lifecycle を確認する

`tests/weather-assistant.test.ts` を作り、次の内容を保存します。状態グラフと Assistants 形式の run は別の API ですが、どちらもこの file で実行できます。

```ts
import { AssistantsClient, END, START, StateGraph, toolCall } from "@kiwa-lab/agent";
import { describe, expect, it } from "vitest";

describe("agent recipes", () => {
  it("merges a graph node patch into the input state", async () => {
    type State = { input: string; reply?: string };
    const graph = new StateGraph<State>()
      .addNode("reply", (state) => ({ reply: `received ${state.input}` }))
      .addEdge(START, "reply")
      .addEdge("reply", END);

    await expect(graph.compile().invoke({ input: "hello" })).resolves.toEqual({
      input: "hello",
      reply: "received hello",
    });
  });

  it("resumes a run after the application returns a tool result", async () => {
    const client = new AssistantsClient({ idSeed: "weather" });
    const assistant = client.createAssistant({
      name: "weather assistant",
      instructions: "Use the weather tool before replying.",
      handler: async ({ toolOutputs }) => {
        if (toolOutputs === undefined) {
          return {
            kind: "tool_calls" as const,
            toolCalls: [
              toolCall({
                id: "weather-call-1",
                name: "get_weather",
                arguments: { city: "Tokyo" },
              }),
            ],
          };
        }
        return {
          kind: "message" as const,
          content: `Tokyo weather is ${toolOutputs[0]?.output}`,
        };
      },
    });
    const thread = client.createThread({
      messages: [{ role: "user", content: "What is the weather in Tokyo" }],
    });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    const waitingForTool = await client.poll(run.id);
    expect(waitingForTool).toMatchObject({
      status: "requires_action",
      requiredAction: { type: "submit_tool_outputs" },
    });
    expect(waitingForTool.requiredAction?.toolCalls[0]?.function).toMatchObject({
      name: "get_weather",
      arguments: "{\"city\":\"Tokyo\"}",
    });

    expect(
      client.submitToolOutputs(run.id, {
        toolOutputs: [{ toolCallId: "weather-call-1", output: "sunny and 22 C" }],
      }).status,
    ).toBe("queued");

    await expect(client.poll(run.id)).resolves.toMatchObject({ status: "completed" });
    expect(client.getThread(thread.id)?.messages.at(-1)).toMatchObject({
      role: "assistant",
      content: "Tokyo weather is sunny and 22 C",
    });
  });

  it("records a handler failure without adding an assistant message", async () => {
    const client = new AssistantsClient({ idSeed: "failure" });
    const assistant = client.createAssistant({
      name: "unavailable assistant",
      instructions: "Reply with inventory information.",
      handler: async () => {
        throw new Error("inventory service is unavailable");
      },
    });
    const thread = client.createThread({
      messages: [{ role: "user", content: "Is item 42 available" }],
    });
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    await expect(client.poll(run.id)).resolves.toMatchObject({
      status: "failed",
      lastError: {
        code: "handler_error",
        message: "inventory service is unavailable",
      },
    });
    expect(client.getThread(thread.id)?.messages).toHaveLength(1);
  });

  it("cancels a queued run before its handler is invoked", async () => {
    const client = new AssistantsClient({ idSeed: "cancel" });
    const assistant = client.createAssistant({
      name: "slow assistant",
      instructions: "Wait for an external result.",
      handler: async () => ({ kind: "message" as const, content: "This must not run" }),
    });
    const thread = client.createThread();
    const run = client.createRun({ threadId: thread.id, assistantId: assistant.id });

    expect(client.cancel(run.id)).toMatchObject({
      status: "failed",
      lastError: { code: "cancelled" },
    });
    await expect(client.poll(run.id)).resolves.toMatchObject({ status: "failed" });
    expect(client.getThread(thread.id)?.messages).toHaveLength(0);
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/weather-assistant.test.ts
```

最初の test は node が返した部分 state が shallow merge されることを確認します。ネストした object を deep merge する API ではないため、同じ key を更新する node がある場合は、前の値をどの node が置き換えるかを assertion にします。`stream()` を使うと node ごとの patch と merge 後の state を確認できます。

二つ目の test は tool lifecycle を確認します。最初の `poll()` で得た `requiredAction.toolCalls` を読んだら、アプリケーション側で tool の許可、引数 schema、呼び出し元の認可を検証してから実行します。`submitToolOutputs()` は run を `queued` に戻すだけです。次の `poll()` が handler を tool output 付きで再実行し、message を thread へ追加します。

三つ目と四つ目の test は、失敗と中止で message を追加しないことを確認します。`handler_error` は tool provider や model provider の error code ではなく、この library が handler から受け取った例外を表します。retry 可能か、利用者へどう表示するか、実行中の process も止めるかは application 側で判断します。

## 実環境へ渡す確認

`AssistantsClient` は in-memory mock です。OpenAI API、LLM 推論、SSE streaming、vector store、file search、code interpreter を実行しません。tool call ID、個数、arguments の JSON schema も検証しません。外部 tool の allowlist、schema validation、認可、timeout、AbortSignal による cancellation は application と integration test で追加してください。

`GraphCompileError` が出た場合は START edge が一つだけか、edge の両端が登録済み node か、すべての node が END まで到達するかを確認します。`MaxStepsExceededError` は graph が循環しているか、設定した `maxSteps` が短すぎることを示します。`submitToolOutputs` の error は run が `requires_action` ではない状態で tool output を渡していることを示します。
