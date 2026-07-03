import { describe, expect, it } from 'vitest';
import {
  mockSignal,
  mockEffect,
  batch,
  track,
  createResourceStub,
  isSignal,
  isEffectHandle,
  isResourceAccessor,
  SIGNAL_SYMBOL,
} from '../src/signal.js';

describe('mockSignal', () => {
  it('T-SJ-001 initial value is returned on first read', () => {
    const [get] = mockSignal(0);
    expect(get()).toBe(0);
    expect(isSignal(get)).toBe(true);
    expect((get as { [SIGNAL_SYMBOL]?: true })[SIGNAL_SYMBOL]).toBe(true);
  });

  it('T-SJ-002 setter accepts a next value and updates the getter', () => {
    const [get, set] = mockSignal('a');
    set('b');
    expect(get()).toBe('b');
  });

  it('T-SJ-003 setter accepts an updater fn that receives the previous value', () => {
    const [get, set] = mockSignal(10);
    set((prev) => prev + 5);
    expect(get()).toBe(15);
  });

  it('T-SJ-004 setter is a no-op when the next value is Object.is-equal', () => {
    const [get, set] = mockSignal(42);
    const before = get();
    set(42);
    expect(get()).toBe(before);
  });

  it('T-SJ-005 NaN write is treated as equal (Object.is(NaN, NaN))', () => {
    const [get, set] = mockSignal<number>(NaN);
    const returned = set(NaN);
    expect(returned).toBe(NaN);
    expect(get()).toBe(NaN);
  });
});

describe('mockEffect', () => {
  it('T-SJ-006 body runs immediately on creation', () => {
    let runs = 0;
    const handle = mockEffect(() => {
      runs += 1;
    });
    expect(runs).toBe(1);
    expect(handle.runCount()).toBe(1);
    expect(isEffectHandle(handle)).toBe(true);
  });

  it('T-SJ-007 body re-runs when a subscribed signal writes', () => {
    const [get, set] = mockSignal(0);
    let seen = -1;
    mockEffect(() => {
      seen = get();
    });
    set(7);
    expect(seen).toBe(7);
  });

  it('T-SJ-008 trace records readValues in order', () => {
    const [get, set] = mockSignal(1);
    const handle = mockEffect(() => {
      void get();
    });
    set(2);
    set(3);
    const trace = handle.trace();
    expect(trace.map((e) => e.readValues[0])).toEqual([1, 2, 3]);
  });

  it('T-SJ-009 dispose stops future re-runs', () => {
    const [get, set] = mockSignal(0);
    let seen = 0;
    const handle = mockEffect(() => {
      seen = get();
    });
    handle.dispose();
    set(99);
    expect(seen).toBe(0);
  });

  it('T-SJ-010 batch dedups multiple writes into a single re-run', () => {
    const [getA, setA] = mockSignal('a1');
    const [getB, setB] = mockSignal('b1');
    let runs = 0;
    mockEffect(() => {
      void getA();
      void getB();
      runs += 1;
    });
    const runsAfterMount = runs;
    batch(() => {
      setA('a2');
      setB('b2');
    });
    expect(runs).toBe(runsAfterMount + 1);
  });

  it('T-SJ-011 nested batch does not double-flush', () => {
    const [get, set] = mockSignal(0);
    let runs = 0;
    mockEffect(() => {
      void get();
      runs += 1;
    });
    const runsAfterMount = runs;
    batch(() => {
      batch(() => {
        set(1);
        set(2);
      });
    });
    expect(runs).toBe(runsAfterMount + 1);
    expect(get()).toBe(2);
  });
});

describe('track', () => {
  it('T-SJ-012 captures the signal getters read inside the callback', () => {
    const [getA] = mockSignal('a');
    const [getB] = mockSignal('b');
    const { result, reads } = track(() => `${getA()}-${getB()}`);
    expect(result).toBe('a-b');
    expect(reads).toHaveLength(2);
    expect(reads[0]).toBe(getA);
    expect(reads[1]).toBe(getB);
  });

  it('T-SJ-013 nested track scopes only capture their own reads', () => {
    const [getA] = mockSignal(1);
    const [getB] = mockSignal(2);
    let innerReads: number = -1;
    const outer = track(() => {
      void getA();
      const inner = track(() => {
        void getB();
      });
      innerReads = inner.reads.length;
    });
    expect(outer.reads).toHaveLength(1);
    expect(innerReads).toBe(1);
  });
});

describe('createResourceStub', () => {
  it('T-SJ-014 initial fetch resolves and reports ready', async () => {
    const { accessor, initialFetch } = createResourceStub(async () => ({ ok: 1 }));
    expect(accessor.state).toBe('pending');
    expect(accessor.loading).toBe(true);
    await initialFetch;
    expect(accessor.state).toBe('ready');
    expect(accessor.loading).toBe(false);
    expect(accessor()).toEqual({ ok: 1 });
    expect(accessor.error).toBeUndefined();
    expect(isResourceAccessor(accessor)).toBe(true);
  });

  it('T-SJ-015 fetcher throw lands in errored state', async () => {
    const { accessor, initialFetch } = createResourceStub<number>(async () => {
      throw new Error('db down');
    });
    await initialFetch;
    expect(accessor.state).toBe('errored');
    expect((accessor.error as Error).message).toBe('db down');
    expect(accessor()).toBeUndefined();
  });

  it('T-SJ-016 refetch transitions to refreshing then ready', async () => {
    let call = 0;
    const { accessor, actions, initialFetch } = createResourceStub(async () => {
      call += 1;
      return call;
    });
    await initialFetch;
    expect(accessor()).toBe(1);
    const p = actions.refetch();
    expect(accessor.state).toBe('refreshing');
    expect(accessor.loading).toBe(true);
    const next = await p;
    expect(next).toBe(2);
    expect(accessor.state).toBe('ready');
    expect(accessor()).toBe(2);
  });

  it('T-SJ-017 mutate overwrites the value and marks ready', async () => {
    const { accessor, actions, initialFetch } = createResourceStub(async () => 'server');
    await initialFetch;
    actions.mutate('client');
    expect(accessor()).toBe('client');
    expect(accessor.state).toBe('ready');
  });

  it('T-SJ-018 latest exposes the most recent successful value even during refetch', async () => {
    let call = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { accessor, actions, initialFetch } = createResourceStub(async () => {
      call += 1;
      if (call === 1) return 'first';
      await gate;
      return 'second';
    });
    await initialFetch;
    expect(accessor.latest).toBe('first');
    const refetch = actions.refetch();
    expect(accessor.state).toBe('refreshing');
    expect(accessor.latest).toBe('first');
    release();
    await refetch;
    expect(accessor.latest).toBe('second');
  });
});
