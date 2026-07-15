export type MigrationProvider = 'prisma' | 'drizzle' | 'kysely' | 'knex';

export type MigrationStatus = 'pending' | 'applied' | 'rolled_back' | 'failed';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

export interface MigrationRecord {
  id: string;
  name: string;
  status: MigrationStatus;
  appliedAt?: number;
  rolledBackAt?: number;
  reason?: string;
}

export interface MigrationResult {
  id: string;
  provider: MigrationProvider;
  status: MigrationStatus;
  appliedAt: number;
  reason?: string;
}

export interface MigrationClient {
  provider: MigrationProvider;
  applied: MigrationRecord[];
  now: () => number;
  markApplied: (migration: Migration) => MigrationResult;
  markRolledBack: (id: string) => MigrationResult;
  markFailed: (migration: Migration, reason: string) => MigrationResult;
  clear: () => void;
}

export interface CreateMigrationClientOptions {
  provider?: MigrationProvider;
  now?: () => number;
  seedApplied?: MigrationRecord[];
}

/**
 * provider 差 (Prisma / Drizzle / Kysely / Knex) を吸収した migration mock client。
 * runUp / runDown / applyPendingMigrations 経由でこの client の applied array を更新する。
 */
export function createMigrationClient(options: CreateMigrationClientOptions = {}): MigrationClient {
  const provider = options.provider ?? 'prisma';
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const applied: MigrationRecord[] = options.seedApplied ? [...options.seedApplied] : [];

  return {
    provider,
    applied,
    now,
    markApplied(migration: Migration): MigrationResult {
      const appliedAt = now();
      const record: MigrationRecord = {
        id: migration.id,
        name: migration.name,
        status: 'applied',
        appliedAt,
      };
      applied.push(record);
      return { id: migration.id, provider, status: 'applied', appliedAt };
    },
    markRolledBack(id: string): MigrationResult {
      const rolledBackAt = now();
      const idx = applied.findIndex((r) => r.id === id);
      if (idx < 0) {
        const failed: MigrationResult = { id, provider, status: 'failed', appliedAt: rolledBackAt, reason: 'not applied' };
        return failed;
      }
      const record = applied[idx]!;
      applied[idx] = { ...record, status: 'rolled_back', rolledBackAt };
      return { id, provider, status: 'rolled_back', appliedAt: rolledBackAt };
    },
    markFailed(migration: Migration, reason: string): MigrationResult {
      const appliedAt = now();
      const record: MigrationRecord = {
        id: migration.id,
        name: migration.name,
        status: 'failed',
        reason,
      };
      applied.push(record);
      return { id: migration.id, provider, status: 'failed', appliedAt, reason };
    },
    clear(): void {
      applied.length = 0;
    },
  };
}
