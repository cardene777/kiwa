import type { Action } from './dispatch.js';

export interface MockActionCreator<P = unknown> {
  type: string;
  (payload?: P): Action;
  match: (action: Action) => boolean;
}

/**
 * action creator mock。 Redux Toolkit createAction 相当、 type 判定 helper (match) を含む。
 */
export function mockAction<P = unknown>(name: string): MockActionCreator<P> {
  const creator = ((payload?: P): Action => {
    if (payload === undefined) return { type: name };
    return { type: name, payload };
  }) as MockActionCreator<P>;
  creator.type = name;
  creator.match = (action: Action) => action.type === name;
  return creator;
}
