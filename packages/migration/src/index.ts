export {
  createMigrationClient,
  type MigrationProvider,
  type MigrationClient,
  type Migration,
  type MigrationRecord,
  type MigrationStatus,
  type MigrationResult,
} from './client.js';

export {
  runUp,
  runDown,
  applyPendingMigrations,
  type ApplyPendingResult,
} from './up-down.js';

export {
  diffSchema,
  type SchemaColumn,
  type SchemaTable,
  type Schema,
  type SchemaDiff,
  type ColumnDiff,
} from './diff.js';

export {
  listAppliedMigrations,
  type MigrationHistory,
} from './history.js';

export {
  createLockRegistry,
  type MigrationLock,
} from './lock.js';

export {
  planDryRun,
  resolveDependencyOrder,
  type DryRunPlan,
  type MigrationWithDeps,
} from './dryrun.js';
