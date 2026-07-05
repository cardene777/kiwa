/**
 * Advanced edge semantics — platform-neutral axis SSOT.
 *
 * v0.1 edge mocks only carried fetch invocation + lightweight KV helpers.
 * v0.2 adds 8 production semantics that edge runtimes expose differently —
 * Durable Objects, websocket upgrades, edge KV, geo replication, cron triggers,
 * subrequest limits, CPU time limits, and streaming responses. Each axis is
 * expressed as a small pure state-machine helper that returns a neutral
 * envelope, so downstream tests can drive the axis without knowing the
 * platform's payload dialect.
 */
export type EdgePlatform = 'cloudflare' | 'vercel' | 'deno';

export type EdgeAxis =
  | 'durable-object'
  | 'websocket-edge'
  | 'edge-kv'
  | 'geo-replicated'
  | 'cron-trigger'
  | 'subrequest-limit'
  | 'cpu-time-limit'
  | 'streaming-response';

/**
 * Platform-neutral event names used inside the axis helpers. Real edge
 * platforms expose different string ids (Cloudflare `durable_object.fetch`,
 * Vercel `edge_function.session_affinity`, Deno Deploy `deploy.stateful_fetch`)
 * — the {@link platformEventName} map handles the translation. Tests can
 * assert on the neutral name via `step.neutralEvent` or on the
 * platform-specific one via `step.platformEvent`.
 */
export type NeutralEventName =
  // durable object / stateful affinity
  | 'durable-object.created'
  | 'durable-object.requested'
  | 'durable-object.alarm-fired'
  | 'durable-object.storage-written'
  // websocket edge
  | 'websocket.upgrade-requested'
  | 'websocket.accepted'
  | 'websocket.message'
  | 'websocket.closed'
  // edge KV
  | 'kv.read'
  | 'kv.write'
  | 'kv.cache-hit'
  | 'kv.cache-miss'
  // geo replication
  | 'geo.primary-write'
  | 'geo.replica-lagged'
  | 'geo.replica-synced'
  | 'geo.conflict-resolved'
  // cron trigger
  | 'cron.scheduled'
  | 'cron.started'
  | 'cron.completed'
  | 'cron.failed'
  // subrequest limit
  | 'subrequest.started'
  | 'subrequest.counted'
  | 'subrequest.limited'
  | 'subrequest.completed'
  // CPU time limit
  | 'cpu.started'
  | 'cpu.budget-warning'
  | 'cpu.limited'
  | 'cpu.completed'
  // streaming response
  | 'stream.opened'
  | 'stream.chunk-sent'
  | 'stream.backpressure'
  | 'stream.closed';

/**
 * Platform-specific event name lookup. When a runtime has a distinct string
 * for the same semantic (e.g. Cloudflare Durable Objects vs Vercel's closest
 * session-affine edge function analogue) the mock emits the platform dialect
 * so tests wired to runtime-specific telemetry still see recognisable names.
 */
const dialect: Record<EdgePlatform, Partial<Record<NeutralEventName, string>>> = {
  cloudflare: {
    'durable-object.created': 'durable_object.created',
    'durable-object.requested': 'durable_object.fetch',
    'durable-object.alarm-fired': 'durable_object.alarm',
    'durable-object.storage-written': 'durable_object.storage.put',
    'websocket.upgrade-requested': 'websocket_upgrade.requested',
    'websocket.accepted': 'websocket_upgrade.accepted',
    'websocket.message': 'websocket.message',
    'websocket.closed': 'websocket.close',
    'kv.read': 'kv_get',
    'kv.write': 'kv_put',
    'kv.cache-hit': 'kv_cache.hit',
    'kv.cache-miss': 'kv_cache.miss',
    'geo.primary-write': 'smart_placement.primary_write',
    'geo.replica-lagged': 'kv_replication.lagged',
    'geo.replica-synced': 'kv_replication.synced',
    'geo.conflict-resolved': 'durable_object.conflict_resolved',
    'cron.scheduled': 'scheduled_event.enqueued',
    'cron.started': 'scheduled_event.started',
    'cron.completed': 'scheduled_event.completed',
    'cron.failed': 'scheduled_event.failed',
    'subrequest.started': 'subrequest.fetch',
    'subrequest.counted': 'subrequest.counted',
    'subrequest.limited': 'subrequest.limit_exceeded',
    'subrequest.completed': 'subrequest.completed',
    'cpu.started': 'worker.cpu.started',
    'cpu.budget-warning': 'worker.cpu.warning',
    'cpu.limited': 'worker.cpu.limit_exceeded',
    'cpu.completed': 'worker.cpu.completed',
    'stream.opened': 'response_stream.opened',
    'stream.chunk-sent': 'response_stream.chunk',
    'stream.backpressure': 'response_stream.backpressure',
    'stream.closed': 'response_stream.closed',
  },
  vercel: {
    'durable-object.created': 'edge_function.session_affinity.created',
    'durable-object.requested': 'edge_function.session_affinity.request',
    'durable-object.alarm-fired': 'edge_function.background_timer',
    'durable-object.storage-written': 'edge_config.write',
    'websocket.upgrade-requested': 'edge_websocket_upgrade.requested',
    'websocket.accepted': 'edge_websocket_upgrade.accepted',
    'websocket.message': 'edge_websocket.message',
    'websocket.closed': 'edge_websocket.close',
    'kv.read': 'edge_config.get',
    'kv.write': 'edge_config.set',
    'kv.cache-hit': 'edge_config.cache_hit',
    'kv.cache-miss': 'edge_config.cache_miss',
    'geo.primary-write': 'edge_config.primary_write',
    'geo.replica-lagged': 'edge_config.replica_lagged',
    'geo.replica-synced': 'edge_config.replica_synced',
    'geo.conflict-resolved': 'edge_config.conflict_resolved',
    'cron.scheduled': 'vercel_cron.scheduled',
    'cron.started': 'vercel_cron.started',
    'cron.completed': 'vercel_cron.completed',
    'cron.failed': 'vercel_cron.failed',
    'subrequest.started': 'edge_function.fetch',
    'subrequest.counted': 'edge_function.subrequest_counted',
    'subrequest.limited': 'edge_function.subrequest_limited',
    'subrequest.completed': 'edge_function.fetch_completed',
    'cpu.started': 'edge_function.cpu_started',
    'cpu.budget-warning': 'edge_function.cpu_warning',
    'cpu.limited': 'edge_function.cpu_limited',
    'cpu.completed': 'edge_function.cpu_completed',
    'stream.opened': 'edge_function.stream_opened',
    'stream.chunk-sent': 'edge_function.stream_chunk',
    'stream.backpressure': 'edge_function.stream_backpressure',
    'stream.closed': 'edge_function.stream_closed',
  },
  deno: {
    'durable-object.created': 'deploy.stateful_object.created',
    'durable-object.requested': 'deploy.stateful_fetch',
    'durable-object.alarm-fired': 'deploy.cron.timer',
    'durable-object.storage-written': 'deno_kv.atomic_write',
    'websocket.upgrade-requested': 'deno_websocket_upgrade.requested',
    'websocket.accepted': 'deno_websocket_upgrade.accepted',
    'websocket.message': 'deno_websocket.message',
    'websocket.closed': 'deno_websocket.close',
    'kv.read': 'deno_kv.get',
    'kv.write': 'deno_kv.set',
    'kv.cache-hit': 'deno_kv.cache_hit',
    'kv.cache-miss': 'deno_kv.cache_miss',
    'geo.primary-write': 'deno_kv.primary_write',
    'geo.replica-lagged': 'deno_kv.replica_lagged',
    'geo.replica-synced': 'deno_kv.replica_synced',
    'geo.conflict-resolved': 'deno_kv.conflict_resolved',
    'cron.scheduled': 'deploy.cron.scheduled',
    'cron.started': 'deploy.cron.started',
    'cron.completed': 'deploy.cron.completed',
    'cron.failed': 'deploy.cron.failed',
    'subrequest.started': 'deploy.fetch.started',
    'subrequest.counted': 'deploy.fetch.counted',
    'subrequest.limited': 'deploy.fetch.limited',
    'subrequest.completed': 'deploy.fetch.completed',
    'cpu.started': 'deploy.cpu.started',
    'cpu.budget-warning': 'deploy.cpu.warning',
    'cpu.limited': 'deploy.cpu.limited',
    'cpu.completed': 'deploy.cpu.completed',
    'stream.opened': 'deploy.stream.opened',
    'stream.chunk-sent': 'deploy.stream.chunk',
    'stream.backpressure': 'deploy.stream.backpressure',
    'stream.closed': 'deploy.stream.closed',
  },
};

/**
 * Translate a neutral event name to the platform dialect. Falls back to the
 * neutral name if the platform has no specific dialect entry — this makes
 * the map partial-safe without silent typos.
 */
export function platformEventName(
  platform: EdgePlatform,
  neutral: NeutralEventName,
): string {
  return dialect[platform][neutral] ?? neutral;
}

/**
 * Axis result envelope returned by every state-machine step. Edge semantics
 * are pure helpers (no adapters); the envelope surfaces the next state
 * transition metadata so tests can drive the next call without re-reading
 * runtime-specific telemetry.
 */
export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  platformEvent: string;
  state: TState;
  platform: EdgePlatform;
  metadata: Record<string, string | number | boolean>;
}
