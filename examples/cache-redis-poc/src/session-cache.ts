import type { CacheTestEnv } from '@kiwa-lab/cache';

/**
 * Signup-flow session cache — the sort of thing a SaaS registers when a user
 * requests a magic link. Reads / writes to the underlying kiwa CacheTestEnv,
 * emits a Pub/Sub notification on invalidation so downstream workers (e.g.
 * websocket fanout) know to drop their local caches.
 */
export interface SessionPayload {
  userId: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
}

export const SESSION_TTL_SECONDS = 900; // 15 minutes
export const SESSION_INVALIDATE_CHANNEL = 'session.invalidated';

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

export async function storeSession(
  env: CacheTestEnv,
  sessionId: string,
  payload: SessionPayload,
): Promise<void> {
  await env.set(sessionKey(sessionId), JSON.stringify(payload), {
    ttlSeconds: SESSION_TTL_SECONDS,
  });
}

export async function readSession(
  env: CacheTestEnv,
  sessionId: string,
): Promise<SessionPayload | null> {
  const raw = await env.get(sessionKey(sessionId));
  if (raw === null) return null;
  return JSON.parse(raw) as SessionPayload;
}

export async function invalidateSession(
  env: CacheTestEnv,
  sessionId: string,
): Promise<{ deleted: boolean }> {
  const removed = await env.delete(sessionKey(sessionId));
  await env.publish(
    SESSION_INVALIDATE_CHANNEL,
    JSON.stringify({ sessionId, at: 'now' }),
  );
  return { deleted: removed === 1 };
}

export async function extendSession(
  env: CacheTestEnv,
  sessionId: string,
  seconds: number,
): Promise<boolean> {
  return env.expire(sessionKey(sessionId), seconds);
}
