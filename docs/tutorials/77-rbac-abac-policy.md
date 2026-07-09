# Authorization policy — RBAC + role hierarchy + ABAC + combining algorithms in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/security` v0.1 that models the 5 pieces of a real authorization pipeline that every non-trivial multi-tenant product eventually needs — an RBAC policy that pins named roles to permission strings, a role-hierarchy expander that walks parents recursively so an `admin` role inherits `editor` and `viewer` permissions without a copy-paste per role, an ABAC policy that evaluates attribute-based rules against a 4-bucket attribute shape (`subject / resource / action / environment`), a combining-algorithm selector (`deny-overrides` / `permit-overrides` / `first-applicable`) that resolves what happens when several rules match at once, and a combined RBAC + ABAC evaluator that layers the two decisions so an operator can start with roles and refine with attributes. `createRbacPolicy()` + `expandRoles()` + `rbacAllows()` + `evaluateAbac()` + `evaluateCombined()` + `toAuthorizationEvent()` give you every one of those pieces without booting a real casbin engine. This is the pattern kiwa's `examples/dogfood-security-rbac-abac-app` exercises against a real casbin policy file under `KIWA_MODE=real` + `KIWA_CASBIN_POLICY_PATH`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the `admin` role stopped inheriting `viewer` permissions after a role rename but nobody caught it until a support ticket asked why the audit UI was blank" gap a reviewer sees in the RBAC-drift post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-authz && cd kiwa-authz
pnpm init
pnpm add -D @kiwa-lab/security@^0.1 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.1 surface exports the authorization axis (`createRbacPolicy` / `expandRoles` / `rbacAllows` / `evaluateAbac` / `evaluateCombined` / `toAuthorizationEvent`) directly from the package root. This tutorial focuses on the authorization axis end-to-end; tutorial 76 covers CSP, tutorial 78 covers SBOM + secrets scanning.

### 2. `createRbacPolicy` + `rbacAllows` — the flat role case

`tests/authz/rbac-flat.test.ts` — an RBAC policy pins roles to permission strings. `createRbacPolicy()` accepts a list of `RbacRole` shapes; `rbacAllows()` returns `true` when the subject's assigned role transitively grants the requested permission. The base case is a flat policy — no parents, one role per permission.

```ts
import { describe, expect, it } from 'vitest';
import { createRbacPolicy, rbacAllows } from '@kiwa-lab/security';

describe('rbac — flat policy', () => {
  it('grants a permission that the subject role holds', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['read:articles', 'write:articles'] },
    ]);
    const subject = { id: 'alice', roles: ['viewer'] };
    expect(rbacAllows(policy, subject, 'read:articles')).toBe(true);
    expect(rbacAllows(policy, subject, 'write:articles')).toBe(false);
  });

  it('denies a permission when the subject has no role', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
    ]);
    expect(
      rbacAllows(policy, { id: 'unknown', roles: [] }, 'read:articles'),
    ).toBe(false);
  });

  it('denies a permission when the subject holds an unknown role', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
    ]);
    expect(
      rbacAllows(
        policy,
        { id: 'bob', roles: ['ghost'] },
        'read:articles',
      ),
    ).toBe(false);
  });
});
```

The unknown-role case returns `false` rather than throwing — the default-deny posture is what makes the check safe to call on every request without a try / catch envelope.

### 3. `expandRoles` — the role hierarchy walk

`tests/authz/rbac-hierarchy.test.ts` — role hierarchy expresses inheritance. If `admin` has `parents: ['editor']` and `editor` has `parents: ['viewer']`, then a subject assigned `admin` inherits every permission held by `editor` + `viewer`. `expandRoles()` returns the transitive permission set (a `Set<string>` deduped across the walk) so the evaluator can answer any `rbacAllows()` question in constant time after the walk.

```ts
import { describe, expect, it } from 'vitest';
import { createRbacPolicy, expandRoles, rbacAllows } from '@kiwa-lab/security';

describe('rbac — role hierarchy', () => {
  it('expands parent permissions transitively', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['write:articles'], parents: ['viewer'] },
      { name: 'admin', permissions: ['delete:articles'], parents: ['editor'] },
    ]);
    const subject = { id: 'root', roles: ['admin'] };
    const perms = expandRoles(policy, subject);
    expect(perms.has('read:articles')).toBe(true);
    expect(perms.has('write:articles')).toBe(true);
    expect(perms.has('delete:articles')).toBe(true);
  });

  it('rbacAllows honors inherited permissions', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['write:articles'], parents: ['viewer'] },
    ]);
    expect(
      rbacAllows(
        policy,
        { id: 'e', roles: ['editor'] },
        'read:articles',
      ),
    ).toBe(true);
  });

  it('detects a cycle at policy creation time', () => {
    expect(() =>
      createRbacPolicy([
        { name: 'a', permissions: [], parents: ['b'] },
        { name: 'b', permissions: [], parents: ['a'] },
      ]),
    ).toThrow(/cycle detected/);
  });
});
```

The cycle detection runs at `createRbacPolicy()` time, not at evaluate time — the operator sees the problem before the request loop calls `rbacAllows()`.

### 4. `evaluateAbac` — the attribute-based decision

`tests/authz/abac-basic.test.ts` — an ABAC policy pins a list of `AbacRule` shapes. Each rule has a `condition` predicate that reads the `AbacAttributes` bucket (`subject / resource / action / environment`) and returns `true` or `false`; a matched rule contributes its `effect` (`permit` / `deny`) to the decision. `evaluateAbac()` returns `AbacDecision` with the effect, the matched rule id, and a human-readable reason — the reason is what the fidelity harness compares real vs. mock outputs on.

```ts
import { describe, expect, it } from 'vitest';
import type { AbacPolicy } from '@kiwa-lab/security';
import { evaluateAbac } from '@kiwa-lab/security';

describe('abac — first-applicable', () => {
  const policy: AbacPolicy = {
    algorithm: 'first-applicable',
    rules: [
      {
        id: 'r-owner-edit',
        effect: 'permit',
        condition: (attrs) =>
          attrs.action === 'edit' &&
          attrs.subject.id === attrs.resource.ownerId,
      },
      {
        id: 'r-guest-read',
        effect: 'permit',
        condition: (attrs) =>
          attrs.action === 'read' && attrs.subject.role === 'guest',
      },
    ],
  };

  it('permits the owner edit when the subject id matches the resource ownerId', () => {
    const decision = evaluateAbac(policy, {
      subject: { id: 'alice', role: 'member' },
      resource: { ownerId: 'alice' },
      action: 'edit',
      environment: {},
    });
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-owner-edit');
  });

  it('defaults to deny when no rule matches', () => {
    const decision = evaluateAbac(policy, {
      subject: { id: 'bob', role: 'member' },
      resource: { ownerId: 'alice' },
      action: 'delete',
      environment: {},
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBeNull();
    expect(decision.reason).toMatch(/default deny/);
  });
});
```

### 5. Combining algorithms — `deny-overrides` vs. `permit-overrides` vs. `first-applicable`

`tests/authz/abac-combining.test.ts` — when multiple rules match, the combining algorithm decides which effect wins. `deny-overrides` (any DENY wins over a PERMIT), `permit-overrides` (any PERMIT wins over a DENY), and `first-applicable` (the first matching rule wins, ignoring later rules). The three algorithms are the XACML-standard set; picking the wrong one is the single most common ABAC bug.

```ts
import { describe, expect, it } from 'vitest';
import type { AbacRule } from '@kiwa-lab/security';
import { evaluateAbac } from '@kiwa-lab/security';

const rules: AbacRule[] = [
  { id: 'r-permit', effect: 'permit', condition: () => true },
  { id: 'r-deny', effect: 'deny', condition: () => true },
];

const attrs = {
  subject: { id: 'x' },
  resource: {},
  action: 'read',
  environment: {},
};

describe('abac — combining algorithms', () => {
  it('deny-overrides — any deny wins', () => {
    const decision = evaluateAbac({ algorithm: 'deny-overrides', rules }, attrs);
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('r-deny');
  });

  it('permit-overrides — any permit wins', () => {
    const decision = evaluateAbac({ algorithm: 'permit-overrides', rules }, attrs);
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-permit');
  });

  it('first-applicable — the first matching rule wins', () => {
    const decision = evaluateAbac({ algorithm: 'first-applicable', rules }, attrs);
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-permit');
  });
});
```

The default-deny fallback still applies when no rule matches — the algorithm only picks between matching rules, not between "matches" and "did not match".

### 6. `evaluateCombined` — layering RBAC over ABAC

`tests/authz/combined.test.ts` — real systems start with RBAC (broad "who can do what") and refine with ABAC ("but not if they're on a shared IP" / "only within business hours"). `evaluateCombined()` accepts optional `rbac` and `abac` inputs — if RBAC denies, the whole decision is DENY; if RBAC permits and ABAC is absent, the decision is PERMIT; if both are present, the ABAC decision takes over (letting a deny narrow the RBAC permit or letting a permit confirm it).

```ts
import { describe, expect, it } from 'vitest';
import { createRbacPolicy, evaluateCombined } from '@kiwa-lab/security';

describe('combined — rbac + abac', () => {
  const rbacPolicy = createRbacPolicy([
    { name: 'editor', permissions: ['write:articles'] },
  ]);

  it('denies when rbac denies (ABAC is not consulted)', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'guest', roles: [] },
        permission: 'write:articles',
      },
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('rbac');
  });

  it('permits when rbac permits and no abac is given', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'alice', roles: ['editor'] },
        permission: 'write:articles',
      },
    });
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('rbac');
  });

  it('lets abac deny narrow a rbac permit', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'alice', roles: ['editor'] },
        permission: 'write:articles',
      },
      abac: {
        policy: {
          algorithm: 'deny-overrides',
          rules: [
            {
              id: 'r-out-of-hours',
              effect: 'deny',
              condition: (a) => a.environment.hour === 3,
            },
          ],
        },
        attrs: {
          subject: { id: 'alice' },
          resource: { id: 'article-1' },
          action: 'edit',
          environment: { hour: 3 },
        },
      },
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('r-out-of-hours');
  });
});
```

The order of precedence (RBAC deny short-circuits, ABAC otherwise takes over) is the SSOT you can point a security review at when they ask "who wins if both fire".

### 7. `toAuthorizationEvent` — the fidelity harness adapter

`tests/authz/adapter.test.ts` — `toAuthorizationEvent()` normalizes an authorization decision into the same `SecurityEvent` shape the CSP tutorial 76 uses. The `axis` is fixed at `'authorization'`, the `provider` picks `'casbin'` (policy engine) or `'coraza'` (WAF-side authorization), and the `verdict` mirrors the ABAC decision effect (`permit` → `allow`, `deny` → `deny`).

```ts
import { describe, expect, it } from 'vitest';
import { toAuthorizationEvent } from '@kiwa-lab/security';

describe('authorization — fidelity adapter', () => {
  it('normalizes a permit decision into the neutral SecurityEvent shape', () => {
    const event = toAuthorizationEvent({
      provider: 'casbin',
      subject: 'alice',
      action: 'edit',
      timestamp: 200,
      decision: {
        effect: 'permit',
        matchedRule: 'r-owner-edit',
        reason: 'abac: first-applicable r-owner-edit',
      },
    });
    expect(event.axis).toBe('authorization');
    expect(event.provider).toBe('casbin');
    expect(event.verdict).toBe('allow');
    expect(event.timestamp).toBe(200);
    expect(event.reason).toContain('r-owner-edit');
  });

  it('maps deny effect to deny verdict', () => {
    const event = toAuthorizationEvent({
      provider: 'coraza',
      subject: 'bob',
      action: 'delete',
      timestamp: 300,
      decision: {
        effect: 'deny',
        matchedRule: null,
        reason: 'abac: no rule matched (default deny)',
      },
    });
    expect(event.verdict).toBe('deny');
    expect(event.provider).toBe('coraza');
  });
});
```

The two providers (`casbin` policy engine, `coraza` WAF-side authorization) emit events with the same shape — the fidelity harness compares the sequence rather than the wire encoding.

## Run the test suite

```bash
pnpm test
```

The v0.1 authorization axis surface — RBAC (`createRbacPolicy` / `expandRoles` / `rbacAllows`) + ABAC (`evaluateAbac`) + combined (`evaluateCombined`) + adapter (`toAuthorizationEvent`) — has 30+ tests in `packages/security/tests/authorization.test.ts` + `authorization-hierarchy.test.ts`; this tutorial covers the everyday RBAC + ABAC + combined path that lands in a real API middleware.

## What's next

- Tutorial 78 covers SBOM tooling (CycloneDX + SPDX + advisory feed + license policy + secrets scanning).
- The `security-real-driver-testing.md` concept doc is the SSOT for the 8-axis / 4-provider / 32-cell grid, the `KIWA_MODE=real` env-gate contract, and the per-provider required-env mapping (`KIWA_CASBIN_POLICY_PATH` for real casbin, `KIWA_CORAZA_RULES_PATH` for real coraza).
