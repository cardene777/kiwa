import type { StateStore } from './client.js';

export type Selector<S extends object, R> = (state: S) => R;

/**
 * store から state slice を抽出。 Zustand selector / Redux useSelector / Jotai atom read /
 * Valtio snapshot read / MobX computed 相当。
 */
export function selectState<S extends object, R>(store: StateStore<S>, selector: Selector<S, R>): R {
  return selector(store.getState());
}
