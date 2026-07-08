// auth.ts — pure session resolver (Pattern A 共通 DI 用)。
//
// Next.js 公式 cookies() API は server-only。 kiwa では env.cookies に inject
// される CookieJar (kiwa-test/nextjs の CookieJar 型) から session を読む。

import type { CookieJar } from '@kiwa/nextjs';

export type Role = 'admin' | 'guest' | 'banned';

export interface SessionUser {
  readonly id: string;
  readonly role: Role;
}

export function resolveUser(cookies: CookieJar): SessionUser | null {
  const session = cookies.get('session');
  if (typeof session !== 'string') return null;
  if (session === 'admin') return { id: 'u1', role: 'admin' };
  if (session === 'banned') return { id: 'u2', role: 'banned' };
  return { id: 'guest', role: 'guest' };
}

export function resolveUserFromCookieHeader(header: string | null): SessionUser | null {
  if (header === null) return null;
  const match = /(?:^|;\s*)session=([^;]+)/.exec(header);
  if (match === null || typeof match[1] !== 'string') return null;
  const session = decodeURIComponent(match[1]);
  if (session === 'admin') return { id: 'u1', role: 'admin' };
  if (session === 'banned') return { id: 'u2', role: 'banned' };
  return { id: 'guest', role: 'guest' };
}
