# Fidelity — dogfood-multimodal-chat (v1.15-4)

Real-vs-mock behavioural fidelity for the Anthropic vision (multimodal) dogfood, produced by `examples/dogfood-multimodal-chat/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` 11-axis release gate.

## Baseline (real mode skipped — no `ANTHROPIC_API_KEY`)

When the harness runs without an Anthropic API key, the real adapter emits `ANTHROPIC_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/ai-llm/multimodal-chat
version    : 0.1.0
verdict    : FAIL (accuracy.score 0.30 vs threshold 0.80)
divergences: 3 (describeImage / streamDescribeImage / compareImages — real mode absent)
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
| cost.perRequestUsd | $0.0049 | $0.10 | pass |
| latency.p95Ms | 16.00 ms | 3000 ms | pass |
| token.totalTokens | 1541 | 4000 | pass |
| accuracy.score | 0.30 | 0.80 | **fail** |

Accuracy is the mean Jaccard similarity between the real and mock text replies. In real-mode-skipped mode the "real" strings are seeded from expected Anthropic vision outputs so the harness has something to diff — the fail is by design and signals that fidelity is unverified without a live key. Wiring `ANTHROPIC_API_KEY` and running against `claude-3-5-sonnet-latest` promotes the report to the real baseline.

Vision requests are substantially heavier than text-only chat — the per-request token count (~1541) reflects the pre-flight image token cost (1200 tokens at `detail: auto` for a single image, 2400 for 2-image compare) plus the small text delta. Cost per request is ~15× the text-only baseline, matching the Anthropic pricing table for image content blocks.

## Reproduction

```bash
pnpm --filter dogfood-multimodal-chat test
cat examples/dogfood-multimodal-chat/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export ANTHROPIC_MODEL=claude-3-5-sonnet-latest
pnpm --filter dogfood-multimodal-chat test
```

## Ops under measurement

Three provider-neutral vision ops on `VisionChatAdapter`.

- `describeImage` — non-streaming vision call, 1 image + text prompt, optional system prompt + `detail` hint
- `streamDescribeImage` — streaming vision call, SSE `content_block_delta` chunks accumulated
- `compareImages` — multi-image call, N image blocks followed by the text prompt (drives the "cost dominated by vision" pattern)

## Image token accounting

Each image contributes a base cost that scales with the `detail` hint (mirrors OpenAI vision's cost model so mock and real report the same `imageTokenEstimate` on the response object).

- `detail: 'low'` — 1500 × 0.5 = 750 tokens / image
- `detail: 'auto'` (default) — 1500 × 0.8 = 1200 tokens / image
- `detail: 'high'` — 1500 × 1 = 1500 tokens / image

For a 2-image compare call at default detail, `imageTokenEstimate` = 2400 — the mock uses this figure to inflate `usage.input_tokens` so token / cost samples flow through the 4 AI-LLM axes with the correct order of magnitude.

## Notes

The mock's response bank in `examples/dogfood-multimodal-chat/src/adapters/mock.ts` keys by the trailing text block of the user message (the vision message concatenates image blocks + text, and the shared `MockEngine` matches on the text portion). Each response returns a Claude-shaped vision reply so streaming chunks + finish reason + usage all take realistic shapes.

Provider prefix `@kiwa/ai-llm/` triggers the 11-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — the 4 AI-LLM axes cost / latency / token / accuracy are added on top of the shared 7).

The real adapter (`src/adapters/real.ts`) speaks Anthropic's HTTP API directly — headers `x-api-key` + `anthropic-version: 2023-06-01`, body includes `image` content blocks whose `source` is either `{ type: 'base64', media_type, data }` or `{ type: 'url', url }`. No `@anthropic-ai/sdk` dependency is dragged into the workspace root; the shape stays honest.
