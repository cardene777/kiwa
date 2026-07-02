# Fidelity — dogfood-anthropic-chatbot (v1.12-2)

Real-vs-mock behavioural fidelity for the Anthropic Messages API dogfood, produced by `examples/dogfood-anthropic-chatbot/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` 11-axis release gate.

## Baseline (real mode skipped — no `ANTHROPIC_API_KEY`)

When the harness runs without an Anthropic API key, the real adapter emits `ANTHROPIC_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/ai-llm/anthropic-chatbot
version    : 0.1.0
verdict    : FAIL (accuracy.score 0.39 vs threshold 0.80)
divergences: 3 (reply / replyStream / toolLoop — real mode absent)
axes       : 11 (AI-LLM branch)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (3/3) | 70% | pass |
| perf.p95Ms | 16.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 12 | 10 | pass |
| cost.perRequestUsd | $0.0003 | $0.10 | pass |
| latency.p95Ms | 16.00 ms | 3000 ms | pass |
| token.totalTokens | 52 | 4000 | pass |
| accuracy.score | 0.39 | 0.80 | **fail** |

Accuracy is the mean Jaccard similarity between the real and mock text replies. In real-mode-skipped mode the "real" strings are seeded from expected Anthropic outputs so the harness has something to diff — the fail is by design and signals that fidelity is unverified without a live key. Wiring `ANTHROPIC_API_KEY` and running against `claude-3-5-sonnet-latest` promotes the report to the real baseline.

## Reproduction

```bash
pnpm --filter examples-dogfood-anthropic-chatbot test
cat examples/dogfood-anthropic-chatbot/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export ANTHROPIC_MODEL=claude-3-5-sonnet-latest
pnpm --filter examples-dogfood-anthropic-chatbot test
```

## Ops under measurement

Three provider-neutral ops on `ChatbotAdapter`.

- `reply` — non-streaming Messages API call with optional system prompt
- `replyStream` — streaming Messages API call, chunks accumulated
- `toolLoop` — 2-tool orchestration (`get_weather` + `calculator`) with mid-loop `tool_result` follow-up

## Notes

The mock's response bank in `examples/dogfood-anthropic-chatbot/src/adapters/mock.ts` keys by user prompt string. The 2-tool loop finalisation matches on empty prompt because the follow-up user turn only carries `tool_result` blocks (ai-llm's Anthropic adapter maps non-text content to an empty string on the way into the shared `MockEngine`).

Provider prefix `@kiwa-test/ai-llm/` triggers the 11-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — the 4 AI-LLM axes cost / latency / token / accuracy are added on top of the shared 7).
