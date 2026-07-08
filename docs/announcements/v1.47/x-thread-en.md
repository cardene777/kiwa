# kiwa v1.47 x-thread (English)

## Tweet 1 — hook

kiwa v1.47 released — security-devsecops v0.2 adapter integration Phase 2 completed, single-axis milestone.

v0.1 semantics + 6 axis × mock/real adapter pair (12 adapter). Real CLI (semgrep / trivy / gitleaks / tfsec / OWASP ZAP / grype) invocation hiding interface + env-gate + fidelity harness established.

## Tweet 2 — adapter interface + env-gate

6 adapter interfaces = SastAdapter + ScaAdapter + SecretAdapter + IacAdapter + DastAdapter + ContainerAdapter. Default path = mock (always test-runnable). Real path = KIWA_SECURITY_MODE=real + each CLI URL env only, fail-closed with explicit throw when unset.

## Tweet 3 — fidelity harness + skill 4 SSOT

dogfood-security-devsecops-adapter-app provides mock/real fidelity harness (runAdapterWorkflow + diffFidelity), reusable when v0.3 replaces real adapters with spawn implementation. security-audit / supply-chain / specialty / threat-model 4 skills × mock/real path map SSOT'd in concept doc.

## Tweet 4 — 25-milestone streak + backward compat

**25-milestone consecutive snippet validation streak** (v1.23-v1.47) achieved, kiwa all-time record updated. Backward compat strict = v0.1 semantics function API 0 changes, v0.2 adapter is new optional path.

`pnpm add -D @kiwa/security-devsecops@^0.2`. Migration: https://cardene777.github.io/kiwa/migrations/v1.46-to-v1.47

7 sub complete (v1.47-1 adapter interface + 6 mock / v1.47-2 6 real + env-gate / v1.47-3 dogfood / v1.47-4 skill SSOT / v1.47-5 tutorial 105 + 25 streak / v1.47-6 publish / v1.47-7 retrospective).

#kiwa #devsecops #adapter #security #testing #vitest
