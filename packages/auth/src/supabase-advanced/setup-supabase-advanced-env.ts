import { randomBytes } from 'node:crypto';
import {
  generateSupabaseRefreshToken,
  generateSupabaseSigningSecret,
  signSupabaseAccessToken,
  verifySupabaseAccessToken,
} from '../supabase/jwt.js';
import type { SupabaseAccessTokenClaims } from '../supabase/types.js';
import {
  buildOtpAuthUri,
  generateBackupCodes,
  generateTotpCode,
  generateTotpSecret,
  verifyTotpCode,
} from './mfa.js';
import { createRlsRegistry } from './rls.js';
import {
  buildAuthnRequest,
  mapAttributes,
  signAssertion,
  verifyAssertion,
} from './saml.js';
import {
  deriveMockAddress,
  generateSiweNonce,
  serializeSiweMessage,
  signSiweMessage,
  verifySiweSignature,
} from './siwe.js';
import type {
  MfaAal,
  MfaBackupCode,
  MfaChallenge,
  MfaFactor,
  RlsPolicyContext,
  SamlAssertion,
  SamlAuthnRequest,
  SamlIdentityProvider,
  SetupSupabaseAdvancedEnvOptions,
  SiweChallenge,
  SiweMessage,
  SupabaseAdvancedTestEnv,
} from './types.js';

const DEFAULT_SESSION_EXPIRATION = 3600;
const DEFAULT_MFA_CHALLENGE_EXPIRATION = 300;
const DEFAULT_SIWE_NONCE_EXPIRATION = 600;
const DEFAULT_PROJECT_URL = 'https://mock.supabase.co';

interface UserRecord {
  id: string;
  email: string | undefined;
  phone: string | undefined;
  role: 'authenticated' | 'anon' | 'service_role';
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  password: string | undefined;
}

interface SessionRecord {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  aal: MfaAal;
}

/**
 * Build a Supabase Auth advanced test env. Layers RLS / MFA / SSO SAML / SIWE
 * on top of the same JWT + session shape the core adapter uses. The advanced
 * env owns its own user + session store — consumers who need core-adapter
 * flows too should keep both envs side by side, or wire the core env's
 * `verifyToken` to a subset of the advanced env's users.
 */
export async function setupSupabaseAdvancedEnv(
  opts: SetupSupabaseAdvancedEnvOptions = {},
): Promise<SupabaseAdvancedTestEnv> {
  const sessionExpiration = opts.sessionExpiration ?? DEFAULT_SESSION_EXPIRATION;
  if (sessionExpiration <= 0) {
    throw new Error('setupSupabaseAdvancedEnv: sessionExpiration must be positive');
  }
  const mfaChallengeExpiration = opts.mfaChallengeExpiration ?? DEFAULT_MFA_CHALLENGE_EXPIRATION;
  if (mfaChallengeExpiration <= 0) {
    throw new Error('setupSupabaseAdvancedEnv: mfaChallengeExpiration must be positive');
  }
  const siweNonceExpiration = opts.siweNonceExpiration ?? DEFAULT_SIWE_NONCE_EXPIRATION;
  if (siweNonceExpiration <= 0) {
    throw new Error('setupSupabaseAdvancedEnv: siweNonceExpiration must be positive');
  }
  const projectUrl = opts.projectUrl ?? DEFAULT_PROJECT_URL;
  const issuer = `${projectUrl}/auth/v1`;
  const secret = generateSupabaseSigningSecret();

  // In-memory stores.
  const users = new Map<string, UserRecord>();
  const usersByEmail = new Map<string, UserRecord>();
  const sessions = new Map<string, SessionRecord>();
  const sessionsByAccessToken = new Map<string, SessionRecord>();
  const factors = new Map<string, MfaFactor>();
  const backupCodes = new Map<string, MfaBackupCode[]>();
  const mfaChallenges = new Map<string, MfaChallenge>();
  const samlIdps = new Map<string, SamlIdentityProvider>();
  const samlSigningKey = randomBytes(32).toString('hex');
  const samlAuthnRequests = new Map<string, SamlAuthnRequest>();
  const siweChallenges = new Map<string, SiweChallenge>();

  const rlsRegistry = createRlsRegistry();

  let userCounter = 0;
  let sessionCounter = 0;
  let factorCounter = 0;
  let mfaChallengeCounter = 0;
  let idpCounter = 0;
  let siweCounter = 0;

  function nextUserId(): string {
    userCounter += 1;
    return `user-${userCounter}`;
  }
  function nextSessionId(): string {
    sessionCounter += 1;
    return `session-${sessionCounter}`;
  }
  function nextFactorId(): string {
    factorCounter += 1;
    return `factor-${factorCounter}`;
  }
  function nextMfaChallengeId(): string {
    mfaChallengeCounter += 1;
    return `mfa-chal-${mfaChallengeCounter}`;
  }
  function nextIdpId(): string {
    idpCounter += 1;
    return `idp-${idpCounter}`;
  }
  function nextSiweId(): string {
    siweCounter += 1;
    return `siwe-${siweCounter}`;
  }

  function createUser(input: {
    email?: string;
    phone?: string;
    role?: 'authenticated' | 'anon' | 'service_role';
    appMetadata?: Record<string, unknown>;
    userMetadata?: Record<string, unknown>;
    password?: string;
  }): UserRecord {
    if (input.email && usersByEmail.has(input.email)) {
      throw new Error(`createUser: email ${input.email} already exists`);
    }
    const user: UserRecord = {
      id: nextUserId(),
      email: input.email,
      phone: input.phone,
      role: input.role ?? 'authenticated',
      appMetadata: input.appMetadata ?? {},
      userMetadata: input.userMetadata ?? {},
      password: input.password,
    };
    users.set(user.id, user);
    if (user.email) usersByEmail.set(user.email, user);
    return user;
  }

  function issueSession(user: UserRecord, amrMethod: string, aal: MfaAal): SessionRecord {
    const sessionId = nextSessionId();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + sessionExpiration;
    const claims: SupabaseAccessTokenClaims = {
      sub: user.id,
      aud: 'authenticated',
      role: user.role,
      email: user.email,
      phone: user.phone,
      app_metadata: user.appMetadata,
      user_metadata: user.userMetadata,
      session_id: sessionId,
      iat: now,
      exp,
      iss: issuer,
      amr: [{ method: amrMethod, timestamp: now }],
    };
    const accessToken = signSupabaseAccessToken(claims, secret);
    const refreshToken = generateSupabaseRefreshToken();
    const record: SessionRecord = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: exp,
      aal,
    };
    sessions.set(sessionId, record);
    sessionsByAccessToken.set(accessToken, record);
    return record;
  }

  // Seed users from options.
  for (const seed of opts.users ?? []) {
    const seedInput: Parameters<typeof createUser>[0] = {};
    if (seed.email !== undefined) seedInput.email = seed.email;
    if (seed.phone !== undefined) seedInput.phone = seed.phone;
    if (seed.role !== undefined) seedInput.role = seed.role;
    if (seed.appMetadata !== undefined) seedInput.appMetadata = seed.appMetadata;
    if (seed.userMetadata !== undefined) seedInput.userMetadata = seed.userMetadata;
    if (seed.password !== undefined) seedInput.password = seed.password;
    createUser(seedInput);
  }

  // Seed RLS policies.
  for (const policy of opts.policies ?? []) rlsRegistry.define(policy);

  // Seed SAML IdPs.
  function registerIdp(input: Omit<SamlIdentityProvider, 'id'>): SamlIdentityProvider {
    const idp: SamlIdentityProvider = { ...input, id: nextIdpId() };
    samlIdps.set(idp.id, idp);
    return idp;
  }
  for (const seed of opts.samlIdps ?? []) registerIdp(seed);

  const env: SupabaseAdvancedTestEnv = {
    mode: 'mock',
    projectUrl,
    sessionExpiration,
    mfaChallengeExpiration,
    siweNonceExpiration,

    rls: {
      defineRlsPolicy(policy) {
        rlsRegistry.define(policy);
      },
      dropRlsPolicy(table, name) {
        rlsRegistry.drop(table, name);
      },
      async checkRlsAccess(input) {
        const claims = verifySupabaseAccessToken(input.accessToken, secret);
        const ctx: RlsPolicyContext = {
          role: claims.role,
          userId: claims.sub,
          appMetadata: claims.app_metadata,
          userMetadata: claims.user_metadata,
          jwt: claims as unknown as Record<string, unknown>,
        };
        return rlsRegistry.check(input, ctx);
      },
      listPolicies(table) {
        return rlsRegistry.list(table);
      },
    },

    mfa: {
      async enrollTotp(input) {
        const user = users.get(input.userId);
        if (!user) throw new Error(`enrollTotp: user ${input.userId} not found`);
        const secretBase32 = generateTotpSecret();
        const now = new Date();
        const factor: MfaFactor = {
          id: nextFactorId(),
          userId: user.id,
          kind: 'totp',
          friendlyName: input.friendlyName ?? 'Authenticator',
          secret: secretBase32,
          verified: false,
          createdAt: now,
          updatedAt: now,
        };
        factors.set(factor.id, factor);
        const accountName = user.email ?? user.id;
        const otpAuthUri = buildOtpAuthUri({
          secret: secretBase32,
          accountName,
          issuer: projectUrl.replace(/^https?:\/\//, ''),
        });
        return { factor, otpAuthUri };
      },
      async enrollPhone(input) {
        const user = users.get(input.userId);
        if (!user) throw new Error(`enrollPhone: user ${input.userId} not found`);
        const now = new Date();
        const factor: MfaFactor = {
          id: nextFactorId(),
          userId: user.id,
          kind: 'phone',
          friendlyName: input.friendlyName ?? 'Phone',
          secret: input.phone,
          verified: false,
          createdAt: now,
          updatedAt: now,
        };
        factors.set(factor.id, factor);
        return { factor };
      },
      async issueBackupCodes(input) {
        const user = users.get(input.userId);
        if (!user) throw new Error(`issueBackupCodes: user ${input.userId} not found`);
        const codes = generateBackupCodes();
        const records: MfaBackupCode[] = codes.map((code) => ({
          userId: user.id,
          code,
          consumedAt: undefined,
        }));
        backupCodes.set(user.id, records);
        // Backup codes count as a factor for AAL purposes.
        const now = new Date();
        const factor: MfaFactor = {
          id: nextFactorId(),
          userId: user.id,
          kind: 'backup',
          friendlyName: 'Backup Codes',
          secret: 'backup-codes',
          verified: true,
          createdAt: now,
          updatedAt: now,
        };
        factors.set(factor.id, factor);
        return { codes };
      },
      async challenge(input) {
        const factor = factors.get(input.factorId);
        if (!factor) throw new Error(`challenge: factor ${input.factorId} not found`);
        const now = new Date();
        const challenge: MfaChallenge = {
          id: nextMfaChallengeId(),
          factorId: factor.id,
          smsCode:
            factor.kind === 'phone'
              ? Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
              : undefined,
          createdAt: now,
          expiresAt: new Date(now.getTime() + mfaChallengeExpiration * 1000),
          verified: false,
        };
        mfaChallenges.set(challenge.id, challenge);
        return challenge;
      },
      async verifyChallenge(input) {
        const challenge = mfaChallenges.get(input.challengeId);
        if (!challenge) throw new Error(`verifyChallenge: challenge ${input.challengeId} not found`);
        if (challenge.verified) {
          throw new Error('verifyChallenge: challenge already verified');
        }
        if (challenge.expiresAt.getTime() < Date.now()) {
          throw new Error('verifyChallenge: challenge expired');
        }
        const factor = factors.get(challenge.factorId);
        if (!factor) throw new Error('verifyChallenge: factor no longer exists');
        let ok = false;
        if (factor.kind === 'totp') {
          ok = verifyTotpCode(factor.secret, input.code);
        } else if (factor.kind === 'phone') {
          ok = challenge.smsCode === input.code;
        } else {
          throw new Error('verifyChallenge: cannot verify challenge for backup factor');
        }
        if (!ok) throw new Error('verifyChallenge: invalid code');
        challenge.verified = true;
        factor.verified = true;
        factor.updatedAt = new Date();
        return { factor, aal: 'aal2' as MfaAal };
      },
      async consumeBackupCode(input) {
        const set = backupCodes.get(input.userId) ?? [];
        const idx = set.findIndex((c) => c.code === input.code && !c.consumedAt);
        if (idx < 0) throw new Error('consumeBackupCode: code invalid or already consumed');
        set[idx] = { ...set[idx]!, consumedAt: new Date() };
        backupCodes.set(input.userId, set);
        return { aal: 'aal2' as MfaAal };
      },
      listFactors(userId) {
        return Array.from(factors.values()).filter((f) => f.userId === userId);
      },
      listBackupCodes(userId) {
        return [...(backupCodes.get(userId) ?? [])];
      },
      getSessionAal(sessionId) {
        return sessions.get(sessionId)?.aal ?? 'aal1';
      },
    },

    saml: {
      registerIdp,
      async initiateSsoLogin(input) {
        const domain = input.email.split('@')[1];
        if (!domain) throw new Error('initiateSsoLogin: invalid email');
        const matchingIdp = Array.from(samlIdps.values()).find(
          (i) => i.metadata.domain.toLowerCase() === domain.toLowerCase(),
        );
        if (!matchingIdp) {
          throw new Error(`initiateSsoLogin: no SAML IdP registered for domain ${domain}`);
        }
        const relayState = input.relayState ?? randomBytes(16).toString('hex');
        const req = buildAuthnRequest({
          idp: matchingIdp,
          relayState,
          expiresIn: 600,
        });
        samlAuthnRequests.set(req.id, req);
        return req;
      },
      mintAssertion(input) {
        const authnReq = samlAuthnRequests.get(input.authnRequestId);
        if (!authnReq) throw new Error('mintAssertion: authn request not found');
        const idp = samlIdps.get(authnReq.idpId);
        if (!idp) throw new Error('mintAssertion: idp no longer registered');
        const now = new Date();
        const expiresIn = input.expiresIn ?? 600;
        return signAssertion({
          nameId: input.nameId,
          attributes: input.attributes,
          sessionIndex: `sidx_${randomBytes(4).toString('hex')}`,
          issuedAt: now,
          expiresAt: new Date(now.getTime() + expiresIn * 1000),
          relayState: authnReq.relayState,
          signingKey: samlSigningKey,
        });
      },
      async exchangeAssertion(input) {
        if (!verifyAssertion({ assertion: input.assertion, signingKey: samlSigningKey })) {
          throw new Error('exchangeAssertion: signature mismatch');
        }
        if (input.assertion.expiresAt.getTime() < Date.now()) {
          throw new Error('exchangeAssertion: assertion expired');
        }
        // Find the IdP by relayState → matching AuthnRequest.
        const authnReq = Array.from(samlAuthnRequests.values()).find(
          (r) => r.relayState === input.assertion.relayState,
        );
        if (!authnReq) throw new Error('exchangeAssertion: no matching AuthnRequest for RelayState');
        const idp = samlIdps.get(authnReq.idpId);
        if (!idp) throw new Error('exchangeAssertion: IdP no longer registered');
        const mapped = mapAttributes({ idp, assertion: input.assertion });
        // Upsert user by email.
        let user = usersByEmail.get(mapped.email);
        if (!user) {
          user = createUser({
            email: mapped.email,
            role: 'authenticated',
            appMetadata: {
              provider: 'saml',
              sso: { idp: idp.metadata.displayName, domain: idp.metadata.domain },
            },
            userMetadata: {
              firstName: mapped.firstName,
              lastName: mapped.lastName,
              groups: mapped.groups,
            },
          });
        }
        const session = issueSession(user, `sso:saml:${idp.metadata.displayName}`, 'aal1');
        return {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          sessionId: session.id,
          userId: user.id,
        };
      },
      listIdps() {
        return Array.from(samlIdps.values());
      },
    },

    web3: {
      async createSiweChallenge(input) {
        const nonce = generateSiweNonce();
        const now = new Date();
        const message: SiweMessage = {
          domain: input.domain,
          address: input.address,
          statement: input.statement ?? 'Sign in with Ethereum to the mock Supabase project.',
          uri: input.uri,
          version: '1',
          chainId: input.chainId ?? 1,
          nonce,
          issuedAt: now.toISOString(),
          expirationTime: new Date(now.getTime() + siweNonceExpiration * 1000).toISOString(),
          notBefore: undefined,
          requestId: input.requestId,
          resources: input.resources,
        };
        const challenge: SiweChallenge = {
          id: nextSiweId(),
          nonce,
          message,
          issuedAt: now,
          expiresAt: new Date(now.getTime() + siweNonceExpiration * 1000),
          consumed: false,
        };
        siweChallenges.set(challenge.id, challenge);
        return challenge;
      },
      signSiweMessage(input) {
        return signSiweMessage(input);
      },
      async verifySiweMessage(input) {
        const challenge = siweChallenges.get(input.challengeId);
        if (!challenge) throw new Error('verifySiweMessage: challenge not found');
        if (challenge.consumed) throw new Error('verifySiweMessage: nonce already consumed');
        if (challenge.expiresAt.getTime() < Date.now()) {
          throw new Error('verifySiweMessage: nonce expired');
        }
        const derived = deriveMockAddress(input.privateKey);
        if (derived.toLowerCase() !== challenge.message.address.toLowerCase()) {
          throw new Error('verifySiweMessage: signature does not match message address');
        }
        if (
          !verifySiweSignature({
            message: challenge.message,
            signature: input.signature,
            privateKey: input.privateKey,
          })
        ) {
          throw new Error('verifySiweMessage: signature verification failed');
        }
        challenge.consumed = true;
        // Upsert a user for the address.
        const email = `${challenge.message.address.toLowerCase()}@wallet.mock`;
        let user = usersByEmail.get(email);
        if (!user) {
          user = createUser({
            email,
            role: 'authenticated',
            appMetadata: {
              provider: 'web3',
              wallet: { address: challenge.message.address, chainId: challenge.message.chainId },
            },
            userMetadata: {
              address: challenge.message.address,
              chainId: challenge.message.chainId,
            },
          });
        }
        const session = issueSession(user, `web3:eip4361`, 'aal1');
        return {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          sessionId: session.id,
          userId: user.id,
        };
      },
      listChallenges() {
        return Array.from(siweChallenges.values());
      },
    },

    async verifyToken(token) {
      const claims = verifySupabaseAccessToken(token, secret);
      return claims as unknown as Record<string, unknown>;
    },

    getUserById(id) {
      const u = users.get(id);
      if (!u) return null;
      return { id: u.id, email: u.email, role: u.role };
    },

    async stop() {
      users.clear();
      usersByEmail.clear();
      sessions.clear();
      sessionsByAccessToken.clear();
      factors.clear();
      backupCodes.clear();
      mfaChallenges.clear();
      samlIdps.clear();
      samlAuthnRequests.clear();
      siweChallenges.clear();
      userCounter = 0;
      sessionCounter = 0;
      factorCounter = 0;
      mfaChallengeCounter = 0;
      idpCounter = 0;
      siweCounter = 0;
    },
  };

  return env;
}

export {
  buildOtpAuthUri,
  deriveMockAddress,
  generateBackupCodes,
  generateSiweNonce,
  generateTotpCode,
  generateTotpSecret,
  serializeSiweMessage,
  verifyTotpCode,
};
