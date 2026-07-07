import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * KV eventual consistency axis — models the read-your-writes / monotonic-reads
 * subset of consistency guarantees that edge KV stores expose. Writes converge
 * across quorum, but until convergence a read from a lagging replica returns
 * stale data. The helper tracks per-key write timestamps and per-session
 * last-observed timestamps, then detects violations (client writes t=100 →
 * reads t=50 back = read-your-writes violation).
 */
export type KvConsistencyState = 'writing' | 'converged' | 'stale' | 'violated';

export interface KvConsistencySession {
  platform: EdgePlatform;
  writes: Record<string, number>;
  observed: Record<string, number>;
  history: AxisStep<KvConsistencyState>[];
}

/**
 * Open a consistency session. Writes and observations start empty.
 */
export function startKvConsistency(input: {
  platform: EdgePlatform;
}): KvConsistencySession {
  return {
    platform: input.platform,
    writes: {},
    observed: {},
    history: [],
  };
}

/**
 * Record a write with monotonic timestamp `ts` reaching quorum. Emits
 * `kv-consistency.write-quorum` and updates the write pointer. Later
 * timestamps overwrite earlier ones (last-writer-wins).
 */
export function recordWriteQuorum(
  session: KvConsistencySession,
  input: { key: string; ts: number },
): AxisStep<KvConsistencyState> {
  session.writes[input.key] = Math.max(session.writes[input.key] ?? 0, input.ts);
  const step: AxisStep<KvConsistencyState> = {
    neutralEvent: 'kv-consistency.write-quorum',
    platformEvent: platformEventName(session.platform, 'kv-consistency.write-quorum'),
    state: 'writing',
    platform: session.platform,
    metadata: {
      key: input.key,
      ts: input.ts,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Observe a read of `key` returning value at timestamp `readTs` from
 * replica `replicaId`. Classifies: `stale` if readTs < writes[key],
 * `converged` if equal, `violated` if this read is older than a previously
 * observed monotonic read on same session (monotonic-reads violation).
 */
export function observeRead(
  session: KvConsistencySession,
  input: { key: string; readTs: number; replicaId: string },
): AxisStep<KvConsistencyState> {
  const { key, readTs, replicaId } = input;
  const writeTs = session.writes[key] ?? 0;
  const priorObserved = session.observed[key] ?? 0;
  let state: KvConsistencyState;
  let neutralEvent:
    | 'kv-consistency.stale-read'
    | 'kv-consistency.read-your-writes'
    | 'kv-consistency.monotonic-violation';
  if (readTs < priorObserved) {
    state = 'violated';
    neutralEvent = 'kv-consistency.monotonic-violation';
  } else if (readTs < writeTs) {
    state = 'stale';
    neutralEvent = 'kv-consistency.stale-read';
  } else {
    state = 'converged';
    neutralEvent = 'kv-consistency.read-your-writes';
  }
  session.observed[key] = Math.max(priorObserved, readTs);
  const step: AxisStep<KvConsistencyState> = {
    neutralEvent,
    platformEvent: platformEventName(session.platform, neutralEvent),
    state,
    platform: session.platform,
    metadata: {
      key,
      readTs,
      writeTs,
      priorObserved,
      replicaId,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Force convergence by advancing the observed pointer on every replica to
 * the latest write. Returns the count of keys reconciled.
 */
export function forceConvergence(session: KvConsistencySession): number {
  let reconciled = 0;
  for (const [key, writeTs] of Object.entries(session.writes)) {
    if ((session.observed[key] ?? 0) < writeTs) {
      session.observed[key] = writeTs;
      reconciled++;
    }
  }
  return reconciled;
}
