# Fidelity — dogfood-openai-tool-agent (v1.12-3)

Real-vs-mock behavioural fidelity for the OpenAI Chat Completions tool-use agent dogfood, produced by `examples/dogfood-openai-tool-agent/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` 11-axis release gate.

## Baseline (real mode skipped — no `OPENAI_API_KEY`)

When the harness runs without an OpenAI API key, the real adapter emits `OPENAI_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/ai-llm/openai-tool-agent
version    : 0.1.0
verdict    : FAIL (accuracy.score 0.65 vs threshold 0.80)
divergences: 3 (validateToolSchemas / runToolLoop / runParallelToolCall — real mode absent)
axes       : 11 (AI-LLM branch)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (3/3) | 70% | pass |
| perf.p95Ms | 12.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 18 | 10 | pass |
| cost.perRequestUsd | $0.0000 | $0.10 | pass |
| latency.p95Ms | 12.00 ms | 3000 ms | pass |
| token.totalTokens | 71 | 4000 | pass |
| accuracy.score | 0.65 | 0.80 | **fail** |

Accuracy is the mean Jaccard similarity between the real and mock final texts. In real-mode-skipped mode the "real" strings are seeded from expected OpenAI outputs so the harness has something to diff — the fail is by design and signals that fidelity is unverified without a live key. Wiring `OPENAI_API_KEY` and running against `gpt-4o-mini` promotes the report to the real baseline.

## Reproduction

```bash
pnpm --filter dogfood-openai-tool-agent test
cat examples/dogfood-openai-tool-agent/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini
pnpm --filter dogfood-openai-tool-agent test
```

## Ops under measurement

Three provider-neutral ops on `AgentAdapter`.

- `validateToolSchemas` — Task 3.1 — every declared tool schema round-trips through the adapter's tool-declaration path
- `runToolLoop` — Task 3.2 — sequential 3-tool orchestration (`get_weather` → `calculator` → `search`) with per-turn tool_result follow-up
- `runParallelToolCall` — Task 3.3 — two parallel `get_weather` calls emitted in a single assistant turn, resolved concurrently, and finalised in one follow-up turn

## Per-turn mock response bank (design SSOT)

OpenAI's function-calling loop keys follow-up turns on `role: 'tool'` messages, so `MockEngine.extractUserPrompt` (which walks backwards for the last `role: 'user'` message) still resolves to the original prompt on turn 2+. The mock adapter therefore constructs a **fresh `createOpenAIMock` instance per iteration** whose response bank cycles through weather → calculator → search → finalisation entries — no changes to the shared `MockEngine`. Metric accumulation is hand-rolled across iterations so the mock's cost / token / latency totals stay comparable with the real adapter's.

## Notes

Provider prefix `@kiwa-lab/ai-llm/` triggers the 11-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — the 4 AI-LLM axes cost / latency / token / accuracy are added on top of the shared 7).
