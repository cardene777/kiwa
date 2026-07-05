import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Geo-replicated store — a primary region that accepts writes and N replica
 * regions that catch up asynchronously. This is the multi-region consistency
 * model behind Cloudflare Smart Placement + KV replication, Vercel Edge Config
 * replication, and Deno KV's primary/replica topology. The mock exposes the
 * observable lifecycle a test cares about: a primary write bumps a version and
 * leaves replicas lagging, each replica is marked lagged then synced, and a
 * write conflict can be explicitly resolved.
 *
 * State transitions:
 *   createGeoReplicatedSession → 'in-sync'   (version 0, no lag)
 *   geoPrimaryWrite            → 'lagging'    (replicas fall behind)
 *   markReplicaLagged          → 'lagging'
 *   syncReplica                → 'in-sync'    (only once every replica lag = 0)
 *   resolveConflict            → 'in-sync'
 */
export type GeoRegion = string;

export type GeoState = 'in-sync' | 'lagging' | 'conflict-detected';

export interface GeoReplicatedSession {
  platform: EdgePlatform;
  primaryRegion: GeoRegion;
  replicaRegions: GeoRegion[];
  state: GeoState;
  version: number;
  lagMs: Record<GeoRegion, number>;
  history: AxisStep<GeoState>[];
}

/** Lag (ms) assigned to every replica immediately after a primary write. */
const POST_WRITE_LAG_MS = 100;

/** Push a fully-formed step onto the session history and return it. */
function record(session: GeoReplicatedSession, step: AxisStep<GeoState>): AxisStep<GeoState> {
  session.history.push(step);
  return step;
}

/**
 * Construct a geo-replicated session. Starts 'in-sync' at version 0 with every
 * replica at zero lag. No event is emitted.
 */
export function createGeoReplicatedSession(input: {
  platform: EdgePlatform;
  primaryRegion: GeoRegion;
  replicaRegions: GeoRegion[];
}): GeoReplicatedSession {
  const lagMs: Record<GeoRegion, number> = {};
  for (const region of input.replicaRegions) lagMs[region] = 0;
  return {
    platform: input.platform,
    primaryRegion: input.primaryRegion,
    replicaRegions: [...input.replicaRegions],
    state: 'in-sync',
    version: 0,
    lagMs,
    history: [],
  };
}

/**
 * Write to the primary region. Bumps the version and marks every replica as
 * lagging (they have not yet received the new version). Emits
 * `geo.primary-write`.
 */
export function geoPrimaryWrite(
  session: GeoReplicatedSession,
  input: { data: string },
): AxisStep<GeoState> {
  session.version += 1;
  session.state = 'lagging';
  for (const region of session.replicaRegions) session.lagMs[region] = POST_WRITE_LAG_MS;
  return record(session, {
    neutralEvent: 'geo.primary-write',
    platformEvent: platformEventName(session.platform, 'geo.primary-write'),
    state: session.state,
    platform: session.platform,
    metadata: { version: session.version, region: session.primaryRegion, size: input.data.length },
  });
}

/**
 * Report replication lag for a specific replica. Rejects an unknown region.
 * Emits `geo.replica-lagged`.
 */
export function markReplicaLagged(
  session: GeoReplicatedSession,
  input: { region: GeoRegion; lagMs: number },
): AxisStep<GeoState> {
  if (!session.replicaRegions.includes(input.region)) {
    throw new Error(`markReplicaLagged: ${input.region} is not a replica region`);
  }
  session.lagMs[input.region] = input.lagMs;
  session.state = 'lagging';
  return record(session, {
    neutralEvent: 'geo.replica-lagged',
    platformEvent: platformEventName(session.platform, 'geo.replica-lagged'),
    state: session.state,
    platform: session.platform,
    metadata: { region: input.region, lagMs: input.lagMs },
  });
}

/**
 * Mark a replica caught up (lag → 0). When every replica has zero lag the
 * session returns 'in-sync'. Rejects an unknown region. Emits
 * `geo.replica-synced`.
 */
export function syncReplica(
  session: GeoReplicatedSession,
  input: { region: GeoRegion },
): AxisStep<GeoState> {
  if (!session.replicaRegions.includes(input.region)) {
    throw new Error(`syncReplica: ${input.region} is not a replica region`);
  }
  session.lagMs[input.region] = 0;
  const allSynced = session.replicaRegions.every((r) => session.lagMs[r] === 0);
  if (allSynced) session.state = 'in-sync';
  return record(session, {
    neutralEvent: 'geo.replica-synced',
    platformEvent: platformEventName(session.platform, 'geo.replica-synced'),
    state: session.state,
    platform: session.platform,
    metadata: { region: input.region, allSynced },
  });
}

/**
 * Resolve a write conflict for a region by picking a winning version. Rejects
 * an unknown region. Adopts the chosen version, clears every replica's lag and
 * forces the session back to 'in-sync'. Emits `geo.conflict-resolved`.
 */
export function resolveConflict(
  session: GeoReplicatedSession,
  input: { region: GeoRegion; chosenVersion: number },
): AxisStep<GeoState> {
  if (!session.replicaRegions.includes(input.region)) {
    throw new Error(`resolveConflict: ${input.region} is not a replica region`);
  }
  session.version = input.chosenVersion;
  for (const region of session.replicaRegions) session.lagMs[region] = 0;
  session.state = 'in-sync';
  return record(session, {
    neutralEvent: 'geo.conflict-resolved',
    platformEvent: platformEventName(session.platform, 'geo.conflict-resolved'),
    state: session.state,
    platform: session.platform,
    metadata: { region: input.region, chosenVersion: input.chosenVersion },
  });
}
