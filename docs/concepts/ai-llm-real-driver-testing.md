# AI-LLM real-driver testing — 8 axis × 4 provider = 32 cell grid + real-driver env-gate (SSOT)

kiwa's v1.38-1 ai-llm package upgrade (`@kiwa-lab/ai-llm` v0.4) covers **8 axes** that model the surface every non-trivial production LLM stack has to reason about — prompt injection defense + hallucination detection + LLM eval + guardrails + advanced RAG + agent orchestration + fine-tuning eval + cost / latency SLA. This concept doc is the SSOT for those 8 axes; the tutorials (79-81) and dogfood apps (v1.38-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production LLM stack hits within the first quarter.

| Axis | Real-world failure it catches | v0.4 API |
|---|---|---|
| Prompt injection | "The jailbreak classifier fired on `DAN mode` in the input but the Constitutional guardrail let a `bomb recipe` output through because the two checks were never chained on the same session" (no 5-class classifier, no per-kind block step, no provider-neutral audit event) | `startInjectionSession` / `detectInjection` / `classifyDirect` / `classifyIndirect` / `blockJailbreak` / `blockRoleHijacking` |
| Hallucination | "The factuality score said 0.9 but 3 of the 5 citations pointed to URLs the model hallucinated because the citation-verifier was never chained after `checkFactuality`" (no self-consistency floor, no corpus-membership check, no confidence hedging scorer) | `startHallucinationSession` / `scoreSelfConsistency` / `checkFactuality` / `verifyCitation` / `scoreConfidence` |
| LLM eval | "The LLM-as-judge picked a candidate that mirrored the prompt tokens but had zero ground-truth overlap because the rubric was never layered on top" (no weighted-rubric scorer, no preference-pair aggregator, no Elo persistence) | `startEvalSession` / `judgeCandidates` / `applyRubric` / `rankPreference` / `updateElo` |
| Guardrails | "The regex allow-list caught the injection payload but the JSON schema validator let a malformed output through because the two guardrails ran on different sessions" (no session-chained guardrail state machine, no PII redactor, no Constitutional AI check) | `startGuardrailSession` / `validateSchema` / `matchRegex` / `blockToxicity` / `redactPii` / `checkConstitutional` |
| RAG advanced | "The hybrid retriever returned the right 10 chunks but the reranker never fired because the harness assumed the sparse score alone was the ranking signal" (no chunk overlap, no dense + sparse fusion, no context compressor) | `startRagSession` / `chunkDocument` / `hybridRetrieve` / `rerank` / `compressContext` |
| Agent orchestration | "The ReAct loop stepped 20 times before the budget check fired because `checkBudget` was called after `reactStep` instead of before" (no ReAct trace persistence, no ToT branching, no reflection cycle bound, no intent-scored tool router) | `startAgentSession` / `reactStep` / `expandToT` / `reflectAndCorrect` / `selectTool` |
| Fine-tuning eval | "The DPO benchmark said preference accuracy 92 % but catastrophic forgetting on a legacy eval jumped 8 points because the two eval passes ran on different runs" (no SFT F1 / exact-match scorer, no DPO log-probability margin, no baseline seeded before drift detection) | `startFtSession` / `evaluateSft` / `evaluateDpo` / `detectCatastrophicForgetting` / `detectBenchmarkDrift` |
| Cost / latency SLA | "The model router picked the cheapest candidate but latency blew past the SLA because the quality floor was set to 0.5 instead of 0.85" (no per-request cost tracker, no percentile latency, no SLA + quality-floor filter, no fallback ladder) | `startSlaSession` / `checkBudget` / `measureLatency` / `routeModel` / `engageFallback` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Anthropic Messages / OpenAI Chat Completions / Vercel AI SDK / LangChain, seconds scale), and a fidelity assertion that the two produce the same event stream. Tutorial 79 covers the prompt-injection + guardrails end-to-end chain (5-class detection → narrow classify → jailbreak / role-hijack block → Constitutional + PII redaction), tutorial 80 covers the hallucination + eval axes (self-consistency → factuality → citation → judge → rubric → preference → Elo), tutorial 81 covers the agent-orchestration + SLA axes (ReAct → ToT → reflection → tool selection → budget → latency → routing → fallback).

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across Anthropic Messages + OpenAI Chat Completions + Vercel AI SDK + LangChain), the emitted event dialects are provider-specific (`anthropic.injection.direct_detected` vs. `openai.injection.direct_detected` vs. `vercel-ai.injection.direct_detected` vs. `langchain.injection.direct_detected`), and the fidelity harness reports the coverage explicitly through `AI_LLM_AXIS_TO_EVENTS` + `collectFidelityCoverage()`.

| Provider | Prompt injection | Hallucination | LLM eval | Guardrails | RAG advanced | Agent orch | Fine-tuning eval | Cost / latency SLA |
|---|---|---|---|---|---|---|---|---|
| anthropic | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| openai | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| vercel-ai | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| langchain | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v1.38 ai-llm grid is fully covered — every provider implements every axis because the semantics are backend-agnostic. That is what makes cross-provider reuse (a mock injection classifier that runs against Anthropic + OpenAI + Vercel AI + LangChain without change) even possible.

### Why the ai-llm grid is fully covered

Anthropic Messages + OpenAI Chat Completions + Vercel AI SDK + LangChain converged on the same neutral events at the "take a prompt, produce a completion, emit a per-step trace" primitive — the "LLM call over a chat-shaped payload" shape is the same across all 4 providers, even though the wire encodings differ (Messages API blocks vs. Chat Completions choices vs. `generateText` result vs. LangChain runnable). The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.38 fidelity coverage at 32/32 = 100 % implemented reflects that convergence at the "LLM call" level.

## The `KIWA_MODE=real` env-gate contract

`skipUnlessReal(env)` returns `{ skip: false, reason: 'KIWA_MODE=real detected' }` when `env.KIWA_MODE === 'real'` and `{ skip: true, reason: 'KIWA_MODE!=real — skip real-driver tests (mock semantics apply)' }` otherwise. A test that respects the contract combines the gate with a per-backend `_API_KEY` presence check plus a `KIWA_LLM_BUDGET_USD` budget guard — the dogfood apps use this at each `describe.skipIf(gate.skip)` block.

Per-backend required-env mapping.

- **anthropic** → `KIWA_MODE` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` (Anthropic Messages API; endpoint `KIWA_ANTHROPIC_URL` optional)
- **openai** → `KIWA_MODE` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` (OpenAI Chat Completions API; endpoint `KIWA_OPENAI_URL` optional)
- **vercel-ai** → `KIWA_MODE` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` (Vercel AI SDK routes through OpenAI by default; endpoint `KIWA_VERCEL_AI_URL` optional)
- **langchain** → `KIWA_MODE` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` (LangChain routes through OpenAI by default; endpoint `KIWA_LANGCHAIN_URL` optional)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when `KIWA_MODE=real` + the required `_API_KEY` are present and the budget guard is set. That means the fast inner loop stays cheap by default (mock only, ms scale), the nightly job flips `KIWA_MODE=real` + the required `_API_KEY` + a bounded `KIWA_LLM_BUDGET_USD`, and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode — the test still runs, the real-driver assertions get skipped. Absent `KIWA_MODE` means fall back to mock. An invalid `KIWA_MODE` value (anything other than `real`) also falls back to mock so a typo does not break tests. The budget guard (`resolveBudgetGuard(env)`) reads `KIWA_LLM_BUDGET_USD` (default `5.0`) + `KIWA_LLM_PER_CALL_CAP_USD` (default `0.5`) and refuses to charge beyond either cap.

## The dogfood app new pattern

The 3 dogfood apps (v1.38-2/3/4) each expose a `pnpm test` command that keeps the mock-only path green sub-second, and are wired for real-driver runs when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` are present.

- `examples/dogfood-llm-prompt-injection-defense-app` — Anthropic Messages + prompt injection + jailbreak + guardrails + Constitutional AI + 5-class classifier + PII redaction pipeline. Walks the defense chain (detect → classify → block → guard) against a real Anthropic Messages endpoint. 109 test.
- `examples/dogfood-llm-hallucination-eval-app` — OpenAI Chat Completions + LLM-as-judge + rubric-based eval + citation grounding + self-consistency + factuality + preference + Elo pipeline. Walks the eval chain against a real OpenAI Chat Completions endpoint. 90 test.
- `examples/dogfood-llm-agent-orchestration-app` — Vercel AI SDK + ReAct + Tree of Thoughts + reflection + tool selection + budget + latency + routing + fallback pipeline. Walks the orchestration chain against a real Vercel AI SDK `generateText` endpoint. 89 test.

The pattern each new app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:real` command that requires `KIWA_MODE=real` + the backend-specific `_API_KEY` + a bounded `KIWA_LLM_BUDGET_USD` and routes assertions through the real provider endpoint.
3. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
4. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.
5. Chain the budget guard (`resolveBudgetGuard` + `chargeBudget`) around every real-driver call so a runaway loop or a bad prompt does not blow the `$` cap.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 32-cell grid at v1.38 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `multi-agent-coordination` or `retrieval-grounded-eval`), it will start as `planned` for all 4 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.38 does not add a 14th release-gate axis. The 8 ai-llm axes gate the ai-llm package's own tests (via `pnpm --filter @kiwa-lab/ai-llm test`) but do not surface as a per-package `@kiwa-lab/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not export to Anthropic Messages / OpenAI Chat Completions / Vercel AI / LangChain has nothing to assert on. When a future milestone adds an `ai-llm.fidelity` axis that describes "which LLM providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.38 keeps the axis count at 13.

## SSOT boundaries

- The 8 ai-llm axes live in this doc. Tutorials 79-81 and the migration guide (v1.37 → v1.38) link back here for the axis SSOT.
- The 4-provider × 8-axis grid is the harness's data structure. The `AI_LLM_AXIS_TO_EVENTS` + `collectFidelityCoverage()` in `packages/ai-llm/src/semantics/fidelity.ts` is the code SSOT — this doc's grid table is derived from that constant.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, the v1.32 database real-driver concept doc, the v1.33 payment real-driver concept doc, the v1.34 frontend real-driver concept doc, the v1.35 observability real-driver concept doc, the v1.36 search real-driver concept doc, and the v1.37 security real-driver concept doc. All eight use the same `skipUnlessReal(env)` pattern; the ai-llm axes just add a `KIWA_LLM_BUDGET_USD` budget guard on top so a real LLM call cannot run past the `$` cap.
