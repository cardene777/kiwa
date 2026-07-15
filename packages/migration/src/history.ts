import type { MigrationClient, MigrationRecord } from './client.js';

export interface MigrationHistory {
  provider: string;
  total: number;
  applied: MigrationRecord[];
  rolledBack: MigrationRecord[];
  failed: MigrationRecord[];
  latestApplied?: MigrationRecord;
}

/**
 * client.applied を category 別 (applied / rolled_back / failed) に集計。
 * latestApplied = appliedAt max の record (無ければ undefined)。
 */
export function listAppliedMigrations(client: MigrationClient): MigrationHistory {
  const applied = client.applied.filter((r) => r.status === 'applied');
  const rolledBack = client.applied.filter((r) => r.status === 'rolled_back');
  const failed = client.applied.filter((r) => r.status === 'failed');
  // latestApplied = insertion-order の最後 (default now が定数を返す環境でも安定)
  // 同 appliedAt が並ぶ場合は後入れ勝ちで実際の適用順を保つ。
  const history: MigrationHistory = {
    provider: client.provider,
    total: client.applied.length,
    applied,
    rolledBack,
    failed,
  };
  if (applied.length > 0) {
    history.latestApplied = applied[applied.length - 1]!;
  }
  return history;
}
