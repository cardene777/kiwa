import { randomBytes, createHash } from 'node:crypto';
import {
  generateOtpCode,
  generateSupabaseRefreshToken,
  generateSupabaseSigningSecret,
  signSupabaseAccessToken,
  verifySupabaseAccessToken,
} from './jwt.js';
import { createSupabaseStore, type SupabaseSessionRecord, type SupabaseStore } from './store.js';
import type {
  SetupSupabaseAuthEnvOptions,
  SupabaseAccessTokenClaims,
  SupabaseAuthTestEnv,
  SupabaseIdentity,
  SupabaseIdentityProvider,
  SupabaseOAuthAuthorizationUrl,
  SupabaseOtpDelivery,
  SupabaseSession,
  SupabaseUser,
} from './types.js';

const DEFAULT_SESSION_EXPIRATION = 3600; // 1 hour, matching Supabase hosted default.
const DEFAULT_OTP_EXPIRATION = 3600; // 1 hour, matching magic-link + SMS OTP default.
const DEFAULT_PROJECT_URL = 'https://mock.supabase.co';

/**
 * Build a Supabase Auth test env. The returned handle exposes an `auth` (client)
 * + `admin` (service-role) surface that mirrors `@supabase/supabase-js`'s
 * `client.auth.*` + `client.auth.admin.*` API, plus a `verifyToken` helper that
 * validates access tokens issued by the same env.
 *
 * v0.3 scope covers Supabase Auth core semantics — email/password + OAuth
 * (Google/GitHub/Apple) + magic link + JWT session mock. RLS policy mock / MFA /
 * SSO SAML / Web3 wallet auth are covered by the advanced adapter (v1.10-2).
 */
export async function setupSupabaseAuthEnv(
  opts: SetupSupabaseAuthEnvOptions = {},
): Promise<SupabaseAuthTestEnv> {
  const sessionExpiration = opts.sessionExpiration ?? DEFAULT_SESSION_EXPIRATION;
  if (sessionExpiration <= 0) {
    throw new Error(
      'setupSupabaseAuthEnv: sessionExpiration must be a positive number of seconds',
    );
  }
  const otpExpiration = opts.otpExpiration ?? DEFAULT_OTP_EXPIRATION;
  if (otpExpiration <= 0) {
    throw new Error(
      'setupSupabaseAuthEnv: otpExpiration must be a positive number of seconds',
    );
  }
  const projectUrl = opts.projectUrl ?? DEFAULT_PROJECT_URL;
  const issuer = `${projectUrl}/auth/v1`;
  const secret = generateSupabaseSigningSecret();
  const store = createSupabaseStore();

  function buildUserRecord(input: {
    email?: string | undefined;
    phone?: string | undefined;
    emailConfirmed?: boolean | undefined;
    phoneConfirmed?: boolean | undefined;
    identities?: Array<{
      provider: SupabaseIdentityProvider;
      identityData?: Record<string, unknown>;
    }> | undefined;
    appMetadata?: Record<string, unknown> | undefined;
    userMetadata?: Record<string, unknown> | undefined;
    role?: 'authenticated' | 'anon' | 'service_role' | undefined;
  }): SupabaseUser {
    const now = new Date();
    const userId = store.nextUserId();
    const identityRecords: SupabaseIdentity[] = [];
    const providersProvided = input.identities ?? [];
    // If the caller did not provide any identities, infer one from email/phone.
    if (providersProvided.length === 0) {
      if (input.email) {
        providersProvided.push({ provider: 'email', identityData: { email: input.email } });
      }
      if (input.phone) {
        providersProvided.push({ provider: 'email', identityData: { phone: input.phone } });
      }
    }
    for (const idProvider of providersProvided) {
      identityRecords.push({
        id: store.nextIdentityId(),
        userId,
        identityId: idProvider.provider === 'email' ? input.email ?? input.phone ?? userId : `${idProvider.provider}-${userId}`,
        provider: idProvider.provider,
        identityData: idProvider.identityData ?? {},
        createdAt: now,
        lastSignInAt: now,
      });
    }
    return {
      id: userId,
      aud: 'authenticated',
      role: input.role ?? 'authenticated',
      email: input.email,
      emailConfirmedAt: input.emailConfirmed && input.email ? now : undefined,
      phone: input.phone,
      phoneConfirmedAt: input.phoneConfirmed && input.phone ? now : undefined,
      identities: identityRecords,
      appMetadata: input.appMetadata ?? { provider: identityRecords[0]?.provider ?? 'email' },
      userMetadata: input.userMetadata ?? {},
      createdAt: now,
      updatedAt: now,
      lastSignInAt: undefined,
    };
  }

  function requireCredential(input: { email?: string; phone?: string }): string {
    if (input.email) return input.email;
    if (input.phone) return input.phone;
    throw new Error('setupSupabaseAuthEnv: either email or phone is required');
  }

  function issueAccessToken(input: {
    user: SupabaseUser;
    sessionId: string;
    amr: Array<{ method: string; timestamp: number }>;
  }): { accessToken: string; expiresAt: number } {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + sessionExpiration;
    const claims: SupabaseAccessTokenClaims = {
      sub: input.user.id,
      aud: input.user.aud,
      role: input.user.role,
      email: input.user.email,
      phone: input.user.phone,
      app_metadata: input.user.appMetadata,
      user_metadata: input.user.userMetadata,
      session_id: input.sessionId,
      iat: now,
      exp,
      iss: issuer,
      amr: input.amr,
    };
    return { accessToken: signSupabaseAccessToken(claims, secret), expiresAt: exp };
  }

  function issueSession(user: SupabaseUser, amrMethod: string): {
    session: SupabaseSession;
    record: SupabaseSessionRecord;
  } {
    const sessionId = store.nextSessionId();
    const now = Math.floor(Date.now() / 1000);
    const { accessToken, expiresAt } = issueAccessToken({
      user,
      sessionId,
      amr: [{ method: amrMethod, timestamp: now }],
    });
    const refreshToken = generateSupabaseRefreshToken();
    const record: SupabaseSessionRecord = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      revokedAt: undefined,
    };
    store.createSession(record);
    // Update user's lastSignInAt.
    store.updateUser(user.id, { lastSignInAt: new Date() });
    const refreshedUser = store.getUser(user.id) ?? user;
    const session: SupabaseSession = {
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn: sessionExpiration,
      tokenType: 'bearer',
      user: refreshedUser,
    };
    return { session, record };
  }

  function pkceChallenge(codeVerifier: string): string {
    return createHash('sha256').update(codeVerifier).digest('base64url');
  }

  // Seed users provided at env-setup time.
  for (const seed of opts.users ?? []) {
    const user = buildUserRecord({
      email: seed.email,
      phone: seed.phone,
      emailConfirmed: seed.emailConfirmed,
      phoneConfirmed: seed.phoneConfirmed,
      identities: seed.identities,
      appMetadata: seed.appMetadata,
      userMetadata: seed.userMetadata,
      role: seed.role,
    });
    store.createUser(user, seed.password);
  }

  // Seed tokens for pre-existing users.
  const seededTokens: Record<string, { accessToken: string; refreshToken: string; sessionId: string }> = {};
  for (const seed of opts.tokens ?? []) {
    const user = store.getUserByEmail(seed.userEmail);
    if (!user) {
      throw new Error(
        `setupSupabaseAuthEnv: cannot seed token, user with email ${seed.userEmail} not found`,
      );
    }
    const { record } = issueSession(user, 'password');
    seededTokens[seed.userEmail] = {
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      sessionId: record.id,
    };
  }

  const env: SupabaseAuthTestEnv = {
    mode: 'mock',
    projectUrl,
    sessionExpiration,
    otpExpiration,
    seededTokens,

    auth: {
      async signUp(input) {
        const _credential = requireCredential(input);
        const user = buildUserRecord({
          email: input.email,
          phone: input.phone,
          emailConfirmed: false,
          phoneConfirmed: false,
          userMetadata: input.options?.data,
        });
        store.createUser(user, input.password);
        // Supabase's default project requires email confirmation — returns null session.
        return { user, session: null };
      },
      async signInWithPassword(input) {
        const _credential = requireCredential(input);
        const user = input.email
          ? store.getUserByEmail(input.email)
          : store.getUserByPhone(input.phone!);
        if (!user) {
          throw new Error('signInWithPassword: invalid login credentials');
        }
        if (!store.verifyPassword(user.id, input.password)) {
          throw new Error('signInWithPassword: invalid login credentials');
        }
        const { session } = issueSession(user, 'password');
        return { user: session.user, session };
      },
      async signInWithOtp(input) {
        const credential = requireCredential(input);
        const channel: 'email' | 'sms' = input.email ? 'email' : 'sms';
        // Create user if not exists (opt-in via shouldCreateUser, default true).
        const shouldCreateUser = input.options?.shouldCreateUser ?? true;
        let user = input.email
          ? store.getUserByEmail(input.email)
          : store.getUserByPhone(input.phone!);
        if (!user) {
          if (!shouldCreateUser) {
            throw new Error('signInWithOtp: user not found and shouldCreateUser is false');
          }
          user = buildUserRecord({
            email: input.email,
            phone: input.phone,
            emailConfirmed: false,
            phoneConfirmed: false,
          });
          store.createUser(user, undefined);
        }
        const code = generateOtpCode();
        const magicLink = channel === 'email'
          ? `${projectUrl}/auth/v1/verify?token=${code}&type=magiclink&redirect_to=${input.options?.emailRedirectTo ?? ''}`
          : undefined;
        const delivery: SupabaseOtpDelivery = {
          channel,
          recipient: credential,
          code,
          magicLink,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + otpExpiration * 1000),
          consumed: false,
        };
        store.recordOtp(delivery);
        return { otp: delivery };
      },
      async signInWithOAuth(input) {
        const codeVerifier = randomBytes(32).toString('base64url');
        const codeChallenge = pkceChallenge(codeVerifier);
        const code = randomBytes(24).toString('base64url');
        const url = `${projectUrl}/auth/v1/authorize?provider=${input.provider}&code_challenge=${codeChallenge}&redirect_to=${input.options?.redirectTo ?? ''}&scopes=${input.options?.scopes ?? ''}`;
        const record: SupabaseOAuthAuthorizationUrl = {
          provider: input.provider,
          url,
          codeVerifier,
          code,
        };
        store.recordOAuthPending(record);
        return record;
      },
      async exchangeCodeForSession(input) {
        const pending = store.consumeOAuthPending(input.code, input.codeVerifier);
        if (!pending) {
          throw new Error('exchangeCodeForSession: invalid or expired authorization code');
        }
        // Materialise a synthetic user for the OAuth identity. Real Supabase
        // matches on the provider's `sub` claim; the mock uses the code as a
        // per-flow stable identifier.
        const oauthEmail = `${pending.provider}-${pending.code.slice(0, 8)}@oauth.mock`;
        let user = store.getUserByEmail(oauthEmail);
        if (!user) {
          user = buildUserRecord({
            email: oauthEmail,
            emailConfirmed: true,
            identities: [
              {
                provider: pending.provider,
                identityData: { sub: pending.code, provider: pending.provider },
              },
            ],
            appMetadata: { provider: pending.provider, providers: [pending.provider] },
          });
          store.createUser(user, undefined);
        }
        const { session } = issueSession(user, `oauth:${pending.provider}`);
        return { user: session.user, session };
      },
      async verifyOtp(input) {
        const credential = requireCredential(input);
        const delivery = store.findPendingOtp(credential, input.token);
        if (!delivery) {
          throw new Error('verifyOtp: invalid or expired OTP');
        }
        if (delivery.expiresAt.getTime() < Date.now()) {
          throw new Error('verifyOtp: OTP has expired');
        }
        store.markOtpConsumed(credential, input.token);
        const user = input.email
          ? store.getUserByEmail(input.email)
          : store.getUserByPhone(input.phone!);
        if (!user) {
          throw new Error('verifyOtp: user not found after OTP consumption');
        }
        // Confirm email/phone if not yet.
        const confirmedUser = store.updateUser(user.id, {
          emailConfirmedAt:
            input.type === 'signup' || input.type === 'magiclink' || input.type === 'email'
              ? user.emailConfirmedAt ?? new Date()
              : user.emailConfirmedAt,
          phoneConfirmedAt:
            input.type === 'sms' ? user.phoneConfirmedAt ?? new Date() : user.phoneConfirmedAt,
        });
        const { session } = issueSession(confirmedUser, `otp:${input.type}`);
        return { user: session.user, session };
      },
      async refreshSession(input) {
        const record = store.getSessionByRefreshToken(input.refreshToken);
        if (!record || record.revokedAt) {
          throw new Error('refreshSession: invalid refresh token');
        }
        const user = store.getUser(record.userId);
        if (!user) {
          throw new Error('refreshSession: user backing session no longer exists');
        }
        // Rotate both tokens.
        const now = Math.floor(Date.now() / 1000);
        const { accessToken, expiresAt } = issueAccessToken({
          user,
          sessionId: record.id,
          amr: [{ method: 'refresh_token', timestamp: now }],
        });
        const refreshToken = generateSupabaseRefreshToken();
        const updated = store.updateSession(record.id, { accessToken, refreshToken, expiresAt });
        const session: SupabaseSession = {
          accessToken: updated.accessToken,
          refreshToken: updated.refreshToken,
          expiresAt: updated.expiresAt,
          expiresIn: sessionExpiration,
          tokenType: 'bearer',
          user,
        };
        return { user, session };
      },
      async signOut(input) {
        const record = store.getSessionByAccessToken(input.accessToken);
        if (!record) return;
        store.revokeSession(record.id);
      },
      async getUser(accessToken) {
        const claims = verifySupabaseAccessToken(accessToken, secret);
        const user = store.getUser(claims.sub);
        if (!user) throw new Error('getUser: user backing session no longer exists');
        // Also verify the session is not revoked.
        const record = store.getSessionByAccessToken(accessToken);
        if (record?.revokedAt) throw new Error('getUser: session revoked');
        return user;
      },
    },

    admin: {
      async createUser(input) {
        if (!input.email && !input.phone) {
          throw new Error('admin.createUser: either email or phone is required');
        }
        const user = buildUserRecord({
          email: input.email,
          phone: input.phone,
          emailConfirmed: input.emailConfirm,
          phoneConfirmed: input.phoneConfirm,
          appMetadata: input.appMetadata,
          userMetadata: input.userMetadata,
          role: input.role,
        });
        store.createUser(user, input.password);
        return user;
      },
      async getUserById(id) {
        const user = store.getUser(id);
        if (!user) throw new Error(`admin.getUserById: user ${id} not found`);
        return user;
      },
      async getUserByEmail(email) {
        return store.getUserByEmail(email);
      },
      async listUsers() {
        return store.listUsers();
      },
      async updateUserById(id, patch) {
        const patchWithConfirmation: Partial<SupabaseUser> = {};
        if (patch.email !== undefined) patchWithConfirmation.email = patch.email;
        if (patch.phone !== undefined) patchWithConfirmation.phone = patch.phone;
        if (patch.emailConfirm !== undefined) {
          patchWithConfirmation.emailConfirmedAt = patch.emailConfirm ? new Date() : undefined;
        }
        if (patch.phoneConfirm !== undefined) {
          patchWithConfirmation.phoneConfirmedAt = patch.phoneConfirm ? new Date() : undefined;
        }
        if (patch.appMetadata !== undefined) patchWithConfirmation.appMetadata = patch.appMetadata;
        if (patch.userMetadata !== undefined) patchWithConfirmation.userMetadata = patch.userMetadata;
        const updated = store.updateUser(id, patchWithConfirmation);
        if (patch.password !== undefined) store.updatePassword(id, patch.password);
        return updated;
      },
      async deleteUser(id) {
        store.deleteUser(id);
      },
    },

    async verifyToken(token) {
      return verifySupabaseAccessToken(token, secret);
    },

    listOtpDeliveries(channel) {
      return store.listOtpDeliveries(channel);
    },

    listOAuthPending() {
      return store.listOAuthPending();
    },

    async stop() {
      store.reset();
    },
  };

  return env;
}
