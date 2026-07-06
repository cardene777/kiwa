import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * MVCC advanced — tuple visibility, table bloat, HOT update chains, and XID
 * wraparound pressure. Postgres maps to heap tuple metadata and
 * pg_stat_user_tables; MySQL approximates with InnoDB transaction metadata;
 * SQLite falls back to snapshot / freelist style counters.
 *
 * State transitions:
 *   created                → 'idle'
 *   checkTupleVisibility   → 'visibility-checked'
 *   measureBloat           → 'bloat-measured'
 *   applyHotUpdate         → 'hot-updated'
 *   detectXidWraparound    → 'xid-wraparound-detected'
 */
export type MvccAdvancedState =
  | 'idle'
  | 'visibility-checked'
  | 'bloat-measured'
  | 'hot-updated'
  | 'xid-wraparound-detected';

export interface MvccAdvancedSession {
  tableName: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: MvccAdvancedState;
  visibleTuples: Set<string>;
  bloatRatio: number;
  hotChainLength: number;
  currentXid: number;
  history: AxisStep<MvccAdvancedState>[];
}

function record(
  session: MvccAdvancedSession,
  step: AxisStep<MvccAdvancedState>,
): AxisStep<MvccAdvancedState> {
  session.history.push(step);
  return step;
}

export function createMvccAdvancedSession(input: {
  tableName: string;
  provider: OrmProvider;
  backend: OrmBackend;
  currentXid: number;
}): MvccAdvancedSession {
  if (input.currentXid <= 0) {
    throw new Error('createMvccAdvancedSession: currentXid must be positive');
  }
  return {
    tableName: input.tableName,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    visibleTuples: new Set(),
    bloatRatio: 0,
    hotChainLength: 0,
    currentXid: input.currentXid,
    history: [],
  };
}

export function checkTupleVisibility(
  session: MvccAdvancedSession,
  input: { tupleId: string; xmin: number; xmax?: number; snapshotXmin: number },
): AxisStep<MvccAdvancedState> {
  if (!input.tupleId) {
    throw new Error('checkTupleVisibility: tupleId is required');
  }
  if (input.xmin > input.snapshotXmin) {
    throw new Error('checkTupleVisibility: tuple xmin is newer than snapshot');
  }
  const visible = input.xmax === undefined || input.xmax > input.snapshotXmin;
  if (visible) session.visibleTuples.add(input.tupleId);
  session.state = 'visibility-checked';
  return record(session, {
    neutralEvent: 'mvcc-advanced.tuple-visibility-checked',
    backendEvent: backendEventName(
      session.backend,
      'mvcc-advanced.tuple-visibility-checked',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      tupleId: input.tupleId,
      visible,
      snapshotXmin: input.snapshotXmin,
    },
  });
}

export function measureBloat(
  session: MvccAdvancedSession,
  input: { liveTuples: number; deadTuples: number },
): AxisStep<MvccAdvancedState> {
  if (session.state !== 'visibility-checked' && session.state !== 'bloat-measured') {
    throw new Error(`measureBloat: requires visibility-checked state (got ${session.state})`);
  }
  const total = input.liveTuples + input.deadTuples;
  if (total <= 0) {
    throw new Error('measureBloat: tuple counts must be positive in total');
  }
  session.bloatRatio = input.deadTuples / total;
  session.state = 'bloat-measured';
  return record(session, {
    neutralEvent: 'mvcc-advanced.bloat-measured',
    backendEvent: backendEventName(
      session.backend,
      'mvcc-advanced.bloat-measured',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      liveTuples: input.liveTuples,
      deadTuples: input.deadTuples,
      bloatRatio: session.bloatRatio,
    },
  });
}

export function applyHotUpdate(
  session: MvccAdvancedSession,
  input: { oldTupleId: string; newTupleId: string; chainLength: number },
): AxisStep<MvccAdvancedState> {
  if (session.state !== 'bloat-measured' && session.state !== 'hot-updated') {
    throw new Error(`applyHotUpdate: requires bloat-measured state (got ${session.state})`);
  }
  if (input.oldTupleId === input.newTupleId) {
    throw new Error('applyHotUpdate: oldTupleId and newTupleId must differ');
  }
  if (input.chainLength <= 0) {
    throw new Error('applyHotUpdate: chainLength must be positive');
  }
  session.hotChainLength = input.chainLength;
  session.visibleTuples.delete(input.oldTupleId);
  session.visibleTuples.add(input.newTupleId);
  session.state = 'hot-updated';
  return record(session, {
    neutralEvent: 'mvcc-advanced.hot-updated',
    backendEvent: backendEventName(
      session.backend,
      'mvcc-advanced.hot-updated',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      oldTupleId: input.oldTupleId,
      newTupleId: input.newTupleId,
      chainLength: input.chainLength,
    },
  });
}

export function detectXidWraparound(
  session: MvccAdvancedSession,
  input: { freezeXid: number; warningAge: number },
): AxisStep<MvccAdvancedState> {
  if (session.state !== 'hot-updated' && session.state !== 'xid-wraparound-detected') {
    throw new Error(`detectXidWraparound: requires hot-updated state (got ${session.state})`);
  }
  if (input.warningAge <= 0) {
    throw new Error('detectXidWraparound: warningAge must be positive');
  }
  const xidAge = session.currentXid - input.freezeXid;
  if (xidAge < input.warningAge) {
    throw new Error('detectXidWraparound: xid age is below warning threshold');
  }
  session.state = 'xid-wraparound-detected';
  return record(session, {
    neutralEvent: 'mvcc-advanced.xid-wraparound-detected',
    backendEvent: backendEventName(
      session.backend,
      'mvcc-advanced.xid-wraparound-detected',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      freezeXid: input.freezeXid,
      xidAge,
      warningAge: input.warningAge,
    },
  });
}
