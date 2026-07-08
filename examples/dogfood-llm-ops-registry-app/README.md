# dogfood-llm-ops-registry-app (v1.40-4)

A model registry + version rollout + A/B testing + canary promotion + shadow comparison service that drives the `@kiwa/ai-llm` v0.5 llm-ops axis (registry updates + rollout percentage advancement + A/B variant scoring + canary error-rate gating + shadow-vs-production score delta) across a provider-neutral `LlmOpsAdapter`. Both mock (`@kiwa/ai-llm` v0.5 llm-ops semantics) and real (Vercel AI SDK + Anthropic Messages driver + deployment control plane (LaunchDarkly / Statsig / GitHub Deployments) when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set) implementations satisfy the same 8-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-llm-ops-registry-app test
```

The vitest suite drives the mock adapter through the same registry / rollout / A/B / canary / shadow / pipeline handlers the runtime mounts in production.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export ANTHROPIC_API_KEY=sk-...
export KIWA_LLM_BUDGET_USD=10
pnpm --filter dogfood-llm-ops-registry-app test
```

The real adapter defers the Vercel AI SDK + Anthropic Messages ceremony (model registry write + rollout advancement + A/B evaluation + canary promotion + shadow comparison) to a follow-up milestone. Until `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_LLM_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`LlmOpsAdapter` covers 8 ops across 5 domain surfaces.

- **session lifecycle**
  - `startOps` — begin an ops session bound to a provider target (anthropic / openai / vercel-ai / langchain)
  - `closeOps` — finalize the session
- **registry surface (registry-e2e axis: append versioned registry entries + activate exactly one)**
  - `updateRegistry` — register a new model version + optionally activate it, refusing duplicates
- **rollout surface (rollout-ab-e2e axis: percentage advancement)**
  - `advanceRollout` — advance the rollout percentage toward a target in step increments
- **A/B surface (rollout-ab-e2e axis: variant scoring)**
  - `evaluateAb` — pick the winner by mean score, gated by minimum sample counts
- **canary surface (canary-shadow-e2e axis: error-rate promotion gate)**
  - `promoteCanary` — promote a canary version when the error rate is at or below the threshold
- **shadow surface (canary-shadow-e2e axis: production-vs-shadow delta)**
  - `compareShadow` — compute the delta between averaged production and shadow scores
- **pipeline surface (pipeline-e2e axis: fused registry → rollout → A/B → canary → shadow)**
  - `runPipeline` — decide `stage` from `registry` + `rollout` + `ab` + `canary` + `shadow` and either return `completed` or a blocked reason (`blocked-no-versions` / `blocked-ab-underpowered` / `blocked-canary-error-rate` / `blocked-shadow-regression`)

## Fidelity harness

`runFidelityHarness()` diffs the mock and real trace event streams and feeds the divergence count into `@kiwa/quality-metrics` release gate. Behavioral divergences are expected on non-integration environments — the real adapter refuses every op with `KIWA_LLM_ENV_MISSING`, and the mock adapter succeeds, so every op appears in the divergence list. The harness treats those as `BEHAVIORAL_DIVERGENCE` records so the release-gate row can distinguish "not configured" from "ran and diverged".

The report writes both markdown and JSON into `./quality-report/`, which the release script picks up alongside every other axis dogfood.
