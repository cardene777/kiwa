# dogfood-security-siem-incident-app (v1.39-3)

A Splunk + PagerDuty style SIEM + incident-response orchestrator that drives SIEM (CIM-formatted structured audit log + tamper-evident hash-chain seal + hot/warm/cold retention + correlation rule) + incident-response (playbook trigger + sev1-5 severity classification + escalation to on-call + forensics capture + post-mortem) + orchestrator (fused SIEM correlation → incident decision) across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa-lab/security` v0.2 siem-audit + incident-response semantics) and real (Splunk + PagerDuty SOAR driver when `SIEM_STACK_READY=1` + `KIWA_SIEM_ENDPOINT` + `KIWA_PAGERDUTY_URL` + `KIWA_LOKI_URL` + `KIWA_SIEM_TOKEN` are set) implementations satisfy the same 16-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-siem-incident-app test
pnpm --filter dogfood-security-siem-incident-app test:e2e
```

The vitest suite drives the mock adapter through the same siem / incident / ir-orchestrator handlers the runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export SIEM_STACK_READY=1
export KIWA_SIEM_ENDPOINT=https://splunk.example.com:8088/services/collector
export KIWA_PAGERDUTY_URL=https://events.pagerduty.com/v2/enqueue
export KIWA_LOKI_URL=https://loki.example.com/loki/api/v1/push
export KIWA_SIEM_TOKEN=Splunk_HEC_Token_abc
pnpm --filter dogfood-security-siem-incident-app test
```

The real adapter defers the Splunk HEC + Loki push + PagerDuty escalation ceremony to a follow-up milestone. Until `SIEM_STACK_READY=1` + `KIWA_SIEM_ENDPOINT` + `KIWA_PAGERDUTY_URL` + `KIWA_LOKI_URL` + `KIWA_SIEM_TOKEN` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_SIEM_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 16 ops across 3 domain surfaces + 2 axes.

- **siem-audit surface (siem axis: structured + seal + retention + correlate)**
  - `startSiem` — begin a SIEM audit session bound to a provider target (istio / opa / siem-splunk / vault)
  - `structureEvent` — turn a raw audit event into a CIM payload with an auto-assigned eventId
  - `sealEvents` — chain the structured batch into a tamper-evident hash-chain seal
  - `applyRetention` — assign hot / warm / cold retention days + legalHold flag
  - `correlate` — run a rule against structured events with a windowMs bound
  - `closeSiem` — finalize the session (subsequent ops raise)
- **incident-response surface (incident axis: playbook + severity + escalate + forensics + post-mortem)**
  - `startIncident` — begin an incident-response session bound to a provider target
  - `triggerPlaybook` — bind a playbookId + detectionSource + initialAlert on the idle session
  - `classifySeverity` — walk the sev1-5 ladder based on data classification + service down + affected users
  - `escalate` — page the on-call rotation across N channels with a primary + optional secondary
  - `captureForensics` — record memory-dump / network-pcap / disk-image artefacts (in MB / GB)
  - `recordPostMortem` — attach a >= 10 char root cause + contributing factors + action items
  - `closeIncident` — finalize the session
- **orchestrator surface (orchestrator axis: fused SIEM → incident)**
  - `startOrchestrator` — begin a fused session bound to a siemTarget + incidentTarget pair
  - `orchestrateDecision` — decide `incidentTriggered` from `correlationMatched` + walk the same sev1-5 ladder from `dataClassification` + `serviceDown` + `affectedUsers`
  - `closeOrchestrator` — finalize the session

## Fidelity harness

`runFidelityHarness()` diffs the mock and real trace event streams and feeds the divergence count into `@kiwa-lab/quality-metrics` release gate. Behavioral divergences are expected on non-integration environments — the real adapter refuses every op with `KIWA_SIEM_ENV_MISSING`, and the mock adapter succeeds, so every op appears in the divergence list. The harness treats those as `BEHAVIORAL_DIVERGENCE` records so the release-gate row can distinguish "not configured" from "ran and diverged".

The report writes both markdown and JSON into `./quality-report/`, which the release script picks up alongside every other axis dogfood.
