import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Logical replication — publication + subscription topology where publisher
 * ships row-level events to subscribers, with initial-sync bootstrap,
 * conflict resolution on divergent writes, and periodic heartbeat. Postgres
 * exposes `pg_publication` / `pg_subscription`; MySQL has group replication
 * with similar semantics but different names; SQLite has no analogue.
 *
 * State transitions:
 *   created                    → 'unpublished'
 *   createPublication          → 'published'
 *   syncSubscription           → 'synced'
 *   resolveConflict            → 'conflict-resolved'
 *   heartbeat                  → (state unchanged, heartbeat is passive)
 */
export type LogicalRepState =
  | 'unpublished'
  | 'published'
  | 'synced'
  | 'conflict-resolved';

export type ConflictStrategy = 'last-write-wins' | 'primary-wins' | 'reject';

export interface LogicalRepSession {
  publisherId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: LogicalRepState;
  publication: { name: string; tables: string[] } | null;
  subscribers: Set<string>;
  syncedSubscribers: Set<string>;
  lastHeartbeatAt: number;
  history: AxisStep<LogicalRepState>[];
}

function record(
  session: LogicalRepSession,
  step: AxisStep<LogicalRepState>,
): AxisStep<LogicalRepState> {
  session.history.push(step);
  return step;
}

/**
 * Create a logical replication session bound to a publisher id. State
 * starts at 'unpublished' with no publication and no subscribers.
 */
export function createLogicalRepSession(input: {
  publisherId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): LogicalRepSession {
  return {
    publisherId: input.publisherId,
    provider: input.provider,
    backend: input.backend,
    state: 'unpublished',
    publication: null,
    subscribers: new Set(),
    syncedSubscribers: new Set(),
    lastHeartbeatAt: 0,
    history: [],
  };
}

/**
 * Create a publication over one or more tables. Moves the session into
 * 'published'. Emits `logical.publication-created`.
 *
 * Rejects when the session already has a live subscription
 * (`synced` / `conflict-resolved`) — overwriting the publication under a
 * live topology silently orphans subscribers from the new publication and
 * corrupts the replication invariant. Callers must drop subscribers first
 * or start a new session.
 */
export function createPublication(
  session: LogicalRepSession,
  input: { name: string; tables: string[] },
): AxisStep<LogicalRepState> {
  if (input.tables.length === 0) {
    throw new Error('createPublication: at least one table is required');
  }
  if (session.state === 'synced' || session.state === 'conflict-resolved') {
    throw new Error(
      `createPublication: cannot overwrite publication under live topology (state=${session.state})`,
    );
  }
  session.publication = { name: input.name, tables: [...input.tables] };
  session.state = 'published';
  return record(session, {
    neutralEvent: 'logical.publication-created',
    backendEvent: backendEventName(
      session.backend,
      'logical.publication-created',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { name: input.name, tableCount: input.tables.length },
  });
}

/**
 * Bootstrap a subscription — mark a subscriber as synced with the publisher.
 * Requires a publication to exist; a subscription without a publication is
 * rejected. Emits `logical.subscription-synced`.
 */
export function syncSubscription(
  session: LogicalRepSession,
  input: { subscriberId: string },
): AxisStep<LogicalRepState> {
  if (!session.publication) {
    throw new Error('syncSubscription: no publication exists yet');
  }
  session.subscribers.add(input.subscriberId);
  session.syncedSubscribers.add(input.subscriberId);
  session.state = 'synced';
  return record(session, {
    neutralEvent: 'logical.subscription-synced',
    backendEvent: backendEventName(
      session.backend,
      'logical.subscription-synced',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      subscriberId: input.subscriberId,
      syncedCount: session.syncedSubscribers.size,
    },
  });
}

/**
 * Resolve a divergent write conflict between publisher and subscriber. The
 * caller picks the strategy; the mock records the winner + strategy in
 * metadata. Requires the session to be 'synced' first (a conflict without
 * a synced subscriber is a bug). Emits `logical.conflict-resolved`.
 */
export function resolveConflict(
  session: LogicalRepSession,
  input: {
    subscriberId: string;
    strategy: ConflictStrategy;
    winner: 'publisher' | 'subscriber';
  },
): AxisStep<LogicalRepState> {
  if (session.state !== 'synced' && session.state !== 'conflict-resolved') {
    throw new Error(
      `resolveConflict: requires synced / conflict-resolved state (got ${session.state})`,
    );
  }
  if (!session.syncedSubscribers.has(input.subscriberId)) {
    throw new Error(
      `resolveConflict: subscriber ${input.subscriberId} is not synced`,
    );
  }
  if (input.strategy === 'reject' && input.winner === 'subscriber') {
    throw new Error(
      "resolveConflict: strategy 'reject' forbids subscriber wins",
    );
  }
  session.state = 'conflict-resolved';
  return record(session, {
    neutralEvent: 'logical.conflict-resolved',
    backendEvent: backendEventName(
      session.backend,
      'logical.conflict-resolved',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      subscriberId: input.subscriberId,
      strategy: input.strategy,
      winner: input.winner,
    },
  });
}

/**
 * Send a heartbeat from publisher to subscribers. Does not change state
 * (heartbeat is passive), but bumps `lastHeartbeatAt`. Emits
 * `logical.heartbeat`.
 */
export function heartbeat(
  session: LogicalRepSession,
  input: { at: number },
): AxisStep<LogicalRepState> {
  if (input.at <= session.lastHeartbeatAt) {
    throw new Error('heartbeat: timestamp must be monotonically increasing');
  }
  session.lastHeartbeatAt = input.at;
  return record(session, {
    neutralEvent: 'logical.heartbeat',
    backendEvent: backendEventName(session.backend, 'logical.heartbeat', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      at: input.at,
      subscriberCount: session.subscribers.size,
    },
  });
}
