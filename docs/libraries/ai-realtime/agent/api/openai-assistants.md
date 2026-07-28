---
title: "@kiwa-lab/agent openai-assistants の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/agent</code> <code v-pre>openai-assistants</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>AssistantsClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L62) <code v-pre>packages/agent/src/openai-assistants.ts</code>

Assistants v2 client mock — real openai.beta.assistants の thin wrapper API。 assistant / thread / run resource を in-memory Map で保持、 id は seed 付き incrementing で generate する。

```ts
/**
 * Assistants v2 client mock — real openai.beta.assistants の thin wrapper API。
 * assistant / thread / run resource を in-memory Map で保持、 id は seed 付き
 * incrementing で generate する。
 */
export declare class AssistantsClient {
    constructor(config?: AssistantsClientConfig);
    /**
     * Assistant resource を発行。 real API と同じく id + name + instructions を持つ。
     * handler は必須ではないが、 createRun() までに registerHandler() で紐付け必要。
     */
    createAssistant(params: {
        name: string;
        instructions: string;
        handler?: AssistantHandler;
    }): Assistant;
    /**
     * assistant に handler を後付け登録。 test で「先に assistant を作って後で handler
     * を差し替える」 シナリオ (behavior injection) 用。
     */
    registerHandler(assistantId: string, handler: AssistantHandler): void;
    /** assistant 参照 (test / debug 用)。 */
    getAssistant(id: string): Assistant | undefined;
    /**
     * Thread resource を発行。 初期 messages を渡すと user message として append される
     * (real API と同じ挙動)。
     */
    createThread(params?: {
        messages?: Array<{
            role: ThreadMessageRole;
            content: string;
        }>;
    }): Thread;
    /**
     * Thread に message を append。 real API と同じく role は user / assistant、
     * v0.1 は tool role 未対応 (Assistants v2 の tool message は submitToolOutputs
     * 経路に統一)。
     */
    addMessage(threadId: string, params: {
        role: ThreadMessageRole;
        content: string;
    }): ThreadMessage;
    /** thread 参照 (test / debug 用、 messages は readonly view として返す)。 */
    getThread(id: string): Thread | undefined;
    /**
     * Run 発行 — thread + assistant を紐付けた Run resource (queued) を返す。 実際の
     * assistant 実行は `poll(runId)` を呼び出した時に走る (real API の polling model と
     * 同構造、 real でも create 直後は queued で 1 tick 後に進行する)。
     */
    createRun(params: {
        threadId: string;
        assistantId: string;
    }): Run;
    /**
     * poll — Run の 1 tick を進める。 real API polling は同じ retrieveRun で status
     * を確認する model、 mock は「poll 呼出 = 1 tick 進行」 と扱う。 呼出後の Run
     * (copy) を返す。 呼出前 status に応じて next status が deterministic に決まる。
     *
     * 1. queued → poll 1 回目で handler 呼出、 result に応じて completed / requires_action / failed
     * 2. in_progress → poll 呼出でも遷移しない (v0.1 は 1 tick = 1 handler 呼出 model、
     *    in_progress は queued → completed の間の transient state として使用しない)、
     *    そのまま返す。 実質 queued と completed / requires_action / failed の 3 状態が
     *    caller に見える。
     * 3. requires_action → poll でも遷移しない (submitToolOutputs 待ち)
     * 4. completed / failed → 変化なし、 そのまま返す
     */
    poll(runId: string): Promise<Run>;
    /**
     * pollUntilFinal — completed / failed / requires_action に到達するまで poll を
     * 繰り返す utility。 requires_action は「final ではない」 が「client 側 action 待ち」
     * なので、 これも終端扱いで返す (client 側で submitToolOutputs → 再度 pollUntilFinal
     * を呼ぶ想定)。 real API では intervalMs で backoff するが、 mock は同期実行のため
     * poll = 1 tick 進行 model で maxAttempts のみ意味を持つ。
     */
    pollUntilFinal(runId: string, options?: {
        maxAttempts?: number;
    }): Promise<Run>;
    /**
     * submitToolOutputs — requires_action 中の Run に tool 実行結果を差し込む。 status
     * を queued に戻し、 次 poll で handler が再度呼び出される (context.toolOutputs
     * で結果参照可能)。 real API と同じ semantic。
     */
    submitToolOutputs(runId: string, params: {
        toolOutputs: ToolOutput[];
    }): Run;
    /**
     * cancel — queued / in_progress の Run を強制終了させる。 status は failed に倒す
     * (real API は cancelled status を持つが v0.1 は failed に統合、 lastError.code =
     * 'cancelled' で識別可能)。
     */
    cancel(runId: string): Run;
    /** run 参照 (test / debug 用)。 */
    getRun(id: string): Run | undefined;
}
```

#### <code v-pre>toolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L367) <code v-pre>packages/agent/src/openai-assistants.ts</code>

ToolCall builder shortcut — test で `{ id, type: 'function', function: { name, arguments: JSON } }` を書くのは冗長なので helper を出す。

```ts
export declare function toolCall(params: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}): ToolCall;
```

### 型

#### <code v-pre>AssistantsClientConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L52) <code v-pre>packages/agent/src/openai-assistants.ts</code>

AssistantsClient config。 handler は必須 (registerHandler で後付けも可)。

```ts
export interface AssistantsClientConfig {
    /** id 生成の deterministic 化用 seed prefix (test の snapshot 用)、 default random。 */
    idSeed?: string;
}
```
