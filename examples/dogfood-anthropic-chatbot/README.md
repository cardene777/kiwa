# dogfood-anthropic-chatbot

Dogfood app 1 (v1.12-2) — an Anthropic Messages API chatbot that exercises **streaming + system prompt + tool_use + cost tracking** across a provider-neutral interface so `@kiwa/ai-llm`'s Anthropic mock can be measured against a real Anthropic call. The resulting fidelity report feeds `@kiwa/quality-metrics` 11-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa/ai-llm` `createAnthropicMock`, deterministic response bank)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that calls the real Anthropic Messages API via `fetch` when `ANTHROPIC_API_KEY` is set. When the env var is missing, the adapter reports each method as `ANTHROPIC_ENV_MISSING` so the fidelity harness records the gap without failing the test suite.

Real-mode envs.

- `ANTHROPIC_API_KEY` — required to enable real mode
- `ANTHROPIC_MODEL` — defaults to `claude-3-5-sonnet-latest`
- `ANTHROPIC_BASE_URL` — defaults to `https://api.anthropic.com`

## Layout

```
src/
  adapters/
    interface.ts       -- provider-neutral chatbot contract (reply / replyStream / toolLoop)
    mock.ts            -- kiwa mock adapter (createAnthropicMock backend)
    real.ts            -- Anthropic HTTP adapter with graceful skip when env missing
  flows/
    chatbot-flows.ts   -- greet / stream story / system prompt / 2-tool loop
    fidelity.ts        -- trace-diffing harness that feeds @kiwa/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 6 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/ai-llm/anthropic-chatbot.md` when they become canonical for a release.

## Release gate (11 axes)

Because the provider string is `@kiwa/ai-llm/anthropic-chatbot`, `evaluateReleaseGate` runs the AI-LLM branch (11 axes = common 7 + AI-LLM 4).

- cost per request ≤ $0.10
- p95 latency ≤ 3000 ms
- total tokens ≤ 4000 / request
- accuracy (Jaccard vs real) ≥ 0.80

The default thresholds are provider-agnostic; overrides live in `packages/quality-metrics/src/gate.ts`.

## Related

- v1.12-1 `@kiwa/ai-llm` v0.1 (`packages/ai-llm/`)
- v1.11-1 `@kiwa/quality-metrics` (`packages/quality-metrics/`)
- v1.12 milestone parent [#694](https://github.com/cardene777/kiwa/issues/694), this sub [#696](https://github.com/cardene777/kiwa/issues/696)
