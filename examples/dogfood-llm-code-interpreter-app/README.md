# dogfood-llm-code-interpreter-app (v1.40-3)

A sandboxed code interpreter + Python REPL + tool use + rollback service that drives the `@kiwa-lab/ai-llm` v0.5 code-interpreter axis (sandbox lifecycle + execution history + tool call ledger + memory snapshot stack) across a provider-neutral `LlmCodeInterpreterAdapter`. Both mock (`@kiwa-lab/ai-llm` v0.5 code-interpreter semantics) and real (Vercel AI SDK + Anthropic Messages driver + sandboxed Python REPL executor (E2B / Modal / Deno subprocess) when `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set) implementations satisfy the same 7-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-llm-code-interpreter-app test
```

The vitest suite drives the mock adapter through the same sandbox / tool / rollback / pipeline handlers the runtime mounts in production.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export ANTHROPIC_API_KEY=sk-...
export KIWA_LLM_BUDGET_USD=10
pnpm --filter dogfood-llm-code-interpreter-app test
```

The real adapter defers the Vercel AI SDK + Anthropic Messages ceremony (sandboxed code exec + tool use + rollback) to a follow-up milestone. Until `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_LLM_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`LlmCodeInterpreterAdapter` covers 7 ops across 3 domain surfaces.

- **sandbox lifecycle surface (sandbox-e2e axis: sandboxed Python REPL + execution history + memory snapshot)**
  - `startCi` — begin a code-interpreter session bound to a provider target (anthropic / openai / vercel-ai / langchain)
  - `startSandbox` — bind an isolated sandbox cell to the session with timeout
  - `executeCode` — run a code snippet; append the execution to history and optionally update memory with assigns
  - `closeCi` — finalize the session
- **tool surface (tool-e2e axis: named tool call ledger)**
  - `useTool` — record a named tool call in the ledger; the "unknown" tool name is refused
- **rollback surface (sandbox-e2e axis: memory snapshot rewind)**
  - `rollback` — pop N most-recent executions and restore the pre-execution memory snapshot
- **pipeline surface (pipeline-e2e axis: fused sandbox → execute → tool → rollback)**
  - `runPipeline` — decide `stage` from `sandbox` + `executions` + `tools` + `rollback` and either return `completed` or a blocked reason (`blocked-no-executions` / `blocked-unknown-tool` / `blocked-rollback-exceeds-history`)

## Fidelity harness

`runFidelityHarness()` diffs the mock and real trace event streams and feeds the divergence count into `@kiwa-lab/quality-metrics` release gate. Behavioral divergences are expected on non-integration environments — the real adapter refuses every op with `KIWA_LLM_ENV_MISSING`, and the mock adapter succeeds, so every op appears in the divergence list. The harness treats those as `BEHAVIORAL_DIVERGENCE` records so the release-gate row can distinguish "not configured" from "ran and diverged".

The report writes both markdown and JSON into `./quality-report/`, which the release script picks up alongside every other axis dogfood.
