// auth-handle.ts — kiwa-test/sveltekit の invokeHandle が direct invoke する pure handle hook。
//
// Pattern A (Dependency Injection) — 実 SvelteKit 側は src/hooks.server.ts で
// export const handle = (args) => authHandle(args) として thin wrap する。

import type { HandleFunction } from '@kiwa-lab/sveltekit';

export interface AuthLocals extends Record<string, unknown> {
  user: { id: string; role: 'admin' | 'guest' } | null;
}

/**
 * authHandle — request middleware
 *   - cookies.session === 'admin' → locals.user = { id: 'u1', role: 'admin' } を set し downstream へ
 *   - cookies.session === 'banned' → 403 を即返却 (resolve 呼ばず)
 *   - cookies.session 不在 → locals.user = null で downstream へ
 *   - downstream response に x-kiwa-handle: passed header を attach
 */
export const authHandle: HandleFunction<AuthLocals> = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  if (session === 'banned') {
    return new Response('banned', { status: 403 });
  }
  if (session === 'admin') {
    (event.locals as AuthLocals).user = { id: 'u1', role: 'admin' };
  } else {
    (event.locals as AuthLocals).user = null;
  }
  const response = await resolve(event);
  response.headers.set('x-kiwa-handle', 'passed');
  return response;
};
