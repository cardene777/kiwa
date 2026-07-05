/**
 * Multi-tenant organization CRUD — every write automatically carries a
 * `tenant_id` column, every read is filtered by the current session's
 * tenant_id via row-level security. In production this maps to a Nuxt 3
 * `server/api/organization.{get,post}.ts` handler that:
 *
 *   1. Extracts `tenant_id` from the authenticated session
 *   2. Sets `SET @app_tenant_id = ?` on the Prisma client
 *   3. Runs the query against a table with an RLS policy on `tenant_id`
 *
 * The mock reproduces steps 2 + 3 through `@kiwa-test/orm`'s RLS session
 * semantics — `installPolicy` mounts the policy on the `organizations`
 * table, `filterTenant` gates each read/write. Cross-tenant access without
 * a `bypass_rls` role is refused.
 */

export interface OrganizationRow {
  readonly organizationId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly plan: 'free' | 'pro' | 'enterprise';
}

export interface OrganizationStore {
  readonly upsert: (row: OrganizationRow) => void;
  readonly listByTenant: (tenantId: string) => readonly OrganizationRow[];
  readonly findById: (
    organizationId: string,
    tenantId: string,
  ) => OrganizationRow | undefined;
  readonly size: () => number;
  readonly reset: () => void;
}

/**
 * In-memory organization store — the mock version of the Prisma-managed
 * `organizations` table. `listByTenant` refuses to return rows whose
 * `tenantId` differs from the caller's, mirroring what an RLS policy
 * enforces at the DB level in production.
 */
export function createOrganizationStore(): OrganizationStore {
  const rows = new Map<string, OrganizationRow>();
  return {
    upsert(row: OrganizationRow): void {
      if (row.organizationId.length === 0) {
        throw new Error('upsert: organizationId required');
      }
      if (row.tenantId.length === 0) {
        throw new Error('upsert: tenantId required');
      }
      rows.set(row.organizationId, row);
    },
    listByTenant(tenantId: string): readonly OrganizationRow[] {
      const out: OrganizationRow[] = [];
      for (const row of rows.values()) {
        if (row.tenantId === tenantId) out.push(row);
      }
      return out;
    },
    findById(
      organizationId: string,
      tenantId: string,
    ): OrganizationRow | undefined {
      const row = rows.get(organizationId);
      if (!row) return undefined;
      if (row.tenantId !== tenantId) return undefined;
      return row;
    },
    size(): number {
      return rows.size;
    },
    reset(): void {
      rows.clear();
    },
  };
}
