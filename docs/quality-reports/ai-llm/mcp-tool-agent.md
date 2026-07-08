# Fidelity — dogfood-mcp-tool-agent (v1.15-5)

Real-vs-mock behavioural fidelity for the Anthropic Claude MCP tool-use agent dogfood, produced by `examples/dogfood-mcp-tool-agent/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` 11-axis release gate.

## Baseline (real mode skipped — no `ANTHROPIC_API_KEY` and no live `@modelcontextprotocol/sdk` install)

When the harness runs without an Anthropic API key or a real MCP server binary, the real adapter emits `MCP_REAL_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/ai-llm/mcp-tool-agent
version    : 0.1.0
verdict    : FAIL (accuracy.score below the 0.80 gate — expected without a live pair)
divergences: 4 (handshake / listTools / callTool / runMcpToolLoop — real mode absent)
axes       : 11 (AI-LLM branch)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (4/4) | 70% | pass |
| perf.p95Ms | ~7 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 18 | 10 | pass |
| cost.perRequestUsd | ~$0.0003 | $0.10 | pass |
| latency.p95Ms | ~7 ms | 3000 ms | pass |
| token.totalTokens | ~200 | 4000 | pass |
| accuracy.score | ~0.45 | 0.80 | **fail** |

Accuracy is the mean Jaccard similarity between the real and mock final texts. In real-mode-skipped mode the "real" strings are seeded from expected Claude outputs so the harness has something to diff — the fail is by design and signals that fidelity is unverified without a live key. Wiring `ANTHROPIC_API_KEY` + installing `@modelcontextprotocol/sdk` promotes the report to the real baseline.

## Reproduction

Mock only.

```bash
pnpm --filter dogfood-mcp-tool-agent test
cat examples/dogfood-mcp-tool-agent/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export ANTHROPIC_MODEL=claude-3-5-sonnet-latest
# optional — override the MCP server the real adapter spawns
export MCP_SERVER_COMMAND=npx
export MCP_SERVER_ARGS="-y @modelcontextprotocol/server-everything"
pnpm --filter dogfood-mcp-tool-agent test
```

## Ops under measurement

Four provider-neutral ops on `McpAgentAdapter`.

- `handshake` — MCP `initialize` roundtrip (client capabilities + protocol version + serverInfo negotiation)
- `listTools` — MCP `tools/list` returns the 3 declared tools (weather / calculator / search) with valid JSONSchema
- `callTool` — MCP `tools/call` roundtrip (schema validate -> handler -> `ToolCallResult`, including `isError=true` + JSON-RPC error paths -32000 / -32001 / -32002 / -32003)
- `runMcpToolLoop` — Anthropic Claude drives a 3-tool orchestration (weather -> calculator -> search -> finalisation) with every tool call forwarded through the MCP client

## The 3-step MCP protocol chain (design SSOT)

1. `initialize` — client + server exchange protocol version + capabilities. Mock latches `initialized` on the server; real MCP client auto-handshakes on `Client.connect(transport)`.
2. `tools/list` — client fetches the 3 tools the server advertises and hands them to Claude as `input_schema` blocks alongside the user prompt.
3. `tools/call` — Claude emits `tool_use` blocks; each is forwarded via `McpClient.callTool` and the JSON-RPC result (text content block + `isError` flag) is fed back to Claude as a `tool_result` block.

The mock enforces the same op order as the real MCP protocol spec — a `tools/list` before `initialize` returns `NotInitialized` (-32002). The fidelity harness cannot spuriously pass on a mock that skipped the handshake.

## Per-turn mock response bank (implementation SSOT)

Anthropic Claude's tool-use loop delivers follow-up turns as user messages whose content is a list of `tool_result` blocks. `MockEngine.extractUserPrompt` looks up the last `role: 'user'` message's text content, which for turn 2+ extracts to an empty string (tool_result blocks are not text blocks). To avoid infinite loops on the same bank entry, the mock adapter constructs a **fresh `createAnthropicMock` instance per iteration**, each with a response bank keyed on the original prompt AND the empty string, cycling through weather -> calculator -> search -> finalisation entries. Metric accumulation is hand-rolled across iterations so the mock's cost / token / latency totals stay comparable with the real adapter's.

## Notes

Provider prefix `@kiwa/ai-llm/` triggers the 11-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — the 4 AI-LLM axes cost / latency / token / accuracy are added on top of the shared 7). MCP-specific fidelity (protocol version negotiation, `tools/list` shape, JSON-RPC error code parity) rolls up into the shared `fidelity.ratio` axis via the trace-diffing harness.
