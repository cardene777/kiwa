import { describe, expect, it } from 'vitest';
import { createCounterStore } from '../src/store/counter.js';

describe('counter store (Signal + Effect)', () => {
  it('T-DSSA-CS-001 initial mount emits 1 effect run + observed=[initial]', () => {
    const store = createCounterStore(0);
    expect(store.effect.runCount()).toBe(1);
    expect(store.observed()).toEqual([0]);
    store.dispose();
  });

  it('T-DSSA-CS-002 increment(1) re-runs effect once + appends value', () => {
    const store = createCounterStore(0);
    store.increment(1);
    expect(store.count()).toBe(1);
    expect(store.effect.runCount()).toBe(2);
    expect(store.observed()).toEqual([0, 1]);
    store.dispose();
  });

  it('T-DSSA-CS-003 3 increments produce ordered trace + runCount=4', () => {
    const store = createCounterStore(0);
    store.increment(1);
    store.increment(1);
    store.increment(1);
    expect(store.count()).toBe(3);
    expect(store.effect.runCount()).toBe(4);
    expect(store.observed()).toEqual([0, 1, 2, 3]);
    store.dispose();
  });

  it('T-DSSA-CS-004 reset() jumps observed to [..., 0]', () => {
    const store = createCounterStore(5);
    store.increment(3);
    store.reset();
    expect(store.count()).toBe(0);
    const values = store.observed();
    expect(values[0]).toBe(5);
    expect(values[values.length - 1]).toBe(0);
    store.dispose();
  });

  it('T-DSSA-CS-005 write with identical value short-circuits (Object.is)', () => {
    const store = createCounterStore(0);
    const baseRuns = store.effect.runCount();
    store.setCount(0);
    // No new run because the value did not change.
    expect(store.effect.runCount()).toBe(baseRuns);
    store.dispose();
  });

  it('T-DSSA-CS-006 dispose() stops future re-runs', () => {
    const store = createCounterStore(0);
    store.dispose();
    const beforeRuns = store.effect.runCount();
    store.increment(1);
    expect(store.effect.runCount()).toBe(beforeRuns);
    // Value itself still updates because the setter is external.
    expect(store.count()).toBe(1);
  });
});
