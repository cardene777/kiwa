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
