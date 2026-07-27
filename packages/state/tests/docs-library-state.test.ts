import { describe, expect, it } from 'vitest';
import {
  createMemoryPersistence,
  createPersistedStore,
  createStore,
  dispatch,
  mockAction,
  subscribe,
} from '../src/index.js';

describe('library documentation state recipes', () => {
  it('updates state, notifies once, and recognizes a reset action', () => {
    const add = mockAction<number>('add');
    const reset = mockAction('reset');
    const store = createStore({
      provider: 'redux',
      initialState: { count: 0 },
      reducer: (state, action) => action.type === add.type ? { count: state.count + Number(action.payload) } : state,
    });
    const seen: number[] = [];
    const subscription = subscribe(store, (state) => seen.push(state.count));

    const result = dispatch(store, add(3));
    subscription.unsubscribe();

    expect(result).toMatchObject({ prevState: { count: 0 }, nextState: { count: 3 }, version: 1 });
    expect(seen).toEqual([3]);
    expect(subscription.callCount()).toBe(1);
    expect(reset()).toEqual({ type: 'reset' });
  });

  it('keeps actions separate and stops a subscription after unsubscribe', () => {
    const setUser = mockAction<{ name: string }>('setUser');
    const setTheme = mockAction<string>('setTheme');
    const reducerStore = createStore({
      provider: 'redux',
      initialState: { user: '', theme: 'light' },
      reducer: (state, action) => {
        if (setUser.match(action)) {
          const payload = action.payload as { name: string };
          return { ...state, user: payload.name };
        }
        if (setTheme.match(action)) return { ...state, theme: String(action.payload) };
        return state;
      },
    });
    dispatch(reducerStore, setUser({ name: 'kiwa' }));
    dispatch(reducerStore, setTheme('dark'));
    const store = createStore({ provider: 'zustand', initialState: { count: 0 } });
    const calls: number[] = [];
    const subscription = subscribe(store, (state) => calls.push(state.count));
    store.setState({ count: 1 });
    subscription.unsubscribe();
    store.setState({ count: 2 });

    expect(reducerStore.getState()).toEqual({ user: 'kiwa', theme: 'dark' });
    expect(calls).toEqual([1]);
  });

  it('restores and clears an in-memory persisted value', async () => {
    const persistence = createMemoryPersistence();
    const cart = createPersistedStore<{ count: number }>('cart', persistence);

    await cart.save({ count: 2 });
    expect(await cart.restore()).toEqual({ count: 2 });
    await cart.clear();
    expect(await cart.restore()).toBeUndefined();
  });
});
