// auth-middleware.ts — middleware の pure 実装 (Pattern A)。
//
// 実 Next.js では middleware.ts で NextRequest を受け、 middlewareActions の
// kiwa helper 形式に変換して返す。 ここでは kiwa の MiddlewareFunction 型で
// 直接書き、 unit test (invokeMiddleware) と production の両方で再利用する。

import { middlewareActions, type MiddlewareFunction } from '@kiwa/nextjs';

/**
 * authMiddleware —
 *   - cookies.session === 'banned' → 403 JSON
 *   - cookies.session 不在 + pathname が '/items*' → /login へ redirect
 *   - それ以外 → next() + x-kiwa-request-id header injection
 */
export const authMiddleware: MiddlewareFunction = (req, env) => {
  const session = req.cookies.get('session');
  if (session === 'banned') {
    return middlewareActions.json({ error: 'banned' }, 403);
  }
  if (!session && req.nextUrl.pathname.startsWith('/items')) {
    return middlewareActions.redirect(`/login?from=${encodeURIComponent(req.nextUrl.pathname)}`, 307);
  }
  const requestId = req.headers.get('x-request-id') ?? 'next-default';
  env.setHeader('x-kiwa-request-id', requestId);
  return middlewareActions.next();
};
