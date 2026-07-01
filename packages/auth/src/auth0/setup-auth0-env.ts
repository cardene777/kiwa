import {
  generateAuth0SigningSecret,
  signAuth0AccessToken,
  signAuth0IdToken,
  verifyAuth0AccessToken,
  verifyAuth0IdToken,
} from './jwt.js';
import { createAuth0Store, type Auth0Store } from './store.js';
import type {
  Auth0AccessTokenClaims,
  Auth0Action,
  Auth0ActionApi,
  Auth0ActionEvent,
  Auth0ActionTrigger,
  Auth0Connection,
  Auth0IdTokenClaims,
  Auth0Identity,
  Auth0Rule,
  Auth0RuleContext,
  Auth0TestEnv,
  Auth0User,
  SetupAuth0EnvOptions,
} from './types.js';

// Auth0 defaults — id_token lifetime 24h, tenant name stub matches Auth0 hosted.
const DEFAULT_TOKEN_EXPIRATION = 24 * 60 * 60;
const DEFAULT_TENANT = 'mock-tenant';
const DEFAULT_CLIENT_ID = 'mock-client-id';
const DEFAULT_PASSWORD_CONNECTION: Auth0Connection = 'Username-Password-Authentication';

// In-memory password store — Auth0 hashes passwords server-side, the mock keeps
// them in a Map keyed by user_id. Tests care about the sign-in flow, not the
// hashing implementation.
type PasswordVault = Map<string, string>;

/**
 * Build an Auth0 test env. The returned handle exposes `users` (Management
 * API surface), `authenticate` (Authentication API surface), `rules` (legacy
 * rules registry), and `actions` (post-login / pre-user-registration /
 * post-user-registration / post-change-password triggers) plus `verifyIdToken`
 * / `verifyAccessToken` helpers that validate JWTs issued by the same env.
 *
 * Consumers wire the env into their code by either (a) swapping the real
 * `ManagementClient` / `AuthenticationClient` for `env.users` / `env.authenticate`
 * in test setup, or (b) driving the token flow directly with `env.authenticate.signIn`
 * + `env.verifyIdToken`.
 */
export async function setupAuth0Env(
  opts: SetupAuth0EnvOptions = {},
): Promise<Auth0TestEnv> {
  const tenant = opts.tenant ?? DEFAULT_TENANT;
  const clientId = opts.clientId ?? DEFAULT_CLIENT_ID;
  const audience = opts.audience;
  const tokenExpiration = opts.tokenExpiration ?? DEFAULT_TOKEN_EXPIRATION;
  if (tokenExpiration <= 0) {
    throw new Error(
      'setupAuth0Env: tokenExpiration must be a positive number of seconds',
    );
  }
  const issuer = opts.issuer ?? `https://${tenant}.auth0.com/`;
  const secret = generateAuth0SigningSecret();
  const store = createAuth0Store();
  const passwordVault: PasswordVault = new Map();

  const rulesRegistry: Auth0Rule[] = [];
  const actionsRegistry: Record<Auth0ActionTrigger, Auth0Action[]> = {
    'post-login': [],
    'pre-user-registration': [],
    'post-user-registration': [],
    'post-change-password': [],
  };

  function buildUser(input: {
    email: string;
    connection?: Auth0Connection;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }): Auth0User {
    if (!input.email || !input.email.includes('@')) {
      throw new Error(
        `setupAuth0Env: email must be a valid email (got ${input.email})`,
      );
    }
    const connection = input.connection ?? DEFAULT_PASSWORD_CONNECTION;
    const userId = store.nextUserId(connection);
    // Auth0 identities carry a `user_id` that is the *provider* user id (the
    // part after `|` in the top-level `user_id`). Split it back out here so
    // the shape matches Auth0's real API.
    const providerUserId = userId.split('|', 2)[1] ?? userId;
    const identity: Auth0Identity = {
      provider: connection,
      user_id: providerUserId,
      connection,
      isSocial: connection !== DEFAULT_PASSWORD_CONNECTION && connection !== 'auth0',
    };
    const now = new Date();
    const user: Auth0User = {
      user_id: userId,
      email: input.email,
      email_verified: input.email_verified ?? false,
      connection,
      identities: [identity],
      created_at: now,
      updated_at: now,
    };
    if (input.name !== undefined) user.name = input.name;
    if (input.nickname !== undefined) user.nickname = input.nickname;
    if (input.picture !== undefined) user.picture = input.picture;
    if (input.app_metadata !== undefined) user.app_metadata = input.app_metadata;
    if (input.user_metadata !== undefined) user.user_metadata = input.user_metadata;
    return store.createUser(user);
  }

  // Run the rule pipeline. Rules mutate context.idToken / context.accessToken /
  // user, and callbacks propagate updated values through the chain. Rules that
  // call `callback(err)` short-circuit the login with an error.
  async function runRules(
    initial: Auth0User,
    baseContext: Auth0RuleContext,
  ): Promise<{ user: Auth0User; context: Auth0RuleContext }> {
    let user = initial;
    let context = baseContext;
    for (const rule of rulesRegistry) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const step = await new Promise<{ user: Auth0User; context: Auth0RuleContext }>(
        (resolve, reject) => {
          try {
            rule(user, context, (err, nextUser, nextContext) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({
                user: nextUser ?? user,
                context: nextContext ?? context,
              });
            });
          } catch (thrown) {
            reject(thrown as Error);
          }
        },
      );
      user = step.user;
      context = step.context;
    }
    return { user, context };
  }

  // Run every action registered for the given trigger sequentially. Actions
  // mutate through the `api` object which writes into the shared context /
  // user references maintained here. For pre-user-registration the user is
  // not yet persisted — metadata sets are buffered and returned so the
  // caller can seed them into the user record on create.
  async function runActions(
    trigger: Auth0ActionTrigger,
    event: Auth0ActionEvent,
    idTokenClaims: Record<string, unknown>,
    accessTokenClaims: Record<string, unknown>,
    permissions: string[],
  ): Promise<{
    idTokenClaims: Record<string, unknown>;
    accessTokenClaims: Record<string, unknown>;
    redirect?: string;
    deniedReason?: string;
    permissions: string[];
    user: Auth0User;
    /** Buffered metadata for pre-user-registration (user not yet in store). */
    bufferedAppMetadata: Record<string, unknown>;
    bufferedUserMetadata: Record<string, unknown>;
  }> {
    const preRegistration = trigger === 'pre-user-registration';
    let user = event.user;
    let redirect: string | undefined;
    let deniedReason: string | undefined;
    const nextIdTokenClaims = { ...idTokenClaims };
    const nextAccessTokenClaims = { ...accessTokenClaims };
    const nextPermissions = [...permissions];
    const bufferedAppMetadata: Record<string, unknown> = {};
    const bufferedUserMetadata: Record<string, unknown> = {};
    for (const action of actionsRegistry[trigger]) {
      if (deniedReason !== undefined) break;
      const api: Auth0ActionApi = {
        idToken: {
          setCustomClaim(name, value) {
            nextIdTokenClaims[name] = value;
          },
        },
        accessToken: {
          setCustomClaim(name, value) {
            nextAccessTokenClaims[name] = value;
          },
          addScope(scope) {
            if (!nextPermissions.includes(scope)) nextPermissions.push(scope);
          },
        },
        user: {
          setAppMetadata(name, value) {
            if (preRegistration) {
              // Auth0 buffers metadata sets in pre-user-registration and
              // applies them at create time — the user row does not exist yet.
              bufferedAppMetadata[name] = value;
              return;
            }
            const patch = { ...(user.app_metadata ?? {}), [name]: value };
            user = store.updateUser(user.user_id, { app_metadata: patch });
          },
          setUserMetadata(name, value) {
            if (preRegistration) {
              bufferedUserMetadata[name] = value;
              return;
            }
            const patch = { ...(user.user_metadata ?? {}), [name]: value };
            user = store.updateUser(user.user_id, { user_metadata: patch });
          },
        },
        redirect: {
          sendUserTo(url) {
            redirect = url;
          },
        },
        access: {
          deny(reason) {
            deniedReason = reason;
          },
        },
      };
      await action({ ...event, user }, api);
    }
    const result: {
      idTokenClaims: Record<string, unknown>;
      accessTokenClaims: Record<string, unknown>;
      redirect?: string;
      deniedReason?: string;
      permissions: string[];
      user: Auth0User;
      bufferedAppMetadata: Record<string, unknown>;
      bufferedUserMetadata: Record<string, unknown>;
    } = {
      idTokenClaims: nextIdTokenClaims,
      accessTokenClaims: nextAccessTokenClaims,
      permissions: nextPermissions,
      user,
      bufferedAppMetadata,
      bufferedUserMetadata,
    };
    if (redirect !== undefined) result.redirect = redirect;
    if (deniedReason !== undefined) result.deniedReason = deniedReason;
    return result;
  }

  function issueTokens(input: {
    user: Auth0User;
    idTokenClaims: Record<string, unknown>;
    accessTokenClaims: Record<string, unknown>;
    permissions: string[];
    nonce?: string;
  }): { id_token: string; access_token: string } {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + tokenExpiration;
    const idClaims: Auth0IdTokenClaims = {
      sub: input.user.user_id,
      aud: clientId,
      iss: issuer,
      iat: now,
      exp,
      azp: clientId,
      email: input.user.email,
      email_verified: input.user.email_verified,
      ...input.idTokenClaims,
    };
    if (input.user.name !== undefined) idClaims.name = input.user.name;
    if (input.user.nickname !== undefined) idClaims.nickname = input.user.nickname;
    if (input.user.picture !== undefined) idClaims.picture = input.user.picture;
    if (input.nonce !== undefined) idClaims.nonce = input.nonce;
    const accessClaims: Auth0AccessTokenClaims = {
      sub: input.user.user_id,
      aud: audience ?? clientId,
      iss: issuer,
      iat: now,
      exp,
      azp: clientId,
      ...input.accessTokenClaims,
    };
    if (input.permissions.length > 0) accessClaims.permissions = input.permissions;
    return {
      id_token: signAuth0IdToken(idClaims, secret),
      access_token: signAuth0AccessToken(accessClaims, secret),
    };
  }

  // Seed users + rules + actions from options.
  if (opts.users) {
    for (const seed of opts.users) {
      const built = buildUser(seed);
      if (seed.password !== undefined) {
        passwordVault.set(built.user_id, seed.password);
      }
    }
  }
  if (opts.rules) {
    for (const rule of opts.rules) rulesRegistry.push(rule);
  }
  if (opts.actions) {
    for (const trigger of Object.keys(opts.actions) as Auth0ActionTrigger[]) {
      const actions = opts.actions[trigger];
      if (actions) for (const action of actions) actionsRegistry[trigger].push(action);
    }
  }

  const usersApi: Auth0TestEnv['users'] = {
    async create(input) {
      return buildUser(input);
    },
    async get(userId) {
      const user = store.getUser(userId);
      if (!user) throw new Error(`Auth0 users.get: not found ${userId}`);
      return user;
    },
    async getByEmail(email) {
      return store.getUserByEmail(email);
    },
    async update(userId, patch) {
      const filtered: Partial<Auth0User> = {};
      if (patch.name !== undefined) filtered.name = patch.name;
      if (patch.nickname !== undefined) filtered.nickname = patch.nickname;
      if (patch.picture !== undefined) filtered.picture = patch.picture;
      if (patch.app_metadata !== undefined) filtered.app_metadata = patch.app_metadata;
      if (patch.user_metadata !== undefined) filtered.user_metadata = patch.user_metadata;
      if (patch.blocked !== undefined) filtered.blocked = patch.blocked;
      return store.updateUser(userId, filtered);
    },
    async delete(userId) {
      store.deleteUser(userId);
      passwordVault.delete(userId);
    },
    async list() {
      return store.listUsers();
    },
  };

  const authenticateApi: Auth0TestEnv['authenticate'] = {
    async signIn(input) {
      const user = store.getUserByEmail(input.email);
      if (!user) {
        throw new Error(`Auth0 authenticate.signIn: unknown user email ${input.email}`);
      }
      if (user.blocked) {
        throw new Error(`Auth0 authenticate.signIn: user ${user.user_id} is blocked`);
      }
      const connection = input.connection ?? user.connection;
      // Password check only fires when the effective connection is
      // Username-Password. Social logins skip password entirely (Auth0's
      // real path defers to the provider's assertion).
      if (connection === DEFAULT_PASSWORD_CONNECTION) {
        const stored = passwordVault.get(user.user_id);
        if (stored === undefined) {
          throw new Error(
            `Auth0 authenticate.signIn: no password on file for ${user.user_id}`,
          );
        }
        if (stored !== input.password) {
          throw new Error(
            `Auth0 authenticate.signIn: incorrect password for ${input.email}`,
          );
        }
      }
      const ruleContext: Auth0RuleContext = {
        clientID: clientId,
        connection,
        idToken: {},
        accessToken: {},
      };
      const ruled = await runRules(user, ruleContext);
      const event: Auth0ActionEvent = {
        user: ruled.user,
        connection: { name: connection, strategy: connection },
        client: { client_id: clientId, name: tenant },
        request: { method: 'POST' },
      };
      if (input.ip !== undefined) event.request.ip = input.ip;
      const acted = await runActions(
        'post-login',
        event,
        ruled.context.idToken,
        ruled.context.accessToken,
        [],
      );
      if (acted.deniedReason !== undefined) {
        throw new Error(
          `Auth0 authenticate.signIn: access denied — ${acted.deniedReason}`,
        );
      }
      const finalUser = store.updateUser(acted.user.user_id, {
        last_login: new Date(),
      });
      const tokens = issueTokens({
        user: finalUser,
        idTokenClaims: acted.idTokenClaims,
        accessTokenClaims: acted.accessTokenClaims,
        permissions: acted.permissions,
        ...(input.nonce !== undefined ? { nonce: input.nonce } : {}),
      });
      const result: {
        user: Auth0User;
        id_token: string;
        access_token: string;
        redirect_url?: string;
      } = { user: finalUser, ...tokens };
      const rulesRedirect = ruled.context.redirect?.url;
      const chosenRedirect = acted.redirect ?? rulesRedirect;
      if (chosenRedirect !== undefined) result.redirect_url = chosenRedirect;
      return result;
    },
    async signUp(input) {
      if (store.getUserByEmail(input.email)) {
        throw new Error(
          `Auth0 authenticate.signUp: user with email ${input.email} already exists`,
        );
      }
      const connection = input.connection ?? DEFAULT_PASSWORD_CONNECTION;
      // Run pre-user-registration actions before the store write so a rejection
      // aborts creation. Mirrors Auth0's real Actions runtime order.
      const preEvent: Auth0ActionEvent = {
        // Temp user for the pre-action pipeline — real user_id assigned after
        // creation, so we build a placeholder here.
        user: {
          user_id: '',
          email: input.email,
          email_verified: false,
          connection,
          identities: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
        connection: { name: connection, strategy: connection },
        client: { client_id: clientId, name: tenant },
        request: { method: 'POST' },
      };
      const preActed = await runActions(
        'pre-user-registration',
        preEvent,
        {},
        {},
        [],
      );
      if (preActed.deniedReason !== undefined) {
        throw new Error(
          `Auth0 authenticate.signUp: registration denied — ${preActed.deniedReason}`,
        );
      }
      const buildInput: {
        email: string;
        connection: Auth0Connection;
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
      } = { email: input.email, connection };
      // Merge signUp input + pre-user-registration buffered metadata.
      const mergedUserMetadata: Record<string, unknown> = {
        ...(input.user_metadata ?? {}),
        ...preActed.bufferedUserMetadata,
      };
      if (Object.keys(mergedUserMetadata).length > 0) {
        buildInput.user_metadata = mergedUserMetadata;
      }
      if (Object.keys(preActed.bufferedAppMetadata).length > 0) {
        buildInput.app_metadata = preActed.bufferedAppMetadata;
      }
      const user = buildUser(buildInput);
      passwordVault.set(user.user_id, input.password);
      // Run post-user-registration actions after the store write.
      const postEvent: Auth0ActionEvent = {
        user,
        connection: { name: connection, strategy: connection },
        client: { client_id: clientId, name: tenant },
        request: { method: 'POST' },
      };
      await runActions('post-user-registration', postEvent, {}, {}, []);
      // Then run the post-login flow (Auth0's real signup implicitly signs the
      // user in and fires post-login actions with the fresh user).
      const ruleContext: Auth0RuleContext = {
        clientID: clientId,
        connection,
        idToken: {},
        accessToken: {},
      };
      const ruled = await runRules(user, ruleContext);
      const loginEvent: Auth0ActionEvent = {
        user: ruled.user,
        connection: { name: connection, strategy: connection },
        client: { client_id: clientId, name: tenant },
        request: { method: 'POST' },
      };
      const acted = await runActions(
        'post-login',
        loginEvent,
        ruled.context.idToken,
        ruled.context.accessToken,
        [],
      );
      const finalUser = store.updateUser(acted.user.user_id, {
        last_login: new Date(),
      });
      const tokens = issueTokens({
        user: finalUser,
        idTokenClaims: acted.idTokenClaims,
        accessTokenClaims: acted.accessTokenClaims,
        permissions: acted.permissions,
      });
      return { user: finalUser, ...tokens };
    },
  };

  const rulesApi: Auth0TestEnv['rules'] = {
    add(rule) {
      rulesRegistry.push(rule);
    },
    list() {
      return [...rulesRegistry];
    },
    clear() {
      rulesRegistry.length = 0;
    },
  };

  const actionsApi: Auth0TestEnv['actions'] = {
    add(trigger, action) {
      actionsRegistry[trigger].push(action);
    },
    list(trigger) {
      return [...actionsRegistry[trigger]];
    },
    clear(trigger) {
      if (trigger) {
        actionsRegistry[trigger].length = 0;
      } else {
        for (const key of Object.keys(actionsRegistry) as Auth0ActionTrigger[]) {
          actionsRegistry[key].length = 0;
        }
      }
    },
  };

  async function verifyIdToken(token: string): Promise<Auth0IdTokenClaims> {
    return verifyAuth0IdToken(token, secret, { issuer, audience: clientId });
  }

  async function verifyAccessToken(token: string): Promise<Auth0AccessTokenClaims> {
    return verifyAuth0AccessToken(token, secret, {
      issuer,
      audience: audience ?? clientId,
    });
  }

  async function setAppMetadata(
    userId: string,
    patch: Record<string, unknown>,
  ): Promise<Auth0User> {
    const current = store.getUser(userId);
    if (!current) throw new Error(`Auth0 setAppMetadata: unknown user id ${userId}`);
    return store.updateUser(userId, {
      app_metadata: { ...(current.app_metadata ?? {}), ...patch },
    });
  }

  const env: Auth0TestEnv = {
    mode: 'mock',
    tenant,
    clientId,
    audience,
    issuer,
    tokenExpiration,
    users: usersApi,
    authenticate: authenticateApi,
    rules: rulesApi,
    actions: actionsApi,
    verifyIdToken,
    verifyAccessToken,
    setAppMetadata,
    stop: async () => {
      store.reset();
      passwordVault.clear();
      rulesRegistry.length = 0;
      for (const key of Object.keys(actionsRegistry) as Auth0ActionTrigger[]) {
        actionsRegistry[key].length = 0;
      }
    },
  };
  return env;
}

// Test-only helper — re-export the store reset so unit tests can assert
// deterministic ids without exposing the full store surface.
export function __resetAuth0Store(store: Auth0Store): void {
  store.reset();
}
