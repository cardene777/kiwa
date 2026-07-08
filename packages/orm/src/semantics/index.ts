export type {
  AxisStep,
  NeutralEventName,
  OrmAxis,
  OrmBackend,
  OrmProvider,
} from './types.js';
export { backendEventName } from './types.js';

export type { FidelityCoverage, FidelityRow } from './fidelity.js';
export { AXIS_TO_EVENTS, collectFidelityCoverage } from './fidelity.js';

export type { ReplicaHandle, ReplicationSession, ReplicationState } from './replication.js';
export {
  createReplicationSession,
  primaryWrite,
  markReplicaLagged,
  startFailover,
  promoteReplica,
} from './replication.js';

export type { CdcEvent, CdcEventKind, CdcSession, CdcState } from './cdc.js';
export {
  createCdcSession,
  decodeEvent,
  appendOutbox,
  markEventOrdered,
  confirmDelivery,
} from './cdc.js';

export type {
  ConflictStrategy,
  LogicalRepSession,
  LogicalRepState,
} from './logical-replication.js';
export {
  createLogicalRepSession,
  createPublication,
  syncSubscription,
  resolveConflict,
  heartbeat,
} from './logical-replication.js';

export type { IsolationLevel, MvccSession, MvccState } from './mvcc.js';
export {
  createMvccSession,
  takeSnapshot,
  abortSerializable,
  blockPhantom,
  detectDeadlock,
} from './mvcc.js';

export type { RlsAuditEntry, RlsPolicy, RlsSession, RlsState } from './rls.js';
export { createRlsSession, installPolicy, filterTenant, bypassRls, logAudit } from './rls.js';

export type { ConnectionHandle, PoolSession, PoolState } from './connection-pool.js';
export {
  createPoolSession,
  acquire,
  waitInQueue,
  idleTimeout,
  statementTimeout,
} from './connection-pool.js';

export type {
  PartitionBucket,
  PartitionState,
  PartitionStrategy,
  PartitioningSession,
} from './partitioning.js';
export {
  createPartitioningSession,
  declarePartition,
  prunePartitions,
  partitionWiseJoin,
  routeInsert,
} from './partitioning.js';

export type {
  VectorDistanceKind,
  VectorIndex,
  VectorIndexKind,
  VectorState,
  VectorStoreSession,
} from './vector-store.js';
export {
  createVectorStoreSession,
  buildIndex,
  knnSearch,
  hybridSearch,
  computeDistance,
} from './vector-store.js';

export type {
  LogicalReplicationAdvancedSession,
  LogicalReplicationAdvancedState,
} from './logical-replication-advanced.js';
export {
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  trackReplicationOrigin,
  confirmTwoSafeCommit,
  syncCascadedSubscription,
} from './logical-replication-advanced.js';

export type { MvccAdvancedSession, MvccAdvancedState } from './mvcc-advanced.js';
export {
  createMvccAdvancedSession,
  checkTupleVisibility,
  measureBloat,
  applyHotUpdate,
  detectXidWraparound,
} from './mvcc-advanced.js';

export type { MysqlClusterSession, MysqlClusterState } from './mysql-cluster.js';
export {
  createMysqlClusterSession,
  joinClusterMember,
  electClusterPrimary,
  detectClusterConflict,
  leaveClusterMember,
} from './mysql-cluster.js';

export type { BinlogFormat, BinlogSession, BinlogState } from './binlog.js';
export {
  createBinlogSession,
  advanceBinlogPosition,
  updateGtidSet,
  negotiateBinlogFormat,
  detectGtidGap,
} from './binlog.js';

export type { SqliteWalSession, SqliteWalState } from './sqlite-wal.js';
export {
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
  triggerWalCheckpoint,
  mapSharedMemory,
} from './sqlite-wal.js';

export type { Fts5Session, Fts5State, Fts5Tokenizer } from './fts5.js';
export {
  createFts5Session,
  createFts5VirtualTable,
  tokenizeFts5Document,
  matchFts5Query,
  inspectFts5Vocab,
} from './fts5.js';

export type { TxnIsolationLevel, TxnIsolationSession, TxnIsolationState } from './txn-isolation.js';
export {
  createTxnIsolationSession,
  setTxnIsolationLevel,
  blockDirtyRead,
  blockNonRepeatableRead,
  blockPhantomRead,
} from './txn-isolation.js';

export type { PoolAdvancedSession, PoolAdvancedState } from './pool-advanced.js';
export {
  createPoolAdvancedSession,
  runPoolHealthCheck,
  warmPoolConnections,
  drainPoolGracefully,
  exportPoolMetrics,
} from './pool-advanced.js';

// v0.6 transaction-orchestrator = txn-isolation + mvcc + connection-pool +
// logical-replication + partitioning の 継続合成 layer (depth-5 pattern 9 例目)
export type {
  TransactionState,
  TransactionEvent,
  TransactionSession,
  TransactionSummary,
} from './transaction-orchestrator.js';
export {
  startTransaction,
  dispatchEvent as dispatchTransactionEvent,
  summarizeTransaction,
} from './transaction-orchestrator.js';
