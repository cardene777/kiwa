/**
 * Provider-neutral auth surface for the dogfood app.
 *
 * The app talks to Supabase only through this interface. Two implementations
 * exist — {@link makeRealAdapter} (points at a real Supabase instance, e.g.
 * Supabase Local via testcontainers) and {@link makeMockAdapter} (backed by
 * `@kiwa-lab/auth`'s Supabase core + advanced envs). Both must satisfy the
 * same contract so behavioural fidelity between real vs mock can be measured
 * side-by-side and fed to `@kiwa-lab/quality-metrics`.
 */

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string | undefined;
  aal: 'aal1' | 'aal2';
}

export interface AuthUser {
  id: string;
  email: string | undefined;
  role: 'authenticated' | 'anon' | 'service_role';
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
}

export interface Doc {
  id: string;
  ownerId: string;
  title: string;
  body: string;
  createdAt: string;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface AuthAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  signUp(input: {
    email: string;
    password: string;
    userMetadata?: Record<string, unknown>;
  }): Promise<{ user: AuthUser; session: AuthSession | null }>;

  signInWithPassword(input: {
    email: string;
    password: string;
  }): Promise<AuthSession>;

  requestMagicLink(input: { email: string }): Promise<{ deliveredCode: string }>;

  consumeMagicLink(input: {
    email: string;
    code: string;
  }): Promise<AuthSession>;

  requestOAuthPkce(input: {
    provider: 'github' | 'google';
    redirectTo: string;
  }): Promise<{ code: string; codeVerifier: string }>;

  exchangeOAuthPkce(input: {
    code: string;
    codeVerifier: string;
  }): Promise<AuthSession>;

  listDocsFor(input: {
    accessToken: string;
    seedDocs: Doc[];
  }): Promise<Doc[]>;

  enrollTotp(input: {
    accessToken: string;
  }): Promise<{ factorId: string; secret: string }>;

  verifyTotpChallenge(input: {
    accessToken: string;
    factorId: string;
    code: string;
  }): Promise<{ aal: 'aal1' | 'aal2' }>;

  registerSamlIdp(input: {
    displayName: string;
    domain: string;
  }): Promise<{ idpId: string; attributeMap: { email: string } }>;

  ssoLoginWithSaml(input: {
    email: string;
    firstName: string;
    lastName: string;
    groups: string[];
  }): Promise<AuthSession>;

  siweLogin(input: {
    domain: string;
    uri: string;
    privateKey: string;
  }): Promise<{ session: AuthSession; address: string }>;

  reset(): Promise<void>;
}
