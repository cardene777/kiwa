# @kiwa-lab/agent

## 0.2.0

### Minor Changes

- c119996: v1.15-3: @kiwa-lab/agent v0.1 — agent orchestration mock (LangGraph 型 state machine + OpenAI Assistants v2)

  - `packages/agent/` を新設 (v0.1.0)。 agent orchestration の 2 系統 (LangGraph 型 state machine + OpenAI Assistants v2) を 1 統一 API で扱う。 SSOT 型 (`AgentState` / `NodeHandler` / `GraphEdge` / `GraphStep` / `Assistant` / `Thread` / `ThreadMessage` / `Run` / `RunStatus` / `ToolCall` / `ToolOutput` / `AssistantHandler`) を整理、 real LangGraph + Assistants v2 の shape に整合。
  - `StateMachine` (低水準) + `StateGraph` (LangGraph 語彙 wrapper) の 2 layer 責務分離。 `addNode` + `addEdge` + `compile` + `invoke` / `stream` の 5 op を提供、 START / END sentinel は real LangGraph に対応。 compile 時 6 validation (START edge の存在 / START edge の to / edge endpoints / isolated node / START edge 1 本上限) を fail-fast、 runtime は `maxSteps` guard (default 100) で runaway loop を遮断、 `MaxStepsExceededError` を throw。
  - `AssistantsClient` — Assistants v2 の 7 op (`createAssistant` / `createThread` / `addMessage` / `createRun` / `poll` / `submitToolOutputs` / `cancel`) を mock。 run status transition (queued → in_progress → completed / failed / requires_action) を deterministic に model、 handler 結果 `{ kind: 'message' }` で completed、 `{ kind: 'tool_calls' }` で requires_action へ遷移。 `submitToolOutputs` で tool 実行結果を差し込み、 次 poll で handler が再呼出される (context.toolOutputs で結果参照可能)。 `idSeed` 指定で id 発行を deterministic 化して snapshot test 可。 `pollUntilFinal` utility で final status (completed / failed / requires_action) 到達までを 1 行で回せる。
  - `toolCall()` helper — real Assistants v2 の tool_call shape (`{ id, type: 'function', function: { name, arguments: JSON } }`) を組む shortcut、 arguments は自動 JSON.stringify。
  - 32 test 追加 (state-machine 14 / langgraph 5 / openai-assistants 11 / integration 2)、 typecheck clean、 build clean。 integration test は LangGraph 3-node pipeline から Assistants を経由して tool_call → submitToolOutputs → completed の 2-turn flow を組み、 「LangGraph node が Assistants v2 run を回す」 real production topology を mock で完結して exercise する。

## 0.1.0

### Minor Changes

- Initial release. Agent orchestration mock harness — LangGraph-style `StateGraph` (addNode + addEdge + compile → invoke / stream) と OpenAI Assistants v2 (Assistant + Thread + Message + Run + run.poll) を 1 統一 API で提供する。 low-level `StateMachine` primitive + 高 level `StateGraph` / `AssistantsClient` の 2 層構成、 6 compile validation + max steps guard + deterministic run status transition (queued → in_progress → completed / failed / requires_action) + tool_calls roundtrip (submitToolOutputs) を含む。 18 test pass。
