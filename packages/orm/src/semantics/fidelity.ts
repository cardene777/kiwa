import {
  backendEventName,
  type NeutralEventName,
  type OrmAxis,
  type OrmBackend,
  type OrmProvider,
} from './types.js';

/**
 * Fidelity harness — collects the provider × backend × axis coverage grid
 * that downstream release-gate reports on. Not a runner (no side effect
 * emit); pure inspection so tests / release-gate can assert
 * "3 provider × 3 backend × 8 axis = 72 row" grid without walking every
 * neutral event by hand.
 */
export interface FidelityRow {
  provider: OrmProvider;
  backend: OrmBackend;
  axis: OrmAxis;
  neutralEvents: NeutralEventName[];
  backendEvents: string[];
}

export interface FidelityCoverage {
  providers: OrmProvider[];
  backends: OrmBackend[];
  axes: OrmAxis[];
  rows: FidelityRow[];
}

/**
 * Static axis → neutral event lookup. Kept as a `Record<OrmAxis, NeutralEventName[]>`
 * so the compiler enforces that every axis is present and every neutral
 * event is spelled correctly.
 */
export const AXIS_TO_EVENTS: Record<OrmAxis, NeutralEventName[]> = {
  replication: [
    'replication.primary-write',
    'replication.replica-lagged',
    'replication.failover-started',
    'replication.promoted',
  ],
  cdc: [
    'cdc.decoded',
    'cdc.outbox-appended',
    'cdc.event-ordered',
    'cdc.at-least-once-delivered',
  ],
  'logical-replication': [
    'logical.publication-created',
    'logical.subscription-synced',
    'logical.conflict-resolved',
    'logical.heartbeat',
  ],
  mvcc: [
    'mvcc.snapshot-taken',
    'mvcc.serializable-aborted',
    'mvcc.phantom-blocked',
    'mvcc.deadlock-detected',
  ],
  rls: [
    'rls.policy-installed',
    'rls.tenant-isolated',
    'rls.bypass-used',
    'rls.audit-logged',
  ],
  'connection-pool': [
    'pool.acquired',
    'pool.idle-timeout',
    'pool.statement-timeout',
    'pool.wait-queued',
  ],
  partitioning: [
    'partition.declared',
    'partition.pruned',
    'partition.wise-joined',
    'partition.route-selected',
  ],
  'vector-store': [
    'vector.indexed',
    'vector.knn-searched',
    'vector.hybrid-searched',
    'vector.distance-computed',
  ],
};

/**
 * Collect the provider × backend × axis coverage grid. Callers pass the
 * providers + backends to inspect — usually all 3 × 3.
 *
 * The output row count is `providers.length * backends.length * axes.length`
 * (72 for the default 3 × 3 × 8 grid) plus roll-up lists so callers can
 * assert on grid dimensions.
 */
export function collectFidelityCoverage(input: {
  providers: OrmProvider[];
  backends: OrmBackend[];
}): FidelityCoverage {
  const axes = Object.keys(AXIS_TO_EVENTS) as OrmAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of input.providers) {
    for (const backend of input.backends) {
      for (const axis of axes) {
        const neutralEvents = AXIS_TO_EVENTS[axis];
        const backendEvents = neutralEvents.map((n) => backendEventName(backend, n, provider));
        rows.push({
          provider,
          backend,
          axis,
          neutralEvents,
          backendEvents,
        });
      }
    }
  }
  return {
    providers: input.providers,
    backends: input.backends,
    axes,
    rows,
  };
}
