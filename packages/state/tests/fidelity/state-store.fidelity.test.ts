/**
 * fidelity test — createStore (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で create / dispatch / subscribe / selector / snapshot version 増加の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createStore,
  dispatch,
  subscribe,
  selectState,
  mockAction,
  composeMiddleware,
  createUndoRedoStack,
  createMemoryPersistence,
  createPersistedStore,
  retryWithBackoff,
} from '../../src/index.js';

function referenceStore() {
  let state = { count: 0 };
  const listeners = new Set<(s: { count: number }) => void>();
  return {
    dispatch(action: { type: string; payload?: unknown }) {
      if (action.type === 'inc') {
        state = { count: state.count + Number(action.payload ?? 1) };
        for (const l of listeners) l(state);
      }
    },
    getState() {
      return state;
    },
    subscribe(l: (s: { count: number }) => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

describe('state store fidelity vs reference impl', () => {
  it('dispatch(inc) で count が payload 分増加 (mock ↔ reference 一致)', async () => {
    const inc = mockAction<number>('inc');
    const mock = createStore<{ count: number }>({
      provider: 'redux',
      initialState: { count: 0 },
      reducer: (s, a) => (a.type === 'inc' ? { count: s.count + Number(a.payload ?? 1) } : s),
    });
    const real = referenceStore();
    const result = await assertFidelity({
      mockFn: async (delta: number) => {
        dispatch(mock, inc(delta));
        return mock.getState().count;
      },
      realFn: async (delta: number) => {
        real.dispatch(inc(delta));
        return real.getState().count;
      },
      cases: [{ name: 'inc 5', args: [5] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('subscribe が state 変更ごとに listener を呼び出す', () => {
    const store = createStore<{ n: number }>({ provider: 'zustand', initialState: { n: 0 } });
    const sub = subscribe(store, () => {});
    store.setState({ n: 1 });
    store.setState({ n: 2 });
    expect(sub.callCount()).toBe(2);
    sub.unsubscribe();
  });

  it('unsubscribe 後は listener が呼ばれない', () => {
    const store = createStore<{ n: number }>({ provider: 'jotai', initialState: { n: 0 } });
    const sub = subscribe(store, () => {});
    sub.unsubscribe();
    store.setState({ n: 5 });
    expect(sub.callCount()).toBe(0);
  });

  it('selectState が state slice を正しく抽出', () => {
    const store = createStore<{ a: number; b: string }>({ provider: 'valtio', initialState: { a: 10, b: 'x' } });
    expect(selectState(store, (s) => s.a * 2)).toBe(20);
    expect(selectState(store, (s) => s.b.toUpperCase())).toBe('X');
  });

  it('setState ごとに snapshot version が単調増加', () => {
    const store = createStore<{ x: number }>({ provider: 'mobx', initialState: { x: 0 } });
    expect(store.getSnapshot().version).toBe(0);
    store.setState({ x: 1 });
    expect(store.getSnapshot().version).toBe(1);
    store.setState({ x: 2 });
    expect(store.getSnapshot().version).toBe(2);
  });

  // v2.1 追加 5 case
  it('v2.1 undo/redo stack で push → undo で戻る', () => {
    const stack = createUndoRedoStack<number>(0);
    stack.push(1);
    stack.push(2);
    expect(stack.undo()).toBe(1);
    expect(stack.undo()).toBe(0);
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(true);
    expect(stack.redo()).toBe(1);
  });

  it('v2.1 memory persistence で save → restore round-trip', async () => {
    const adapter = createMemoryPersistence();
    const persisted = createPersistedStore<{ count: number }>('state1', adapter);
    await persisted.save({ count: 42 });
    const restored = await persisted.restore();
    expect(restored?.count).toBe(42);
    await persisted.clear();
    expect(await persisted.restore()).toBeUndefined();
  });

  it('v2.1 composeMiddleware で 2 middleware chain', () => {
    const middleware = composeMiddleware<{ x: number }>(
      (state, _action, next) => next(),
      (state, _action, next) => next(),
    );
    const result = middleware({ x: 1 }, { type: 'noop' }, () => ({ x: 99 }));
    expect(result.x).toBe(99);
  });

  it('v2.1 retryWithBackoff で 2 attempt 成功', async () => {
    let n = 0;
    const r = await retryWithBackoff(async () => {
      n += 1;
      if (n < 2) throw new Error('r');
      return 'ok';
    }, { maxAttempts: 3, initialDelayMs: 1 });
    expect(r.attempts).toBe(2);
    expect(r.ok).toBe(true);
  });

  it('v2.1 undo/redo size + clear', () => {
    const stack = createUndoRedoStack<string>('a');
    stack.push('b');
    stack.push('c');
    expect(stack.size().past).toBe(2);
    stack.clear();
    expect(stack.size().past).toBe(0);
    expect(stack.size().future).toBe(0);
  });
});
