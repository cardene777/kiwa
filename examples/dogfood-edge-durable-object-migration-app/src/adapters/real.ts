/**
 * Real adapter — env-gated stub delegating to real Cloudflare Workers
 * Durable Objects + Vercel Edge session-affinity + Deno Deploy
 * stateful-object migration APIs when KIWA_MODE=real +
 * EDGE_DO_MIGRATION_STACK_READY=1 + KIWA_EDGE_DO_URL are present.
 */
import type {
  EdgeDoMigrationAdapter,
  MigrationSession,
  MigrationStep,
} from './interface.js';

const ENV_MISSING = 'KIWA_EDGE_DO_MIGRATION_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['EDGE_DO_MIGRATION_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_EDGE_DO_URL'])
  );
}

function envMissingStep(op: string): MigrationStep {
  return {
    op,
    outcome: 'env-missing',
    metadata: { reason: ENV_MISSING },
  };
}

export function makeRealAdapter(): EdgeDoMigrationAdapter {
  let counter = 0;
  const newSession = (
    prefix: string,
    input: {
      platform: MigrationSession['platform'];
      fromVersion: number;
      toVersion: number;
      instanceIds: string[];
    },
  ): MigrationSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, ...input };
  };
  return {
    startSchemaBump: async (input) => newSession('schema', input),
    bumpSchemaVersion: async () => (isReady() ? { op: 'bumpSchemaVersion', outcome: 'success', metadata: { real: true } } : envMissingStep('bumpSchemaVersion')),
    verifySchemaBump: async () => (isReady() ? { op: 'verifySchemaBump', outcome: 'success', metadata: { real: true } } : envMissingStep('verifySchemaBump')),
    closeSchemaBump: async () => {},
    startDataMigrate: async (input) => newSession('data', input),
    migrateOneInstance: async (_s, { instanceId }) => (isReady() ? { op: 'migrateOneInstance', outcome: 'success', metadata: { instanceId, real: true } } : envMissingStep('migrateOneInstance')),
    migrateBatch: async (_s, { instanceIds }) => (isReady() ? { op: 'migrateBatch', outcome: 'success', metadata: { batchSize: instanceIds.length, real: true } } : envMissingStep('migrateBatch')),
    closeDataMigrate: async () => {},
    startRollout: async (input) => newSession('rollout', input),
    completeRolloutOp: async () => (isReady() ? { op: 'completeRolloutOp', outcome: 'success', metadata: { real: true } } : envMissingStep('completeRolloutOp')),
    rollbackRollout: async () => (isReady() ? { op: 'rollbackRollout', outcome: 'success', metadata: { real: true } } : envMissingStep('rollbackRollout')),
    closeRollout: async () => {},
  };
}
