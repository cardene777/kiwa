/**
 * Next.js 15 edge-runtime middleware — inspects Accept-Language + geo IP
 * headers and returns the resolved region and language for the downstream
 * route handlers. In a real Vercel deployment this runs at every POP; the
 * mock reproduces the header parsing + region resolution logic without a
 * live Vercel runtime.
 *
 * The middleware is stateless — it only inspects the request and returns
 * routing metadata. It does not touch KV or open streams; those live in
 * the route handlers below `src/app/api/`.
 *
 * Vercel exposes 3 pieces of geographic metadata via request headers:
 *  - `x-vercel-ip-country`  — 2-letter ISO country code
 *  - `x-vercel-ip-city`     — POP city name
 *  - `x-vercel-ip-region`   — subdivision (state / prefecture)
 *
 * When these headers are absent (local dev, non-Vercel deployment) the
 * middleware falls back to Accept-Language, then to the default region.
 */

import { resolveRegion } from './lib/vercel-adapter.js';

export const config = {
  matcher: ['/api/:path*'],
  runtime: 'edge' as const,
};

export interface EdgeRequest {
  readonly headers: Record<string, string>;
  readonly url: string;
  readonly method: string;
}

export interface EdgeMiddlewareResult {
  readonly region: string;
  readonly language: string;
  readonly fellBack: boolean;
  readonly headers: Record<string, string>;
}

/**
 * Parse Vercel geo headers + Accept-Language, resolve a region, return
 * routing metadata. Callers (`middleware.ts` in real Next.js, tests here)
 * pass a plain request object rather than a `Request` instance so the
 * mock stays runtime-agnostic.
 */
export function runMiddleware(request: EdgeRequest): EdgeMiddlewareResult {
  const acceptLanguage = getHeader(request, 'accept-language') ?? 'en';
  const clientCountry =
    getHeader(request, 'x-vercel-ip-country') ??
    getHeader(request, 'cf-ipcountry') ??
    '';
  const { region, fellBack } = resolveRegion({
    acceptLanguage,
    clientCountry,
  });
  const language = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase() ?? 'en';
  const headers: Record<string, string> = {
    'x-kiwa-region': region,
    'x-kiwa-language': language,
    'x-kiwa-fell-back': fellBack ? '1' : '0',
  };
  return { region, language, fellBack, headers };
}

/**
 * Case-insensitive header lookup — Vercel normalises header names to
 * lower-case; the mock does not, so both cases are checked.
 */
function getHeader(request: EdgeRequest, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(request.headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}
