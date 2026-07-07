/**
 * Advanced edge semantics — platform-neutral axis SSOT.
 *
 * v0.1 edge mocks only carried fetch invocation + lightweight KV helpers.
 * v0.2 adds 8 production semantics that edge runtimes expose differently —
 * Durable Objects, websocket upgrades, edge KV, geo replication, cron triggers,
 * subrequest limits, CPU time limits, and streaming responses.
 * v1.2 adds 8 advanced production semantics — cold-start (serverless
 * function warm/cold path + provisioned concurrency), middleware-chain
 * (edge middleware auth → rewrite → cache → transform chain), KV eventual
 * consistency (read-your-writes / monotonic-reads), R2 multipart upload
 * (resumable + integrity check), D1 read replica (lag detection + failover),
 * DurableObject state migration (schema versioning + zero-downtime rollout),
 * WebSocket hibernation (resume + reconnect state), and global routing
 * (Anycast + geo + latency-based failover). Each axis is expressed as a
 * small pure state-machine helper that returns a neutral envelope, so
 * downstream tests can drive the axis without knowing the platform's
 * payload dialect.
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
  | 'streaming-response'
  | 'cold-start'
  | 'middleware-chain'
  | 'kv-eventual-consistency'
  | 'r2-multipart'
  | 'd1-read-replica'
  | 'do-state-migration'
  | 'websocket-hibernation'
  | 'global-routing';

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
  | 'stream.closed'
  // v1.2 advanced axis
  // cold-start
  | 'cold-start.invoked'
  | 'cold-start.cache-hit'
  | 'cold-start.provisioned-hit'
  | 'cold-start.warmed'
  // middleware-chain
  | 'middleware.entered'
  | 'middleware.rewritten'
  | 'middleware.short-circuited'
  | 'middleware.completed'
  // kv-eventual-consistency
  | 'kv-consistency.write-quorum'
  | 'kv-consistency.stale-read'
  | 'kv-consistency.read-your-writes'
  | 'kv-consistency.monotonic-violation'
  // r2-multipart
  | 'r2.multipart-initiated'
  | 'r2.part-uploaded'
  | 'r2.checksum-verified'
  | 'r2.multipart-completed'
  // d1-read-replica
  | 'd1.primary-write'
  | 'd1.replica-read'
  | 'd1.replica-lagged'
  | 'd1.replica-failover'
  // do-state-migration
  | 'do-migration.initiated'
  | 'do-migration.schema-bumped'
  | 'do-migration.data-migrated'
  | 'do-migration.rolled-out'
  // websocket-hibernation
  | 'ws-hibernation.entered'
  | 'ws-hibernation.resumed'
  | 'ws-hibernation.state-restored'
  | 'ws-hibernation.reconnected'
  // global-routing
  | 'routing.anycast-received'
  | 'routing.geo-matched'
  | 'routing.latency-selected'
  | 'routing.failover-triggered';

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
    'cold-start.invoked': 'worker.cold_start.invoked',
    'cold-start.cache-hit': 'worker.cold_start.warm_hit',
    'cold-start.provisioned-hit': 'worker.cold_start.always_on',
    'cold-start.warmed': 'worker.cold_start.warmed',
    'middleware.entered': 'workers.middleware.entered',
    'middleware.rewritten': 'workers.middleware.rewritten',
    'middleware.short-circuited': 'workers.middleware.terminated',
    'middleware.completed': 'workers.middleware.completed',
    'kv-consistency.write-quorum': 'kv.write_quorum',
    'kv-consistency.stale-read': 'kv.stale_read',
    'kv-consistency.read-your-writes': 'kv.read_your_writes',
    'kv-consistency.monotonic-violation': 'kv.monotonic_violation',
    'r2.multipart-initiated': 'r2.multipart.initiated',
    'r2.part-uploaded': 'r2.multipart.part_uploaded',
    'r2.checksum-verified': 'r2.multipart.checksum_verified',
    'r2.multipart-completed': 'r2.multipart.completed',
    'd1.primary-write': 'd1.primary_write',
    'd1.replica-read': 'd1.replica_read',
    'd1.replica-lagged': 'd1.replica_lagged',
    'd1.replica-failover': 'd1.replica_failover',
    'do-migration.initiated': 'durable_object.migration.initiated',
    'do-migration.schema-bumped': 'durable_object.migration.schema_bumped',
    'do-migration.data-migrated': 'durable_object.migration.data_migrated',
    'do-migration.rolled-out': 'durable_object.migration.rolled_out',
    'ws-hibernation.entered': 'websocket.hibernation.entered',
    'ws-hibernation.resumed': 'websocket.hibernation.resumed',
    'ws-hibernation.state-restored': 'websocket.hibernation.state_restored',
    'ws-hibernation.reconnected': 'websocket.hibernation.reconnected',
    'routing.anycast-received': 'anycast.received',
    'routing.geo-matched': 'anycast.geo_matched',
    'routing.latency-selected': 'anycast.latency_selected',
    'routing.failover-triggered': 'anycast.failover_triggered',
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
    'cold-start.invoked': 'serverless.cold_start.invoked',
    'cold-start.cache-hit': 'serverless.cold_start.warm_hit',
    'cold-start.provisioned-hit': 'serverless.cold_start.provisioned',
    'cold-start.warmed': 'serverless.cold_start.warmed',
    'middleware.entered': 'edge_middleware.entered',
    'middleware.rewritten': 'edge_middleware.rewrite',
    'middleware.short-circuited': 'edge_middleware.terminated',
    'middleware.completed': 'edge_middleware.completed',
    'kv-consistency.write-quorum': 'edge_config.write_quorum',
    'kv-consistency.stale-read': 'edge_config.stale_read',
    'kv-consistency.read-your-writes': 'edge_config.read_your_writes',
    'kv-consistency.monotonic-violation': 'edge_config.monotonic_violation',
    'r2.multipart-initiated': 'blob.multipart.initiated',
    'r2.part-uploaded': 'blob.multipart.part_uploaded',
    'r2.checksum-verified': 'blob.multipart.checksum_verified',
    'r2.multipart-completed': 'blob.multipart.completed',
    'd1.primary-write': 'postgres.primary_write',
    'd1.replica-read': 'postgres.replica_read',
    'd1.replica-lagged': 'postgres.replica_lagged',
    'd1.replica-failover': 'postgres.replica_failover',
    'do-migration.initiated': 'edge_function.session_affinity.migration_initiated',
    'do-migration.schema-bumped': 'edge_function.session_affinity.schema_bumped',
    'do-migration.data-migrated': 'edge_function.session_affinity.data_migrated',
    'do-migration.rolled-out': 'edge_function.session_affinity.rolled_out',
    'ws-hibernation.entered': 'edge_websocket.hibernation.entered',
    'ws-hibernation.resumed': 'edge_websocket.hibernation.resumed',
    'ws-hibernation.state-restored': 'edge_websocket.hibernation.state_restored',
    'ws-hibernation.reconnected': 'edge_websocket.hibernation.reconnected',
    'routing.anycast-received': 'edge_network.anycast_received',
    'routing.geo-matched': 'edge_network.geo_matched',
    'routing.latency-selected': 'edge_network.latency_selected',
    'routing.failover-triggered': 'edge_network.failover_triggered',
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
    'cold-start.invoked': 'deploy.cold_start.invoked',
    'cold-start.cache-hit': 'deploy.cold_start.warm_hit',
    'cold-start.provisioned-hit': 'deploy.cold_start.provisioned',
    'cold-start.warmed': 'deploy.cold_start.warmed',
    'middleware.entered': 'deploy.middleware.entered',
    'middleware.rewritten': 'deploy.middleware.rewritten',
    'middleware.short-circuited': 'deploy.middleware.terminated',
    'middleware.completed': 'deploy.middleware.completed',
    'kv-consistency.write-quorum': 'deno_kv.write_quorum',
    'kv-consistency.stale-read': 'deno_kv.stale_read',
    'kv-consistency.read-your-writes': 'deno_kv.read_your_writes',
    'kv-consistency.monotonic-violation': 'deno_kv.monotonic_violation',
    'r2.multipart-initiated': 'deploy.blob.multipart.initiated',
    'r2.part-uploaded': 'deploy.blob.multipart.part_uploaded',
    'r2.checksum-verified': 'deploy.blob.multipart.checksum_verified',
    'r2.multipart-completed': 'deploy.blob.multipart.completed',
    'd1.primary-write': 'deno_kv.primary_write',
    'd1.replica-read': 'deno_kv.replica_read',
    'd1.replica-lagged': 'deno_kv.replica_lagged',
    'd1.replica-failover': 'deno_kv.replica_failover',
    'do-migration.initiated': 'deploy.stateful_object.migration_initiated',
    'do-migration.schema-bumped': 'deploy.stateful_object.schema_bumped',
    'do-migration.data-migrated': 'deploy.stateful_object.data_migrated',
    'do-migration.rolled-out': 'deploy.stateful_object.rolled_out',
    'ws-hibernation.entered': 'deno_websocket.hibernation.entered',
    'ws-hibernation.resumed': 'deno_websocket.hibernation.resumed',
    'ws-hibernation.state-restored': 'deno_websocket.hibernation.state_restored',
    'ws-hibernation.reconnected': 'deno_websocket.hibernation.reconnected',
    'routing.anycast-received': 'deploy.anycast_received',
    'routing.geo-matched': 'deploy.anycast_geo_matched',
    'routing.latency-selected': 'deploy.anycast_latency_selected',
    'routing.failover-triggered': 'deploy.anycast_failover_triggered',
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
