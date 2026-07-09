import type { BetterAuthTestEnv } from '@kiwa-lab/auth';

/**
 * Minimal bare-metal server handler that consumes a Better Auth session token.
 * Better Auth's real integration ships helpers for Next.js, SvelteKit, Astro,
 * etc., but at the wire level every handler resolves the session by looking up
 * the `Bearer` / cookie token — the PoC keeps to Web-standard `Request` /
 * `Response` primitives so the suite is fast and stable in CI without booting
 * a real HTTP server.
 */
export interface ProtectedProfile {
  userId: string;
  email: string;
  emailVerified: boolean;
}

export function createProtectedRoute(env: BetterAuthTestEnv) {
  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const authorization = req.headers.get('authorization') ?? '';
    const bearer = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    const token = bearer || url.searchParams.get('token') || '';
    if (!token) {
      return Response.json({ error: 'missing token' }, { status: 401 });
    }
    const validated = await env.validateSession(token);
    if (!validated) {
      return Response.json({ error: 'invalid token' }, { status: 401 });
    }
    const body: ProtectedProfile = {
      userId: validated.user.id,
      email: validated.user.email,
      emailVerified: validated.user.emailVerified,
    };
    return Response.json(body, { status: 200 });
  };
}
