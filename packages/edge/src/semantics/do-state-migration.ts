import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * DurableObject state migration axis — schema versioning + zero-downtime
 * rollout across DO instances. Migrations bump a schema version and apply
 * a transform to each instance's state, but old workers may still be
 * reading the previous schema during rollout. The helper tracks per-instance
 * schema version so tests can assert atomic migration + safe rollback.
 */
export type DoMigrationState = 'initiated' | 'schema-bumped' | 'data-migrated' | 'rolled-out' | 'rolled-back';

export interface DoMigrationSession {
  platform: EdgePlatform;
  fromVersion: number;
  toVersion: number;
  instances: Map<string, number>;
  migratedCount: number;
  state: DoMigrationState;
  history: AxisStep<DoMigrationState>[];
}

/**
 * Initiate a migration from `fromVersion` to `toVersion` for a set of
 * instances. Emits `do-migration.initiated`. All instances start at
 * `fromVersion`.
 */
export function initiateMigration(input: {
  platform: EdgePlatform;
  fromVersion: number;
  toVersion: number;
  instanceIds: string[];
}): DoMigrationSession {
  if (input.toVersion <= input.fromVersion) {
    throw new Error(
      `initiateMigration: toVersion ${input.toVersion} must be > fromVersion ${input.fromVersion}`,
    );
  }
  const instances = new Map<string, number>();
  for (const id of input.instanceIds) {
    instances.set(id, input.fromVersion);
  }
  const session: DoMigrationSession = {
    platform: input.platform,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    instances,
    migratedCount: 0,
    state: 'initiated',
    history: [],
  };
  const step: AxisStep<DoMigrationState> = {
    neutralEvent: 'do-migration.initiated',
    platformEvent: platformEventName(input.platform, 'do-migration.initiated'),
    state: 'initiated',
    platform: input.platform,
    metadata: {
      fromVersion: input.fromVersion,
      toVersion: input.toVersion,
      instanceCount: input.instanceIds.length,
    },
  };
  session.history.push(step);
  return session;
}

/**
 * Bump schema version registry. Emits `do-migration.schema-bumped` and
 * transitions to `schema-bumped`. Instances still hold old data until
 * migrateInstance is called per instance.
 */
export function bumpSchema(session: DoMigrationSession): AxisStep<DoMigrationState> {
  if (session.state !== 'initiated') {
    throw new Error(`bumpSchema: session is ${session.state}, expected initiated`);
  }
  session.state = 'schema-bumped';
  const step: AxisStep<DoMigrationState> = {
    neutralEvent: 'do-migration.schema-bumped',
    platformEvent: platformEventName(session.platform, 'do-migration.schema-bumped'),
    state: 'schema-bumped',
    platform: session.platform,
    metadata: {
      fromVersion: session.fromVersion,
      toVersion: session.toVersion,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Migrate a single instance's data. Advances that instance's version to
 * `toVersion` and increments the migrated count. Emits `do-migration.data-migrated`.
 * Rejects if the instance is not registered or already migrated.
 */
export function migrateInstance(
  session: DoMigrationSession,
  input: { instanceId: string },
): AxisStep<DoMigrationState> {
  if (session.state !== 'schema-bumped' && session.state !== 'data-migrated') {
    throw new Error(`migrateInstance: session is ${session.state}, cannot migrate`);
  }
  const current = session.instances.get(input.instanceId);
  if (current === undefined) {
    throw new Error(`migrateInstance: unknown instanceId ${input.instanceId}`);
  }
  if (current === session.toVersion) {
    throw new Error(`migrateInstance: instance ${input.instanceId} already at toVersion`);
  }
  session.instances.set(input.instanceId, session.toVersion);
  session.migratedCount++;
  session.state = 'data-migrated';
  const step: AxisStep<DoMigrationState> = {
    neutralEvent: 'do-migration.data-migrated',
    platformEvent: platformEventName(session.platform, 'do-migration.data-migrated'),
    state: 'data-migrated',
    platform: session.platform,
    metadata: {
      instanceId: input.instanceId,
      fromVersion: current,
      toVersion: session.toVersion,
      migratedCount: session.migratedCount,
      totalCount: session.instances.size,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Complete the rollout once every instance is at `toVersion`. Emits
 * `do-migration.rolled-out`. Rejects if any instance is still on the old
 * version (partial rollout).
 */
export function completeRollout(session: DoMigrationSession): AxisStep<DoMigrationState> {
  const stragglers = Array.from(session.instances.entries()).filter(
    ([, v]) => v !== session.toVersion,
  );
  if (stragglers.length > 0) {
    throw new Error(
      `completeRollout: ${stragglers.length} instances still on old version`,
    );
  }
  session.state = 'rolled-out';
  const step: AxisStep<DoMigrationState> = {
    neutralEvent: 'do-migration.rolled-out',
    platformEvent: platformEventName(session.platform, 'do-migration.rolled-out'),
    state: 'rolled-out',
    platform: session.platform,
    metadata: {
      toVersion: session.toVersion,
      migratedCount: session.migratedCount,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Roll back the migration by resetting every instance to `fromVersion`.
 * Used on rollout failure or a bad schema shipping. Transitions to
 * `rolled-back`.
 */
export function rollbackMigration(session: DoMigrationSession): void {
  for (const id of Array.from(session.instances.keys())) {
    session.instances.set(id, session.fromVersion);
  }
  session.migratedCount = 0;
  session.state = 'rolled-back';
}
