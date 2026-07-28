---
title: "@kiwa-lab/agent types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/agent</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>END</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L40) <code v-pre>packages/agent/src/types.ts</code>

END sentinel — graph の終端を示す reserved node name。 real LangGraph の `END` に対応。

```ts
export declare const END: "__end__";
```

#### <code v-pre>START</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L44) <code v-pre>packages/agent/src/types.ts</code>

START sentinel — graph の起点を示す reserved node name。 real LangGraph の `START` に対応。

```ts
export declare const START: "__start__";
```

### 型

#### <code v-pre>AgentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L32) <code v-pre>packages/agent/src/types.ts</code>

状態を持つ graph node の generic state 型。 実 test では project 側で narrow する。 shape は `object` に緩めて index signature 要求を避ける (real LangGraph も any-typed TypedDict を許容する)。 handler / stream の内部で `{ ...state, ...patch }` で shallow merge するため、 実質的な shape 制約は各 project 側の TState で narrow される。

```ts
export type AgentState = object;
```

#### <code v-pre>Assistant</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L171) <code v-pre>packages/agent/src/types.ts</code>

Assistant resource — real API と同じく id + name + instructions を保持。

```ts
export interface Assistant {
    id: string;
    name: string;
    instructions: string;
    createdAt: number;
}
```

#### <code v-pre>AssistantHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L105) <code v-pre>packages/agent/src/types.ts</code>

Assistant handler — 1 run で assistant が「thread 履歴を見て次の action を決める」 1 step 分の logic。 return が string なら completed で assistant message として append、 return が `{ toolCalls }` なら requires_action に遷移して pending tool_calls を保持。

```ts
export type AssistantHandler = (ctx: AssistantHandlerContext) => Promise<AssistantHandlerResult> | AssistantHandlerResult;
```

#### <code v-pre>AssistantHandlerContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L110) <code v-pre>packages/agent/src/types.ts</code>

handler に渡す context — thread 履歴 + 現在の run。

```ts
export interface AssistantHandlerContext {
    thread: readonly ThreadMessage[];
    runId: string;
    assistantId: string;
    /**
     * 前 step の tool 実行結果 (submit_tool_outputs で受け取ったもの)、 requires_action
     * を解除した直後の再呼出でのみ set される。 それ以外は undefined。
     */
    toolOutputs?: readonly ToolOutput[];
}
```

#### <code v-pre>AssistantHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L122) <code v-pre>packages/agent/src/types.ts</code>

handler が返す result — completed か requires_action の 2 種。

```ts
export type AssistantHandlerResult = {
    kind: 'message';
    content: string;
} | {
    kind: 'tool_calls';
    toolCalls: ToolCall[];
};
```

#### <code v-pre>EndNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L41) <code v-pre>packages/agent/src/types.ts</code>

```ts
export type EndNode = typeof END;
```

#### <code v-pre>GraphEdge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L51) <code v-pre>packages/agent/src/types.ts</code>

Graph edge — `from` node の実行後に `to` node を実行する矢印。 `to === END` で graph 終了。 v0.1 は unconditional edge のみ、 `conditional_edges` は v0.2 以降。

```ts
export interface GraphEdge {
    from: string | StartNode;
    to: string | EndNode;
}
```

#### <code v-pre>GraphStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L57) <code v-pre>packages/agent/src/types.ts</code>

1 step の実行 trace — stream / debug 用。

```ts
export interface GraphStep<TState extends AgentState = AgentState> {
    /** 実行した node 名。 START edge の直後は最初の node 名。 */
    node: string;
    /** node handler が返した partial state (merge 前)。 */
    patch: Partial<TState>;
    /** patch merge 後の state。 */
    state: TState;
}
```

#### <code v-pre>NodeHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L35) <code v-pre>packages/agent/src/types.ts</code>

Node handler — 現 state を受け取り、 更新分 (partial state) を返す。 同期 or 非同期。

```ts
export type NodeHandler<TState extends AgentState = AgentState> = (state: TState) => Partial<TState> | Promise<Partial<TState>>;
```

#### <code v-pre>Run</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L150) <code v-pre>packages/agent/src/types.ts</code>

Run entity — real Assistants v2 の Run resource に対応。 v0.1 は mock なので `created_at` / `expires_at` 等の unix ts は number epoch ms で近似する。

```ts
export interface Run {
    id: string;
    threadId: string;
    assistantId: string;
    status: RunStatus;
    createdAt: number;
    completedAt?: number;
    failedAt?: number;
    /** requires_action 時に pending の tool_calls、 それ以外は undefined。 */
    requiredAction?: {
        type: 'submit_tool_outputs';
        toolCalls: ToolCall[];
    };
    /** failed 時のみ set、 real API の Run.last_error に整合。 */
    lastError?: {
        code: string;
        message: string;
    };
}
```

#### <code v-pre>RunStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L93) <code v-pre>packages/agent/src/types.ts</code>

Assistants v2 の Run status SSOT — real API と同じ 5 状態。 v0.1 mock は queued → in_progress → completed / failed / requires_action の deterministic transition を model する。 | status | 意味 | |---|---| | queued | createRun 直後、 まだ polling で 1 回も進んでいない | | in_progress | polling 1 回で queued から遷移、 assistant が work 中 | | completed | assistant が response 生成完了、 final message が thread に append 済 | | failed | handler が throw、 final error は run.lastError に格納 | | requires_action | tool_calls が pending、 submit_tool_outputs で解除 |

```ts
export type RunStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'requires_action';
```

#### <code v-pre>StartNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L45) <code v-pre>packages/agent/src/types.ts</code>

```ts
export type StartNode = typeof START;
```

#### <code v-pre>Thread</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L179) <code v-pre>packages/agent/src/types.ts</code>

Thread resource — id + createdAt + messages 配列。

```ts
export interface Thread {
    id: string;
    createdAt: number;
    messages: ThreadMessage[];
}
```

#### <code v-pre>ThreadMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L73) <code v-pre>packages/agent/src/types.ts</code>

Thread message — real Assistants v2 の Message resource に対応。

```ts
export interface ThreadMessage {
    id: string;
    role: ThreadMessageRole;
    content: string;
    createdAt: number;
}
```

#### <code v-pre>ThreadMessageRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L70) <code v-pre>packages/agent/src/types.ts</code>

OpenAI Assistants v2 の Message role — real API に整合。 v0.1 は user + assistant の 2 種、 tool_message は v0.2 以降。

```ts
export type ThreadMessageRole = 'user' | 'assistant';
```

#### <code v-pre>ToolCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L130) <code v-pre>packages/agent/src/types.ts</code>

Assistants v2 の tool_call — real API と同じ shape (function only)。 v0.1 は `type: 'function'` の 1 種のみ、 code_interpreter / file_search は v0.2 以降。

```ts
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        /** JSON string、 real API に整合。 */
        arguments: string;
    };
}
```

#### <code v-pre>ToolOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L141) <code v-pre>packages/agent/src/types.ts</code>

submit_tool_outputs で client が返す 1 tool 実行結果。

```ts
export interface ToolOutput {
    toolCallId: string;
    output: string;
}
```
