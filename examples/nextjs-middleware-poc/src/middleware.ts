// Next.js middleware test PoC for kiwa (Issue #495).
//
// In a real app this file would live at the repo root as `middleware.ts` and
// would import from 'next/server'. We omit those imports here so the PoC stays
// a pure Vitest workspace — the runtime shape of the return values is identical
// to what production code would produce via NextResponse.

import { middlewareActions, type MiddlewareFunction } from '@kiwa-test/nextjs';

// Auth gate: redirect unauthenticated requests to /login, but always allow /api/*.
export const authGate: MiddlewareFunction = async (req) => {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return middlewareActions.next();
  }
  if (!req.cookies.get('session')) {
    return middlewareActions.redirect('/login');
  }
  return middlewareActions.next();
};

// Locale rewrite: prefix the visible URL with the user's locale cookie.
export const localeRewrite: MiddlewareFunction = async (req) => {
  const locale = req.cookies.get('locale') ?? 'en';
  if (req.nextUrl.pathname.startsWith(`/${locale}`)) {
    return middlewareActions.next();
  }
  return middlewareActions.rewrite(`/${locale}${req.nextUrl.pathname}`);
};

// Header inject: add security headers + a per-request id.
export const headerInject: MiddlewareFunction = async (_req, env) => {
  env.setHeader('X-Frame-Options', 'DENY');
  env.setHeader('X-Content-Type-Options', 'nosniff');
  env.setHeader('Referrer-Policy', 'same-origin');
  return middlewareActions.next();
};
