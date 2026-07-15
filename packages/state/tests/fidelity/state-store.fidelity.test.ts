/**
 * fidelity test — createStore (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で create / dispatch / subscribe / selector / snapshot version 増加の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createStore, dispatch, subscribe, selectState, mockAction } from '../../src/index.js';

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
});
