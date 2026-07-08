# dogfood-security-rbac-abac-app (v1.37-3)

A Casbin-style Authorization service that drives RBAC (role hierarchy + permission inheritance) + ABAC (attribute matching + combining algorithms) + policy engine (combined RBAC/ABAC decision) + policy store (versioning + rollback + activation) across a provider-neutral `SecurityAdapter`. Both mock (`@kiwa/security` v0.1 authorization semantics) and real (Casbin-style policy store driver when `AUTHZ_STORE_READY=1` + `KIWA_POLICY_STORE_URL` are set) implementations satisfy the same 15-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-security-rbac-abac-app test
pnpm --filter dogfood-security-rbac-abac-app test:e2e
```

The vitest suite drives the mock adapter through the same rbac / abac / policy-store handlers the runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export AUTHZ_STORE_READY=1
export KIWA_POLICY_STORE_URL=postgres://localhost:5432/policy
pnpm --filter dogfood-security-rbac-abac-app test
```

The real adapter defers the Casbin policy store driver wiring to a follow-up milestone. Until `AUTHZ_STORE_READY=1` + `KIWA_POLICY_STORE_URL` are set (which every non-integration environment leaves unset), every real op refuses with `KIWA_AUTHZ_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`SecurityAdapter` covers 15 ops across 3 domain surfaces + 3 axes.

- **rbac surface (rbac axis: role hierarchy + subject expansion + permission check)**
  - `startRbac` — begin an RBAC policy session
  - `attachRole` — attach a role with permissions + optional parent role list (inherits transitively)
  - `expandRoles` — walk the parent hierarchy for a subject's assigned roles and return the transitive permission union
  - `checkPermission` — return true iff the transitive union contains the requested permission
  - `closeRbac` — finalize the policy session (subsequent attach raises)
- **abac surface (abac axis: attribute matching + combining algorithm + combined engine)**
  - `startAbac` — begin an ABAC policy session with a combining algorithm (deny-overrides / permit-overrides / first-applicable)
  - `attachRule` — attach a rule with id + effect (permit / deny) + attribute predicate over subject / resource / action / environment
  - `evaluateAbac` — return `AbacDecision` for a set of 4 attribute buckets under the session's combining algorithm
  - `evaluateCombined` — couple an RBAC decision with an ABAC decision (RBAC deny wins, otherwise ABAC decides)
  - `closeAbac` — finalize the policy session
- **policy-store surface (policy-store axis: versioning + activation + rollback)**
  - `startPolicyStore` — begin a policy store session (ordered version list + single active pointer)
  - `publishPolicy` — append a new version and optionally move the active pointer forward
  - `activatePolicy` — move the active pointer to any stored version
  - `rollbackPolicy` — move the active pointer backwards to an earlier stored version (guarded against forward rollback)
  - `closePolicyStore` — finalize the store session

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa/quality-metrics` picks up for the 13-axis release gate. The doc counterpart is added alongside the existing security dogfood entry.
