import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Declarative partitioning — RANGE / LIST / HASH partition strategies,
 * partition pruning, partition-wise join planning, and per-row routing.
 * Postgres has native declarative partitioning; MySQL has RANGE / LIST /
 * HASH partition types; SQLite emulates via ATTACH DATABASE shards. All 3
 * backends map to the same 4 neutral events with backend dialect via
 * {@link backendEventName}.
 *
 * State transitions:
 *   created                  → 'undeclared'
 *   declarePartition         → 'declared'
 *   prunePartitions          → 'pruned'
 *   partitionWiseJoin        → 'joined'
 *   routeInsert              → (state unchanged, routing is stateless)
 */
export type PartitionState = 'undeclared' | 'declared' | 'pruned' | 'joined';

export type PartitionStrategy = 'range' | 'list' | 'hash';

export interface PartitionBucket {
  name: string;
  strategy: PartitionStrategy;
  bounds: { low?: number; high?: number; values?: (string | number)[]; modulus?: number; remainder?: number };
}

export interface PartitioningSession {
  tableId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: PartitionState;
  buckets: PartitionBucket[];
  prunedCount: number;
  history: AxisStep<PartitionState>[];
}

function record(
  session: PartitioningSession,
  step: AxisStep<PartitionState>,
): AxisStep<PartitionState> {
  session.history.push(step);
  return step;
}

/**
 * Create a partitioning session bound to a table. State starts at
 * 'undeclared' and no buckets exist.
 */
export function createPartitioningSession(input: {
  tableId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): PartitioningSession {
  return {
    tableId: input.tableId,
    provider: input.provider,
    backend: input.backend,
    state: 'undeclared',
    buckets: [],
    prunedCount: 0,
    history: [],
  };
}

/**
 * Declare a new partition bucket. Range partitions require low + high; list
 * partitions require `values`; hash partitions require `modulus` +
 * `remainder`. Emits `partition.declared`.
 */
export function declarePartition(
  session: PartitioningSession,
  input: PartitionBucket,
): AxisStep<PartitionState> {
  if (input.strategy === 'range') {
    if (input.bounds.low === undefined || input.bounds.high === undefined) {
      throw new Error('declarePartition: range strategy requires low + high');
    }
    if (input.bounds.high <= input.bounds.low) {
      throw new Error('declarePartition: range high must exceed low');
    }
  } else if (input.strategy === 'list') {
    if (!input.bounds.values || input.bounds.values.length === 0) {
      throw new Error('declarePartition: list strategy requires values');
    }
  } else {
    if (input.bounds.modulus === undefined || input.bounds.remainder === undefined) {
      throw new Error('declarePartition: hash strategy requires modulus + remainder');
    }
    if (input.bounds.modulus <= 0) {
      throw new Error('declarePartition: hash modulus must be positive');
    }
    if (input.bounds.remainder < 0 || input.bounds.remainder >= input.bounds.modulus) {
      throw new Error(
        'declarePartition: hash remainder must be in [0, modulus)',
      );
    }
  }
  if (session.buckets.some((b) => b.name === input.name)) {
    throw new Error(`declarePartition: duplicate name ${input.name}`);
  }
  session.buckets.push({ ...input, bounds: { ...input.bounds } });
  session.state = 'declared';
  return record(session, {
    neutralEvent: 'partition.declared',
    backendEvent: backendEventName(session.backend, 'partition.declared', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      name: input.name,
      strategy: input.strategy,
      bucketCount: session.buckets.length,
    },
  });
}

/**
 * Prune partitions that cannot match a predicate. `keptCount` must be
 * smaller than or equal to the current bucket count. Emits
 * `partition.pruned`.
 */
export function prunePartitions(
  session: PartitioningSession,
  input: { predicate: string; keptCount: number },
): AxisStep<PartitionState> {
  if (session.buckets.length === 0) {
    throw new Error('prunePartitions: no partitions declared');
  }
  if (input.keptCount < 0 || input.keptCount > session.buckets.length) {
    throw new Error(
      `prunePartitions: keptCount ${input.keptCount} out of range [0, ${session.buckets.length}]`,
    );
  }
  const pruned = session.buckets.length - input.keptCount;
  session.prunedCount = pruned;
  session.state = 'pruned';
  return record(session, {
    neutralEvent: 'partition.pruned',
    backendEvent: backendEventName(session.backend, 'partition.pruned', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      predicate: input.predicate,
      pruned,
      kept: input.keptCount,
    },
  });
}

/**
 * Signal that a partition-wise join was planned between this table and
 * another partitioned table on the same key. Requires both sides to have
 * matching partition counts (Postgres constraint). Emits
 * `partition.wise-joined`.
 */
export function partitionWiseJoin(
  session: PartitioningSession,
  input: { otherTable: string; matchedBuckets: number },
): AxisStep<PartitionState> {
  if (session.state === 'undeclared') {
    throw new Error('partitionWiseJoin: partitions must be declared first');
  }
  if (input.matchedBuckets <= 0) {
    throw new Error('partitionWiseJoin: matchedBuckets must be positive');
  }
  if (input.matchedBuckets > session.buckets.length) {
    throw new Error(
      `partitionWiseJoin: matchedBuckets ${input.matchedBuckets} exceeds declared ${session.buckets.length}`,
    );
  }
  session.state = 'joined';
  return record(session, {
    neutralEvent: 'partition.wise-joined',
    backendEvent: backendEventName(session.backend, 'partition.wise-joined', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      otherTable: input.otherTable,
      matchedBuckets: input.matchedBuckets,
    },
  });
}

/**
 * Route a single row insert to a specific partition. Deterministic on the
 * partition strategy: range picks the bucket whose bounds enclose the key,
 * list picks the bucket whose values include the key, hash uses key %
 * modulus === remainder. Emits `partition.route-selected` and returns the
 * chosen bucket name in metadata.
 */
export function routeInsert(
  session: PartitioningSession,
  input: { key: number | string },
): AxisStep<PartitionState> {
  if (session.state === 'undeclared') {
    throw new Error('routeInsert: partitions must be declared first');
  }
  const chosen = session.buckets.find((b) => {
    if (b.strategy === 'range') {
      const low = b.bounds.low ?? Number.NEGATIVE_INFINITY;
      const high = b.bounds.high ?? Number.POSITIVE_INFINITY;
      return typeof input.key === 'number' && input.key >= low && input.key < high;
    }
    if (b.strategy === 'list') {
      return b.bounds.values?.includes(input.key) ?? false;
    }
    if (typeof input.key !== 'number') return false;
    const modulus = b.bounds.modulus ?? 1;
    const remainder = b.bounds.remainder ?? 0;
    return ((input.key % modulus) + modulus) % modulus === remainder;
  });
  if (!chosen) {
    throw new Error(`routeInsert: no bucket matches key ${String(input.key)}`);
  }
  return record(session, {
    neutralEvent: 'partition.route-selected',
    backendEvent: backendEventName(session.backend, 'partition.route-selected', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      key: String(input.key),
      bucket: chosen.name,
      strategy: chosen.strategy,
    },
  });
}
