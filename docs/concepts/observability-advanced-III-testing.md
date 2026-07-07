# Observability advanced III testing — v2.2 8 axis × 4 provider = 32 cell advanced III grid + 16-axis combined harness + pair 深度 4 段拡張 3 例目 record (SSOT)

kiwa's v1.42-1 observability v2.2 package (`@kiwa-test/observability` v2.2.0) covers **8 advanced III axes** that model the deepening production observability posture of a real product stack beyond the v2.1 advanced axes (SLO + RED-USE + exemplar + OTel advanced + log correlation + alert routing + profiling + cardinality) — IaC observability (Terraform plan capture + drift detection + OPA policy evaluation + team cost attribution) + service mesh (Istio / Linkerd mTLS + sidecar injection + circuit breaker + traffic split) + eBPF profiling III (user-space uprobe + kernel kprobe / tracepoint / LSM + syscall counters + network flow) + LLM observability (token counting + prompt log + hallucination detection + budget check) + FinOps observability (cost per request + team attribution + rightsizing + spot optimization) + chaos engineering (fault injection + blast radius + auto-rollback + game day) + data-pipeline (OpenLineage capture + freshness SLA + schema drift + data quality) + AIOps (anomaly detection + auto-remediation + RCA + alert correlation). This concept doc is the SSOT for those 8 advanced III axes; the tutorials (91-93) and dogfood apps (v1.42-2/3/4) are the concrete implementations.

The v2.2 grid is orthogonal to the v2.1 advanced grid — the v2.1 grid covers the "compute an SLO error budget, aggregate a RED-USE panel, attach an exemplar, batch an OTel export, join a log to a trace, silence an alert, sample a CPU profile, detect a high-cardinality label" primitive across 4 provider (`grafana-oss` / `prometheus` / `loki` / `otel-collector`), and the v2.2 advanced III grid extends the same 4 provider matrix with the "capture an IaC plan, handshake mTLS, probe a syscall, count LLM tokens, attribute FinOps cost, inject a chaos fault, evaluate pipeline freshness, correlate AIOps alerts" primitives. Read the `observability-v2-testing.md` concept doc first for the v2.0 base grid (dashboard + alert + trace + correlation) + `observability-real-driver-testing.md` for the v2.1 real-driver pattern, then read this doc for the v2.2 advanced III grid.

## The 8 advanced III axes grid

The 8 axes are cover-oriented — each one names a real-world failure surface every non-trivial production observability stack hits after the v2.1 axes land.

| Axis | Real-world failure it catches | v2.2 API |
|---|---|---|
| IaC | "The drift detector missed a resource because `detectDrift` compared expected vs. actual with the wrong direction, and the OPA policy evaluation counted `passed: false` as `passedCount + 1` because the branch inverted" (no set-diff invariant on drift, no boolean-inverse guard on policy count) | `startIacSession` / `capturePlan` / `detectDrift` / `evaluatePolicy` / `attributeCost` |
| Service mesh | "The mTLS handshake accepted an un-scoped SPIFFE ID because `handshakeMtls` did not gate on `spiffe://` prefix, and the circuit breaker never tripped because `tripCircuitBreaker` compared `failures / total > threshold` instead of `>=`" (no `spiffe://` prefix guard, no `>= threshold` invariant) | `startMeshSession` / `handshakeMtls` / `injectSidecar` / `tripCircuitBreaker` / `applyTrafficSplit` |
| eBPF-III | "The uprobe count double-fired because `probeUserspace` accepted a duplicate symbol without a set guard, and the kernel hook categoriser lumped every kprobe / tracepoint / LSM sample into a single bucket because the categoriser did not switch on `kind`" (no dedup on probe symbols, no per-kind branch) | `startEbpfIiiSession` / `probeUserspace` / `traceKernel` / `recordSyscall` / `captureNetworkFlow` |
| LLM observability | "The budget alert never fired because `checkBudget` compared `spentUsd > limitUsd` instead of `>=`, and the hallucination check missed the toxicity signal because `flagHallucination` used the same direction (below-threshold) for toxicity as faithfulness" (no `>=` invariant on budget, no per-signal direction switch) | `startLlmObsSession` / `countTokens` / `logPrompt` / `flagHallucination` / `checkBudget` |
| FinOps | "The cost-per-request came out as `Infinity` because `recordCostPerRequest` accepted `requests: 0`, and the team-attribution remainder went negative because `attributeTeam` did not clamp to 0 when teams over-accounted" (no divide-by-zero guard, no clamp-to-0 on unattributed) | `startFinopsSession` / `recordCostPerRequest` / `attributeTeam` / `recommendRightsizing` / `optimizeSpot` |
| Chaos | "The rollback never fired because `triggerRollback` compared `errorRate > threshold` instead of `>=`, and the blast-radius ratio went negative because `computeBlastRadius` did not check `totalInstances > 0`" (no `>=` invariant on rollback, no divide-by-zero guard on blast radius) | `startChaosSession` / `injectFault` / `computeBlastRadius` / `triggerRollback` / `recordGameDay` |
| Data pipeline | "The freshness eval passed on a 60-minute stale pipeline because `evaluateFreshness` used `<` instead of `<=`, and the schema-drift detector missed a renamed column because `detectSchemaDrift` compared only names, not name + type pairs" (no `<= slaMinutes` invariant, no compound-key set-diff) | `startPipelineSession` / `captureLineage` / `evaluateFreshness` / `detectSchemaDrift` / `scoreDataQuality` |
| AIOps | "The anomaly detector missed a negative-z-score outlier because `detectAnomaly` compared `zScore > threshold` instead of `Math.abs(zScore) >= threshold`, and the RCA returned the wrong root because `analyzeRootCause` walked outgoing edges instead of incoming edges" (no absolute-value guard on z-score, no topological-root invariant) | `startAiopsSession` / `detectAnomaly` / `executeRemediation` / `analyzeRootCause` / `correlateAlerts` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Terraform + OPA / Istio / Linkerd / bpftrace / Anthropic + OpenAI + Datadog LLM Obs / AWS Cost Explorer / Chaos Mesh + Litmus / Airflow + Dagster / Datadog Watchdog, seconds scale), and a fidelity assertion that the two produce the same neutral event. Tutorial 91 covers the IaC + service-mesh + eBPF-III end-to-end chain (capturePlan → detectDrift → evaluatePolicy → attributeCost + handshakeMtls → injectSidecar → tripCircuitBreaker → applyTrafficSplit + probeUserspace → traceKernel → recordSyscall → captureNetworkFlow), tutorial 92 covers the LLM observability + FinOps chain (countTokens → logPrompt → flagHallucination → checkBudget + recordCostPerRequest → attributeTeam → recommendRightsizing → optimizeSpot), tutorial 93 covers the chaos + data-pipeline + AIOps chain (injectFault → computeBlastRadius → triggerRollback → recordGameDay + captureLineage → evaluateFreshness → detectSchemaDrift → scoreDataQuality + detectAnomaly → executeRemediation → analyzeRootCause → correlateAlerts).

## The 4-provider × 8-axis = 32 cell advanced III grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across `grafana-oss` + `prometheus` + `loki` + `otel-collector`), the emitted event dialects are provider-specific (`grafana.iac.plan` vs. `prom.iac.plan.export` vs. `loki.iac.plan.log` vs. `otel.iac.plan.span`), and the advanced III fidelity harness reports the coverage explicitly through `collectFidelityCoverage()` walking all 16 axes (v2.1 8 + v2.2 8).

| Provider | IaC | Service mesh | eBPF-III | LLM obs | FinOps | Chaos | Data pipeline | AIOps |
|---|---|---|---|---|---|---|---|---|
| grafana-oss | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| prometheus | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| loki | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| otel-collector | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v2.2 advanced III grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (an IaC drift detector that runs against Grafana OSS Alerting + Prometheus rules + Loki log queries + OTel Collector processors without change) even possible. The neutral event names live in the v2.2 semantics `types.ts` SSOT and the per-provider dialect table is a static lookup — a new provider drops into the same shape.

### Why the advanced III grid is fully covered

grafana-oss + prometheus + loki + otel-collector converged on the same neutral events at the "capture an IaC plan, handshake mTLS, probe a syscall, count LLM tokens, attribute FinOps cost, inject a chaos fault, evaluate pipeline freshness, correlate AIOps alerts" primitive — the 8 advanced III shapes are the same across all 4 providers, even though the wire encodings differ (Grafana OSS Alerting event name vs. Prometheus metric family name vs. Loki log field name vs. OTel Collector processor event name). The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.42 advanced III fidelity grid at 32/32 = 100 % implemented reflects that convergence at the "advanced III production observability" level. Combined with the v2.1 32-cell advanced grid (8 axis × 4 provider) + the v2.2 32-cell advanced III grid, the total v2.1 + v2.2 fidelity harness now walks 64 cells (4 provider × 16 axis) in one `collectFidelityCoverage()` call.

## The `KIWA_MODE=real` env-gate contract for the advanced III grid

`resolveObservabilityRealDriver(provider, env)` (from `observability-real-driver-testing.md` SSOT) returns `{ mode: 'real', reason: '...' }` when `env.KIWA_MODE === 'real'` and the required env for that provider is set, and `{ mode: 'mock', reason: 'KIWA_MODE!=real — mock driver' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(mode === 'mock')` block. The v2.2 advanced III axes reuse the same real-driver gate as the v2.1 axes — no new env variable is introduced. The per-axis dogfood app pins the required backend URL (`KIWA_TERRAFORM_URL` / `KIWA_ISTIO_URL` / `KIWA_BPFTRACE_URL` / `KIWA_ANTHROPIC_API_KEY` / `KIWA_AWS_COST_EXPLORER_URL` / `KIWA_CHAOSMESH_URL` / `KIWA_AIRFLOW_URL` / `KIWA_DATADOG_WATCHDOG_URL`) on top of the shared `KIWA_MODE` gate.

Per-provider required-env mapping stays the same as v2.1.

- **grafana-oss** → `KIWA_MODE` + `KIWA_GRAFANA_URL`
- **prometheus** → `KIWA_MODE` + `KIWA_PROMETHEUS_URL`
- **loki** → `KIWA_MODE` + `KIWA_LOKI_URL`
- **otel-collector** → `KIWA_MODE` + `KIWA_OTEL_COLLECTOR_URL`

Per-dogfood-app required backend URL (on top of the provider gate above).

- **dogfood-observability-iac-drift-app** → `KIWA_TERRAFORM_URL` + `KIWA_OPA_URL` (Terraform state + OPA policy engine)
- **dogfood-observability-llm-ops-app** → `KIWA_ANTHROPIC_API_KEY` + `KIWA_OPENAI_API_KEY` + `KIWA_DATADOG_LLM_OBS_URL` + `KIWA_LLM_BUDGET_USD` (Anthropic + OpenAI + Datadog LLM Observability + budget guard)
- **dogfood-observability-chaos-aiops-app** → `KIWA_CHAOSMESH_URL` + `KIWA_LITMUS_URL` + `KIWA_AIRFLOW_URL` + `KIWA_DAGSTER_URL` + `KIWA_DATADOG_WATCHDOG_URL` (Chaos Mesh + Litmus + Airflow + Dagster + Datadog Watchdog)

## The 16-axis fidelity harness (v2.1 8 + v2.2 8 combined)

`collectFidelityCoverage()` walks the full 16-axis grid and returns a per-cell `{ provider, axis, neutralEvents, providerEvents }` record so a CI job can assert `rows.every(r => r.providerEvents.length === r.neutralEvents.length)` in one line. The neutral events per axis floor (asserted in the fidelity test) is preserved for the 8 new v2.2 axes.

```ts
import { collectFidelityCoverage } from '@kiwa-test/observability';

const cov = collectFidelityCoverage();
console.log(cov.rows.length); // 64 (4 provider × 16 axis)
console.log(cov.rows.every((r) => r.providerEvents.length === r.neutralEvents.length)); // true after v2.2 lands
```

The 64-row grid is the single point of truth for the "is a provider × axis pair covered?" question — a new dogfood app that adds a new provider walks the same table without touching the axis list.

## The v1.42 pair 深度 4 段拡張 3 例目 record

v2.2 is the **third pair in kiwa history to reach depth 4 (v1.14 → v1.17 → v1.35 → v1.42)** on the observability axis. The first was the AI-LLM 縦深化 pair (v1.12 v0.1 base → v1.15 v0.2 multimodal → v1.38 v0.4 advanced → v1.40 v0.5 advanced III), recorded in the v1.39 → v1.40 migration guide. The second was the Payment 深化 pair (v1.14 v0.1 base → v1.19 v0.2 advanced → v1.33 v0.4 advanced II → v1.41 v0.5 advanced III), recorded in the v1.40 → v1.41 migration guide. The v1.42 milestone establishes the pair 深度 4 段 pattern as **stabilised across 3 axes** — the same 4-provider × 8-axis fidelity harness template applies at each depth without change, and the 深化 process (v0.1 base → v0.2 advanced → v0.4/v2.1 advanced II → v0.5/v2.2 advanced III) is idempotent under scale, no longer specific to a single production shape.

Combined with the v2.0 base grid (dashboard + alert + trace + correlation) + the v2.1 32-cell advanced grid (8 axis × 4 provider) + the v2.2 32-cell advanced III grid (8 axis × 4 provider), the observability package now covers 16 axes × 4 provider = 64 cells of production observability shape in one package with one fidelity harness — matched only by the AI-LLM package's 64-cell breadth (16 axes × 4 provider) and the Payment package's 75-cell breadth (25 axes × 3 provider).

The 20-milestone snippet validation streak (v1.23 → v1.42) reinforces the same repeatability signal for docs — every milestone since v1.23 has added a snippet-validation test that walks the tutorial's code blocks against the actual API surface, catching drift before readers hit "the tutorial does not compile" gaps. The Observability 深化 pair achieves depth 4 as the third axis after AI-LLM and Payment, validating that the methodology is not axis-specific but applies to any production shape (payment / observability / security / streaming / etc.) that has natural v0.1 / v2.0 → v0.5 / v2.2 evolution — the pattern is now record-stable across 3 axes.
