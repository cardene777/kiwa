import type { Migration } from './client.js';

export interface DryRunPlan {
  operations: Array<{ id: string; direction: 'up' | 'down'; sql: string; estimated: 'safe' | 'risky' | 'destructive' }>;
  totalSteps: number;
  destructiveCount: number;
}

/**
 * migration 列を「dry-run」 で解析、 実 SQL を実行せずに safe / risky / destructive の
 * 3 段階リスク分類 + 総 step 数 + destructive 数を返す。 real Prisma `migrate diff --dry-run` 相当。
 */
export function planDryRun(pending: readonly Migration[], direction: 'up' | 'down' = 'up'): DryRunPlan {
  const operations = pending.map((m) => ({
    id: m.id,
    direction,
    sql: direction === 'up' ? m.up : m.down,
    estimated: estimateRisk(direction === 'up' ? m.up : m.down),
  }));
  const destructiveCount = operations.filter((o) => o.estimated === 'destructive').length;
  return { operations, totalSteps: operations.length, destructiveCount };
}

function estimateRisk(sql: string): 'safe' | 'risky' | 'destructive' {
  const upper = sql.toUpperCase();
  if (upper.includes('DROP TABLE') || upper.includes('DROP COLUMN') || upper.includes('TRUNCATE')) return 'destructive';
  if (upper.includes('ALTER TABLE') && (upper.includes('DROP') || upper.includes('RENAME'))) return 'risky';
  if (upper.includes('UPDATE') || upper.includes('DELETE')) return 'risky';
  return 'safe';
}

/**
 * migration 間の dependency (id 参照) を解決、 topological order で並び替える。
 * real migration lib の depends-on 解決相当、 循環参照は throw。
 */
export interface MigrationWithDeps extends Migration {
  dependsOn?: string[];
}

export function resolveDependencyOrder(migrations: readonly MigrationWithDeps[]): MigrationWithDeps[] {
  const map = new Map(migrations.map((m) => [m.id, m]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: MigrationWithDeps[] = [];
  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`cyclic dependency detected at ${id}`);
    const node = map.get(id);
    if (!node) throw new Error(`unknown migration referenced: ${id}`);
    visiting.add(id);
    for (const dep of node.dependsOn ?? []) visit(dep);
    visiting.delete(id);
    visited.add(id);
    result.push(node);
  }
  for (const m of migrations) visit(m.id);
  return result;
}
