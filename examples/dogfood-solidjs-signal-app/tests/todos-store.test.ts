import { describe, expect, it } from 'vitest';
import { createTodosStore } from '../src/store/todos.js';

describe('todos store (Signal batch + fine-grained update)', () => {
  it('T-DSSA-TS-001 empty seed emits 1 run + completedCount=0', () => {
    const store = createTodosStore([]);
    expect(store.effect.runCount()).toBe(1);
    expect(store.completedCount()).toBe(0);
    expect(store.todos()).toEqual([]);
    store.dispose();
  });

  it('T-DSSA-TS-002 add() appends 1 item + re-runs once', () => {
    const store = createTodosStore([]);
    store.add('buy milk');
    expect(store.todos().length).toBe(1);
    expect(store.effect.runCount()).toBe(2);
    store.dispose();
  });

  it('T-DSSA-TS-003 toggle() flips completed + updates completedCount', () => {
    const store = createTodosStore([]);
    store.add('write test');
    const id = store.todos()[0]!.id;
    store.toggle(id);
    expect(store.completedCount()).toBe(1);
    expect(store.todos()[0]!.completed).toBe(true);
    store.toggle(id);
    expect(store.completedCount()).toBe(0);
    store.dispose();
  });

  it('T-DSSA-TS-004 remove() drops item by id', () => {
    const store = createTodosStore([]);
    store.add('a');
    store.add('b');
    const idA = store.todos()[0]!.id;
    store.remove(idA);
    expect(store.todos().length).toBe(1);
    expect(store.todos()[0]!.title).toBe('b');
    store.dispose();
  });

  it('T-DSSA-TS-005 markAll(true) batches N writes into 1 effect run', () => {
    const store = createTodosStore([]);
    store.add('a');
    store.add('b');
    store.add('c');
    const runsBefore = store.effect.runCount();
    store.markAll(true);
    // Batch collapses to a single re-run regardless of item count.
    expect(store.effect.runCount()).toBe(runsBefore + 1);
    expect(store.completedCount()).toBe(3);
    store.dispose();
  });

  it('T-DSSA-TS-006 markAll(false) resets completed count to 0', () => {
    const store = createTodosStore([]);
    store.add('a');
    store.add('b');
    store.markAll(true);
    expect(store.completedCount()).toBe(2);
    store.markAll(false);
    expect(store.completedCount()).toBe(0);
    store.dispose();
  });
});
