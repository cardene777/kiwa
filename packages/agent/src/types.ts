/**
 * Agent orchestration mock — 2 系統 (LangGraph 型 state machine + OpenAI Assistants v2)
 * を 1 統一 API で扱う。 real LangGraph は Python + TS の 2 SDK があり、
 * StateGraph(addNode + addEdge + compile → invoke / stream) が中核。
 * real OpenAI Assistants v2 は Thread + Run + Message + polling が中核で、
 * run status が queued → in_progress → completed / failed / requires_action の
 * 5 状態を遷移する。
 *
 * ### 対応する mock 表現 (v1.15-3 対象)
 *
 * 1. **LangGraph 型 state machine** — `StateGraph` で node + edge を組み、
 *    `compile()` で `CompiledGraph` を得て、 `invoke(initialState)` で最終 state を、
 *    `stream(initialState)` で 中間 state を順次得る。
 * 2. **OpenAI Assistants v2** — `AssistantsClient` で `createAssistant` /
 *    `createThread` / `addMessage` / `createRun` / `run.poll` を実行、 run status を
 *    決定的に遷移させる。
 *
 * ### 対応しない (v0.2 以降)
 *
 * - Vector store / file 系 (Assistants v2 の `file_search` tool)
 * - real streaming API (SSE / websocket) — mock は同期的 stream generator
 * - LangGraph の `conditional_edges` / `interrupt` — v0.1 は addEdge + END の 2 辺のみ
 */

/**
 * 状態を持つ graph node の generic state 型。 実 test では project 側で narrow する。
 * shape は `object` に緩めて index signature 要求を避ける (real LangGraph も any-typed
 * TypedDict を許容する)。 handler / stream の内部で `{ ...state, ...patch }` で shallow
 * merge するため、 実質的な shape 制約は各 project 側の TState で narrow される。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AgentState = object;

/** Node handler — 現 state を受け取り、 更新分 (partial state) を返す。 同期 or 非同期。 */
export type NodeHandler<TState extends AgentState = AgentState> = (
  state: TState,
) => Partial<TState> | Promise<Partial<TState>>;

/** END sentinel — graph の終端を示す reserved node name。 real LangGraph の `END` に対応。 */
export const END = '__end__' as const;
export type EndNode = typeof END;

/** START sentinel — graph の起点を示す reserved node name。 real LangGraph の `START` に対応。 */
export const START = '__start__' as const;
export type StartNode = typeof START;

/**
 * Graph edge — `from` node の実行後に `to` node を実行する矢印。 `to === END`
 * で graph 終了。 v0.1 は unconditional edge のみ、 `conditional_edges` は v0.2 以降。
 */
export interface GraphEdge {
  from: string | StartNode;
  to: string | EndNode;
}

/** 1 step の実行 trace — stream / debug 用。 */
export interface GraphStep<TState extends AgentState = AgentState> {
  /** 実行した node 名。 START edge の直後は最初の node 名。 */
  node: string;
  /** node handler が返した partial state (merge 前)。 */
  patch: Partial<TState>;
  /** patch merge 後の state。 */
  state: TState;
}

/**
 * OpenAI Assistants v2 の Message role — real API に整合。 v0.1 は user + assistant
 * の 2 種、 tool_message は v0.2 以降。
 */
export type ThreadMessageRole = 'user' | 'assistant';

/** Thread message — real Assistants v2 の Message resource に対応。 */
export interface ThreadMessage {
  id: string;
  role: ThreadMessageRole;
  content: string;
  createdAt: number;
}

/**
 * Assistants v2 の Run status SSOT — real API と同じ 5 状態。 v0.1 mock は
 * queued → in_progress → completed / failed / requires_action の deterministic
 * transition を model する。
 *
 * | status | 意味 |
 * |---|---|
 * | queued | createRun 直後、 まだ polling で 1 回も進んでいない |
 * | in_progress | polling 1 回で queued から遷移、 assistant が work 中 |
 * | completed | assistant が response 生成完了、 final message が thread に append 済 |
 * | failed | handler が throw、 final error は run.lastError に格納 |
 * | requires_action | tool_calls が pending、 submit_tool_outputs で解除 |
 */
export type RunStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'requires_action';

/**
 * Assistant handler — 1 run で assistant が「thread 履歴を見て次の action を決める」
 * 1 step 分の logic。 return が string なら completed で assistant message として append、
 * return が `{ toolCalls }` なら requires_action に遷移して pending tool_calls を保持。
 */
export type AssistantHandler = (
  ctx: AssistantHandlerContext,
) => Promise<AssistantHandlerResult> | AssistantHandlerResult;

/** handler に渡す context — thread 履歴 + 現在の run。 */
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

/** handler が返す result — completed か requires_action の 2 種。 */
export type AssistantHandlerResult =
  | { kind: 'message'; content: string }
  | { kind: 'tool_calls'; toolCalls: ToolCall[] };

/**
 * Assistants v2 の tool_call — real API と同じ shape (function only)。
 * v0.1 は `type: 'function'` の 1 種のみ、 code_interpreter / file_search は v0.2 以降。
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    /** JSON string、 real API に整合。 */
    arguments: string;
  };
}

/** submit_tool_outputs で client が返す 1 tool 実行結果。 */
export interface ToolOutput {
  toolCallId: string;
  output: string;
}

/**
 * Run entity — real Assistants v2 の Run resource に対応。 v0.1 は mock なので
 * `created_at` / `expires_at` 等の unix ts は number epoch ms で近似する。
 */
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

/** Assistant resource — real API と同じく id + name + instructions を保持。 */
export interface Assistant {
  id: string;
  name: string;
  instructions: string;
  createdAt: number;
}

/** Thread resource — id + createdAt + messages 配列。 */
export interface Thread {
  id: string;
  createdAt: number;
  messages: ThreadMessage[];
}
