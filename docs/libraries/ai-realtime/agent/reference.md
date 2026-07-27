# Agent リファレンス

## 状態グラフ

`StateGraph<TState>` に `addNode(name, handler)` と `addEdge(from, to)` を追加し、`compile()` 後に実行します。`invoke(state)` は完了時の state を返します。途中の node、patch、merge 後の state を確認したいときは `stream(state)` を非同期反復します。`START` と `END` は開始と終了を表す予約 node です。

コンパイル時には開始edge、存在しないnodeへの遷移、終了経路のないnode、複数の開始edgeを検証します。実行回数は `DEFAULT_MAX_STEPS` で制限され、超過時は `MaxStepsExceededError` になります。edgeは無条件で、同じnodeから複数の遷移先を選ぶrouterはありません。

## Assistants クライアント

`new AssistantsClient(config)` で in-memory client を作り、`createAssistant`、`createThread`、`createRun` の順で run を作成します。`poll(runId)` は queued run を一段階進めます。handler が message を返せば assistant message を thread に追加して completed になり、tool calls を返せば requires_action で停止します。`submitToolOutputs` は requires_action の run だけを queued に戻します。`cancel` は未完了 run を `lastError.code` が `cancelled` の failed state にします。`toolCall` は handler が返す tool call の arguments を JSON string へ整形する helper です。

`AssistantsClientConfig` の `idSeed` を指定すると、生成IDをテストで安定させられます。IDはclient内の連番で、clientを新しく作ると連番も最初から始まります。resourceを取得する `getAssistant`、`getThread`、`getRun` はtestとdebug用で、getRunはrunのshallow copyを返します。

`poll` はqueued runだけを進めます。requires_action、completed、failedはpollしても変化しません。`submitToolOutputs` はrequires_action以外でthrowし、tool outputの内容は検証しません。tool outputを受け取ったhandlerが再びtool callsを返せば、再度requires_actionになります。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `unknown assistant id: ${assistantId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L101) |
| `unknown thread id: ${threadId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L141) |
| `unknown thread id: ${params.threadId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L167) |
| `unknown assistant id: ${params.assistantId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L170) |
| `assistant ${params.assistantId} has no handler registered — call registerHandler() first` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L173) |
| `unknown run id: ${runId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L205) |
| `pollUntilFinal exceeded ${maxAttempts} attempts for run ${runId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L227) |
| `unknown run id: ${runId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L242) |
| `run ${runId} is not requires_action (current: ${run.status}), cannot submit tool outputs` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L245) |
| `unknown run id: ${runId}` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L271) |
| `run ${run.id} references missing thread or handler` | [packages/agent/src/openai-assistants.ts](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L303) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `AssistantsClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L62) `packages/agent/src/openai-assistants.ts`

Assistants v2 client mock — real openai.beta.assistants の thin wrapper API。 assistant / thread / run resource を in-memory Map で保持、 id は seed 付き incrementing で generate する。

```ts
export declare class AssistantsClient {
  private readonly assistants = new Map<string, Assistant>();
  private readonly threads = new Map<string, Thread>();
  private readonly runs = new Map<string, Run>();
  private readonly handlers = new Map<string, AssistantHandler>();
  private nextId = 1;
  private readonly idSeed: string;
  constructor(config: AssistantsClientConfig = {});
  createAssistant(params: { name: string; instructions: string; handler?: AssistantHandler }): Assistant;
  registerHandler(assistantId: string, handler: AssistantHandler): void;
  getAssistant(id: string): Assistant | undefined;
  createThread(params: { messages?: Array<{ role: ThreadMessageRole; content: string }> } = {}): Thread;
  addMessage(threadId: string, params: { role: ThreadMessageRole; content: string }): ThreadMessage;
  getThread(id: string): Thread | undefined;
  createRun(params: { threadId: string; assistantId: string }): Run;
  async poll(runId: string): Promise<Run>;
  async pollUntilFinal(runId: string, options: { maxAttempts?: number } = {}): Promise<Run>;
  submitToolOutputs(runId: string, params: { toolOutputs: ToolOutput[] }): Run;
  cancel(runId: string): Run;
  getRun(id: string): Run | undefined;
  private readonly pendingToolOutputs = new Map<string, readonly ToolOutput[]>();
  private async executeRun(run: Run): Promise<Run>;
  private mintId(kind: string): string;
}
```

#### `CompiledGraph`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts#L85) `packages/agent/src/langgraph.ts`

CompiledGraph — StateGraph.compile() 後の実行可能 graph。 real LangGraph の compiled graph に対応、 invoke + stream の 2 実行モード。

```ts
export declare class CompiledGraph {
  constructor(private readonly machine: StateMachine<TState>);
  async invoke(initialState: TState, options?: RunOptions): Promise<TState>;
  async *stream(
    initialState: TState,
    options?: RunOptions,
  ): AsyncGenerator<GraphStep<TState>, void, void>;
}
```

#### `DEFAULT_MAX_STEPS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L35) `packages/agent/src/state-machine.ts`

runtime cycle 検出 — 同一 node が 2 回以上 visit されたら循環と判定する。 real LangGraph は cycle 許容だが (agent loop の中核)、 v0.1 mock は simplicity 優先で 「visit 上限を突破したら halt + throw」 に倒す。 default 上限は 100 step。

```ts
export declare const DEFAULT_MAX_STEPS: 100;
```

#### `END`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L40) `packages/agent/src/types.ts`

END sentinel — graph の終端を示す reserved node name。 real LangGraph の `END` に対応。

```ts
export declare const END: "__end__";
```

#### `GraphCompileError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L44) `packages/agent/src/state-machine.ts`

compile 失敗 error — validate 時に投げる。

```ts
export declare class GraphCompileError extends Error {
  constructor(message: string);
}
```

#### `MaxStepsExceededError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L52) `packages/agent/src/state-machine.ts`

runtime 最大 step 突破 error。

```ts
export declare class MaxStepsExceededError extends Error {
  readonly steps: number;
  constructor(steps: number);
}
```

#### `START`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L44) `packages/agent/src/types.ts`

START sentinel — graph の起点を示す reserved node name。 real LangGraph の `START` に対応。

```ts
export declare const START: "__start__";
```

#### `StateGraph`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts#L46) `packages/agent/src/langgraph.ts`

StateGraph builder — node / edge を組んで compile() で `CompiledGraph` を得る。 real LangGraph の `StateGraph` に対応。

```ts
export declare class StateGraph {
  private readonly machine = new StateMachine<TState>();
  addNode(name: string, handler: NodeHandler<TState>): this;
  addEdge(from: string | typeof START, to: string | typeof END): this;
  compile(): CompiledGraph<TState>;
  get nodeCount(): number;
  get edgeCount(): number;
}
```

#### `StateMachine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L65) `packages/agent/src/state-machine.ts`

StateMachine — pure state graph 実行 engine。 langgraph.ts の StateGraph が 内部で使う。 直接叩くのも可 (低水準 API として export)。

```ts
export declare class StateMachine {
  private readonly nodes = new Map<string, NodeHandler<TState>>();
  private readonly edges: GraphEdge[] = [];
  private compiled = false;
  addNode(name: string, handler: NodeHandler<TState>): this;
  addEdge(from: string, to: string): this;
  get nodeCount(): number;
  get edgeCount(): number;
  get isCompiled(): boolean;
  compile(): this;
  async invoke(initialState: TState, options: RunOptions = {}): Promise<TState>;
  async *stream(
    initialState: TState,
    options: RunOptions = {},
  ): AsyncGenerator<{ node: string; patch: Partial<TState>; state: TState }, void, void>;
  private startNode(): string | typeof END;
  private nextNode(from: string): string | typeof END | undefined;
}
```

#### `toolCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L367) `packages/agent/src/openai-assistants.ts`

ToolCall builder shortcut — test で `{ id, type: 'function', function: { name, arguments: JSON } }` を書くのは冗長なので helper を出す。

```ts
export function toolCall(params: {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}): ToolCall;
```

### 型

#### `AgentState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L32) `packages/agent/src/types.ts`

状態を持つ graph node の generic state 型。 実 test では project 側で narrow する。 shape は `object` に緩めて index signature 要求を避ける (real LangGraph も any-typed TypedDict を許容する)。 handler / stream の内部で `{ ...state, ...patch }` で shallow merge するため、 実質的な shape 制約は各 project 側の TState で narrow される。

```ts
export type AgentState = object;
```

#### `Assistant`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L171) `packages/agent/src/types.ts`

Assistant resource — real API と同じく id + name + instructions を保持。

```ts
export interface Assistant {
  id: string;
  name: string;
  instructions: string;
  createdAt: number;
}
```

#### `AssistantHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L105) `packages/agent/src/types.ts`

Assistant handler — 1 run で assistant が「thread 履歴を見て次の action を決める」 1 step 分の logic。 return が string なら completed で assistant message として append、 return が `{ toolCalls }` なら requires_action に遷移して pending tool_calls を保持。

```ts
export type AssistantHandler = (
  ctx: AssistantHandlerContext,
) => Promise<AssistantHandlerResult> | AssistantHandlerResult;
```

#### `AssistantHandlerContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L110) `packages/agent/src/types.ts`

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

#### `AssistantHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L122) `packages/agent/src/types.ts`

handler が返す result — completed か requires_action の 2 種。

```ts
export type AssistantHandlerResult =
  | { kind: 'message'; content: string }
  | { kind: 'tool_calls'; toolCalls: ToolCall[] };
```

#### `AssistantsClientConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts#L52) `packages/agent/src/openai-assistants.ts`

AssistantsClient config。 handler は必須 (registerHandler で後付けも可)。

```ts
export interface AssistantsClientConfig {
  /** id 生成の deterministic 化用 seed prefix (test の snapshot 用)、 default random。 */
  idSeed?: string;
}
```

#### `EndNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L41) `packages/agent/src/types.ts`

```ts
export type EndNode = typeof END;
```

#### `GraphEdge`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L51) `packages/agent/src/types.ts`

Graph edge — `from` node の実行後に `to` node を実行する矢印。 `to === END` で graph 終了。 v0.1 は unconditional edge のみ、 `conditional_edges` は v0.2 以降。

```ts
export interface GraphEdge {
  from: string | StartNode;
  to: string | EndNode;
}
```

#### `GraphStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L57) `packages/agent/src/types.ts`

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

#### `NodeHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L35) `packages/agent/src/types.ts`

Node handler — 現 state を受け取り、 更新分 (partial state) を返す。 同期 or 非同期。

```ts
export type NodeHandler<TState extends AgentState = AgentState> = (
  state: TState,
) => Partial<TState> | Promise<Partial<TState>>;
```

#### `Run`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L150) `packages/agent/src/types.ts`

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

#### `RunOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts#L38) `packages/agent/src/state-machine.ts`

invoke / stream 実行時 config。

```ts
export interface RunOptions {
  /** 最大 step 数、 突破したら `MaxStepsExceededError` を throw。 default 100。 */
  maxSteps?: number;
}
```

#### `RunStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L93) `packages/agent/src/types.ts`

Assistants v2 の Run status SSOT — real API と同じ 5 状態。 v0.1 mock は queued → in_progress → completed / failed / requires_action の deterministic transition を model する。 | status | 意味 | |---|---| | queued | createRun 直後、 まだ polling で 1 回も進んでいない | | in_progress | polling 1 回で queued から遷移、 assistant が work 中 | | completed | assistant が response 生成完了、 final message が thread に append 済 | | failed | handler が throw、 final error は run.lastError に格納 | | requires_action | tool_calls が pending、 submit_tool_outputs で解除 |

```ts
export type RunStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'requires_action';
```

#### `StartNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L45) `packages/agent/src/types.ts`

```ts
export type StartNode = typeof START;
```

#### `Thread`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L179) `packages/agent/src/types.ts`

Thread resource — id + createdAt + messages 配列。

```ts
export interface Thread {
  id: string;
  createdAt: number;
  messages: ThreadMessage[];
}
```

#### `ThreadMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L73) `packages/agent/src/types.ts`

Thread message — real Assistants v2 の Message resource に対応。

```ts
export interface ThreadMessage {
  id: string;
  role: ThreadMessageRole;
  content: string;
  createdAt: number;
}
```

#### `ThreadMessageRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L70) `packages/agent/src/types.ts`

OpenAI Assistants v2 の Message role — real API に整合。 v0.1 は user + assistant の 2 種、 tool_message は v0.2 以降。

```ts
export type ThreadMessageRole = 'user' | 'assistant';
```

#### `ToolCall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L130) `packages/agent/src/types.ts`

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

#### `ToolOutput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/types.ts#L141) `packages/agent/src/types.ts`

submit_tool_outputs で client が返す 1 tool 実行結果。

```ts
export interface ToolOutput {
  toolCallId: string;
  output: string;
}
```
<!-- kiwa-public-api:end -->
