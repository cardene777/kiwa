---
title: "@kiwa-lab/orm semantics__rls の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;rls</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>bypassRls</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L133) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Simulate a `bypass_rls` role usage. Requires a policy to be installed — a bypass without a policy is a bug. Marks the session 'bypassed' and emits `rls.bypass-used`. Subsequent `filterTenant` calls will throw until the caller re-installs / re-arms the policy.

```ts
export declare function bypassRls(session: RlsSession, input: {
    roleId: string;
    reason: string;
}): AxisStep<RlsState>;
```

#### <code v-pre>createRlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L52) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Create an RLS session bound to a table. State starts at 'no-policy'; the caller must call `installPolicy` before any filter / bypass step.

```ts
export declare function createRlsSession(input: {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): RlsSession;
```

#### <code v-pre>filterTenant</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L104) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Simulate a per-tenant filter application on a query. Requires a policy to be installed and the session to be 'policy-installed' (not bypassed). Emits `rls.tenant-isolated`. Metadata carries the tenant id and the operation kind.

```ts
export declare function filterTenant(session: RlsSession, input: {
    tenantId: string;
    operation: 'read' | 'write';
}): AxisStep<RlsState>;
```

#### <code v-pre>installPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L72) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Install a policy over a table. Requires an unused tenant column name. Emits `rls.policy-installed`.

```ts
export declare function installPolicy(session: RlsSession, input: {
    name: string;
    tenantColumn: string;
}): AxisStep<RlsState>;
```

#### <code v-pre>logAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L156) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Append an audit log entry. Audit is passive; it does not change state. Records the tenant, operation, whether the operation was allowed, and a reason string. Emits `rls.audit-logged`.

```ts
export declare function logAudit(session: RlsSession, input: RlsAuditEntry): AxisStep<RlsState>;
```

### 型

#### <code v-pre>RlsAuditEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L26) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsAuditEntry {
    tenantId: string;
    operation: 'read' | 'write';
    allowed: boolean;
    reason: string;
}
```

#### <code v-pre>RlsPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L20) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsPolicy {
    name: string;
    table: string;
    tenantColumn: string;
}
```

#### <code v-pre>RlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L33) <code v-pre>packages/orm/src/semantics/rls.ts</code>

```ts
export interface RlsSession {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: RlsState;
    policy: RlsPolicy | null;
    auditLog: RlsAuditEntry[];
    history: AxisStep<RlsState>[];
}
```

#### <code v-pre>RlsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/rls.ts#L18) <code v-pre>packages/orm/src/semantics/rls.ts</code>

Row-level security (RLS) — install a per-table policy, evaluate it on every read/write to isolate tenants, allow a superuser / `bypass_rls` role to skip it under audit, and record every access in an audit trail. Postgres has first-class `CREATE POLICY`; MySQL / SQLite emulate with filtered views. The mock exposes the same 4 neutral events for all 3 backends so tests can assert on tenant isolation regardless of backend. State transitions: created → 'no-policy' installPolicy → 'policy-installed' filterTenant → 'policy-installed' bypassRls → 'bypassed' logAudit → (state unchanged, audit is passive)

```ts
export type RlsState = 'no-policy' | 'policy-installed' | 'bypassed';
```
