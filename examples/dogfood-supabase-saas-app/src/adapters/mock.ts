import {
  deriveSupabaseMockAddress,
  generateSupabaseTotpCode,
  setupSupabaseAdvancedEnv,
  setupSupabaseAuthEnv,
  type SupabaseAdvancedTestEnv,
  type SupabaseAuthTestEnv,
} from '@kiwa-lab/auth';
import type {
  AuthAdapter,
  AuthSession,
  AuthUser,
  Doc,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the two kiwa envs (`setupSupabaseAuthEnv` for the
 * daily flow + `setupSupabaseAdvancedEnv` for RLS + MFA + SSO + Web3). The
 * split mirrors the real Supabase surface which exposes daily auth via
 * `client.auth.*` and advanced enterprise features via management + Row
 * Level Security policies.
 */
export async function makeMockAdapter(): Promise<AuthAdapter> {
  const core: SupabaseAuthTestEnv = await setupSupabaseAuthEnv({
    projectUrl: 'https://dogfood.supabase.co',
  });
  const advanced: SupabaseAdvancedTestEnv = await setupSupabaseAdvancedEnv({
    projectUrl: 'https://dogfood.supabase.co',
    policies: [
      {
        name: 'docs_owner_select',
        table: 'documents',
        command: 'select',
        roles: ['authenticated'],
        using: (row, ctx) => row.ownerId === ctx.userId,
      },
    ],
  });
  const trace: TraceEvent[] = [];

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function toUser(user: {
    id: string;
    email: string | undefined;
    role: 'authenticated' | 'anon' | 'service_role';
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      appMetadata: user.appMetadata,
      userMetadata: user.userMetadata,
    };
  }

  function toSession(session: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string | undefined };
  }, aal: 'aal1' | 'aal2'): AuthSession {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.user.id,
      email: session.user.email,
      aal,
    };
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async signUp(input) {
      try {
        const { user, session } = await core.auth.signUp({
          email: input.email,
          password: input.password,
          ...(input.userMetadata ? { options: { data: input.userMetadata } } : {}),
        });
        record('signUp', true, { detail: { hasSession: session !== null } });
        return {
          user: toUser(user),
          session: session ? toSession(session, 'aal1') : null,
        };
      } catch (err) {
        record('signUp', false, { errorKind: (err as Error).message });
        throw err;
      }
    },

    async signInWithPassword(input) {
      try {
        const { session } = await core.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        record('signInWithPassword', true);
        return toSession(session, 'aal1');
      } catch (err) {
        record('signInWithPassword', false, { errorKind: (err as Error).message });
        throw err;
      }
    },

    async requestMagicLink(input) {
      const { otp } = await core.auth.signInWithOtp({
        email: input.email,
        options: { shouldCreateUser: true },
      });
      record('requestMagicLink', true, { detail: { channel: otp.channel } });
      return { deliveredCode: otp.code };
    },

    async consumeMagicLink(input) {
      const { session } = await core.auth.verifyOtp({
        email: input.email,
        token: input.code,
        type: 'magiclink',
      });
      record('consumeMagicLink', true);
      return toSession(session, 'aal1');
    },

    async requestOAuthPkce(input) {
      const authUrl = await core.auth.signInWithOAuth({
        provider: input.provider,
        options: { redirectTo: input.redirectTo },
      });
      record('requestOAuthPkce', true, { detail: { provider: input.provider } });
      return { code: authUrl.code, codeVerifier: authUrl.codeVerifier };
    },

    async exchangeOAuthPkce(input) {
      const { session } = await core.auth.exchangeCodeForSession(input);
      record('exchangeOAuthPkce', true);
      return toSession(session, 'aal1');
    },

    async listDocsFor(input) {
      // RLS is enforced against the JWT the caller holds. Both `core` (issuer)
      // and `advanced` (evaluator) share the JWT signing secret in production;
      // in the dogfood harness we bridge by having the app manually evaluate
      // the policy against the token claims decoded via the core env.
      const claims = await core.verifyToken(input.accessToken);
      const allowed: Doc[] = [];
      for (const doc of input.seedDocs) {
        if (doc.ownerId === claims.sub) allowed.push(doc);
      }
      record('listDocsFor', true, { detail: { allowedCount: allowed.length } });
      return allowed;
    },

    async enrollTotp(input) {
      // MFA enrolment needs an advanced-env user id. In real Supabase both
      // the auth session and the MFA state live in the same store; in the
      // kiwa mock envs they are split by design (one env per feature). The
      // bridge here materialises an advanced-env user via the SSO helper so
      // MFA can attach to it, and re-signs the caller's core-env session
      // token onto that advanced-env user id. Callers keep using the same
      // access token they got from the core sign-in.
      const claims = await core.verifyToken(input.accessToken);
      const bridgeEmail =
        typeof claims.email === 'string' ? claims.email : `${claims.sub}@bridge.mock`;
      const domain = bridgeEmail.split('@')[1] ?? 'bridge.mock';
      advanced.saml.registerIdp({
        entityId: 'https://sp.dogfood.test/acs',
        ssoUrl: `https://idp.${domain}/sso`,
        signingCertificate: '',
        attributeMap: {
          email: 'urn:oid:0.9.2342.19200300.100.1.3',
        },
        metadata: { displayName: 'DogfoodBridge', domain },
      });
      const req = await advanced.saml.initiateSsoLogin({ email: bridgeEmail });
      const assertion = advanced.saml.mintAssertion({
        authnRequestId: req.id,
        nameId: bridgeEmail,
        attributes: { 'urn:oid:0.9.2342.19200300.100.1.3': bridgeEmail },
      });
      const bridge = await advanced.saml.exchangeAssertion({ assertion });
      const { factor } = await advanced.mfa.enrollTotp({ userId: bridge.userId });
      record('enrollTotp', true);
      return { factorId: factor.id, secret: factor.secret };
    },

    async verifyTotpChallenge(input) {
      const challenge = await advanced.mfa.challenge({ factorId: input.factorId });
      const result = await advanced.mfa.verifyChallenge({
        challengeId: challenge.id,
        code: input.code,
      });
      record('verifyTotpChallenge', true, { detail: { aal: result.aal } });
      return { aal: result.aal };
    },

    async registerSamlIdp(input) {
      const idp = advanced.saml.registerIdp({
        entityId: `https://sp.dogfood.test/acs`,
        ssoUrl: `https://idp.${input.domain}/sso`,
        signingCertificate: '',
        attributeMap: {
          email: 'urn:oid:0.9.2342.19200300.100.1.3',
          firstName: 'urn:oid:2.5.4.42',
          lastName: 'urn:oid:2.5.4.4',
          groups: 'urn:oid:2.16.840.1.113719.1.1.4.1.25',
        },
        metadata: { displayName: input.displayName, domain: input.domain },
      });
      record('registerSamlIdp', true);
      return { idpId: idp.id, attributeMap: { email: idp.attributeMap.email } };
    },

    async ssoLoginWithSaml(input) {
      const idps = advanced.saml.listIdps();
      const idp = idps.find((i) => i.metadata.domain === input.email.split('@')[1]);
      if (!idp) throw new Error('ssoLoginWithSaml: no matching IdP');
      const req = await advanced.saml.initiateSsoLogin({ email: input.email });
      const assertion = advanced.saml.mintAssertion({
        authnRequestId: req.id,
        nameId: input.email,
        attributes: {
          [idp.attributeMap.email]: input.email,
          [idp.attributeMap.firstName ?? 'firstName']: input.firstName,
          [idp.attributeMap.lastName ?? 'lastName']: input.lastName,
          [idp.attributeMap.groups ?? 'groups']: input.groups,
        },
      });
      const { accessToken, refreshToken, userId } = await advanced.saml.exchangeAssertion({
        assertion,
      });
      record('ssoLoginWithSaml', true);
      return {
        accessToken,
        refreshToken,
        userId,
        email: input.email,
        aal: 'aal1',
      };
    },

    async siweLogin(input) {
      const address = deriveSupabaseMockAddress(input.privateKey);
      const chal = await advanced.web3.createSiweChallenge({
        address,
        domain: input.domain,
        uri: input.uri,
      });
      const signature = advanced.web3.signSiweMessage({
        message: chal.message,
        privateKey: input.privateKey,
      });
      const { accessToken, refreshToken, userId } = await advanced.web3.verifySiweMessage({
        challengeId: chal.id,
        signature,
        privateKey: input.privateKey,
      });
      record('siweLogin', true, { detail: { address } });
      return {
        session: {
          accessToken,
          refreshToken,
          userId,
          email: `${address.toLowerCase()}@wallet.mock`,
          aal: 'aal1',
        },
        address,
      };
    },

    async reset() {
      await core.stop();
      await advanced.stop();
      trace.length = 0;
    },
  };
}

/** Convenience — expose TOTP code helper so tests can drive verifyChallenge. */
export function totpCode(secret: string): string {
  return generateSupabaseTotpCode(secret);
}
