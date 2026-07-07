import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * D1 read replica axis — primary-replica database routing. Writes always
 * land on primary, reads route to nearest replica unless lag exceeds
 * threshold, in which case failover to primary. The helper tracks per-replica
 * lag (in milliseconds behind primary) and routing decisions.
 */
export type D1RoutingState = 'primary' | 'replica' | 'lagged' | 'failing-over';

export interface D1Replica {
  replicaId: string;
  region: string;
  lagMs: number;
  healthy: boolean;
}

export interface D1Session {
  platform: EdgePlatform;
  primaryId: string;
  replicas: Map<string, D1Replica>;
  maxLagMs: number;
  history: AxisStep<D1RoutingState>[];
}

/**
 * Open a D1 session with primary + replica pool. `maxLagMs` is the
 * threshold above which a replica is considered unhealthy and failover
 * kicks in.
 */
export function startD1(input: {
  platform: EdgePlatform;
  primaryId: string;
  replicas?: Omit<D1Replica, 'healthy'>[];
  maxLagMs?: number;
}): D1Session {
  const replicas = new Map<string, D1Replica>();
  for (const r of input.replicas ?? []) {
    replicas.set(r.replicaId, { ...r, healthy: r.lagMs < (input.maxLagMs ?? 500) });
  }
  return {
    platform: input.platform,
    primaryId: input.primaryId,
    replicas,
    maxLagMs: input.maxLagMs ?? 500,
    history: [],
  };
}

/**
 * Route a write to primary. Emits `d1.primary-write`.
 */
export function writeToPrimary(
  session: D1Session,
  input: { query: string },
): AxisStep<D1RoutingState> {
  const step: AxisStep<D1RoutingState> = {
    neutralEvent: 'd1.primary-write',
    platformEvent: platformEventName(session.platform, 'd1.primary-write'),
    state: 'primary',
    platform: session.platform,
    metadata: {
      primaryId: session.primaryId,
      query: input.query,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Route a read. Picks the healthiest replica in the given region (or any
 * healthy replica if region has none), or falls back to primary if all
 * replicas are unhealthy. Emits `d1.replica-read` on success, `d1.replica-failover`
 * on fallback.
 */
export function readFromReplica(
  session: D1Session,
  input: { query: string; preferredRegion?: string },
): AxisStep<D1RoutingState> {
  const inRegion = Array.from(session.replicas.values()).filter(
    (r) => r.region === input.preferredRegion && r.healthy,
  );
  const healthy = inRegion.length > 0
    ? inRegion
    : Array.from(session.replicas.values()).filter((r) => r.healthy);
  if (healthy.length === 0) {
    const step: AxisStep<D1RoutingState> = {
      neutralEvent: 'd1.replica-failover',
      platformEvent: platformEventName(session.platform, 'd1.replica-failover'),
      state: 'failing-over',
      platform: session.platform,
      metadata: {
        query: input.query,
        fellBackTo: session.primaryId,
        healthyCount: 0,
      },
    };
    session.history.push(step);
    return step;
  }
  const first = healthy[0]!;
  const picked = healthy.reduce((best, r) => (r.lagMs < best.lagMs ? r : best), first);
  const step: AxisStep<D1RoutingState> = {
    neutralEvent: 'd1.replica-read',
    platformEvent: platformEventName(session.platform, 'd1.replica-read'),
    state: 'replica',
    platform: session.platform,
    metadata: {
      query: input.query,
      replicaId: picked.replicaId,
      region: picked.region,
      lagMs: picked.lagMs,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Report replica lag observed (e.g. from replication log). If lag exceeds
 * threshold, marks replica unhealthy and emits `d1.replica-lagged`.
 */
export function reportLag(
  session: D1Session,
  input: { replicaId: string; lagMs: number },
): AxisStep<D1RoutingState> {
  const replica = session.replicas.get(input.replicaId);
  if (!replica) {
    throw new Error(`reportLag: unknown replicaId ${input.replicaId}`);
  }
  replica.lagMs = input.lagMs;
  replica.healthy = input.lagMs < session.maxLagMs;
  const state: D1RoutingState = replica.healthy ? 'replica' : 'lagged';
  const step: AxisStep<D1RoutingState> = {
    neutralEvent: 'd1.replica-lagged',
    platformEvent: platformEventName(session.platform, 'd1.replica-lagged'),
    state,
    platform: session.platform,
    metadata: {
      replicaId: input.replicaId,
      lagMs: input.lagMs,
      threshold: session.maxLagMs,
      healthy: replica.healthy,
    },
  };
  session.history.push(step);
  return step;
}
