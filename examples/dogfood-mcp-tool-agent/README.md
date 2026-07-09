# dogfood-mcp-tool-agent

Dogfood app (v1.15-5) — a Node.js MCP tool-use agent that exposes 3 tools (**weather / calculator / search**) through a Model Context Protocol server and drives an Anthropic Claude client through the JSON-RPC 2.0 `initialize` -> `tools/list` -> `tools/call` chain. Drivable in both `KIWA_MODE=real` (spawns `@modelcontextprotocol/sdk` stdio server + optional real Anthropic Messages API when `ANTHROPIC_API_KEY` is set) and `KIWA_MODE=mock` (`@kiwa-lab/mcp` in-process `McpServer` + `@kiwa-lab/ai-llm` `createAnthropicMock`). The resulting fidelity report feeds `@kiwa-lab/quality-metrics` 11-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/mcp` `McpServer` + `InMemoryTransport` + `@kiwa-lab/ai-llm` `createAnthropicMock` with a per-turn response bank).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that spawns a stdio child MCP server via `@modelcontextprotocol/sdk` and calls the real Anthropic Messages API via `fetch` when `ANTHROPIC_API_KEY` is set. Without the key each method reports `MCP_REAL_ENV_MISSING` so the fidelity harness records the gap without failing the suite.

Real-mode envs.

- `ANTHROPIC_API_KEY` — required to enable real mode
- `ANTHROPIC_MODEL` — defaults to `claude-3-5-sonnet-latest`
- `ANTHROPIC_BASE_URL` — defaults to `https://api.anthropic.com`
- `MCP_SERVER_COMMAND` — the binary to spawn as the real MCP server (defaults to `npx`)
- `MCP_SERVER_ARGS` — space-separated args (defaults to `-y @modelcontextprotocol/server-everything`, the reference implementation)

## Layout

```
src/
  tools/
    schema.ts       -- 3 declared MCP tools (weather / calculator / search) + inputSchema + handlers
  adapters/
    interface.ts    -- provider-neutral contract (handshake / listTools / callTool / runMcpToolLoop)
    mock.ts         -- kiwa mock adapter (@kiwa-lab/mcp McpServer + @kiwa-lab/ai-llm createAnthropicMock)
    real.ts         -- real MCP + real Anthropic adapter with graceful skip when env missing
  flows/
    agent-flows.ts  -- 4 user-facing flows (handshake+discover / claude chain / call each / warm)
    fidelity.ts     -- trace-diffing harness feeding @kiwa-lab/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 7 mock-mode end-to-end tests
  mcp-handshake.test.ts        -- 4 handshake + tools/list tests
  tool-schema.test.ts          -- 7 schema + JSON-RPC error semantics tests
  fidelity-report.test.ts      -- 3 harness contract tests
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
  perf/
    dogfood-mcp-tool-agent.perf.ts      -- 3-layer perf (serial + concurrent + memory)
    dogfood-mcp-tool-agent.live.perf.ts -- live perf against real MCP + Anthropic
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-mcp-tool-agent test
cat examples/dogfood-mcp-tool-agent/quality-report/fidelity-latest.md
cat examples/dogfood-mcp-tool-agent/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/ai-llm/mcp-tool-agent.md` when they become canonical for a release.

## The 3-step MCP protocol chain

The whole point of MCP dogfood is to exercise the protocol chain in the exact shape a real MCP-aware Claude client implements.

1. `initialize` — client + server exchange protocol version + capabilities. Mock latches its `initialized` flag on the server side; real MCP client library auto-handshakes on `Client.connect(transport)`.
2. `tools/list` — client fetches the 3 tools the server advertises (weather / calculator / search) and hands them to Claude as `input_schema` blocks alongside the user prompt.
3. `tools/call` — Claude emits `tool_use` blocks; each one is forwarded via `McpClient.callTool` and the JSON-RPC result (text content block, `isError` flag) is fed back to Claude as a `tool_result` block.

The mock enforces the same order as the real MCP protocol spec — a `tools/list` before `initialize` returns `NotInitialized` (-32002) so the fidelity harness cannot spuriously pass on a mock that skipped the handshake.

## Release gate (11 axes)

Because the provider string is `@kiwa-lab/ai-llm/mcp-tool-agent`, `evaluateReleaseGate` includes the AI-LLM branch (11 axes = common 7 + AI-LLM 4) — the mock drives a real LLM roundtrip so cost / latency / token / accuracy all apply. The MCP-specific axes (protocol version negotiation, `tools/list` shape) roll up into the shared `fidelity.ratio` axis.

- cost per request <= $0.10
- p95 latency <= 3000 ms
- total tokens <= 4000 / request
- accuracy (Jaccard vs real) >= 0.80

The default thresholds are provider-agnostic; overrides live in `packages/quality-metrics/src/gate.ts`.

## Per-turn mock response bank

Anthropic Claude's tool-use loop delivers follow-up turns as user messages whose content is a list of `tool_result` blocks. The mock's response-bank lookup keys on the last text-carrying user block, which for turn 2+ is still the original prompt. To avoid infinite tool-use loops the mock adapter constructs a **fresh mock instance per iteration**, each with a distinct response bank keyed by the ordered tool state (turn 0 = weather, turn 1 = calculator, turn 2 = search, turn 3+ = finalisation), and hand-rolls metric accumulation across turns. This preserves real Anthropic shape (assistant + user tool_result blocks appended verbatim) without infinite-loop hazards.

## Related

- v1.15-2 `@kiwa-lab/mcp` v0.1 (`packages/mcp/`)
- v1.12-3 `dogfood-openai-tool-agent` (OpenAI native function-calling counterpart)
- v1.15-4 `dogfood-multimodal-chat` (Anthropic vision counterpart)
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.15 milestone parent [#745](https://github.com/cardene777/kiwa/issues/745), this sub [#750](https://github.com/cardene777/kiwa/issues/750)
