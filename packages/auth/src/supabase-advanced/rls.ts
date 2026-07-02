import type {
  RlsCheckInput,
  RlsCheckOutcome,
  RlsPolicy,
  RlsPolicyContext,
} from './types.js';

/**
 * PostgreSQL RLS policy simulator. Real Supabase relies on Postgres's RLS
 * evaluation — for testing we replicate the semantics in memory. The mock
 * enforces the same conjunction of USING (row visibility) + WITH CHECK (write
 * validation) predicates that Postgres does.
 */
export interface RlsRegistry {
  define(policy: RlsPolicy): void;
  drop(table: string, name: string): void;
  list(table?: string): RlsPolicy[];
  check(input: RlsCheckInput, ctx: RlsPolicyContext): RlsCheckOutcome;
}

export function createRlsRegistry(): RlsRegistry {
  const policies: RlsPolicy[] = [];

  function key(table: string, name: string): string {
    return `${table}::${name}`;
  }

  return {
    define(policy) {
      const idx = policies.findIndex(
        (p) => key(p.table, p.name) === key(policy.table, policy.name),
      );
      if (idx >= 0) {
        // Redefinition — replace in place, matching Postgres `CREATE OR REPLACE POLICY`.
        policies[idx] = policy;
        return;
      }
      policies.push(policy);
    },
    drop(table, name) {
      const idx = policies.findIndex((p) => p.table === table && p.name === name);
      if (idx >= 0) policies.splice(idx, 1);
    },
    list(table) {
      if (table === undefined) return [...policies];
      return policies.filter((p) => p.table === table);
    },
    check(input, ctx) {
      // service_role bypasses RLS entirely, matching Postgres behavior.
      if (ctx.role === 'service_role') {
        return { allowed: true, matchedPolicy: 'service_role bypass', reason: undefined };
      }

      const applicable = policies.filter(
        (p) =>
          p.table === input.table &&
          (p.command === 'all' || p.command === input.command) &&
          (p.roles.length === 0 || p.roles.includes(ctx.role)),
      );

      if (applicable.length === 0) {
        return {
          allowed: false,
          matchedPolicy: undefined,
          reason: `no RLS policy grants ${ctx.role} ${input.command} on ${input.table}`,
        };
      }

      // Postgres evaluates policies as OR — any policy that grants access wins.
      for (const policy of applicable) {
        const usingRow = input.row;
        const checkRow = input.newRow ?? input.row;
        // USING side (read visibility for SELECT / UPDATE / DELETE).
        if ((input.command === 'select' || input.command === 'update' || input.command === 'delete')) {
          if (!usingRow) {
            // Cannot evaluate USING without a candidate row — treat as no-match.
            continue;
          }
          if (policy.using && !policy.using(usingRow, ctx)) continue;
        }
        // WITH CHECK side (write validation for INSERT / UPDATE).
        if (input.command === 'insert' || input.command === 'update') {
          if (!checkRow) continue;
          if (policy.withCheck && !policy.withCheck(checkRow, ctx)) continue;
        }
        return { allowed: true, matchedPolicy: policy.name, reason: undefined };
      }

      return {
        allowed: false,
        matchedPolicy: undefined,
        reason: `no matching RLS policy allows ${ctx.role} ${input.command} on ${input.table}`,
      };
    },
  };
}
