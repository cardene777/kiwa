# AI-LLM advanced III testing — v0.5 8 axis × 4 provider = 32 cell advanced III grid + real-driver env-gate (SSOT)

kiwa's v1.40-1 ai-llm v0.5 package (`@kiwa-lab/ai-llm` v0.5.0) covers **8 advanced III axes** that model the deepening LLM production posture of a real product stack beyond the v0.4 advanced axes (prompt injection + hallucination + LLM eval + guardrails + RAG advanced + agent orchestration + fine-tuning eval + cost / latency SLA) — multi-agent orchestration (CrewAI + LangGraph supervisor) + agent swarm (role-based + PBFT-lite consensus) + code interpreter (sandboxed REPL + tool use + rollback) + fine-tuning pipeline (dataset + RLHF/DPO + eval loop + drift) + LLM ops (model registry + rollout + A/B + canary + shadow) + prompt engineering advanced (CoT + few-shot + caching + versioning) + RAG III (GraphRAG + agentic + self-querying + parent document) + cost optimization (batch API + prompt compression + model cascade + semantic cache). This concept doc is the SSOT for those 8 advanced III axes; the tutorials (85-87) and dogfood apps (v1.40-2/3/4) are the concrete implementations.

The v0.5 grid is orthogonal to the v0.4 advanced grid — the v0.4 advanced grid (`AI_LLM_ADV_FIDELITY_GRID` conceptual name, but implemented through the same `AI_LLM_AXIS_TO_EVENTS`) covers the "run one agent, decide one answer, emit one event" primitive across 4 provider (`anthropic` / `openai` / `vercel-ai` / `langchain`), and the v0.5 advanced III grid extends the same 4 provider matrix with the "orchestrate multiple agents, interpret code in a sandbox, run a fine-tuning pipeline, manage the model lifecycle in production, walk a GraphRAG index" primitives. Read the `ai-llm-real-driver-testing.md` concept doc first for the v0.4 advanced grid, then read this doc for the v0.5 advanced III grid.

## The 8 advanced III axes grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production LLM stack hits after the v0.4 advanced axes land.

| Axis | Real-world failure it catches | v0.5 API |
|---|---|---|
| Multi-agent orchestration | "The supervisor delegated the same task to `worker A` twice because the round counter was reset on session save, and the LangGraph node walk never terminated because the terminal node's outgoing edge pointed at a visited ancestor" (no round-robin invariant on delegation, no visited-set on graph transition, no terminal-node record) | `startMaoSession` / `assembleCrew` / `delegateBySupervisor` / `transitionGraph` / `completeRound` |
| Agent swarm | "The swarm consensus fired on a 5-vs-5 split because the majority check was `>=` instead of `>`, and the Byzantine fault check let 4 faulty out of 10 through because the threshold was `0.5` instead of the PBFT-lite `0.34`" (no strict-majority gate, no `1 - threshold` honest-ratio invariant, no null-winner on a split) | `startSwarmSession` / `assignRoles` / `allocateTasks` / `reachConsensus` / `tolerateByzantine` |
| Code interpreter | "The rollback popped 3 executions but the memory snapshot was one step stale because the snapshot was taken after the assignment instead of before" (no snapshot-before-assign invariant, no per-execution memory snapshot, no tool-call `ok=false` on `unknown` tool name) | `startCiSession` / `startSandbox` / `executeCode` / `useTool` / `rollback` |
| Fine-tuning pipeline | "The RLHF policy update landed on a non-deterministic delta because the mean was computed over a shuffled batch and the drift detector fired on a `NaN` because the baseline was never pinned" (no `learningRate * meanReward` invariant, no first-call baseline snapshot, no `Math.abs(delta) >= threshold` gate) | `startFtpSession` / `prepareDataset` / `stepRlhf` / `runEvalLoop` / `detectDrift` |
| LLM ops | "The A/B evaluator picked the variant with 5 samples over the one with 500 samples because `minSamples` was not enforced, and the canary promotion rewrote the registry `active` bit before the error-rate check ran" (no `minSamples` filter, no `errorRate <= threshold` gate, no post-promotion registry rewrite) | `startOpsSession` / `updateRegistry` / `advanceRollout` / `evaluateAb` / `promoteCanary` / `compareShadow` |
| Prompt engineering advanced | "The prompt cache hit rate was measured on a version drift because `pinVersion` was called after `cachePrompt` instead of before, and the few-shot picker returned the first-in-array instead of the top-by-score because the pool was iterated in insertion order" (no strict `semver+hash` pin, no top-k sort by score descending, no cache-hit accounting) | `startPeaSession` / `expandChainOfThought` / `selectFewShot` / `cachePrompt` / `pinVersion` |
| RAG III | "The GraphRAG traversal never terminated because the `maxHops` guard was off by one, and the agentic step decided `answer` on a `confidence: 0.3` because the threshold comparison was `>` instead of `>=`" (no `maxHops` decrement in BFS, no `confidence >= threshold` invariant, no chunk-to-parent lookup on cold miss) | `startRag3Session` / `traverseGraph` / `stepAgentic` / `selfQuery` / `expandParent` |
| Cost optimization | "The model cascade escalated to the top tier on every request because the confidence threshold was set on the top tier instead of the bottom, and the batch savings estimate was 2x instead of 0.5x because the pricing table was misread" (no cheapest-tier-first sort, no 0.5x savings ratio, no cache backfill on cold miss) | `startCoSession` / `submitBatch` / `compressPrompt` / `stepCascade` / `lookupSemanticCache` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real LangGraph / CrewAI / Docker Python REPL / Redis + Postgres model registry, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 85 covers the multi-agent + swarm end-to-end chain (crew → delegate → graph → round → roles → tasks → consensus → Byzantine), tutorial 86 covers the code interpreter + fine-tuning pipeline chain (sandbox → execute → tool → rollback → dataset → RLHF → eval → drift), tutorial 87 covers the LLM ops + prompt engineering + RAG III + cost optimization chain (registry → rollout → A/B → canary → shadow → CoT → few-shot → cache → version → graph → agentic → self-query → parent → batch → compress → cascade → semantic-cache).

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across `anthropic` + `openai` + `vercel-ai` + `langchain`), the emitted event dialects are provider-specific (`anthropic.mao.crew_assembled` vs. `openai.mao.crew_assembled` vs. `vercel-ai.mao.crew_assembled` vs. `langchain.mao.crew_assembled`), and the advanced III fidelity harness reports the coverage explicitly through `collectFidelityCoverage()` walking all 16 axes (v0.4 8 + v0.5 8).

| Provider | Multi-agent | Swarm | Code interp | Fine-tune pipe | LLM ops | Prompt eng adv | RAG III | Cost opt |
|---|---|---|---|---|---|---|---|---|
| anthropic | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| openai | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| vercel-ai | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| langchain | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v0.5 advanced III grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a multi-agent workflow that runs under anthropic + openai + vercel-ai + langchain without change) even possible. The neutral event names live in the v0.5 `types.ts` SSOT and the per-provider dialect table is a static lookup — a new provider drops into the same shape.

### Why the advanced III grid is fully covered

anthropic + openai + vercel-ai + langchain converged on the same neutral events at the "orchestrate an LLM call chain, decide an outcome, emit an event" primitive — the "multi-agent + code-interpreter + fine-tuning + ops + prompt-engineering + GraphRAG + cost-optimization" shape is the same across all 4 providers, even though the wire encodings differ (Anthropic Messages tool-use vs. OpenAI Assistants API vs. Vercel AI SDK `generateText` vs. LangChain `RunnableSequence`). The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.40 advanced III fidelity grid at 32/32 = 100 % implemented reflects that convergence at the "advanced LLM production" level. Combined with the v0.4 32-cell advanced grid, the total v0.4 + v0.5 fidelity harness now walks 64 cells (4 provider × 16 axis) in one `collectFidelityCoverage()` call.

## The `KIWA_MODE=real` env-gate contract for the advanced III grid

`skipUnlessReal(provider, env)` returns `{ skip: false, reason: 'KIWA_MODE=real + required env present — real driver' }` when `env.KIWA_MODE === 'real'` and the required env for that provider is set, and `{ skip: true, reason: 'KIWA_MODE!=real (got "unset") — mock driver' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip)` block. The v0.5 advanced III axes reuse the same real-driver gate as the v0.4 advanced axes — no new env variable is introduced. The per-axis dogfood app pins the required backend URL (`KIWA_LANGGRAPH_URL` / `KIWA_CI_SANDBOX_URL` / `KIWA_OPS_REGISTRY_URL`) on top of the shared `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` gate.

Per-provider required-env mapping stays the same as v0.4.

- **anthropic** → `KIWA_MODE` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` (Anthropic Messages API endpoint)
- **openai** → `KIWA_MODE` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` (OpenAI Chat Completions + Assistants API)
- **vercel-ai** → `KIWA_MODE` + `OPENAI_API_KEY` (Vercel AI SDK routes through the underlying provider) + `KIWA_LLM_BUDGET_USD`
- **langchain** → `KIWA_MODE` + `ANTHROPIC_API_KEY` (LangChain runnable sequence over Anthropic) + `KIWA_LLM_BUDGET_USD`

Per-dogfood-app required backend URL (on top of the provider gate above).

- **dogfood-llm-multi-agent-swarm-app** → `KIWA_LANGGRAPH_URL` + `KIWA_CREWAI_URL` (real LangGraph + CrewAI SDKs)
- **dogfood-llm-code-interpreter-app** → `KIWA_CI_SANDBOX_URL` (Docker-isolated Python REPL, e.g. `http://localhost:8100`)
- **dogfood-llm-ops-registry-app** → `KIWA_OPS_REGISTRY_URL` (Redis + Postgres model registry, e.g. `http://localhost:8200`)

## `KIWA_LLM_BUDGET_USD` budget guard (unchanged from v0.4)

The v0.5 axes reuse the same budget guard as v0.4. `chargeBudget(env, usd)` decrements the caller-supplied budget and throws when the remaining balance falls below zero. Every real-driver call goes through `chargeBudget` before hitting the wire so a runaway multi-agent loop cannot silently rack up an $80 bill. The mock path never touches the guard (mock cost is zero) so the inner-loop iteration stays free of budget noise.

## The 16-axis fidelity harness (v0.4 8 + v0.5 8 combined)

`collectFidelityCoverage()` walks the full 16-axis grid and returns a per-cell `{ provider, axis, implemented, missingEvents }` record so a CI job can assert `rows.every(r => r.implemented)` in one line. The `AI_LLM_AXIS_TO_EVENTS` table has 16 entries after v0.5 lands — the 4 neutral events per axis floor (asserted in the fidelity test) is preserved for the 8 new v0.5 axes.

```ts
import { collectFidelityCoverage } from '@kiwa-lab/ai-llm';

const cov = collectFidelityCoverage();
console.log(cov.rows.length); // 64 (4 provider × 16 axis)
console.log(cov.rows.every((r) => r.implemented)); // true after v0.5 lands
```

The 64-row grid is the single point of truth for the "is a provider × axis pair covered?" question — a new dogfood app that adds a new provider walks the same table without touching the axis list.

## The v1.40 pair 深度 4 段 record (unprecedented in kiwa history)

v0.5 is the 10th 縦深化 pair in kiwa history and the **first pair to reach depth 4 (v1.12 → v1.15 → v1.38 → v1.40)**. Previous deepest pair depths were 3 (Payment v1.14→v1.19→v1.33 and Observability v1.16→v1.20→v1.35). The v1.40 milestone establishes a new record and validates the 縦深化 methodology at unprecedented depth — the same 4-provider × 8-axis fidelity harness template applies at each depth without change, and the 深化 process (v0.1 base → v0.4 advanced → v0.5 advanced III) is idempotent under scale.

Combined with the v1.38 v0.4 advanced grid (8 axis × 4 provider = 32 cell) + the v1.40 v0.5 advanced III grid (8 axis × 4 provider = 32 cell), the ai-llm package now covers 16 axes × 4 provider = 64 cells of production LLM shape in one package with one fidelity harness — the broadest single-package matrix in the kiwa ecosystem.
