// middleware.ts — 実 Next.js middleware thin wrapper。
//
// 純粋ロジックは lib/_kiwa/auth-middleware.ts に切り出し、 kiwa の invokeMiddleware で
// direct invoke できる。 ここでは NextRequest を kiwa MiddlewareRequest に変換、
// 返り値の MiddlewareAction を NextResponse に再変換する。

import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware } from './lib/_kiwa/auth-middleware';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const headers = new Map<string, string>();
  req.headers.forEach((value, key) => headers.set(key.toLowerCase(), value));
  const cookies = new Map<string, string>();
  req.cookies.getAll().forEach((c) => cookies.set(c.name, c.value));

  const responseHeaders = new Map<string, string>();
  const responseCookies = new Map<string, string>();

  const action = await authMiddleware(
    {
      url: req.url,
      method: req.method,
      headers,
      cookies,
      nextUrl: {
        pathname: req.nextUrl.pathname,
        search: req.nextUrl.search,
        searchParams: req.nextUrl.searchParams,
      },
      geo: {},
    },
    {
      setHeader: (name: string, value: string) => responseHeaders.set(name.toLowerCase(), value),
      setCookie: (name: string, value: string) => responseCookies.set(name, value),
    },
  );

  let response: NextResponse;
  if (action.kind === 'redirect') {
    response = NextResponse.redirect(new URL(action.url!, req.url), action.status ?? 307);
  } else if (action.kind === 'rewrite') {
    response = NextResponse.rewrite(new URL(action.url!, req.url));
  } else if (action.kind === 'json') {
    response = NextResponse.json(action.body, { status: action.status ?? 200 });
  } else {
    response = NextResponse.next();
  }
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  responseCookies.forEach((value, name) => response.cookies.set(name, value));
  return response;
}

export const config = {
  matcher: ['/items/:path*', '/api/:path*'],
};
