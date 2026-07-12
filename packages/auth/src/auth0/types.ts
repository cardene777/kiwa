import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * Auth0 exposes two APIs — Management API (`auth0` node SDK's `ManagementClient`)
 * for tenant-level CRUD (users / clients / actions / rules), and Authentication API
 * (`AuthenticationClient`) for login / signup / token exchange. The mock mirrors
 * both surfaces so a suite can swap the real clients with the mock and drive the
 * same code paths without hitting the tenant.
 *
 * Auth0 issues two tokens per login — an `id_token` (OIDC standard claims, RS256
 * in prod, HS256 in the mock) and an `access_token` (JWT with the API audience
 * for backend gate checks). The mock signs both with the same per-env secret
 * and exposes a `verifyIdToken` + `verifyAccessToken` helper that matches
 * `express-jwt` / `jose` style verification in real projects.
 */

/**
 * Auth0's user identity — the real profile carries dozens of fields; the mock
 * covers what tests assert against (email + email_verified + connection +
 * identities + app_metadata + user_metadata + Auth0's opaque `user_id` and the
 * `sub` claim shape `<connection>|<connection_user_id>`).
 */
export type Auth0Connection =
  | 'Username-Password-Authentication'
  | 'google-oauth2'
  | 'github'
  | 'auth0'
  | 'sms'
  | 'email';

export const AUTH0_CONNECTIONS: readonly Auth0Connection[] = [
  'Username-Password-Authentication',
  'google-oauth2',
  'github',
  'auth0',
  'sms',
  'email',
];

export function isAuth0Connection(value: string): value is Auth0Connection {
  return AUTH0_CONNECTIONS.includes(value as Auth0Connection);
}

export interface Auth0Identity {
  /** Provider name — same taxonomy as the connection. */
  provider: Auth0Connection;
  /** Provider-side user id (the part after `|` in `sub`). */
  user_id: string;
  connection: string;
  isSocial: boolean;
}

export interface Auth0User {
  /** Auth0's user id — matches `sub` claim shape (`connection|providerUserId`). */
  user_id: string;
  email: string;
  email_verified: boolean;
  name?: string | undefined;
  nickname?: string | undefined;
  picture?: string | undefined;
  /** Primary connection the user was created in (Username-Password / google-oauth2 / etc). */
  connection: Auth0Connection;
  /** All linked identities (Auth0's account-linking surface). */
  identities: Auth0Identity[];
  /**
   * App metadata — surfaced in tokens under the app namespace claim, writable
   * only via Management API. Tests assert against it after actions run.
   */
  app_metadata?: Record<string, unknown> | undefined;
  /**
   * User metadata — surfaced under the user namespace claim, editable by the
   * end user through Account Settings.
   */
  user_metadata?: Record<string, unknown> | undefined;
  created_at: Date;
  updated_at: Date;
  /** Last login timestamp — set when signIn flows complete. */
  last_login?: Date | undefined;
  /** Blocked flag — Auth0 marks accounts disabled via Management API. */
  blocked?: boolean | undefined;
}

/**
 * OIDC id_token claims Auth0 issues. Standard OIDC (sub / aud / iss / iat / exp)
 * plus Auth0-specific extras (nickname / email / email_verified) and namespaced
 * custom claims injected by rules / actions.
 */
export interface Auth0IdTokenClaims {
  /** Subject — the Auth0 `user_id`. */
  sub: string;
  /** Audience — the Auth0 client id the token was issued for. */
  aud: string;
  /** Issuer — the tenant's Auth0 domain (`https://<tenant>.auth0.com/`). */
  iss: string;
  /** Issued-at seconds. */
  iat: number;
  /** Expiry seconds. */
  exp: number;
  /** Nonce — echoed from the authorize request. */
  nonce?: string | undefined;
  email?: string | undefined;
  email_verified?: boolean | undefined;
  name?: string | undefined;
  nickname?: string | undefined;
  picture?: string | undefined;
  /** Auth0 azp claim — the authorized party (client id). */
  azp?: string | undefined;
  /**
   * Custom claims injected by rules / actions. Auth0 recommends namespaced
   * URIs (`https://myapp.example/roles`) to avoid collisions — the mock stores
   * them as an open string-keyed record.
   */
  [customClaim: string]: unknown;
}

/**
 * Access token claims — Auth0 issues these when an API audience is configured.
 * Tokens are consumed by backend APIs and verified with the tenant's JWKS.
 */
export interface Auth0AccessTokenClaims {
  sub: string;
  /** Audience — the API identifier (a URL string in Auth0). */
  aud: string | string[];
  iss: string;
  iat: number;
  exp: number;
  /** azp — always the client id, matches OIDC. */
  azp?: string | undefined;
  /** Scopes granted (space-separated string in prod, kept as string here). */
  scope?: string | undefined;
  /**
   * Permissions array — Auth0 RBAC exposes granular perms alongside scope.
   * Populated when `add_permissions_in_the_access_token` is enabled.
   */
  permissions?: string[] | undefined;
  /** Custom claims from rules / actions, namespaced same as id_token. */
  [customClaim: string]: unknown;
}

/**
 * Rules — Auth0's legacy pipeline (still supported for tenants pre-Actions).
 * A rule is a `(user, context, callback) => void` in prod; the mock exposes
 * the same signature so consumers can drop existing rules straight in.
 * Rules run in order during login and can mutate `context.idToken` /
 * `context.accessToken` (namespaced claim injection) and `user.app_metadata`.
 */
export interface Auth0RuleContext {
  /** Client id the login is scoped to. */
  clientID: string;
  /** Connection the user authenticated with. */
  connection: string;
  /**
   * ID token claim namespace. Rules mutate this to inject custom claims —
   * e.g. `context.idToken['https://myapp.example/roles'] = ['admin']`.
   */
  idToken: Record<string, unknown>;
  /**
   * Access token claim namespace. Same shape, mutations flow into the
   * `access_token` JWT.
   */
  accessToken: Record<string, unknown>;
  /**
   * Redirect URL — set by rules to redirect the user after login (e.g.
   * enforce a step-up MFA challenge on a separate page).
   */
  redirect?: {
    url: string;
  };
}

export type Auth0Rule = (
  user: Auth0User,
  context: Auth0RuleContext,
  callback: (err: Error | null, user?: Auth0User, context?: Auth0RuleContext) => void,
) => void;

/**
 * Actions — Auth0's current extensibility model. An action targets a trigger
 * (post-login / pre-user-registration / etc) and receives an `event` object
 * + an `api` object with helpers for mutation (idToken.setCustomClaim /
 * accessToken.setCustomClaim / redirect.sendUserTo / user.setAppMetadata).
 * The mock covers the two most common triggers.
 */
export type Auth0ActionTrigger =
  | 'post-login'
  | 'pre-user-registration'
  | 'post-user-registration'
  | 'post-change-password';

export interface Auth0ActionEvent {
  /** User the action fires for. */
  user: Auth0User;
  /** Connection metadata — kind (`Username-Password-Authentication` etc). */
  connection: {
    name: string;
    strategy: string;
  };
  /** Client the login belongs to. */
  client: {
    client_id: string;
    name: string;
  };
  /** Auth-hop data — carries request context (ip / method / etc). */
  request: {
    ip?: string;
    method: string;
  };
}

export interface Auth0ActionApi {
  idToken: {
    setCustomClaim: (name: string, value: unknown) => void;
  };
  accessToken: {
    setCustomClaim: (name: string, value: unknown) => void;
    /** Add a permission — Auth0 RBAC. Appends to `permissions` claim. */
    addScope: (scope: string) => void;
  };
  user: {
    setAppMetadata: (name: string, value: unknown) => void;
    setUserMetadata: (name: string, value: unknown) => void;
  };
  /** Redirect the user post-action. */
  redirect: {
    sendUserTo: (url: string) => void;
  };
  /** Deny the login — Auth0 aborts with the reason returned to the client. */
  access: {
    deny: (reason: string) => void;
  };
}

/**
 * An action's callback shape — signature mirrors Auth0's real Actions runtime,
 * `async (event, api) => void`. The mock invokes actions sequentially with
 * shared idToken/accessToken/user mutations across the pipeline.
 */
export type Auth0Action = (
  event: Auth0ActionEvent,
  api: Auth0ActionApi,
) => Promise<void> | void;

/**
 * Options accepted by {@link setupAuth0Env}. Every field is optional — the
 * defaults exercise a single-tenant single-user shape that matches Auth0's
 * hosted quick-start after tenant creation.
 */
export interface SetupAuth0EnvOptions {
  /** Auth0 tenant name — flows into the issuer `https://<tenant>.auth0.com/`. */
  tenant?: string | undefined;
  /** Auth0 client id — surfaces as `aud` in id_token + `azp` in access_token. */
  clientId?: string | undefined;
  /** Client secret — reserved for future signature checks, unused today. */
  clientSecret?: string | undefined;
  /** API audience — set when the tenant has an API configured (backend gates). */
  audience?: string | undefined;
  /** Token lifetime in seconds — Auth0 default is 24h for id_token, mock mirrors it. */
  tokenExpiration?: number | undefined;
  /** Custom issuer override — otherwise derived from `tenant`. */
  issuer?: string | undefined;
  /**
   * Pre-seeded users. Each entry becomes an {@link Auth0User} through the
   * `users.create` Management API. Useful when tests need a specific
   * `user_id` shape to assert against without threading `signIn` calls.
   */
  users?: Array<{
    email: string;
    connection?: Auth0Connection;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    /**
     * Optional seed password. Set when the test wants to call
     * {@link Auth0TestEnv.authenticate.signIn} against the seeded user
     * without running through `signUp` first. Ignored for non-database
     * connections (social / SMS / email).
     */
    password?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }> | undefined;
  /**
   * Pre-registered rules. Rules run in order during login flows — later rules
   * see mutations from earlier rules (mirrors Auth0's actual rule pipeline).
   */
  rules?: Auth0Rule[] | undefined;
  /**
   * Pre-registered actions keyed by trigger. The mock invokes matching actions
   * in registration order during {@link Auth0TestEnv.signIn} + {@link Auth0TestEnv.signUp}.
   */
  actions?: Partial<Record<Auth0ActionTrigger, Auth0Action[]>> | undefined;
}

/**
 * Test env returned by {@link setupAuth0Env}. Consumers hold this handle for
 * the lifetime of a test and call `stop()` in `afterEach` to reset all
 * in-memory state. The `users` / `authenticate` / `rules` / `actions` handles
 * mirror the shape of the real `auth0` node SDK.
 */
export interface Auth0TestEnv extends TestEnvBase<'mock'> {
  tenant: string;
  clientId: string;
  audience: string | undefined;
  issuer: string;
  tokenExpiration: number;
  /**
   * Management API users surface — mirrors `ManagementClient.users.*` from
   * the `auth0` node SDK. Consumers that use the real client swap it for
   * this surface in test setup and every call resolves against the store.
   */
  users: {
    create: (input: {
      email: string;
      connection?: Auth0Connection;
      email_verified?: boolean;
      name?: string;
      nickname?: string;
      picture?: string;
      app_metadata?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
    }) => Promise<Auth0User>;
    get: (userId: string) => Promise<Auth0User>;
    getByEmail: (email: string) => Promise<Auth0User | null>;
    update: (
      userId: string,
      patch: Partial<Pick<Auth0User, 'name' | 'nickname' | 'picture' | 'app_metadata' | 'user_metadata' | 'blocked'>>,
    ) => Promise<Auth0User>;
    delete: (userId: string) => Promise<void>;
    list: () => Promise<Auth0User[]>;
  };
  /**
   * Authentication API — mirrors the `AuthenticationClient` surface.
   * `signIn` = password grant / social login combined path (mock treats both
   * uniformly). `signUp` = database connection signup. Both return the
   * id_token + access_token pair.
   */
  authenticate: {
    signIn: (input: {
      email: string;
      /** Password — checked when the user's connection is Username-Password. */
      password?: string;
      /** Explicit connection override — otherwise the user's connection is used. */
      connection?: Auth0Connection;
      /** Nonce echoed back into the id_token. */
      nonce?: string;
      /** Request IP — passed to actions. */
      ip?: string;
    }) => Promise<{
      user: Auth0User;
      id_token: string;
      access_token: string;
      /** Redirect URL set by a rule / action, when present. */
      redirect_url?: string | undefined;
    }>;
    signUp: (input: {
      email: string;
      password: string;
      connection?: Auth0Connection;
      user_metadata?: Record<string, unknown>;
    }) => Promise<{
      user: Auth0User;
      id_token: string;
      access_token: string;
    }>;
  };
  /**
   * Rules registry. Rules run sequentially in the order they were added, and
   * can mutate tokens + user through the callback signature.
   */
  rules: {
    add: (rule: Auth0Rule) => void;
    list: () => Auth0Rule[];
    clear: () => void;
  };
  /**
   * Actions registry keyed by trigger. Actions run in registration order per
   * trigger. `post-login` fires on `signIn`, `pre-user-registration` fires
   * before `signUp` completes, `post-user-registration` fires after signUp.
   */
  actions: {
    add: (trigger: Auth0ActionTrigger, action: Auth0Action) => void;
    list: (trigger: Auth0ActionTrigger) => Auth0Action[];
    clear: (trigger?: Auth0ActionTrigger) => void;
  };
  /**
   * Verify an id_token — checks signature, expiry, issuer, and audience.
   * Throws when any of those fail. Mirrors `jwt.verify` with the tenant JWKS.
   */
  verifyIdToken: (token: string) => Promise<Auth0IdTokenClaims>;
  /**
   * Verify an access_token — same signature check + audience is matched
   * against the API audience configured on the env.
   */
  verifyAccessToken: (token: string) => Promise<Auth0AccessTokenClaims>;
  /**
   * Set app_metadata on a user directly — Auth0 users.update shortcut.
   * Useful for tests that want to seed app_metadata before signIn flows so
   * post-login actions can read it.
   */
  setAppMetadata: (userId: string, patch: Record<string, unknown>) => Promise<Auth0User>;
}
