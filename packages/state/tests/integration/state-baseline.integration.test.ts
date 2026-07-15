/**
 * integration test — state domain の end-to-end workflow (create → dispatch → subscribe →
 * unsubscribe → snapshot 検証) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import { createStore, dispatch, subscribe, selectState, mockAction } from '../../src/index.js';

describe('state integration — store workflow', () => {
  it('T-INT-S-001 counter store で inc/dec dispatch + subscribe が正しく通る', () => {
    const inc = mockAction<number>('inc');
    const dec = mockAction<number>('dec');
    const store = createStore<{ count: number }>({
      provider: 'redux',
      initialState: { count: 0 },
      reducer: (s, a) => {
        if (a.type === 'inc') return { count: s.count + Number(a.payload ?? 1) };
        if (a.type === 'dec') return { count: s.count - Number(a.payload ?? 1) };
        return s;
      },
    });
    const sub = subscribe(store, () => {});
    dispatch(store, inc(5));
    dispatch(store, inc(3));
    dispatch(store, dec(2));
    expect(store.getState().count).toBe(6);
    expect(sub.callCount()).toBe(3);
    sub.unsubscribe();
  });

  it('T-INT-S-002 複数 subscribe が全て通知を受け取る', () => {
    const store = createStore<{ n: number }>({ provider: 'zustand', initialState: { n: 0 } });
    const subs = [subscribe(store, () => {}), subscribe(store, () => {}), subscribe(store, () => {})];
    store.setState({ n: 1 });
    for (const s of subs) expect(s.callCount()).toBe(1);
    for (const s of subs) s.unsubscribe();
  });

  it('T-INT-S-003 setState の function updater で prev 参照可能', () => {
    const store = createStore<{ arr: number[] }>({ provider: 'valtio', initialState: { arr: [1, 2] } });
    store.setState((prev) => ({ arr: [...prev.arr, 3] }));
    expect(store.getState().arr).toEqual([1, 2, 3]);
  });

  it('T-INT-S-004 mockAction.match で action filtering が可能 (Redux Toolkit 相当)', () => {
    const setUser = mockAction<{ name: string }>('setUser');
    const setTheme = mockAction<string>('setTheme');
    const store = createStore<{ user: string; theme: string }>({
      provider: 'redux',
      initialState: { user: '', theme: 'light' },
      reducer: (s, a) => {
        if (setUser.match(a)) return { ...s, user: (a.payload as { name: string }).name };
        if (setTheme.match(a)) return { ...s, theme: String(a.payload) };
        return s;
      },
    });
    dispatch(store, setUser({ name: 'kiwa' }));
    dispatch(store, setTheme('dark'));
    expect(store.getState()).toEqual({ user: 'kiwa', theme: 'dark' });
  });

  it('T-INT-S-005 selector で computed slice + snapshot version 追跡', () => {
    const store = createStore<{ items: { price: number }[] }>({
      provider: 'jotai',
      initialState: { items: [{ price: 100 }, { price: 200 }] },
    });
    const total = () => selectState(store, (s) => s.items.reduce((a, i) => a + i.price, 0));
    expect(total()).toBe(300);
    expect(store.getSnapshot().version).toBe(0);
    store.setState({ items: [{ price: 500 }] });
    expect(total()).toBe(500);
    expect(store.getSnapshot().version).toBe(1);
  });
});
