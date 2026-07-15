import type { Migration, MigrationClient, MigrationResult } from './client.js';

export interface ApplyPendingResult {
  applied: MigrationResult[];
  skipped: string[];
  failed: MigrationResult[];
}

/**
 * 1 migration の up 実行 mock。 実 provider (Prisma migrate / Drizzle push / Kysely migrator /
 * Knex migrate) は client.applied を更新する経路で invoke される。
 */
export function runUp(client: MigrationClient, migration: Migration): MigrationResult {
  const already = client.applied.find((r) => r.id === migration.id && r.status === 'applied');
  if (already) {
    return { id: migration.id, provider: client.provider, status: 'applied', appliedAt: already.appliedAt ?? client.now(), reason: 'already applied' };
  }
  return client.markApplied(migration);
}

/**
 * 1 migration の down 実行 mock。 markRolledBack で client.applied の status を更新。
 */
export function runDown(client: MigrationClient, migrationId: string): MigrationResult {
  return client.markRolledBack(migrationId);
}

/**
 * pending 全 migration を id 昇順で適用。 failed が出た時点で以降 skip。
 */
export function applyPendingMigrations(client: MigrationClient, migrations: Migration[]): ApplyPendingResult {
  const applied: MigrationResult[] = [];
  const skipped: string[] = [];
  const failed: MigrationResult[] = [];
  const sorted = [...migrations].sort((a, b) => a.id.localeCompare(b.id));
  let hasFailure = false;
  for (const migration of sorted) {
    if (hasFailure) {
      skipped.push(migration.id);
      continue;
    }
    const already = client.applied.find((r) => r.id === migration.id && r.status === 'applied');
    if (already) {
      skipped.push(migration.id);
      continue;
    }
    const result = client.markApplied(migration);
    if (result.status === 'failed') {
      failed.push(result);
      hasFailure = true;
    } else {
      applied.push(result);
    }
  }
  return { applied, skipped, failed };
}
