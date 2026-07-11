import { describe, expect, it } from 'vitest';
import {
  applyHotUpdate,
  backendEventName,
  checkTupleVisibility,
  createMvccAdvancedSession,
  detectXidWraparound,
  measureBloat,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('mvcc-advanced axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: visibility → bloat → HOT → wraparound happy path',
    (provider, backend) => {
      const session = createMvccAdvancedSession({
        tableName: 'users',
        provider,
        backend,
        currentXid: 5000,
      });
      checkTupleVisibility(session, { tupleId: 't1', xmin: 100, snapshotXmin: 200 });
      measureBloat(session, { liveTuples: 80, deadTuples: 20 });
      applyHotUpdate(session, { oldTupleId: 't1', newTupleId: 't2', chainLength: 2 });
      const wrap = detectXidWraparound(session, { freezeXid: 1000, warningAge: 3000 });
      expect(wrap.neutralEvent).toBe('mvcc-advanced.xid-wraparound-detected');
      expect(wrap.metadata.xidAge).toBe(4000);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for tuple visibility',
    (provider, backend) => {
      const session = createMvccAdvancedSession({
        tableName: 'users',
        provider,
        backend,
        currentXid: 10,
      });
      const step = checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'mvcc-advanced.tuple-visibility-checked', provider),
      );
    },
  );

  it('constructor rejects non-positive currentXid', () => {
    expect(() =>
      createMvccAdvancedSession({
        tableName: 'users',
        provider: 'drizzle',
        backend: 'postgres',
        currentXid: 0,
      }),
    ).toThrow(/currentXid/);
  });

  it('measureBloat requires visibility check first', () => {
    const session = createMvccAdvancedSession({
      tableName: 'users',
      provider: 'drizzle',
      backend: 'postgres',
      currentXid: 10,
    });
    expect(() => measureBloat(session, { liveTuples: 1, deadTuples: 1 })).toThrow(/visibility/);
  });

  it('applyHotUpdate rejects same tuple id', () => {
    const session = createMvccAdvancedSession({
      tableName: 'users',
      provider: 'drizzle',
      backend: 'postgres',
      currentXid: 10,
    });
    checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
    measureBloat(session, { liveTuples: 1, deadTuples: 1 });
    expect(() =>
      applyHotUpdate(session, { oldTupleId: 't1', newTupleId: 't1', chainLength: 1 }),
    ).toThrow(/differ/);
  });

  it('detectXidWraparound rejects age below threshold', () => {
    const session = createMvccAdvancedSession({
      tableName: 'users',
      provider: 'drizzle',
      backend: 'postgres',
      currentXid: 100,
    });
    checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
    measureBloat(session, { liveTuples: 1, deadTuples: 1 });
    applyHotUpdate(session, { oldTupleId: 't1', newTupleId: 't2', chainLength: 1 });
    expect(() => detectXidWraparound(session, { freezeXid: 90, warningAge: 20 })).toThrow(/threshold/);
  });

  // Argument guards that had no test — each throw is now exercised through the
  // public API.
  it('checkTupleVisibility rejects empty tupleId', () => {
    const session = createMvccAdvancedSession({
      tableName: 'u', provider: 'drizzle', backend: 'postgres', currentXid: 10,
    });
    expect(() =>
      checkTupleVisibility(session, { tupleId: '', xmin: 1, snapshotXmin: 2 }),
    ).toThrow(/tupleId is required/);
  });

  it('checkTupleVisibility rejects tuple xmin newer than snapshot', () => {
    const session = createMvccAdvancedSession({
      tableName: 'u', provider: 'drizzle', backend: 'postgres', currentXid: 10,
    });
    expect(() =>
      checkTupleVisibility(session, { tupleId: 't1', xmin: 10, snapshotXmin: 2 }),
    ).toThrow(/newer than snapshot/);
  });

  it('measureBloat rejects non-positive total tuple counts', () => {
    const session = createMvccAdvancedSession({
      tableName: 'u', provider: 'drizzle', backend: 'postgres', currentXid: 10,
    });
    checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
    expect(() => measureBloat(session, { liveTuples: 0, deadTuples: 0 })).toThrow(
      /tuple counts must be positive in total/,
    );
  });

  it('applyHotUpdate requires bloat-measured state (state guard)', () => {
    const session = createMvccAdvancedSession({
      tableName: 'u', provider: 'drizzle', backend: 'postgres', currentXid: 10,
    });
    checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
    // state = 'visibility-checked', not 'bloat-measured'
    expect(() =>
      applyHotUpdate(session, { oldTupleId: 't1', newTupleId: 't2', chainLength: 1 }),
    ).toThrow(/requires bloat-measured state/);
  });

  it('applyHotUpdate rejects non-positive chainLength', () => {
    const session = createMvccAdvancedSession({
      tableName: 'u', provider: 'drizzle', backend: 'postgres', currentXid: 10,
    });
    checkTupleVisibility(session, { tupleId: 't1', xmin: 1, snapshotXmin: 2 });
    measureBloat(session, { liveTuples: 1, deadTuples: 1 });
    expect(() =>
      applyHotUpdate(session, { oldTupleId: 't1', newTupleId: 't2', chainLength: 0 }),
    ).toThrow(/chainLength must be positive/);
  });
});
