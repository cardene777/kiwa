// auth.ts — pure session resolver。
//
// Pattern A (Dependency Injection) — Remix runtime の cookies / Request を直接受け取り、
// session 値 (Cookie ヘッダーから抽出) を解釈する pure 関数。 kiwa の invokeLoader / invokeAction
// 経由でも実 Remix dev server 経由でも同じ logic を共有する。

export type Role = 'admin' | 'guest' | 'banned';

export interface SessionUser {
  readonly id: string;
  readonly role: Role;
}

export function readSessionCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (cookie === null) return null;
  const match = /(?:^|;\s*)session=([^;]+)/.exec(cookie);
  return match !== null && typeof match[1] === 'string' ? decodeURIComponent(match[1]) : null;
}

export function resolveUser(request: Request): SessionUser | null {
  const session = readSessionCookie(request);
  if (session === null) return null;
  if (session === 'admin') return { id: 'u1', role: 'admin' };
  if (session === 'banned') return { id: 'u2', role: 'banned' };
  return { id: 'guest', role: 'guest' };
}
