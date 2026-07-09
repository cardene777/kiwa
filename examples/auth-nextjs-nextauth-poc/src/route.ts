import type { NextAuthTestEnv } from '@kiwa-lab/auth';

/**
 * Minimal Next.js App Router style handler that consumes a NextAuth session.
 * The PoC feeds the handler through `@kiwa-lab/auth` so we can verify the
 * whole sign-in / session / sign-out loop without booting Next.js.
 */
export interface ProtectedProfile {
  userId: string;
  email: string;
  name?: string | undefined;
}

export function createProtectedRoute(env: NextAuthTestEnv) {
  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const sessionToken =
      req.headers.get('x-session-token') ?? url.searchParams.get('token') ?? '';
    if (!sessionToken) {
      return Response.json({ error: 'missing session token' }, { status: 401 });
    }
    const session = await env.getSession(sessionToken);
    if (!session) {
      return Response.json({ error: 'invalid session' }, { status: 401 });
    }
    const body: ProtectedProfile = {
      userId: session.user.id,
      email: session.user.email,
      ...(session.user.name !== undefined ? { name: session.user.name } : {}),
    };
    return Response.json(body, { status: 200 });
  };
}
