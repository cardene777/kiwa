/**
 * skill test — state skill が主要 5 API (createStore / dispatch / subscribe / selectState / mockAction)
 * を全て公開している + 5 provider 全てで動作することを assertion する。
 */
import { describe, expect, it } from 'vitest';
import { createStore, dispatch, subscribe, selectState, mockAction } from '../../src/index.js';

describe('state skill assertions', () => {
  it('createStore を 5 provider (zustand/redux/jotai/valtio/mobx) 全てで instantiate 可能', () => {
    for (const provider of ['zustand', 'redux', 'jotai', 'valtio', 'mobx'] as const) {
      const store = createStore({ provider, initialState: { n: 0 } });
      expect(store.provider).toBe(provider);
    }
  });

  it('dispatch(reducer 経路) が prevState / nextState / version を DispatchResult に返す', () => {
    const inc = mockAction<number>('inc');
    const store = createStore<{ n: number }>({
      provider: 'redux',
      initialState: { n: 0 },
      reducer: (s, a) => (a.type === 'inc' ? { n: s.n + Number(a.payload ?? 1) } : s),
    });
    const result = dispatch(store, inc(3));
    expect(result.prevState.n).toBe(0);
    expect(result.nextState.n).toBe(3);
    expect(result.version).toBe(1);
  });

  it('subscribe が Subscription (listener / unsubscribe / callCount) を返す', () => {
    const store = createStore<{ x: number }>({ provider: 'zustand', initialState: { x: 0 } });
    const sub = subscribe(store, () => {});
    expect(typeof sub.listener).toBe('function');
    expect(typeof sub.unsubscribe).toBe('function');
    expect(typeof sub.callCount).toBe('function');
    sub.unsubscribe();
  });

  it('selectState で computed value を取得 (Zustand selector 相当)', () => {
    const store = createStore<{ items: number[] }>({ provider: 'jotai', initialState: { items: [1, 2, 3, 4] } });
    const sum = selectState(store, (s) => s.items.reduce((a, b) => a + b, 0));
    expect(sum).toBe(10);
  });

  it('mockAction が type + payload + match helper を持つ MockActionCreator を返す', () => {
    const add = mockAction<{ amount: number }>('add');
    expect(add.type).toBe('add');
    const action = add({ amount: 5 });
    expect(action.type).toBe('add');
    expect(action.payload).toEqual({ amount: 5 });
    expect(add.match(action)).toBe(true);
    expect(add.match({ type: 'other' })).toBe(false);
  });
});
