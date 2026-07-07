import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type IndexMgmtState =
  | 'idle'
  | 'shard-allocated'
  | 'replica-promoted'
  | 'reindex-in-progress'
  | 'reindex-completed'
  | 'zero-downtime-swapped';

export interface ShardAssignment {
  shardId: number;
  nodeId: string;
  role: 'primary' | 'replica';
}

export interface IndexMgmtSession {
  target: SearchTarget;
  indexId: string;
  shardCount: number;
  replicaCount: number;
  nodes: string[];
  shards: ShardAssignment[];
  reindexProgress: number;
  aliasTarget: string;
  state: IndexMgmtState;
  history: AxisStep<IndexMgmtState>[];
}

export function startIndexMgmtSession(input: {
  target: SearchTarget;
  indexId: string;
  shardCount: number;
  replicaCount: number;
  nodes: string[];
}): IndexMgmtSession {
  if (input.indexId.length === 0) {
    throw new Error('startIndexMgmtSession: indexId must not be empty');
  }
  if (input.shardCount <= 0) {
    throw new Error('startIndexMgmtSession: shardCount must be positive');
  }
  if (input.replicaCount < 0) {
    throw new Error('startIndexMgmtSession: replicaCount must be non-negative');
  }
  if (input.nodes.length === 0) {
    throw new Error('startIndexMgmtSession: nodes must not be empty');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    shardCount: input.shardCount,
    replicaCount: input.replicaCount,
    nodes: [...input.nodes],
    shards: [],
    reindexProgress: 0,
    aliasTarget: input.indexId,
    state: 'idle',
    history: [],
  };
}

export function allocateShards(session: IndexMgmtSession): AxisStep<IndexMgmtState> {
  if (session.state !== 'idle') {
    throw new Error(`allocateShards: session is ${session.state}, not idle`);
  }
  session.shards = [];
  const nodeCount = session.nodes.length;
  const requiredNodes = 1 + session.replicaCount;
  if (nodeCount < requiredNodes) {
    throw new Error(
      `allocateShards: need at least ${requiredNodes} nodes for ${session.replicaCount} replicas`,
    );
  }
  for (let s = 0; s < session.shardCount; s += 1) {
    const primaryNode = session.nodes[s % nodeCount] ?? session.nodes[0] ?? 'node-0';
    session.shards.push({ shardId: s, nodeId: primaryNode, role: 'primary' });
    for (let r = 0; r < session.replicaCount; r += 1) {
      const replicaNode = session.nodes[(s + r + 1) % nodeCount] ?? primaryNode;
      session.shards.push({ shardId: s, nodeId: replicaNode, role: 'replica' });
    }
  }
  session.state = 'shard-allocated';
  return emit(session, 'index.shard_allocated', {
    shardCount: session.shardCount,
    replicaCount: session.replicaCount,
    totalAssignments: session.shards.length,
  });
}

export function promoteReplica(
  session: IndexMgmtSession,
  input: { shardId: number; failedNode: string },
): AxisStep<IndexMgmtState> {
  if (session.state !== 'shard-allocated' && session.state !== 'replica-promoted') {
    throw new Error(`promoteReplica: session is ${session.state}, expected shard-allocated`);
  }
  const primaryIdx = session.shards.findIndex(
    (s) => s.shardId === input.shardId && s.role === 'primary' && s.nodeId === input.failedNode,
  );
  if (primaryIdx === -1) {
    throw new Error(`promoteReplica: primary shard ${input.shardId} on ${input.failedNode} not found`);
  }
  const replicaIdx = session.shards.findIndex(
    (s) => s.shardId === input.shardId && s.role === 'replica' && s.nodeId !== input.failedNode,
  );
  if (replicaIdx === -1) {
    throw new Error(`promoteReplica: no replica available for shard ${input.shardId}`);
  }
  const primary = session.shards[primaryIdx];
  const replica = session.shards[replicaIdx];
  if (primary) primary.role = 'replica';
  if (replica) replica.role = 'primary';
  session.state = 'replica-promoted';
  return emit(session, 'index.replica_promoted', {
    shardId: input.shardId,
    failedNode: input.failedNode,
    newPrimaryNode: replica?.nodeId ?? '',
  });
}

export function advanceRollingReindex(
  session: IndexMgmtSession,
  input: { batchPercent: number },
): AxisStep<IndexMgmtState> {
  if (input.batchPercent <= 0 || input.batchPercent > 100) {
    throw new Error('advanceRollingReindex: batchPercent must be within (0, 100]');
  }
  if (session.state === 'zero-downtime-swapped') {
    throw new Error('advanceRollingReindex: reindex already swapped');
  }
  const nextProgress = Math.min(100, session.reindexProgress + input.batchPercent);
  session.reindexProgress = nextProgress;
  session.state = nextProgress >= 100 ? 'reindex-completed' : 'reindex-in-progress';
  return emit(session, 'index.rolling_reindex_advanced', {
    batchPercent: input.batchPercent,
    progress: nextProgress,
    completed: nextProgress >= 100,
  });
}

export function swapZeroDowntime(
  session: IndexMgmtSession,
  input: { newIndexId: string },
): AxisStep<IndexMgmtState> {
  if (session.state !== 'reindex-completed') {
    throw new Error(`swapZeroDowntime: session is ${session.state}, expected reindex-completed`);
  }
  if (input.newIndexId.length === 0) {
    throw new Error('swapZeroDowntime: newIndexId must not be empty');
  }
  const previous = session.aliasTarget;
  session.aliasTarget = input.newIndexId;
  session.state = 'zero-downtime-swapped';
  return emit(session, 'index.zero_downtime_swapped', {
    previousAlias: previous,
    newAlias: input.newIndexId,
    reindexProgress: session.reindexProgress,
  });
}

function emit(
  session: IndexMgmtSession,
  neutralEvent: AxisStep<IndexMgmtState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<IndexMgmtState> {
  const step: AxisStep<IndexMgmtState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
