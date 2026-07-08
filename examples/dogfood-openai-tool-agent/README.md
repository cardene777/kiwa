# dogfood-openai-tool-agent

Dogfood app 2 (v1.12-3) — an OpenAI Chat Completions tool-use agent that exercises **function calling + tool-use loop + multi-tool orchestration + parallel tool calls** across a provider-neutral interface so `@kiwa/ai-llm`'s OpenAI mock can be measured against the real Chat Completions endpoint. The resulting fidelity report feeds `@kiwa/quality-metrics` 11-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa/ai-llm` `createOpenAIMock`, per-turn response bank).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that calls `POST https://api.openai.com/v1/chat/completions` via `fetch` when `OPENAI_API_KEY` is set. Without the key each method reports `OPENAI_ENV_MISSING` so the fidelity harness records the gap without failing the suite.

Real-mode envs.

- `OPENAI_API_KEY` — required to enable real mode
- `OPENAI_MODEL` — defaults to `gpt-4o-mini`
- `OPENAI_BASE_URL` — defaults to `https://api.openai.com`

## Layout

```
src/
  tools/
    schema.ts       -- 3 declared tools (get_weather / calculator / search) + JSON Schema
    executors.ts    -- app-side tool bodies (canned data, safe arithmetic, canned search index)
  adapters/
    interface.ts    -- provider-neutral contract (validateToolSchemas / runToolLoop / runParallelToolCall)
    mock.ts         -- kiwa mock adapter with per-turn response bank
    real.ts         -- OpenAI HTTP adapter with graceful skip when env missing
  flows/
    agent-flows.ts  -- validate all schemas / ordered 3-tool loop / parallel weather flow
    fidelity.ts     -- trace-diffing harness feeding @kiwa/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- mock-mode end-to-end tests (8)
  tool-schema.test.ts          -- Task 3.1 schema validation (4)
  tool-call-sequence.test.ts   -- Task 3.2 sequence assertion (4)
  parallel-tool-use.test.ts    -- Task 3.3 parallel tool call (5)
  fidelity-report.test.ts      -- fidelity harness contract (3)
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-openai-tool-agent test
cat examples/dogfood-openai-tool-agent/quality-report/fidelity-latest.md
cat examples/dogfood-openai-tool-agent/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/ai-llm/openai-tool-agent.md` when they become canonical for a release.

## Per-turn mock response bank

OpenAI's function-calling loop has a subtle wrinkle vs Anthropic's — the follow-up turn is delivered as `role: 'tool'` messages, so the mock's response-bank lookup (which keys by the last `role: 'user'` message content) still resolves to the original prompt on turn 2+. The mock adapter therefore constructs a **fresh mock client per iteration**, each with a distinct response bank keyed by the ordered tool state (turn 0 = weather, turn 1 = calculator, turn 2 = search, turn 3+ = finalisation), and hand-rolls metric accumulation across turns. This preserves real-OpenAI shape (assistant + tool messages appended verbatim) without infinite-loop hazards.

## Release gate (11 axes)

Because the provider string is `@kiwa/ai-llm/openai-tool-agent`, `evaluateReleaseGate` runs the AI-LLM branch (11 axes = common 7 + AI-LLM 4).

- cost per request ≤ $0.10
- p95 latency ≤ 3000 ms
- total tokens ≤ 4000 / request
- accuracy (Jaccard vs real) ≥ 0.80

The default thresholds are provider-agnostic; overrides live in `packages/quality-metrics/src/gate.ts`.

## Related

- v1.12-1 `@kiwa/ai-llm` v0.1 (`packages/ai-llm/`)
- v1.12-2 dogfood app 1 (`examples/dogfood-anthropic-chatbot/`)
- v1.11-1 `@kiwa/quality-metrics` (`packages/quality-metrics/`)
- v1.12 milestone parent [#694](https://github.com/cardene777/kiwa/issues/694), this sub [#697](https://github.com/cardene777/kiwa/issues/697)
