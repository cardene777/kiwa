/**
 * v1.32-5 docs 補強 (Issue #1026) — tutorial 61-63 code snippet validation.
 *
 * `docs/tutorials/61-postgres-logical-replication-advanced.md` /
 * `docs/tutorials/62-mysql-group-replication.md` /
 * `docs/tutorials/63-sqlite-wal-fts5.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * v1.23 → v1.32 で 10 milestone 連続 snippet validation streak を延伸。
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  // tutorial 61
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  trackReplicationOrigin,
  confirmTwoSafeCommit,
  syncCascadedSubscription,
  // tutorial 62
  createMysqlClusterSession,
  joinClusterMember,
  electClusterPrimary,
  detectClusterConflict,
  leaveClusterMember,
  // tutorial 63 — WAL
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
  triggerWalCheckpoint,
  mapSharedMemory,
  // tutorial 63 — FTS5
  createFts5Session,
  createFts5VirtualTable,
  tokenizeFts5Document,
  matchFts5Query,
  inspectFts5Vocab,
  // concept doc — fidelity harness
  collectFidelityCoverage,
} from '../src/semantics/index.js';

// -----------------------------------------------------------------------------
// tutorial 61 — Postgres logical replication advanced
// -----------------------------------------------------------------------------

describe('tutorial 61 — startLogicalStreaming', () => {
  it('opens a pgoutput stream from a positive start LSN (tutorial: happy path snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });

    const step = startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });

    expect(step.state).toBe('streaming');
    expect(step.neutralEvent).toBe('logical-advanced.streaming-started');
    expect(step.backendEvent).toBe('pgoutput.start_replication');
    expect(step.metadata.startLsn).toBe(42_000_000);
    expect(step.metadata.protocolVersion).toBe(2);
  });

  it('rejects a non-positive start LSN (tutorial: reject snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      startLogicalStreaming(session, { startLsn: 0, protocolVersion: 2 }),
    ).toThrow(/startLsn must be positive/);
  });
});

describe('tutorial 61 — trackReplicationOrigin', () => {
  it('records remote LSN and switches to origin-tracked (tutorial: advance snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });

    const step = trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });

    expect(step.state).toBe('origin-tracked');
    expect(step.metadata.originId).toBe('sub_orders');
    expect(step.metadata.remoteLsn).toBe(42_010_000);
    expect(session.confirmedLsn).toBe(42_010_000);
  });

  it('rejects remote LSN that precedes stream start (tutorial: precedes snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    expect(() =>
      trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 41_999_000 }),
    ).toThrow(/remoteLsn cannot precede startLsn/);
  });
});

describe('tutorial 61 — confirmTwoSafeCommit', () => {
  it('advances confirmedLsn on 2 synchronous standbys (tutorial: two-safe snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });

    const step = confirmTwoSafeCommit(session, {
      confirmedFlushLsn: 42_020_000,
      synchronousStandbys: 2,
    });

    expect(step.state).toBe('two-safe-confirmed');
    expect(step.backendEvent).toBe('synchronous_commit.remote_apply');
    expect(step.metadata.confirmedFlushLsn).toBe(42_020_000);
    expect(step.metadata.synchronousStandbys).toBe(2);
  });

  it('rejects zero synchronous standbys (tutorial: zero standby snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    expect(() =>
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 0 }),
    ).toThrow(/at least one synchronous standby is required/);
  });

  it('rejects regressed confirmedFlushLsn (tutorial: regress snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    expect(() =>
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_009_000, synchronousStandbys: 1 }),
    ).toThrow(/confirmedFlushLsn cannot regress/);
  });
});

describe('tutorial 61 — syncCascadedSubscription', () => {
  it('adds downstream subscribers and tracks cascadedCount (tutorial: cascade snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 2 });

    const first = syncCascadedSubscription(session, {
      upstreamId: 'primary',
      subscriberId: 'analytics-eu',
    });
    expect(first.state).toBe('cascade-synced');
    expect(first.metadata.cascadedCount).toBe(1);

    const second = syncCascadedSubscription(session, {
      upstreamId: 'primary',
      subscriberId: 'analytics-us',
    });
    expect(second.metadata.cascadedCount).toBe(2);
  });

  it('rejects self-loop upstream === subscriber (tutorial: self-loop snippet)', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 2 });
    expect(() =>
      syncCascadedSubscription(session, { upstreamId: 'primary', subscriberId: 'primary' }),
    ).toThrow(/upstreamId and subscriberId must differ/);
  });
});

// -----------------------------------------------------------------------------
// tutorial 62 — MySQL group replication
// -----------------------------------------------------------------------------

describe('tutorial 62 — joinClusterMember', () => {
  it('adds a member with weight and grows the visible set (tutorial: join snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });

    const step = joinClusterMember(session, { memberId: 'node-1', weight: 50 });

    expect(step.state).toBe('joined');
    expect(step.neutralEvent).toBe('cluster.member-joined');
    expect(step.backendEvent).toBe('group_replication.member_joined');
    expect(step.metadata.memberId).toBe('node-1');
    expect(step.metadata.memberCount).toBe(1);
    expect(session.members.has('node-1')).toBe(true);
  });

  it('rejects duplicate join (tutorial: duplicate snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 50 });
    expect(() => joinClusterMember(session, { memberId: 'node-1', weight: 60 })).toThrow(
      /already joined/,
    );
  });

  it('rejects negative weight (tutorial: negative-weight snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    expect(() => joinClusterMember(session, { memberId: 'node-1', weight: -1 })).toThrow(
      /weight must be non-negative/,
    );
  });
});

describe('tutorial 62 — electClusterPrimary', () => {
  it('elects a joined member as single-primary (tutorial: elect snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });

    const step = electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });

    expect(step.state).toBe('primary-elected');
    expect(step.backendEvent).toBe('group_replication.primary_elected');
    expect(session.primaryId).toBe('node-1');
  });

  it('rejects unknown member for election (tutorial: unknown-member snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    expect(() => electClusterPrimary(session, { memberId: 'ghost', mode: 'single-primary' })).toThrow(
      /unknown member/,
    );
  });

  it('rejects multi-primary mode for election (tutorial: multi-primary snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    expect(() => electClusterPrimary(session, { memberId: 'node-1', mode: 'multi-primary' })).toThrow(
      /requires single-primary/,
    );
  });
});

describe('tutorial 62 — detectClusterConflict', () => {
  it('records winner and increments conflictCount (tutorial: conflict snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });

    const first = detectClusterConflict(session, {
      transactionId: 'txn-100',
      winnerMemberId: 'node-1',
    });
    expect(first.state).toBe('conflict-detected');
    expect(first.metadata.conflictCount).toBe(1);

    const second = detectClusterConflict(session, {
      transactionId: 'txn-101',
      winnerMemberId: 'node-2',
    });
    expect(second.metadata.conflictCount).toBe(2);
  });

  it('rejects unknown winner (tutorial: unknown-winner snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });
    expect(() =>
      detectClusterConflict(session, { transactionId: 'txn-x', winnerMemberId: 'ghost' }),
    ).toThrow(/unknown winner/);
  });
});

describe('tutorial 62 — leaveClusterMember', () => {
  it('removes member and clears primary slot when the leaver is primary (tutorial: leave snippet)', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });
    detectClusterConflict(session, { transactionId: 'txn-100', winnerMemberId: 'node-1' });

    const step = leaveClusterMember(session, { memberId: 'node-1' });

    expect(step.state).toBe('member-left');
    expect(step.backendEvent).toBe('group_replication.member_left');
    expect(step.metadata.memberCount).toBe(1);
    expect(step.metadata.primaryPresent).toBe(false);
    expect(session.primaryId).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// tutorial 63 — SQLite WAL
// -----------------------------------------------------------------------------

describe('tutorial 63 — switchJournalMode', () => {
  it('flips from DELETE to WAL and records the event (tutorial: switch snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });

    const step = switchJournalMode(session, { mode: 'WAL' });

    expect(step.state).toBe('wal-enabled');
    expect(step.neutralEvent).toBe('wal.journal-mode-switched');
    expect(step.backendEvent).toBe('pragma_journal_mode.wal');
    expect(step.metadata.mode).toBe('WAL');
    expect(session.journalMode).toBe('WAL');
  });

  it('rejects second switch (tutorial: rejected-second-switch snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() => switchJournalMode(session, { mode: 'WAL' })).toThrow(
      /requires rollback-journal state/,
    );
  });
});

describe('tutorial 63 — crossWalSizeThreshold', () => {
  it('records WAL size and transitions to threshold-crossed (tutorial: threshold snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });

    const step = crossWalSizeThreshold(session, {
      walSizeBytes: 8_192_000,
      thresholdBytes: 4_096_000,
    });

    expect(step.state).toBe('threshold-crossed');
    expect(step.metadata.walSizeBytes).toBe(8_192_000);
    expect(step.metadata.thresholdBytes).toBe(4_096_000);
    expect(session.walSizeBytes).toBe(8_192_000);
  });

  it('rejects walSizeBytes <= thresholdBytes (tutorial: not-crossed snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() =>
      crossWalSizeThreshold(session, { walSizeBytes: 4_096_000, thresholdBytes: 4_096_000 }),
    ).toThrow(/must exceed thresholdBytes/);
  });
});

describe('tutorial 63 — triggerWalCheckpoint', () => {
  it('TRUNCATE resets WAL size to 0 (tutorial: truncate snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });

    const step = triggerWalCheckpoint(session, { mode: 'TRUNCATE' });

    expect(step.state).toBe('checkpointed');
    expect(step.backendEvent).toBe('pragma_wal_checkpoint');
    expect(step.metadata.mode).toBe('TRUNCATE');
    expect(step.metadata.checkpointCount).toBe(1);
    expect(step.metadata.walSizeBytes).toBe(0);
  });

  it('PASSIVE keeps WAL size (tutorial: passive snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });

    const step = triggerWalCheckpoint(session, { mode: 'PASSIVE' });

    expect(step.state).toBe('checkpointed');
    expect(step.metadata.walSizeBytes).toBe(8_192_000);
  });
});

describe('tutorial 63 — mapSharedMemory', () => {
  it('maps positive region and flips flag (tutorial: shm snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });
    triggerWalCheckpoint(session, { mode: 'TRUNCATE' });

    const step = mapSharedMemory(session, { regionBytes: 32_768 });

    expect(step.state).toBe('shared-memory-mapped');
    expect(step.backendEvent).toBe('wal_index.shm_mapped');
    expect(step.metadata.regionBytes).toBe(32_768);
    expect(session.sharedMemoryMapped).toBe(true);
  });

  it('rejects zero region (tutorial: zero-region snippet)', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });
    triggerWalCheckpoint(session, { mode: 'TRUNCATE' });
    expect(() => mapSharedMemory(session, { regionBytes: 0 })).toThrow(
      /regionBytes must be positive/,
    );
  });
});

// -----------------------------------------------------------------------------
// tutorial 63 — SQLite FTS5
// -----------------------------------------------------------------------------

describe('tutorial 63 — FTS5 virtual table', () => {
  it('creates virtual table with unicode61 tokenizer (tutorial: unicode61 snippet)', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });

    const step = createFts5VirtualTable(session, {
      columns: ['title', 'body'],
      tokenizer: 'unicode61',
    });

    expect(step.state).toBe('virtual-table-created');
    expect(step.backendEvent).toBe('fts5.virtual_table_created');
    expect(step.metadata.columnCount).toBe(2);
    expect(step.metadata.tokenizer).toBe('unicode61');
  });

  it('rejects empty columns (tutorial: empty-columns snippet)', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    expect(() =>
      createFts5VirtualTable(session, { columns: [], tokenizer: 'unicode61' }),
    ).toThrow(/at least one column/);
  });

  it('tokenizes with porter tokenizer (tutorial: porter snippet)', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'porter' });

    const step = tokenizeFts5Document(session, {
      document: 'the quick brown fox jumps',
    });

    expect(step.state).toBe('tokenized');
    expect(step.backendEvent).toBe('fts5.tokenizer_configured');
    expect(step.metadata.tokenCount).toBe(5);
    expect(step.metadata.tokenizer).toBe('porter');
  });

  it('matches query and records BM25 rank (tutorial: bm25 snippet)', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'trigram' });
    tokenizeFts5Document(session, { document: 'the quick brown fox jumps' });

    const step = matchFts5Query(session, { query: 'quick fox', rank: -1.234 });

    expect(step.state).toBe('matched');
    expect(step.backendEvent).toBe('fts5.bm25_rank');
    expect(step.metadata.query).toBe('quick fox');
    expect(step.metadata.rank).toBe(-1.234);
    expect(session.lastRank).toBe(-1.234);
  });

  it('inspects vocab for a term (tutorial: vocab snippet)', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'unicode61' });
    tokenizeFts5Document(session, { document: 'the quick brown fox' });
    matchFts5Query(session, { query: 'quick', rank: -0.5 });

    const step = inspectFts5Vocab(session, { term: 'fox', occurrences: 42 });

    expect(step.state).toBe('vocab-inspected');
    expect(step.backendEvent).toBe('fts5vocab.inspected');
    expect(step.metadata.term).toBe('fox');
    expect(step.metadata.occurrences).toBe(42);
  });
});

// -----------------------------------------------------------------------------
// concept doc — collectFidelityCoverage
// -----------------------------------------------------------------------------

describe('concept doc — 144 cell grid', () => {
  it('produces 3 provider × 3 backend × 16 axis = 144 rows (concept: coverage snippet)', () => {
    const coverage = collectFidelityCoverage({
      providers: ['drizzle', 'prisma', 'kysely'],
      backends: ['postgres', 'mysql', 'sqlite'],
    });

    expect(coverage.rows.length).toBe(144);
    expect(coverage.axes.length).toBe(16);
    expect(coverage.providers).toEqual(['drizzle', 'prisma', 'kysely']);
    expect(coverage.backends).toEqual(['postgres', 'mysql', 'sqlite']);
  });

  it('surfaces postgres logical-replication-advanced dialect (concept: postgres dialect snippet)', () => {
    const coverage = collectFidelityCoverage({
      providers: ['drizzle', 'prisma', 'kysely'],
      backends: ['postgres', 'mysql', 'sqlite'],
    });

    const postgresLogicalAdv = coverage.rows.find(
      (r) =>
        r.provider === 'drizzle' &&
        r.backend === 'postgres' &&
        r.axis === 'logical-replication-advanced',
    );

    expect(postgresLogicalAdv).toBeDefined();
    expect(postgresLogicalAdv?.backendEvents).toEqual([
      'pgoutput.start_replication',
      'pg_replication_origin.progress',
      'synchronous_commit.remote_apply',
      'pg_subscription.cascade_synced',
    ]);
  });

  it('surfaces mysql cluster dialect for a joined member (concept: mysql dialect snippet)', () => {
    const coverage = collectFidelityCoverage({
      providers: ['drizzle', 'prisma', 'kysely'],
      backends: ['postgres', 'mysql', 'sqlite'],
    });

    const mysqlCluster = coverage.rows.find(
      (r) => r.provider === 'prisma' && r.backend === 'mysql' && r.axis === 'mysql-cluster',
    );

    expect(mysqlCluster).toBeDefined();
    expect(mysqlCluster?.backendEvents).toEqual([
      'group_replication.member_joined',
      'group_replication.primary_elected',
      'performance_schema.replication_conflict_detected',
      'group_replication.member_left',
    ]);
  });

  it('surfaces sqlite fts5 dialect (concept: sqlite dialect snippet)', () => {
    const coverage = collectFidelityCoverage({
      providers: ['drizzle', 'prisma', 'kysely'],
      backends: ['postgres', 'mysql', 'sqlite'],
    });

    const sqliteFts5 = coverage.rows.find(
      (r) => r.provider === 'kysely' && r.backend === 'sqlite' && r.axis === 'fts5',
    );

    expect(sqliteFts5).toBeDefined();
    expect(sqliteFts5?.backendEvents).toEqual([
      'fts5.virtual_table_created',
      'fts5.tokenizer_configured',
      'fts5.bm25_rank',
      'fts5vocab.inspected',
    ]);
  });
});
