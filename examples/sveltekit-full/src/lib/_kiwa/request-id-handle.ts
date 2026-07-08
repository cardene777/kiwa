// request-id-handle.ts — request 毎の `requestId` を locals に注入する handle hook。
//
// chain (sequence) の前段に置いて downstream handle (authHandle) に requestId を
// 流す PoC。 `crypto.randomUUID()` 依存を避けるため counter ベース + seed 経由で
// deterministic に挙動再現可能。 SvelteKit 公式 hooks.server.ts では typically
// `sequence(requestIdHandle, authHandle)` の形で組み合わせる。

import type { HandleFunction } from '@kiwa/sveltekit';
import type { AuthLocals } from './auth-handle.js';

export interface RequestIdLocals extends AuthLocals {
  requestId: string;
}

let counter = 0;
export function resetRequestIdCounter(seed = 0): void {
  counter = seed;
}

export const requestIdHandle: HandleFunction<RequestIdLocals> = async ({ event, resolve }) => {
  counter += 1;
  (event.locals as RequestIdLocals).requestId = `req-${counter}`;
  const response = await resolve(event);
  response.headers.set('x-request-id', (event.locals as RequestIdLocals).requestId);
  return response;
};
