import type { Auth0TestEnv } from '@kiwa-lab/auth';

/**
 * Minimal Auth0-gated server handler that mirrors what real Auth0 middleware
 * (`express-jwt` + `jwks-rsa`, or `@auth0/nextjs-auth0`) does at the edge:
 * (1) pull the bearer token off `Authorization`, (2) verify it against the
 * tenant JWKS, (3) resolve the caller's profile. The PoC swaps the tenant
 * with the mock env's `verifyAccessToken` + `verifyIdToken` and asserts the
 * same 401 / 403 / 200 branches consumers gate on in prod.
 *
 * The admin variant additionally enforces an `https://kiwa.test/roles` custom
 * claim — the same pattern used by projects that inject role claims from a
 * rule / action pipeline.
 */
export interface ProtectedProfile {
  userId: string;
  email: string;
  roles?: string[] | undefined;
}

const ROLES_CLAIM = 'https://kiwa.test/roles';

export function createProtectedRoute(env: Auth0TestEnv) {
  return async function handler(req: Request): Promise<Response> {
    const authorization = req.headers.get('authorization') ?? '';
    const bearer = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    if (!bearer) {
      return Response.json({ error: 'missing token' }, { status: 401 });
    }
    let claims;
    try {
      claims = await env.verifyAccessToken(bearer);
    } catch (err) {
      return Response.json(
        { error: 'invalid token', reason: (err as Error).message },
        { status: 401 },
      );
    }
    const user = await env.users.get(claims.sub).catch(() => null);
    if (!user) {
      return Response.json({ error: 'user not found' }, { status: 401 });
    }
    const body: ProtectedProfile = {
      userId: user.user_id,
      email: user.email,
    };
    const rolesClaim = claims[ROLES_CLAIM];
    if (Array.isArray(rolesClaim)) body.roles = rolesClaim as string[];
    return Response.json(body, { status: 200 });
  };
}

/**
 * Admin-only variant. Consumers wire this in front of `/api/admin/*` routes
 * and rely on the `https://kiwa.test/roles` custom claim populated by a
 * post-login action. Returns 403 when the caller is authenticated but does
 * not carry the `admin` role.
 */
export function createAdminRoute(env: Auth0TestEnv) {
  const protectedRoute = createProtectedRoute(env);
  return async function handler(req: Request): Promise<Response> {
    const res = await protectedRoute(req);
    if (res.status !== 200) return res;
    const body = (await res.json()) as ProtectedProfile;
    const roles = body.roles ?? [];
    if (!roles.includes('admin')) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    return Response.json(body, { status: 200 });
  };
}
