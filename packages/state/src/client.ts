import type { StateListener, Unsubscribe } from './subscribe.js';

export type StateProvider = 'zustand' | 'redux' | 'jotai' | 'valtio' | 'mobx';

export interface StateStoreOptions<S extends object> {
  provider?: StateProvider;
  initialState: S;
  reducer?: (state: S, action: { type: string; payload?: unknown }) => S;
}

export interface StateSnapshot<S extends object> {
  provider: StateProvider;
  state: S;
  version: number;
}

export interface StateStore<S extends object> {
  provider: StateProvider;
  getState: () => S;
  setState: (updater: Partial<S> | ((prev: S) => Partial<S>)) => void;
  getSnapshot: () => StateSnapshot<S>;
  _subscribers: Set<StateListener<S>>;
  _reducer?: (state: S, action: { type: string; payload?: unknown }) => S;
  _addSubscriber: (listener: StateListener<S>) => Unsubscribe;
  _notify: () => void;
  _incrementVersion: () => void;
}

export function createStore<S extends object>(options: StateStoreOptions<S>): StateStore<S> {
  const provider = options.provider ?? 'zustand';
  let state: S = { ...options.initialState };
  let version = 0;
  const subscribers = new Set<StateListener<S>>();

  const store: StateStore<S> = {
    provider,
    getState() {
      return state;
    },
    setState(updater) {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...patch };
      version += 1;
      store._notify();
    },
    getSnapshot() {
      return { provider, state, version };
    },
    _subscribers: subscribers,
    _addSubscriber(listener) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    _notify() {
      for (const listener of subscribers) {
        listener(state);
      }
    },
    _incrementVersion() {
      version += 1;
    },
  };
  if (options.reducer !== undefined) {
    store._reducer = options.reducer;
  }
  return store;
}
