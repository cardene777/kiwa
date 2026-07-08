import type { ClerkTestEnv } from '@kiwa/auth';

/**
 * Minimal server handler that mirrors Clerk's real Next.js middleware +
 * `auth()` helper. Real integrations delegate token verification to
 * `@clerk/backend`'s `verifyToken`; the PoC swaps in the mock env's
 * `verifyToken` and asserts the same code paths (missing token → 401,
 * invalid token → 401, valid token → 200 + user profile). The org-scoped
 * variant additionally enforces membership by comparing `org_role` in the
 * decoded claims — matching how consumers gate admin routes at the edge.
 */
export interface ProtectedProfile {
  userId: string;
  primaryEmailAddress: string;
  activeOrganizationId?: string | undefined;
  organizationRole?: string | undefined;
}

export function createProtectedRoute(env: ClerkTestEnv) {
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
      claims = await env.verifyToken(bearer);
    } catch (err) {
      return Response.json(
        { error: 'invalid token', reason: (err as Error).message },
        { status: 401 },
      );
    }
    const user = await env.users.getUser(claims.sub).catch(() => null);
    if (!user) {
      return Response.json({ error: 'user not found' }, { status: 401 });
    }
    const body: ProtectedProfile = {
      userId: user.id,
      primaryEmailAddress: user.primaryEmailAddress,
    };
    if (claims.org_id !== undefined) body.activeOrganizationId = claims.org_id;
    if (claims.org_role !== undefined) body.organizationRole = claims.org_role;
    return Response.json(body, { status: 200 });
  };
}

/**
 * Admin-only variant. Consumers wire this in front of `/api/admin/*` routes
 * and rely on Clerk's `org_role` claim to gate access. Returns 403 when the
 * caller is authenticated but not `admin` / `owner`.
 */
export function createAdminRoute(env: ClerkTestEnv) {
  const protectedRoute = createProtectedRoute(env);
  return async function handler(req: Request): Promise<Response> {
    const res = await protectedRoute(req);
    if (res.status !== 200) return res;
    const body = (await res.json()) as ProtectedProfile;
    if (body.organizationRole !== 'admin' && body.organizationRole !== 'owner') {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    return Response.json(body, { status: 200 });
  };
}
