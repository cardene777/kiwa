import type { StateStore } from './client.js';

export interface Action {
  type: string;
  payload?: unknown;
}

export interface DispatchResult<S extends object> {
  action: Action;
  prevState: S;
  nextState: S;
  version: number;
}

/**
 * provider 別 dispatch。 Redux reducer / Zustand setState / Jotai atom write /
 * Valtio proxy mutation / MobX action の 5 経路を統一 interface で叩く。
 */
export function dispatch<S extends object>(store: StateStore<S>, action: Action): DispatchResult<S> {
  const prevState = { ...store.getState() };
  if (store._reducer) {
    const nextState = store._reducer(prevState, action);
    store.setState(nextState);
  } else {
    // 非 reducer 経路 = payload を直接 merge (Zustand set / Valtio proxy 相当)
    if (action.payload && typeof action.payload === 'object') {
      store.setState(action.payload as Partial<S>);
    } else {
      store._incrementVersion();
      store._notify();
    }
  }
  return {
    action,
    prevState,
    nextState: { ...store.getState() },
    version: store.getSnapshot().version,
  };
}
