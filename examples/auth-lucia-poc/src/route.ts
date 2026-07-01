import type { LuciaTestEnv } from '@kiwa-test/auth';

/**
 * Minimal bare-metal server handler that consumes a Lucia session. Lucia is
 * framework-agnostic (Hono / Fresh / Express are all typical hosts), so the
 * PoC keeps to the Web-standard `Request` / `Response` primitives. The whole
 * sign-up / validate / sign-out loop is exercised without booting a real HTTP
 * server, which keeps the suite fast and stable in CI.
 */
export interface ProtectedProfile {
  userId: string;
  email: string;
}

export function createProtectedRoute(env: LuciaTestEnv) {
  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const sessionId =
      req.headers.get('x-session-id') ?? url.searchParams.get('session') ?? '';
    if (!sessionId) {
      return Response.json({ error: 'missing session' }, { status: 401 });
    }
    const validated = await env.validateSession(sessionId);
    if (!validated) {
      return Response.json({ error: 'invalid session' }, { status: 401 });
    }
    const body: ProtectedProfile = {
      userId: validated.user.id,
      email: validated.user.email,
    };
    // Real Lucia handlers rewrite the session cookie whenever `fresh` is true.
    // The PoC signals the same intent through a response header so tests can
    // assert on the rotation without depending on cookie parsing.
    const headers = new Headers({ 'content-type': 'application/json' });
    if (validated.session.fresh) {
      headers.set('x-session-rotated', validated.session.id);
    }
    return new Response(JSON.stringify(body), { status: 200, headers });
  };
}
