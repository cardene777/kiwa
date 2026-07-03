# @kiwa-test/agent

## 0.1.0

### Minor Changes

- Initial release. Agent orchestration mock harness — LangGraph-style `StateGraph` (addNode + addEdge + compile → invoke / stream) と OpenAI Assistants v2 (Assistant + Thread + Message + Run + run.poll) を 1 統一 API で提供する。 low-level `StateMachine` primitive + 高 level `StateGraph` / `AssistantsClient` の 2 層構成、 6 compile validation + max steps guard + deterministic run status transition (queued → in_progress → completed / failed / requires_action) + tool_calls roundtrip (submitToolOutputs) を含む。 18 test pass。
