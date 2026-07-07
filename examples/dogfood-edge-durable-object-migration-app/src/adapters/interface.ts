/**
 * Provider-neutral DurableObject state migration surface for the
 * dogfood-edge-durable-object-migration-app.
 *
 * The app talks to the DurableObject class migration + state schema
 * versioning + zero-downtime rollout stack only through this interface.
 * Two implementations exist —
 *  - {@link makeRealAdapter} — drives Cloudflare Workers Durable Objects +
 *    Vercel Edge session-affinity + Deno Deploy stateful-object APIs when
 *    KIWA_MODE=real + EDGE_DO_MIGRATION_STACK_READY=1 are set.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/edge` v1.2 advanced
 *    do-state-migration semantics.
 *
 * 12-op contract — 3 axes × 4 ops (schema-bump / data-migrate / rollout).
 */

import type { EdgePlatform as EdgeEdgePlatform } from '@kiwa-test/edge';

export type EdgePlatform = EdgeEdgePlatform;

/** Migration lifecycle stage. */
export type MigrationStage = 'schema-bump' | 'data-migrate' | 'rollout';

export interface MigrationSession {
  sessionId: string;
  platform: EdgePlatform;
  fromVersion: number;
  toVersion: number;
  instanceIds: string[];
}

export interface MigrationStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface EdgeDoMigrationAdapter {
  // schema-bump axis — initiate + bump + verify + close
  startSchemaBump: (input: {
    platform: EdgePlatform;
    fromVersion: number;
    toVersion: number;
    instanceIds: string[];
  }) => Promise<MigrationSession>;
  bumpSchemaVersion: (session: MigrationSession) => Promise<MigrationStep>;
  verifySchemaBump: (session: MigrationSession) => Promise<MigrationStep>;
  closeSchemaBump: (session: MigrationSession) => Promise<void>;
  // data-migrate axis — start + migrate one + migrate many + close
  startDataMigrate: (input: MigrationSession) => Promise<MigrationSession>;
  migrateOneInstance: (
    session: MigrationSession,
    input: { instanceId: string },
  ) => Promise<MigrationStep>;
  migrateBatch: (
    session: MigrationSession,
    input: { instanceIds: string[] },
  ) => Promise<MigrationStep>;
  closeDataMigrate: (session: MigrationSession) => Promise<void>;
  // rollout axis — start + complete + rollback + close
  startRollout: (input: MigrationSession) => Promise<MigrationSession>;
  completeRolloutOp: (session: MigrationSession) => Promise<MigrationStep>;
  rollbackRollout: (session: MigrationSession) => Promise<MigrationStep>;
  closeRollout: (session: MigrationSession) => Promise<void>;
}
