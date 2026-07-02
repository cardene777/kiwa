import type {
  AuthAdapter,
  AuthSession,
  AuthUser,
  Doc,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — points at a running Supabase instance. In the v1.11-2
 * scope this is Supabase Local (started via `supabase start` / testcontainers).
 * When `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` are
 * not set, {@link makeRealAdapter} returns a `skipped` adapter whose methods
 * throw a distinguished error. Tests use `isReal()` to short-circuit
 * gracefully — the fidelity report captures "environment absent" rather than
 * failing the whole suite in CI.
 *
 * The real HTTP driving is deliberately kept minimal (fetch against the
 * Supabase REST API surface). The point of this adapter is not to fully
 * reimplement Supabase — it is to compare the *observable behaviour* of a
 * few key methods against the kiwa mock adapter and count divergences.
 */

export interface RealAdapterEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return null;
  return { url, anonKey: anon, serviceRoleKey: service };
}

export async function makeRealAdapter(): Promise<AuthAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

/**
 * When Supabase Local is not running, the adapter reports `mode: 'real'`
 * but every method throws a distinguished `SkippedError` so tests can
 * detect the condition and count as "skipped" in the fidelity report.
 */
export class SkippedError extends Error {
  readonly code = 'SUPABASE_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are not set`,
    );
  }
}

function makeSkippedRealAdapter(): AuthAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'SUPABASE_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    signUp: async () => unsupported('signUp'),
    signInWithPassword: async () => unsupported('signInWithPassword'),
    requestMagicLink: async () => unsupported('requestMagicLink'),
    consumeMagicLink: async () => unsupported('consumeMagicLink'),
    requestOAuthPkce: async () => unsupported('requestOAuthPkce'),
    exchangeOAuthPkce: async () => unsupported('exchangeOAuthPkce'),
    listDocsFor: async () => unsupported('listDocsFor'),
    enrollTotp: async () => unsupported('enrollTotp'),
    verifyTotpChallenge: async () => unsupported('verifyTotpChallenge'),
    registerSamlIdp: async () => unsupported('registerSamlIdp'),
    ssoLoginWithSaml: async () => unsupported('ssoLoginWithSaml'),
    siweLogin: async () => unsupported('siweLogin'),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Connected real adapter — real HTTP against Supabase Local. Only the
 * methods v1.11-2 needs are implemented; the rest fall back to the
 * skipped-error path so unimplemented gaps still register as divergences.
 */
function makeConnectedRealAdapter(env: RealAdapterEnv): AuthAdapter {
  const trace: TraceEvent[] = [];

  async function callAuthApi<T>(
    path: string,
    init: RequestInit,
    op: string,
  ): Promise<T> {
    const url = `${env.url.replace(/\/$/, '')}${path}`;
    const headers = new Headers(init.headers ?? {});
    if (!headers.has('apikey')) headers.set('apikey', env.anonKey);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      const body = await res.text();
      trace.push({ op, ok: false, errorKind: `HTTP ${res.status}: ${body}` });
      throw new Error(`Supabase ${op} failed: ${res.status} ${body}`);
    }
    trace.push({ op, ok: true });
    return (await res.json()) as T;
  }

  function toUser(raw: {
    id: string;
    email?: string;
    role?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }): AuthUser {
    return {
      id: raw.id,
      email: raw.email,
      role: (raw.role as AuthUser['role']) ?? 'authenticated',
      appMetadata: raw.app_metadata ?? {},
      userMetadata: raw.user_metadata ?? {},
    };
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async signUp(input) {
      const raw = await callAuthApi<{
        user: { id: string; email: string };
        session: null | { access_token: string; refresh_token: string };
      }>('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          data: input.userMetadata,
        }),
      }, 'signUp');
      return {
        user: toUser(raw.user),
        session: raw.session
          ? {
              accessToken: raw.session.access_token,
              refreshToken: raw.session.refresh_token,
              userId: raw.user.id,
              email: raw.user.email,
              aal: 'aal1',
            }
          : null,
      };
    },

    async signInWithPassword(input) {
      const raw = await callAuthApi<{
        access_token: string;
        refresh_token: string;
        user: { id: string; email: string };
      }>('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: input.email, password: input.password }),
      }, 'signInWithPassword');
      return {
        accessToken: raw.access_token,
        refreshToken: raw.refresh_token,
        userId: raw.user.id,
        email: raw.user.email,
        aal: 'aal1',
      };
    },

    async requestMagicLink(input) {
      // Supabase does not return the OTP; tests either short-circuit or
      // inspect the mailbox. For the fidelity harness we surface an empty
      // string + a divergence marker.
      await callAuthApi('/auth/v1/otp', {
        method: 'POST',
        body: JSON.stringify({ email: input.email, create_user: true }),
      }, 'requestMagicLink');
      trace.push({
        op: 'requestMagicLink.divergence',
        ok: false,
        errorKind: 'REAL_ADAPTER_CANNOT_INTROSPECT_OTP',
      });
      return { deliveredCode: '' };
    },

    consumeMagicLink: notImplemented('consumeMagicLink', trace),
    requestOAuthPkce: notImplemented('requestOAuthPkce', trace),
    exchangeOAuthPkce: notImplemented('exchangeOAuthPkce', trace),
    listDocsFor: notImplemented('listDocsFor', trace),
    enrollTotp: notImplemented('enrollTotp', trace),
    verifyTotpChallenge: notImplemented('verifyTotpChallenge', trace),
    registerSamlIdp: notImplemented('registerSamlIdp', trace),
    ssoLoginWithSaml: notImplemented('ssoLoginWithSaml', trace),
    siweLogin: notImplemented('siweLogin', trace),

    async reset() {
      trace.length = 0;
    },
  };
}

function notImplemented<TArgs extends unknown[], TRet>(op: string, trace: TraceEvent[]): (...args: TArgs) => Promise<TRet> {
  return async () => {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    throw new Error(`Real adapter for '${op}' is not implemented in the v1.11-2 scope`);
  };
}

/** Convenience for tests — a seed of realistic docs owned by different users. */
export function seedDocsFor(ownerId: string): Doc[] {
  return [
    {
      id: 'd1',
      ownerId,
      title: 'Owned doc',
      body: 'This belongs to me',
      createdAt: '2026-07-02T00:00:00Z',
    },
    {
      id: 'd2',
      ownerId: 'someone-else',
      title: "Someone else's doc",
      body: 'Should not be visible',
      createdAt: '2026-07-02T00:00:00Z',
    },
  ];
}
