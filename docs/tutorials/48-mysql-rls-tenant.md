# MySQL RLS + multi-tenant — row-level security in 15 min

## What you'll build

A vitest suite wired to `@kiwa/orm` v0.9 that walks the RLS (row-level security) axis end-to-end for a multi-tenant SaaS on MySQL 8. You will install a per-table policy, filter a tenant's read / write path, exercise a `bypass_rls` superuser role under audit, and record every access in an audit log. The exact pattern that `examples/dogfood-mysql-rls-tenant-app` (Nuxt 3 + Prisma + MySQL 8) uses — same `createRlsSession` + `installPolicy` + `filterTenant` + `bypassRls` + `logAudit` primitives, same state-machine guards, same tenant isolation invariants. You leave this tutorial with a runnable multi-tenant test and a working audit trail for any RLS flow you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-mysql-rls && cd kiwa-mysql-rls
pnpm init
pnpm add -D @kiwa/orm@^0.9 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Open an RLS session

`tests/rls/session.test.ts` — `createRlsSession` opens a per-table session. It starts at `no-policy` with a null `policy` and an empty `auditLog`. Subsequent `filterTenant` / `bypassRls` calls will throw until `installPolicy` moves it into `policy-installed`.

```ts
import { describe, expect, it } from 'vitest';
import { createRlsSession } from '@kiwa/orm';

describe('rls — session ctor', () => {
  it('starts at no-policy with an empty audit log', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(session.state).toBe('no-policy');
    expect(session.policy).toBeNull();
    expect(session.auditLog).toHaveLength(0);
    expect(session.history).toHaveLength(0);
  });
});
```

MySQL does not have a first-class `CREATE POLICY` — the mock emulates the semantics via a filtered-view pattern. The neutral events are portable (`rls.policy-installed` / `rls.tenant-isolated` / `rls.bypass-used` / `rls.audit-logged`), and the backend dialect is `view.filtered_installed` / `view.tenant_filter` / `grant.super_bypass` / `audit_log.record`.

### 3. Install a policy

`tests/rls/policy.test.ts` — `installPolicy` moves the session from `no-policy → policy-installed` and stores the policy `{ name, table, tenantColumn }` on the session.

```ts
import { describe, expect, it } from 'vitest';
import { createRlsSession, installPolicy } from '@kiwa/orm';

describe('rls — install policy', () => {
  it('captures the policy and moves to policy-installed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    const step = installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });

    expect(step.neutralEvent).toBe('rls.policy-installed');
    expect(step.backendEvent).toBe('view.filtered_installed');
    expect(step.state).toBe('policy-installed');
    expect(session.policy).toEqual({
      name: 'tenant_isolation',
      table: 'orders',
      tenantColumn: 'tenant_id',
    });
  });

  it('rejects an empty policy name', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() => installPolicy(session, { name: '', tenantColumn: 'tenant_id' })).toThrow(
      /policy name required/,
    );
  });
});
```

Policy name uniqueness is enforced at the app layer, not the session — the state-machine guard only requires a non-empty name. Postgres emits `pg_policy.created` for the same neutral event; MySQL emits `view.filtered_installed` matching the filtered-view emulation.

### 4. Filter a per-tenant read

`tests/rls/filter.test.ts` — `filterTenant` records that a read (or write) was scoped to a specific `tenantId`. Requires an installed policy; a call from `no-policy` or `bypassed` throws. Subsequent `filterTenant` calls stay in `policy-installed` (the axis models the "policy is armed" state, not per-call events).

```ts
import { describe, expect, it } from 'vitest';
import {
  createRlsSession,
  filterTenant,
  installPolicy,
} from '@kiwa/orm';

describe('rls — filter tenant', () => {
  it('records a per-tenant filter application', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, { name: 'tenant_isolation', tenantColumn: 'tenant_id' });

    const step = filterTenant(session, { tenantId: 'tenant-a', operation: 'read' });

    expect(step.neutralEvent).toBe('rls.tenant-isolated');
    expect(step.backendEvent).toBe('view.tenant_filter');
    expect(step.state).toBe('policy-installed');
    expect(step.metadata.tenantId).toBe('tenant-a');
    expect(step.metadata.operation).toBe('read');
    expect(step.metadata.policyName).toBe('tenant_isolation');
  });

  it('throws when called before policy install', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() => filterTenant(session, { tenantId: 'tenant-a', operation: 'read' })).toThrow(
      /policy-installed/,
    );
  });
});
```

Downstream tests key on `step.metadata.tenantId + operation` to assert that the caller filtered on the expected tenant + kind. A test that intended a per-tenant read but forgot to install the policy first fails at test time with an actionable error, not at production with a cross-tenant leak.

### 5. Exercise the bypass_rls role

`tests/rls/bypass.test.ts` — `bypassRls` records that a superuser / `bypass_rls` role deliberately skipped the policy under an audit reason. Moves the session into `bypassed`. Subsequent `filterTenant` calls throw until the caller re-installs the policy — the bypass "sticks" so a test cannot silently regress to the filtered path.

```ts
import { describe, expect, it } from 'vitest';
import {
  bypassRls,
  createRlsSession,
  filterTenant,
  installPolicy,
} from '@kiwa/orm';

describe('rls — bypass', () => {
  it('records the bypass with role + reason and moves to bypassed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, { name: 'tenant_isolation', tenantColumn: 'tenant_id' });

    const step = bypassRls(session, {
      roleId: 'audit_report_writer',
      reason: 'nightly cross-tenant analytics job',
    });

    expect(step.neutralEvent).toBe('rls.bypass-used');
    expect(step.backendEvent).toBe('grant.super_bypass');
    expect(step.state).toBe('bypassed');
    expect(step.metadata.roleId).toBe('audit_report_writer');
  });

  it('sticks so filterTenant throws until policy re-installed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, { name: 'tenant_isolation', tenantColumn: 'tenant_id' });
    bypassRls(session, { roleId: 'admin', reason: 'ops' });

    expect(() => filterTenant(session, { tenantId: 'tenant-a', operation: 'read' })).toThrow(
      /policy-installed/,
    );
  });

  it('requires an installed policy — bypass without policy is a bug', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() => bypassRls(session, { roleId: 'admin', reason: 'ops' })).toThrow(
      /installed policy/,
    );
  });
});
```

The "bypass sticks" behaviour catches a common bug — a test that intends to bypass just once but forgot to re-arm the policy after. Every subsequent `filterTenant` call surfaces the mistake at test time, not in production. MySQL emits `grant.super_bypass`, matching the `GRANT SUPER` role that a real MySQL admin would use.

### 6. Record an audit entry

`tests/rls/audit.test.ts` — `logAudit` records every access decision (`allowed: true` or `allowed: false` + `reason`). Passive: it does not change state. The `auditLog` array accumulates entries for downstream inspection.

```ts
import { describe, expect, it } from 'vitest';
import {
  createRlsSession,
  installPolicy,
  logAudit,
} from '@kiwa/orm';

describe('rls — audit log', () => {
  it('accumulates entries without changing state', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, { name: 'tenant_isolation', tenantColumn: 'tenant_id' });

    logAudit(session, {
      tenantId: 'tenant-a',
      operation: 'read',
      allowed: true,
      reason: 'own-tenant',
    });
    logAudit(session, {
      tenantId: 'tenant-b',
      operation: 'write',
      allowed: false,
      reason: 'cross-tenant refused',
    });

    expect(session.auditLog).toHaveLength(2);
    expect(session.auditLog[0]?.allowed).toBe(true);
    expect(session.auditLog[1]?.allowed).toBe(false);
    expect(session.auditLog[1]?.reason).toBe('cross-tenant refused');
    expect(session.state).toBe('policy-installed'); // unchanged
  });
});
```

The audit log is what a compliance report reads later. The `logAudit` step returns an `AxisStep<RlsState>` envelope with `metadata.auditSize` — telemetry can key on the running count without walking the array.

### 7. Run it

```bash
pnpm test
```

Every step above returns an `AxisStep<RlsState>` envelope so downstream tests can assert on either the state machine outcome (`step.state === 'bypassed'`) or the emitted event (`step.neutralEvent === 'rls.tenant-isolated'`). The full end-to-end pattern lives in `packages/orm/tests/docs-tutorial-v1.26.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa/orm` v0.9 API.

## Where to next

- [Tutorial 47 — Postgres CDC + outbox (cdc axis)](./47-postgres-cdc-outbox)
- [Tutorial 49 — pgvector + hybrid search (vector-store axis)](./49-vector-search-pgvector)
- [Concept — Db advanced testing SSOT (8 axis + provider × backend fidelity table)](../concepts/db-advanced-testing)
- [Migration guide — v1.25 → v1.26](../migrations/v1.25-to-v1.26)
