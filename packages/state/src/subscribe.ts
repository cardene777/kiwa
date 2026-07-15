import type { StateStore } from './client.js';

export type Unsubscribe = () => void;
export type StateListener<S extends object> = (state: S) => void;

export interface Subscription<S extends object> {
  listener: StateListener<S>;
  unsubscribe: Unsubscribe;
  callCount: () => number;
}

/**
 * store の state 変更に listener を登録。 unsubscribe 関数と callCount helper を返却。
 * Redux subscribe / Zustand subscribe / Jotai atom subscribe / Valtio subscribe / MobX autorun 相当。
 */
export function subscribe<S extends object>(store: StateStore<S>, listener: StateListener<S>): Subscription<S> {
  let calls = 0;
  const wrapped: StateListener<S> = (state) => {
    calls += 1;
    listener(state);
  };
  const unsubscribe = store._addSubscriber(wrapped);
  return {
    listener: wrapped,
    unsubscribe,
    callCount: () => calls,
  };
}
