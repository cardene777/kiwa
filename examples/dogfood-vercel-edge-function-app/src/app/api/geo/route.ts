/**
 * `/api/geo` route handler — reports the resolved region for the caller.
 * The middleware sets `x-kiwa-region`; this handler echoes the region +
 * language back to the client. Failure mode: when the middleware could
 * not resolve a country + language pair, the response uses the default
 * region and sets `fellBack` on the payload.
 *
 * In a real Vercel deployment this endpoint proves the middleware
 * augmentation works end-to-end; the dogfood harness drives the geo axis
 * mock instead of a live request but the payload shape is identical.
 */

import { runMiddleware, type EdgeRequest } from '../../../middleware.js';

export const runtime = 'edge';

export interface GeoRoutePayload {
  ok: boolean;
  region: string;
  language: string;
  fellBack: boolean;
  requestId: string;
}

/**
 * Route entrypoint. Real Next.js 15 hands `Request`; the mock hands a
 * plain object with `headers` + `url`. Both branches converge on the
 * middleware result.
 */
export function handleGeo(request: EdgeRequest, requestId: string): {
  status: number;
  headers: Record<string, string>;
  body: GeoRoutePayload;
} {
  const middleware = runMiddleware(request);
  return {
    status: 200,
    headers: middleware.headers,
    body: {
      ok: true,
      region: middleware.region,
      language: middleware.language,
      fellBack: middleware.fellBack,
      requestId,
    },
  };
}
