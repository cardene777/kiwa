/**
 * Advanced ORM / database semantics — provider × backend neutral axis SSOT.
 *
 * v0.8 orm mocks only carried `setupOrmEnv` (schema + migration + seed) for
 * 3 provider (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite).
 * v0.9 adds 8 production db semantics that real database engines expose
 * differently — streaming replication, change data capture, logical
 * replication, MVCC snapshot isolation, row-level security, connection
 * pool, declarative partitioning, and vector search. Each axis is a small
 * pure state-machine helper that returns a neutral envelope so downstream
 * tests can drive the axis without knowing the provider / backend payload
 * dialect.
 */
export type OrmProvider = 'drizzle' | 'prisma' | 'kysely';

export type OrmBackend = 'postgres' | 'mysql' | 'sqlite';

export type OrmAxis =
  | 'replication'
  | 'cdc'
  | 'logical-replication'
  | 'mvcc'
  | 'rls'
  | 'connection-pool'
  | 'partitioning'
  | 'vector-store'
  | 'logical-replication-advanced'
  | 'mvcc-advanced'
  | 'mysql-cluster'
  | 'binlog'
  | 'sqlite-wal'
  | 'fts5'
  | 'txn-isolation'
  | 'pool-advanced';

/**
 * Platform-neutral event names used inside the axis helpers. Real backends
 * expose different string ids — Postgres `wal_sender.progress`,
 * MySQL `binlog.dump_gtid`, SQLite `session.diff`. The
 * {@link backendEventName} map handles the translation. Tests can assert
 * on the neutral name via `step.neutralEvent` or on the backend-specific
 * one via `step.backendEvent`.
 */
export type NeutralEventName =
  // streaming replication
  | 'replication.primary-write'
  | 'replication.replica-lagged'
  | 'replication.failover-started'
  | 'replication.promoted'
  // change data capture
  | 'cdc.decoded'
  | 'cdc.outbox-appended'
  | 'cdc.event-ordered'
  | 'cdc.at-least-once-delivered'
  // logical replication
  | 'logical.publication-created'
  | 'logical.subscription-synced'
  | 'logical.conflict-resolved'
  | 'logical.heartbeat'
  // MVCC
  | 'mvcc.snapshot-taken'
  | 'mvcc.serializable-aborted'
  | 'mvcc.phantom-blocked'
  | 'mvcc.deadlock-detected'
  // row-level security
  | 'rls.policy-installed'
  | 'rls.tenant-isolated'
  | 'rls.bypass-used'
  | 'rls.audit-logged'
  // connection pool
  | 'pool.acquired'
  | 'pool.idle-timeout'
  | 'pool.statement-timeout'
  | 'pool.wait-queued'
  // declarative partitioning
  | 'partition.declared'
  | 'partition.pruned'
  | 'partition.wise-joined'
  | 'partition.route-selected'
  // vector store
  | 'vector.indexed'
  | 'vector.knn-searched'
  | 'vector.hybrid-searched'
  | 'vector.distance-computed'
  // Postgres logical replication advanced
  | 'logical-advanced.streaming-started'
  | 'logical-advanced.origin-tracked'
  | 'logical-advanced.two-safe-confirmed'
  | 'logical-advanced.cascade-synced'
  // MVCC advanced
  | 'mvcc-advanced.tuple-visibility-checked'
  | 'mvcc-advanced.bloat-measured'
  | 'mvcc-advanced.hot-updated'
  | 'mvcc-advanced.xid-wraparound-detected'
  // MySQL cluster / group replication
  | 'cluster.member-joined'
  | 'cluster.primary-elected'
  | 'cluster.conflict-detected'
  | 'cluster.member-left'
  // MySQL binlog
  | 'binlog.position-advanced'
  | 'binlog.gtid-set-updated'
  | 'binlog.format-negotiated'
  | 'binlog.gap-detected'
  // SQLite WAL
  | 'wal.checkpoint-triggered'
  | 'wal.size-threshold-crossed'
  | 'wal.shared-memory-mapped'
  | 'wal.journal-mode-switched'
  // SQLite FTS5
  | 'fts5.virtual-table-created'
  | 'fts5.tokenized'
  | 'fts5.matched'
  | 'fts5.vocab-inspected'
  // transaction isolation
  | 'txn.level-set'
  | 'txn.dirty-read-blocked'
  | 'txn.non-repeatable-read-blocked'
  | 'txn.phantom-read-blocked'
  // connection pool advanced
  | 'pool-advanced.health-checked'
  | 'pool-advanced.warmed-up'
  | 'pool-advanced.drained'
  | 'pool-advanced.metrics-exported'
  // Existing staged Postgres-specific helper events.
  | 'pglr.publication-created'
  | 'pglr.slot-allocated'
  | 'pglr.subscription-synced'
  | 'pglr.streaming'
  | 'pglr.disconnected';

/**
 * Backend-specific event name lookup. When a backend has a distinct string
 * for the same semantic (e.g. Postgres `pg_logical_slot` vs MySQL
 * `binlog.gtid_next`) the mock emits the backend dialect so tests wired to
 * runtime-specific telemetry still see recognisable names.
 *
 * SQLite entries are partial by design — several server-only axes (streaming
 * replication, wal2json CDC, statement_timeout etc.) have no SQLite analogue
 * and fall back to the neutral name via {@link backendEventName}.
 */
const dialect: Record<OrmBackend, Partial<Record<NeutralEventName, string>>> = {
  postgres: {
    'replication.primary-write': 'wal_sender.progress',
    'replication.replica-lagged': 'pg_stat_replication.lag',
    'replication.failover-started': 'pg_ctl.promote_started',
    'replication.promoted': 'pg_stat_replication.promoted',
    'cdc.decoded': 'pg_logical_slot.decoded',
    'cdc.outbox-appended': 'outbox.wal2json_appended',
    'cdc.event-ordered': 'pg_logical_slot.lsn_ordered',
    'cdc.at-least-once-delivered': 'pg_logical_slot.confirmed_flush',
    'logical.publication-created': 'pg_publication.created',
    'logical.subscription-synced': 'pg_subscription.synced',
    'logical.conflict-resolved': 'pg_subscription.conflict_resolved',
    'logical.heartbeat': 'pg_replication_origin.heartbeat',
    'mvcc.snapshot-taken': 'pg_snapshot.exported',
    'mvcc.serializable-aborted': 'pg_serializable.abort',
    'mvcc.phantom-blocked': 'pg_predicate_lock.wait',
    'mvcc.deadlock-detected': 'pg_stat_activity.deadlock',
    'rls.policy-installed': 'pg_policy.created',
    'rls.tenant-isolated': 'pg_rls.tenant_filter',
    'rls.bypass-used': 'pg_rls.bypass_role',
    'rls.audit-logged': 'pg_audit.record',
    'pool.acquired': 'pgbouncer.client_acquired',
    'pool.idle-timeout': 'pgbouncer.idle_close',
    'pool.statement-timeout': 'pg_stat_statements.timeout',
    'pool.wait-queued': 'pgbouncer.wait_queue',
    'partition.declared': 'pg_partitioned_table.created',
    'partition.pruned': 'pg_stat_user_tables.pruned',
    'partition.wise-joined': 'pg_plan.partitionwise_join',
    'partition.route-selected': 'pg_plan.partition_selected',
    'vector.indexed': 'pgvector.ivfflat_indexed',
    'vector.knn-searched': 'pgvector.knn',
    'vector.hybrid-searched': 'pgvector.hybrid',
    'vector.distance-computed': 'pgvector.cosine_distance',
    'logical-advanced.streaming-started': 'pgoutput.start_replication',
    'logical-advanced.origin-tracked': 'pg_replication_origin.progress',
    'logical-advanced.two-safe-confirmed': 'synchronous_commit.remote_apply',
    'logical-advanced.cascade-synced': 'pg_subscription.cascade_synced',
    'mvcc-advanced.tuple-visibility-checked': 'heap_tuple_infomask.visible',
    'mvcc-advanced.bloat-measured': 'pg_stat_user_tables.n_dead_tup',
    'mvcc-advanced.hot-updated': 'pg_stat_all_tables.n_tup_hot_upd',
    'mvcc-advanced.xid-wraparound-detected': 'pg_database.xid_wraparound_warning',
    'cluster.member-joined': 'patroni.member_joined',
    'cluster.primary-elected': 'patroni.leader_elected',
    'cluster.conflict-detected': 'patroni.split_brain_detected',
    'cluster.member-left': 'patroni.member_left',
    'binlog.position-advanced': 'pg_wal_lsn_advanced',
    'binlog.gtid-set-updated': 'pg_replication_slot.confirmed_flush_lsn',
    'binlog.format-negotiated': 'pg_waldecoding.output_plugin',
    'binlog.gap-detected': 'pg_wal.timeline_gap',
    'wal.checkpoint-triggered': 'pg_wal_checkpoint.triggered',
    'wal.size-threshold-crossed': 'pg_wal.size_threshold',
    'wal.shared-memory-mapped': 'pg_wal.shared_buffers_mapped',
    'wal.journal-mode-switched': 'pg_wal.enabled',
    'fts5.virtual-table-created': 'pg_tsvector.index_created',
    'fts5.tokenized': 'pg_to_tsvector.tokenized',
    'fts5.matched': 'pg_tsquery.matched',
    'fts5.vocab-inspected': 'pg_statistic_ext.tsvector_vocab',
    'txn.level-set': 'set_transaction_isolation',
    'txn.dirty-read-blocked': 'pg_isolation.dirty_read_blocked',
    'txn.non-repeatable-read-blocked': 'pg_isolation.non_repeatable_read_blocked',
    'txn.phantom-read-blocked': 'pg_predicate_lock.phantom_blocked',
    'pool-advanced.health-checked': 'pgbouncer.server_check',
    'pool-advanced.warmed-up': 'pgbouncer.pool_warmup',
    'pool-advanced.drained': 'pgbouncer_admin_pause',
    'pool-advanced.metrics-exported': 'pgbouncer.stats_exported',
  },
  mysql: {
    'replication.primary-write': 'binlog.write',
    'replication.replica-lagged': 'seconds_behind_master',
    'replication.failover-started': 'group_replication.failover_started',
    'replication.promoted': 'group_replication.primary_elected',
    'cdc.decoded': 'binlog.event_decoded',
    'cdc.outbox-appended': 'debezium.outbox_row',
    'cdc.event-ordered': 'binlog.gtid_ordered',
    'cdc.at-least-once-delivered': 'debezium.at_least_once_ack',
    'logical.publication-created': 'binlog.filter_registered',
    'logical.subscription-synced': 'replica_ready',
    'logical.conflict-resolved': 'group_replication.conflict_resolved',
    'logical.heartbeat': 'binlog.heartbeat',
    'mvcc.snapshot-taken': 'innodb.consistent_snapshot',
    'mvcc.serializable-aborted': 'innodb.serializable_rollback',
    'mvcc.phantom-blocked': 'innodb.gap_lock',
    'mvcc.deadlock-detected': 'innodb.deadlock',
    'rls.policy-installed': 'view.filtered_installed',
    'rls.tenant-isolated': 'view.tenant_filter',
    'rls.bypass-used': 'grant.super_bypass',
    'rls.audit-logged': 'audit_log.record',
    'pool.acquired': 'proxysql.acquired',
    'pool.idle-timeout': 'wait_timeout',
    'pool.statement-timeout': 'max_execution_time',
    'pool.wait-queued': 'proxysql.wait_queue',
    'partition.declared': 'partition.range_created',
    'partition.pruned': 'partition_prune',
    'partition.wise-joined': 'partition_join',
    'partition.route-selected': 'partition_selected',
    // MySQL 8.4+ has native vector indexing (MySQL HeatWave) — use those names
    'vector.indexed': 'heatwave.vector_indexed',
    'vector.knn-searched': 'heatwave.knn',
    'vector.hybrid-searched': 'heatwave.hybrid',
    'vector.distance-computed': 'heatwave.euclidean_distance',
    'logical-advanced.streaming-started': 'group_replication.stream_started',
    'logical-advanced.origin-tracked': 'group_replication.origin_tracked',
    'logical-advanced.two-safe-confirmed': 'group_replication.two_safe_ack',
    'logical-advanced.cascade-synced': 'group_replication.cascade_synced',
    'mvcc-advanced.tuple-visibility-checked': 'innodb.trx_visibility_checked',
    'mvcc-advanced.bloat-measured': 'innodb.table_bloat_estimated',
    'mvcc-advanced.hot-updated': 'innodb.secondary_index_unchanged_update',
    'mvcc-advanced.xid-wraparound-detected': 'innodb.trx_id_wraparound_warning',
    'cluster.member-joined': 'group_replication.member_joined',
    'cluster.primary-elected': 'group_replication.primary_elected',
    'cluster.conflict-detected': 'performance_schema.replication_conflict_detected',
    'cluster.member-left': 'group_replication.member_left',
    'binlog.position-advanced': 'binlog.position_advanced',
    'binlog.gtid-set-updated': 'gtid_executed.updated',
    'binlog.format-negotiated': 'binlog_format.negotiated',
    'binlog.gap-detected': 'gtid.gap_detected',
    'wal.checkpoint-triggered': 'innodb.redo_checkpoint',
    'wal.size-threshold-crossed': 'innodb.redo_size_threshold',
    'wal.shared-memory-mapped': 'innodb.buffer_pool_mapped',
    'wal.journal-mode-switched': 'innodb.redo_log_enabled',
    'fts5.virtual-table-created': 'fulltext.index_created',
    'fts5.tokenized': 'fulltext.tokenized',
    'fts5.matched': 'match_against.ranked',
    'fts5.vocab-inspected': 'information_schema.innodb_ft_index_table',
    'txn.level-set': 'set_transaction_isolation',
    'txn.dirty-read-blocked': 'innodb.dirty_read_blocked',
    'txn.non-repeatable-read-blocked': 'innodb.non_repeatable_read_blocked',
    'txn.phantom-read-blocked': 'innodb.next_key_lock.phantom_blocked',
    'pool-advanced.health-checked': 'proxysql.health_check',
    'pool-advanced.warmed-up': 'proxysql.connection_warmup',
    'pool-advanced.drained': 'proxysql.graceful_drain',
    'pool-advanced.metrics-exported': 'proxysql_stats_conn.exported',
  },
  sqlite: {
    // SQLite has no server-side replication/CDC/heartbeat/failover etc.
    // The mock still emits neutral events but many backend-specific
    // dialects fall back to the neutral name via `backendEventName`.
    'mvcc.snapshot-taken': 'sqlite.snapshot_open',
    'mvcc.serializable-aborted': 'sqlite.busy_rollback',
    'mvcc.phantom-blocked': 'sqlite.busy_wait',
    'mvcc.deadlock-detected': 'sqlite.busy_deadlock',
    'rls.policy-installed': 'sqlite.view_created',
    'rls.tenant-isolated': 'sqlite.view_tenant_filter',
    'rls.bypass-used': 'sqlite.attach_bypass',
    'rls.audit-logged': 'sqlite.audit_log',
    'pool.acquired': 'sqlite.wal_writer_acquired',
    'pool.idle-timeout': 'sqlite.idle_close',
    'pool.statement-timeout': 'sqlite.busy_timeout_exceeded',
    'pool.wait-queued': 'sqlite.wal_wait',
    'partition.declared': 'sqlite.shard_attached',
    'partition.pruned': 'sqlite.shard_skipped',
    'partition.wise-joined': 'sqlite.attach_join',
    'partition.route-selected': 'sqlite.shard_selected',
    // sqlite-vec / sqlite-vss extensions expose vector search
    'vector.indexed': 'sqlite_vec.indexed',
    'vector.knn-searched': 'sqlite_vec.knn',
    'vector.hybrid-searched': 'sqlite_vec.hybrid',
    'vector.distance-computed': 'sqlite_vec.cosine',
    'logical-advanced.streaming-started': 'sqlite.session_stream_started',
    'logical-advanced.origin-tracked': 'sqlite.session_origin_tracked',
    'logical-advanced.two-safe-confirmed': 'sqlite.session_two_safe_confirmed',
    'logical-advanced.cascade-synced': 'sqlite.session_cascade_synced',
    'mvcc-advanced.tuple-visibility-checked': 'sqlite.snapshot_tuple_visible',
    'mvcc-advanced.bloat-measured': 'sqlite.freelist_bloat_measured',
    'mvcc-advanced.hot-updated': 'sqlite.rowid_update_chain',
    'mvcc-advanced.xid-wraparound-detected': 'sqlite.transaction_id_wraparound',
    'cluster.member-joined': 'sqlite.cluster_member_joined',
    'cluster.primary-elected': 'sqlite.cluster_primary_elected',
    'cluster.conflict-detected': 'sqlite.cluster_conflict_detected',
    'cluster.member-left': 'sqlite.cluster_member_left',
    'binlog.position-advanced': 'sqlite.wal_position_advanced',
    'binlog.gtid-set-updated': 'sqlite.changeset_gtid_updated',
    'binlog.format-negotiated': 'sqlite.changeset_format_negotiated',
    'binlog.gap-detected': 'sqlite.changeset_gap_detected',
    'wal.checkpoint-triggered': 'pragma_wal_checkpoint',
    'wal.size-threshold-crossed': 'wal.size_threshold',
    'wal.shared-memory-mapped': 'wal_index.shm_mapped',
    'wal.journal-mode-switched': 'pragma_journal_mode.wal',
    'fts5.virtual-table-created': 'fts5.virtual_table_created',
    'fts5.tokenized': 'fts5.tokenizer_configured',
    'fts5.matched': 'fts5.bm25_rank',
    'fts5.vocab-inspected': 'fts5vocab.inspected',
    'txn.level-set': 'pragma_locking_mode',
    'txn.dirty-read-blocked': 'sqlite.read_uncommitted_disabled',
    'txn.non-repeatable-read-blocked': 'sqlite.transaction_snapshot',
    'txn.phantom-read-blocked': 'sqlite.immediate_transaction',
    'pool-advanced.health-checked': 'sqlite3_status.health_check',
    'pool-advanced.warmed-up': 'sqlite3_db_config.warmup',
    'pool-advanced.drained': 'sqlite3_close_v2.drain',
    'pool-advanced.metrics-exported': 'sqlite3_status.metrics',
  },
};

/**
 * Provider-specific event name overlay. Some ORMs surface events with their
 * own label (e.g. Prisma `prisma:query`), so the mock offers an optional
 * override on top of the backend dialect. Currently only Prisma has any
 * override; drizzle / kysely default to the backend dialect entirely.
 *
 * Kept partial + empty defaults so future work can add overrides without
 * touching the {@link backendEventName} lookup.
 */
const providerOverlay: Record<OrmProvider, Partial<Record<NeutralEventName, string>>> = {
  drizzle: {},
  prisma: {
    'pool.acquired': 'prisma.pool.acquired',
    'pool.wait-queued': 'prisma.pool.wait',
    'mvcc.snapshot-taken': 'prisma.interactive_transaction',
  },
  kysely: {},
};

/**
 * Translate a neutral event name to the backend dialect. Optional provider
 * argument applies a per-ORM overlay on top of the backend dialect (used
 * for Prisma). Falls back to the neutral name if the backend has no
 * specific dialect entry — this makes the map partial-safe without silent
 * typos.
 */
export function backendEventName(
  backend: OrmBackend,
  neutral: NeutralEventName,
  provider?: OrmProvider,
): string {
  if (provider) {
    const overlay = providerOverlay[provider][neutral];
    if (overlay) return overlay;
  }
  return dialect[backend][neutral] ?? neutral;
}

/**
 * Axis result envelope returned by every state-machine step. ORM semantics
 * are pure helpers (no adapters); the envelope surfaces the next state
 * transition metadata so tests can drive the next call without re-reading
 * runtime-specific telemetry.
 */
export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  backendEvent: string;
  state: TState;
  provider: OrmProvider;
  backend: OrmBackend;
  metadata: Record<string, string | number | boolean>;
}
