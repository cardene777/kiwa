# AI-LLM testing — non-determinism, fidelity, cost, accuracy

kiwa's provider mocks up to v1.11 all shared a comforting property — call the mock twice with the same input and you get the same output. `setupSupabaseAuthEnv` is deterministic. `setupRabbitMQEnv` is deterministic. `evaluateReleaseGate` is deterministic. The v1.11 release gate leaned on that property — a coverage number is a coverage number, a mutation kill rate is a mutation kill rate. Two runs of the same test suite produce byte-identical reports.

AI-LLM providers break this assumption. That break is what v1.12 is designed to absorb.

## What non-determinism actually is

Modern chat LLMs (Claude, GPT, Gemini, Llama) are next-token predictors trained to output a probability distribution over the vocabulary. At `temperature = 0`, decoding picks the highest-probability token every step — deterministic given the exact same input (same model version, same prompt, same context window). At any `temperature > 0` (the default for most APIs is `1.0`), decoding samples from the distribution — the same prompt returns different completions each call.

Even at `temperature = 0`, other sources of drift persist:

- **Model version bumps** — provider silently shifts `claude-3-5-sonnet-latest` from `20241022` to `20260701`; your test expected one phrasing and gets another.
- **Server-side batching non-determinism** — GPU kernels for attention are not always bit-exact across batch shapes; two identical prompts submitted at different times can differ in the last token or two.
- **Tokenizer drift** — a punctuation change in the tokenizer between versions rebuckets your prompt into a slightly different token sequence.
- **Tool-call ordering** — a model may reorder parallel tool calls turn-to-turn, or pick a different tool the second time.

The result — the v1.11 test paradigm ("run the test, assert `.toEqual(expected)`") cannot be extended to AI-LLM providers as-is. Either the assertions become so weak that regressions slip through (`.toContain('Tokyo')`) or so tight that they flake constantly (`.toEqual('Tokyo currently has clear skies.')`).

## Why the v1.11 release gate is not enough

The v1.11 gate evaluates 7 axes — coverage, test count, fidelity, perf p95, mutation kill rate. Every axis is a deterministic measurement over a deterministic mock:

| axis | v1.11 semantics | breaks under non-determinism? |
|---|---|---|
| coverage — line / branch / function | did test suite touch this code path? | no — coverage is about the test code, not the model |
| test count — behavior | how many behavioural tests? | no — you can count tests |
| fidelity — ratio | what % of real API methods does the mock cover? | no — this is a surface-area count |
| perf — p95 ms | how fast is `setup + call`? | partially — mock latency is deterministic, real latency is not |
| mutation — kill rate | mutation testing on the test suite | no — mutation is deterministic |

The gaps show up on the runtime side. A mock that returns "hello world" for every prompt has full coverage, full fidelity ratio, full behaviour test count, high mutation kill rate — and is useless. A mock that costs $10 per test run has full coverage — and blows the developer's budget. A mock that streams 30k tokens for a 3-word question has full fidelity — and blows the context window.

The v1.12 gate adds 4 axes that measure **what real vs mock actually cost and how close they land**:

| axis | what it measures | why it matters |
|---|---|---|
| **cost — perRequestUsd** | mean USD cost per LLM request | detects bulk-call cost blow-ups + mock rate misconfiguration |
| **latency — p95Ms** | end-to-end p95 (embed + retrieve + generate) | detects streaming stalls + tool-loop over-iteration |
| **token — totalTokens** | mean prompt + completion tokens per request | detects context bloat + retrieval-augmented prompt runaway |
| **accuracy — score** | similarity score between mock output and real output on a golden set | detects mock drift from real behaviour |

Only providers whose name starts with `@kiwa/ai-` enter the 11-axis branch. Everyone else still runs on 7 axes with the v1.11 semantics unchanged (see `isAiLlmProvider` in `packages/quality-metrics/src/types.ts`).

## Concept 1 — non-determinism as a first-class constraint

The v1.12 mocks do not pretend that real Claude / GPT is deterministic. Instead, they **make the mock deterministic on purpose** and measure how far real behaviour drifts from that deterministic anchor.

The pattern in [`packages/ai-llm/src/engine.ts`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/engine.ts):

1. `createAnthropicMock({ responses })` accepts a **prompt → canned response bank**. The response bank is keyed on the last `role: 'user'` message content — every entry in `responses` is a deterministic reply.
2. Every mock reply carries `_kiwa = { costUsd, latencyMs }` derived from the mock's cost table + `artificialLatencyMs`. Cost + latency are deterministic — the mock cost per prompt is exactly `(promptTokens × costPer1kTokens.prompt + completionTokens × costPer1kTokens.completion) / 1000`.
3. The fidelity harness (`runFidelityCheck`) runs the same prompt set through **both** the mock and the real API, records both outputs, and computes deltas: cost diff, latency diff, token diff, accuracy score. The accuracy score is a chosen similarity method (`cosine` for embeddings, `jaccard` for text) — the choice is stored in the report so consumers know what the number means.

Tests do not assert "mock returned X" against real. They assert "the mock's deterministic reply is close enough to the real API's stochastic reply that the release gate is happy". Close enough is defined by the accuracy threshold (default 0.80 — see below).

Tests still make assertions, but the shape shifts:

```ts
// v1.11 style — deterministic mock, exact assertion
expect(await setupSupabaseAuthEnv(...).auth.signIn(...)).toEqual({ userId: '...', email: '...' });

// v1.12 style — deterministic mock reply against deterministic bank
expect(text).toMatch(/Arrr/);  // shape-level assertion
expect(res.usage.output_tokens).toBeGreaterThan(0);  // structural assertion
expect(res._kiwa.costUsd).toBeGreaterThan(0);  // cost-tracking assertion

// v1.12 real-vs-mock — accuracy score on the aggregate
expect(fidelityReport.summary.avgAccuracyScore).toBeGreaterThan(0.80);
```

## Concept 2 — fidelity score (four metrics, one report)

`runFidelityCheck` produces a report shaped like:

```ts
{
  summary: {
    avgCostDiffUsd: number,       // real cost − mock cost, averaged
    avgLatencyDiffMs: number,     // real latency − mock latency, averaged
    avgTokenDiffTotal: number,    // real total tokens − mock total tokens, averaged
    avgAccuracyScore: number,     // mean similarity between real + mock outputs
    accuracyMethod: 'cosine' | 'jaccard',  // which similarity function was used
    prompts: number,              // sample count
  },
  perPrompt: [
    // one entry per prompt: raw real vs mock outputs + per-prompt diffs
  ],
}
```

The four numbers give a top-line signal, but the 4 AI-LLM axes on the `QualityReport` are aggregated from the **per-prompt mock-side raw samples** — `mock.costUsd`, `mock.latencyMs`, `mock.usage.promptTokens + completionTokens`, and per-prompt `accuracyScore` — not from the `avg*Diff*` aggregates. That means the cost / latency / token axes describe the mock's absolute distribution across the prompt set (what a v1.13 test written against the mock will actually experience), and the accuracy axis describes the per-prompt distance to real. The `buildAiLlmReport` helper (exported from `packages/ai-llm/src/report.ts`) wraps this aggregation so a consumer does not have to hand-wire the mapping — pass the `fidelity` result and it produces a `QualityReport` ready for `evaluateReleaseGate`.

**Fidelity is not "mock == real"**. It is "mock stays inside a bounded distance from real, per axis, on a defined prompt set". That distance is the release gate's job to enforce.

## Concept 3 — accuracy threshold (0.80 default, method-aware)

Accuracy is the hardest of the four axes because it depends on what "close" means for your domain. `@kiwa/quality-metrics` supports three methods with the same 0.80 default threshold but different semantics:

| method | what it measures | when to use |
|---|---|---|
| **cosine** | cosine similarity between embedding vectors of real + mock outputs | RAG / semantic-similarity tasks, where "semantically close" is enough |
| **jaccard** | word-level Jaccard similarity between real + mock outputs | chat / summarisation, where surface overlap matters |
| **rouge-l** | longest-common-subsequence F1 | summarisation, where phrase-level overlap matters |

The dogfood app for RAG (`examples/dogfood-vercel-ai-rag/`) uses cosine similarity — the retrieval fidelity metric compares embedding vectors, and the answer accuracy metric compares word-level Jaccard on the answer. The report notes both.

0.80 is chosen as the "meaningfully similar" bar — a cosine similarity of 0.80 between two embedding vectors means the underlying meanings overlap substantially without being identical; a Jaccard of 0.80 means the two answers share 80% of their word set. Below that, the mock is drifting far enough from real that a v1.13 test written against the mock will not tell you much about production behaviour.

The threshold is overridable per provider via `evaluateReleaseGate(report, { accuracyScore: 0.95 })` — high-precision providers (medical / legal / compliance) should push it up; casual chat providers may drop it. Every override must be justified in the provider PR body (per [release-gate.md](../quality/release-gate) § overrides の運用).

## Concept 4 — cost bound (mock cost = 0 anchor, real cost bounded)

The mock cost is deterministic by construction — it comes from the `costPer1kTokens` config in the mock builder. In `runFidelityCheck`, the mock's per-request cost is subtracted from the real per-request cost, producing a **cost delta**. The default threshold `cost.perRequestUsd ≤ $0.10` bounds the **real** side of that delta so a cost blow-up on the real API triggers a release blocker.

Why this shape and not "mock cost = 0, bound the mock"? Two reasons:

- **The mock is under our control.** The cost of `createAnthropicMock({ costPer1kTokens: { prompt: 0.003, completion: 0.015 } })` is set by us. Bounding it is a self-check that always passes.
- **The real API is what actually spends money.** The release gate cares about the production cost profile. `cost.perRequestUsd` is a **real** measurement per prompt, aggregated across the fidelity harness's prompt set.

The mock's role is to give the gate a deterministic baseline — "the real cost should not exceed $0.10 per request on this prompt set". If it does, either the prompt set is too expensive (add prompt trimming) or the model is over-quota (switch to a cheaper tier) or the tool loop is over-iterating (cap `maxIterations`).

## Where the 11 axes live in code

- **SSOT thresholds** — [`packages/quality-metrics/src/gate.ts`](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts) `DEFAULT_RELEASE_GATE_THRESHOLDS`
- **Provider dispatch** — [`packages/quality-metrics/src/types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/types.ts) `isAiLlmProvider(provider)` (1-line predicate)
- **Verdict shape** — `ReleaseGateVerdict.axesEvaluated` is `7` for non-AI providers, `11` for AI-LLM providers; the same 7 axes are enforced in both branches, plus 4 AI-LLM axes in the AI-LLM branch
- **Metric constructors** — `costFromSamples`, `latencyFromSamples`, `tokenFromSamples`, `accuracyFromSamples` in `packages/quality-metrics/src/collect.ts`
- **Fidelity harness** — [`packages/ai-llm/src/fidelity.ts`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/fidelity.ts) `runFidelityCheck`
- **Report adapter** — [`packages/ai-llm/src/report.ts`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/report.ts) `buildAiLlmReport`, `buildAiLlmReportFromMock`
- **Report emit** — `emitMarkdown` + `emitJson` in `packages/quality-metrics/src/emit.ts` (both branches render only the axes actually evaluated)

## When to use the AI-LLM branch

Rules of thumb.

- **Use AI-LLM 11 axes if** your test suite drives an LLM (Anthropic, OpenAI, Vercel AI SDK, LangChain, or any provider that ends up calling one of those) and you can measure cost / latency / token / accuracy against a real provider on some prompt set.
- **Skip AI-LLM 11 axes if** your test suite drives a pure logic mock (Supabase Auth, RabbitMQ, Foundry, etc). Even if your app internally calls an LLM, the provider prefix (`@kiwa/auth`, `@kiwa/queue`, etc.) keeps you on the 7-axis branch. Adding AI-LLM axes to non-AI providers is possible via override but generally not useful — the metrics measure LLM behaviour, not auth / queue / contract behaviour.
- **You have no real API key** — the dogfood apps show how to still produce a report by falling back to a `test-real` variant (deterministic hashing embedder for embeddings, canned fixture for chat) that shares the mock's implementation but exposes a distinct trace signature. The accuracy score in that setup measures "does the mock differ from the test-real fixture in a way we care about", which is not the same as "does the mock differ from production". Document the fallback in the report notes.

## What is deliberately not in scope for v1.12

- **Prompt injection defence** — treated as a separate concern. Prompt injection is a security topic; the release gate measures quality. `security-audit` skill covers the security surface.
- **Multi-turn conversation memory correctness** — the v1.12 tests exercise turn 0 + turn 1 loops but do not measure "does the model correctly recall a fact from turn 3 at turn 9". Long-conversation correctness is a research topic; v1.12 sets up the infrastructure but does not enforce it.
- **Fine-tuned model regressions** — the fidelity harness is model-version-agnostic. Regressions from a fine-tune retrain must be caught by holding the model version fixed and re-running the harness after each retrain; v1.12 does not automate that loop.
- **Hallucination detection at answer time** — the 20-QA-pair pattern in the RAG dogfood app measures Jaccard against a ground-truth answer, which is a shallow proxy for factuality. Deep factuality checking is out of scope; the accuracy axis is a **relative** score against real API output, not an **absolute** factuality claim.

## Reading list

- [Release gate SSOT](../quality/release-gate) — thresholds + overrides + how the gate is wired
- [Migration v1.11 → v1.12](../migrations/v1.11-to-v1.12) — how to adopt the 11-axis branch
- [Anthropic streaming tutorial](../tutorials/06-anthropic-chatbot-streaming) — hands-on with `createAnthropicMock`
- [OpenAI tool agent tutorial](../tutorials/07-openai-tool-agent) — hands-on with `createOpenAIMock` (function calling + parallel calls)
- [Vercel AI RAG tutorial](../tutorials/08-vercel-ai-rag) — hands-on with `createVercelAiMock` + embeddings + vector store
- [`@kiwa/ai-llm` README](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/README.md) — full API reference for the 4 mocks + fidelity harness

## Takeaways

- Non-determinism is a property of the model, not a bug in kiwa. The v1.12 gate embraces it.
- The mock is deterministic on purpose; the release gate measures how far real drifts from the mock, per axis.
- 4 new axes (cost / latency / token / accuracy) turn the 7-axis gate into an 11-axis gate — but only for providers whose name starts with `@kiwa/ai-`. Non-AI providers are unaffected.
- Accuracy is method-aware (cosine / jaccard / rouge-l). Pick the method that matches your task; document overrides in the PR body.
- v1.12 is the infrastructure; v1.13+ will build on it (evaluation harnesses, multi-turn correctness, fine-tune regression suites).
