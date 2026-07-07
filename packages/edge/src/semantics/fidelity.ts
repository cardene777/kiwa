import { platformEventName, type EdgeAxis, type EdgePlatform, type NeutralEventName } from './types.js';

/**
 * Fidelity harness — collects the platform × axis coverage grid that
 * downstream release-gate reports on. Not a runner (no side effect emit);
 * pure inspection so tests / release-gate can assert "3 platform × 8 axis"
 * without walking every neutral event by hand.
 */
export interface FidelityRow {
  platform: EdgePlatform;
  axis: EdgeAxis;
  neutralEvents: NeutralEventName[];
  platformEvents: string[];
}

export interface FidelityCoverage {
  platforms: EdgePlatform[];
  axes: EdgeAxis[];
  rows: FidelityRow[];
}

export const AXIS_TO_EVENTS: Record<EdgeAxis, NeutralEventName[]> = {
  'durable-object': [
    'durable-object.created',
    'durable-object.requested',
    'durable-object.alarm-fired',
    'durable-object.storage-written',
  ],
  'websocket-edge': [
    'websocket.upgrade-requested',
    'websocket.accepted',
    'websocket.message',
    'websocket.closed',
  ],
  'edge-kv': ['kv.read', 'kv.write', 'kv.cache-hit', 'kv.cache-miss'],
  'geo-replicated': [
    'geo.primary-write',
    'geo.replica-lagged',
    'geo.replica-synced',
    'geo.conflict-resolved',
  ],
  'cron-trigger': ['cron.scheduled', 'cron.started', 'cron.completed', 'cron.failed'],
  'subrequest-limit': [
    'subrequest.started',
    'subrequest.counted',
    'subrequest.limited',
    'subrequest.completed',
  ],
  'cpu-time-limit': ['cpu.started', 'cpu.budget-warning', 'cpu.limited', 'cpu.completed'],
  'streaming-response': [
    'stream.opened',
    'stream.chunk-sent',
    'stream.backpressure',
    'stream.closed',
  ],
  'cold-start': [
    'cold-start.invoked',
    'cold-start.cache-hit',
    'cold-start.provisioned-hit',
    'cold-start.warmed',
  ],
  'middleware-chain': [
    'middleware.entered',
    'middleware.rewritten',
    'middleware.short-circuited',
    'middleware.completed',
  ],
  'kv-eventual-consistency': [
    'kv-consistency.write-quorum',
    'kv-consistency.stale-read',
    'kv-consistency.read-your-writes',
    'kv-consistency.monotonic-violation',
  ],
  'r2-multipart': [
    'r2.multipart-initiated',
    'r2.part-uploaded',
    'r2.checksum-verified',
    'r2.multipart-completed',
  ],
  'd1-read-replica': [
    'd1.primary-write',
    'd1.replica-read',
    'd1.replica-lagged',
    'd1.replica-failover',
  ],
  'do-state-migration': [
    'do-migration.initiated',
    'do-migration.schema-bumped',
    'do-migration.data-migrated',
    'do-migration.rolled-out',
  ],
  'websocket-hibernation': [
    'ws-hibernation.entered',
    'ws-hibernation.resumed',
    'ws-hibernation.state-restored',
    'ws-hibernation.reconnected',
  ],
  'global-routing': [
    'routing.anycast-received',
    'routing.geo-matched',
    'routing.latency-selected',
    'routing.failover-triggered',
  ],
};

/**
 * Collect the platform × axis coverage grid. `platforms` is the list of
 * platforms to inspect — usually all 3 (`cloudflare`, `vercel`, `deno`).
 *
 * The output is a flat row list `platforms.length * 16 = 48` for the default
 * setup (8 v0.2 axes + 8 v1.2 advanced axes), plus `platforms` + `axes`
 * roll-up lists so callers can assert on the grid dimensions.
 */
export function collectFidelityCoverage(platforms: EdgePlatform[]): FidelityCoverage {
  const axes = Object.keys(AXIS_TO_EVENTS) as EdgeAxis[];
  const rows: FidelityRow[] = [];
  for (const platform of platforms) {
    for (const axis of axes) {
      const neutralEvents = AXIS_TO_EVENTS[axis];
      const platformEvents = neutralEvents.map((n) => platformEventName(platform, n));
      rows.push({
        platform,
        axis,
        neutralEvents,
        platformEvents,
      });
    }
  }
  return { platforms, axes, rows };
}
