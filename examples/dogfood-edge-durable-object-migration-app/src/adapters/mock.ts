/**
 * Mock adapter — walks the edge do-state-migration state machine from
 * @kiwa/edge v1.2 semantics deterministically.
 */
import {
  bumpSchema,
  completeRollout,
  initiateMigration,
  migrateInstance,
  rollbackMigration,
  type DoMigrationSession,
} from '@kiwa/edge';
import type {
  EdgeDoMigrationAdapter,
  MigrationSession,
  MigrationStep,
} from './interface.js';

interface MockContext {
  sessions: Map<string, DoMigrationSession>;
  ops: number;
}

export function makeMockAdapter(): EdgeDoMigrationAdapter {
  const ctx: MockContext = { sessions: new Map(), ops: 0 };
  const persist = (session: MigrationSession, machine: DoMigrationSession): void => {
    ctx.sessions.set(session.sessionId, machine);
  };
  const load = (sessionId: string): DoMigrationSession => {
    const machine = ctx.sessions.get(sessionId);
    if (!machine) throw new Error(`load: unknown sessionId ${sessionId}`);
    return machine;
  };
  const newSession = (
    prefix: string,
    platform: MigrationSession['platform'],
    fromVersion: number,
    toVersion: number,
    instanceIds: string[],
  ): MigrationSession => {
    ctx.ops++;
    return {
      sessionId: `${prefix}-${ctx.ops}`,
      platform,
      fromVersion,
      toVersion,
      instanceIds,
    };
  };
  return {
    // schema-bump axis
    startSchemaBump: async ({ platform, fromVersion, toVersion, instanceIds }) => {
      const machine = initiateMigration({ platform, fromVersion, toVersion, instanceIds });
      const session = newSession('schema', platform, fromVersion, toVersion, instanceIds);
      persist(session, machine);
      return session;
    },
    bumpSchemaVersion: async (session) => {
      const machine = load(session.sessionId);
      const step = bumpSchema(machine);
      return {
        op: 'bumpSchemaVersion',
        outcome: 'success',
        metadata: {
          neutralEvent: step.neutralEvent,
          toVersion: session.toVersion,
        },
      } satisfies MigrationStep;
    },
    verifySchemaBump: async (session) => {
      const machine = load(session.sessionId);
      return {
        op: 'verifySchemaBump',
        outcome: 'success',
        metadata: { state: machine.state, toVersion: session.toVersion },
      };
    },
    closeSchemaBump: async (session) => {
      ctx.sessions.delete(session.sessionId);
    },
    // data-migrate axis
    startDataMigrate: async (input) => {
      const machine = initiateMigration({
        platform: input.platform,
        fromVersion: input.fromVersion,
        toVersion: input.toVersion,
        instanceIds: input.instanceIds,
      });
      bumpSchema(machine);
      const session = newSession(
        'data',
        input.platform,
        input.fromVersion,
        input.toVersion,
        input.instanceIds,
      );
      persist(session, machine);
      return session;
    },
    migrateOneInstance: async (session, { instanceId }) => {
      const machine = load(session.sessionId);
      const step = migrateInstance(machine, { instanceId });
      return {
        op: 'migrateOneInstance',
        outcome: 'success',
        metadata: {
          instanceId,
          migratedCount: Number(step.metadata.migratedCount ?? 0),
        },
      };
    },
    migrateBatch: async (session, { instanceIds }) => {
      const machine = load(session.sessionId);
      let migratedCount = 0;
      for (const id of instanceIds) {
        try {
          const step = migrateInstance(machine, { instanceId: id });
          migratedCount = Number(step.metadata.migratedCount ?? migratedCount);
        } catch {
          // already migrated, skip
        }
      }
      return {
        op: 'migrateBatch',
        outcome: 'success',
        metadata: { migratedCount, batchSize: instanceIds.length },
      };
    },
    closeDataMigrate: async (session) => {
      ctx.sessions.delete(session.sessionId);
    },
    // rollout axis
    startRollout: async (input) => {
      const machine = initiateMigration({
        platform: input.platform,
        fromVersion: input.fromVersion,
        toVersion: input.toVersion,
        instanceIds: input.instanceIds,
      });
      bumpSchema(machine);
      for (const id of input.instanceIds) {
        migrateInstance(machine, { instanceId: id });
      }
      const session: MigrationSession = { ...input, sessionId: `rollout-${++ctx.ops}` };
      persist(session, machine);
      return session;
    },
    completeRolloutOp: async (session) => {
      const machine = load(session.sessionId);
      const step = completeRollout(machine);
      return {
        op: 'completeRolloutOp',
        outcome: 'success',
        metadata: {
          neutralEvent: step.neutralEvent,
          toVersion: session.toVersion,
        },
      };
    },
    rollbackRollout: async (session) => {
      const machine = load(session.sessionId);
      rollbackMigration(machine);
      return {
        op: 'rollbackRollout',
        outcome: 'success',
        metadata: { fromVersion: session.fromVersion },
      };
    },
    closeRollout: async (session) => {
      ctx.sessions.delete(session.sessionId);
    },
  };
}
