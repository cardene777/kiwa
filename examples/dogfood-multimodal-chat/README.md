# dogfood-multimodal-chat

Dogfood app (v1.15-4) — an Anthropic vision chat that exercises **image upload (base64 + url) + streaming response + cost tracking + multi-image comparison** across a provider-neutral interface so `@kiwa-test/ai-llm`'s Anthropic multimodal mock can be measured against a real Anthropic vision call.
The resulting fidelity report feeds `@kiwa-test/quality-metrics` 11-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-test/ai-llm` `createAnthropicMock` with `MessagePart` image, deterministic response bank).
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that calls the real Anthropic Messages API with `image` content blocks via `fetch` when `ANTHROPIC_API_KEY` is set. When the env var is missing, the adapter reports each method as `ANTHROPIC_ENV_MISSING` so the fidelity harness records the gap without failing the test suite.

Real-mode envs.

- `ANTHROPIC_API_KEY` — required to enable real mode
- `ANTHROPIC_MODEL` — defaults to `claude-3-5-sonnet-latest`
- `ANTHROPIC_BASE_URL` — defaults to `https://api.anthropic.com`

## Layout

```
src/
  adapters/
    interface.ts       -- provider-neutral vision contract (describeImage / streamDescribeImage / compareImages)
    mock.ts            -- kiwa mock adapter (createAnthropicMock + MessagePart image)
    real.ts            -- Anthropic HTTP adapter with image content blocks, graceful skip when env missing
  flows/
    chat-flows.ts      -- upload / stream / OCR-with-high-detail / 2-image compare
    fidelity.ts        -- trace-diffing harness that feeds @kiwa-test/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 7 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
  perf/
    dogfood-multimodal-chat.perf.ts      -- 3-layer perf (serial + concurrent + memory)
    dogfood-multimodal-chat.live.perf.ts -- live perf against real Anthropic vision API
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/ai-llm/multimodal-chat.md` when they become canonical for a release.

## Release gate (11 axes)

Because the provider string is `@kiwa-test/ai-llm/multimodal-chat`, `evaluateReleaseGate` runs the AI-LLM branch (11 axes = common 7 + AI-LLM 4).

- cost per request ≤ $0.10
- p95 latency ≤ 3000 ms
- total tokens ≤ 4000 / request
- accuracy (Jaccard vs real) ≥ 0.80

The default thresholds are provider-agnostic; overrides live in `packages/quality-metrics/src/gate.ts`.

## Image token accounting

Each image contributes a base cost that scales with the `detail` hint (mirrors OpenAI vision's cost model).

- `detail: 'low'` — 1500 × 0.5 = 750 tokens per image
- `detail: 'auto'` (default) — 1500 × 0.8 = 1200 tokens per image
- `detail: 'high'` — 1500 × 1 = 1500 tokens per image

The adapter response includes `imageTokenEstimate` so the UI can render a "vision cost dominates" hint before the request completes. The mock's real usage counts include this estimate; the real adapter's `imageTokenEstimate` is a pre-flight number that lines up with Anthropic's actual `input_tokens` within roughly 20 percent.

## Related

- v1.15-1 `@kiwa-test/ai-llm` v0.2 multimodal (`packages/ai-llm/src/multimodal.ts`)
- v1.11-1 `@kiwa-test/quality-metrics` (`packages/quality-metrics/`)
- v1.15 milestone parent [#745](https://github.com/cardene777/kiwa/issues/745), this sub [#749](https://github.com/cardene777/kiwa/issues/749)
