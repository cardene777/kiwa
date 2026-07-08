# dogfood-llm-multi-agent-swarm-app (v1.40-2)

A LangGraph + CrewAI + AutoGen style multi-agent orchestrator + agent-swarm coordinator that drives the CrewAI-shaped supervisor pattern + LangGraph-shaped state graph transition + swarm role assignment + majority-vote consensus + Byzantine fault tolerance across a provider-neutral `LlmMaoSwarmAdapter`. Both mock (`@kiwa/ai-llm` v0.5 multi-agent-orchestration + agent-swarm semantics) and real (Vercel AI SDK + Anthropic Messages driver when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set) implementations satisfy the same 13-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-llm-multi-agent-swarm-app test
```

The vitest suite drives the mock adapter through the same multi-agent / swarm / pipeline handlers the runtime mounts in production.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export ANTHROPIC_API_KEY=sk-...
export KIWA_LLM_BUDGET_USD=10
pnpm --filter dogfood-llm-multi-agent-swarm-app test
```

The real adapter defers the Vercel AI SDK + Anthropic Messages ceremony (multi-agent planning + swarm consensus) to a follow-up milestone. Until `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_LLM_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`LlmMaoSwarmAdapter` covers 13 ops across 3 domain surfaces.

- **multi-agent orchestration surface (mao-e2e axis: CrewAI + AutoGen + LangGraph supervisor pattern)**
  - `startMao` — begin a multi-agent session bound to a provider target (anthropic / openai / vercel-ai / langchain)
  - `assembleCrew` — register a role-typed crew (planner / worker / reviewer + capabilities) on the session
  - `delegateBySupervisor` — round-robin a supervisor's task through the worker roster
  - `transitionGraph` — walk a state graph (LangGraph-shaped nodes + edges) from an entry node to the terminal node
  - `completeRound` — assert the delegation count reached the configured minimum for the current round
  - `closeMao` — finalize the session
- **swarm surface (swarm-e2e axis: role-based + majority-vote + Byzantine)**
  - `startSwarm` — begin a swarm session bound to a provider target + fault threshold
  - `assignRoles` — assign roles to swarm agents by index modulo
  - `allocateTasks` — allocate a task backlog to swarm agents by priority descending
  - `reachConsensus` — pick the majority-vote winner + report the agreement ratio
  - `tolerateByzantine` — pass when honest ratio ≥ 1 − fault threshold (PBFT-lite invariant)
  - `closeSwarm` — finalize the session
- **pipeline surface (pipeline-e2e axis: fused mao + swarm)**
  - `runPipeline` — decide `stage` from `crew` + `delegation` + `graph` + `swarm` allocation + `consensus` + `Byzantine tolerance` and either return `completed` or a blocked reason (`blocked-graph-empty` / `blocked-no-consensus` / `blocked-byzantine`)

## Fidelity harness

`runFidelityHarness()` diffs the mock and real trace event streams and feeds the divergence count into `@kiwa/quality-metrics` release gate. Behavioral divergences are expected on non-integration environments — the real adapter refuses every op with `KIWA_LLM_ENV_MISSING`, and the mock adapter succeeds, so every op appears in the divergence list. The harness treats those as `BEHAVIORAL_DIVERGENCE` records so the release-gate row can distinguish "not configured" from "ran and diverged".

The report writes both markdown and JSON into `./quality-report/`, which the release script picks up alongside every other axis dogfood.
