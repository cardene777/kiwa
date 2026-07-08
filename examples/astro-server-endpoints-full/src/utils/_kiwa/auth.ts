// auth.ts — pure session resolver。
//
// Pattern A (Dependency Injection) — Astro APIContext.cookies のみを受け取り
// session 値を解釈する pure 関数。 kiwa invokeEndpoint 経由でも実 Astro dev server
// 経由でも同じ logic を共有する。

import type { SimulatedAPIContext } from '@kiwa/astro';

export type Role = 'admin' | 'guest' | 'banned';

export interface SessionUser {
  readonly id: string;
  readonly role: Role;
}

export function resolveUser(cookies: SimulatedAPIContext['cookies']): SessionUser | null {
  const session = cookies.get('session')?.value;
  if (typeof session !== 'string') return null;
  if (session === 'admin') return { id: 'u1', role: 'admin' };
  if (session === 'banned') return { id: 'u2', role: 'banned' };
  return { id: 'guest', role: 'guest' };
}
