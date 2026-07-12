import { afterEach, describe, expect, it } from 'vitest';
import { semantics } from '../../src/index.js';
import {
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createVirtualAuthenticator,
  generateSupabaseBackupCodes,
  generateSupabaseTotpSecret,
  migrateCredential as caBleMigrateCredential,
  performSignatureRoundtrip,
  serializeSupabaseSiweMessage,
  setupPasskeyEnv,
  setupSupabaseAdvancedEnv,
  setupWebAuthnEnv,
  verifySupabaseTotpCode,
  webAuthnNormalizeChallenge,
  type PasskeyTestEnv,
  type SupabaseAdvancedTestEnv,
  type WebAuthnTestEnv,
  type CaBLEWebSocketTunnel,
} from '../../src/index.js';

/**
 * State-guard / argument-guard / fallback tests for the auth package.
 *
 * Same pattern as security / orm / mobile — closes reachable state-machine
 * throw branches, argument validation branches, and `?? neutral` fallback
 * branches. Focuses on the semantics layer (session-lifecycle-orchestrator,
 * step-up-mfa, conditional-ui, risk-based-auth, device-bound-passkey,
 * platformEventName fallback) plus supabase-advanced (siwe optional field
 * chain + saml mapAttributes email/groups branches) and webauthn / passkey
 * argument guards.
 */

// ---------------------------------------------------------------------------
// semantics/session-lifecycle-orchestrator — state × event transitions
// ---------------------------------------------------------------------------

describe('semantics: session-lifecycle-orchestrator state × event guards', () => {
  const { startSession, dispatchSessionEvent } = semantics;

  it('init state accepts timeout → expired', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchSessionEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(next.state).toBe('expired');
  });

  it('authed state accepts session-expired → expired', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    const next = dispatchSessionEvent({
      session: s,
      event: 'session-expired',
      timestamp: 't2',
    });
    expect(next.state).toBe('expired');
  });

  it('authed state accepts timeout → expired', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    const next = dispatchSessionEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('expired');
  });

  it('authed state rejects auth-succeeded (invalid) but stays authed', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    const next = dispatchSessionEvent({
      session: s,
      event: 'auth-succeeded',
      timestamp: 't2',
    });
    expect(next.state).toBe('authed');
    expect(next.events).toContain('invalid:auth-succeeded-in-authed');
  });

  it('refreshing state accepts revoke-requested → revoked', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    s = dispatchSessionEvent({ session: s, event: 'refresh-triggered', timestamp: 't2' });
    const next = dispatchSessionEvent({
      session: s,
      event: 'revoke-requested',
      timestamp: 't3',
    });
    expect(next.state).toBe('revoked');
    expect(next.revokes).toBe(1);
  });

  it('refreshing state accepts timeout → expired', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    s = dispatchSessionEvent({ session: s, event: 'refresh-triggered', timestamp: 't2' });
    const next = dispatchSessionEvent({ session: s, event: 'timeout', timestamp: 't3' });
    expect(next.state).toBe('expired');
  });

  it('refreshing state rejects auth-succeeded (invalid) but stays refreshing', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    s = dispatchSessionEvent({ session: s, event: 'refresh-triggered', timestamp: 't2' });
    const next = dispatchSessionEvent({
      session: s,
      event: 'auth-succeeded',
      timestamp: 't3',
    });
    expect(next.state).toBe('refreshing');
    expect(next.events).toContain('invalid:auth-succeeded-in-refreshing');
  });

  it('expired state records non-revoke events as terminal', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchSessionEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(s.state).toBe('expired');
    const next = dispatchSessionEvent({
      session: s,
      event: 'auth-succeeded',
      timestamp: 't2',
    });
    expect(next.state).toBe('expired');
    expect(next.events).toContain('terminal:auth-succeeded-in-expired');
  });
});

// ---------------------------------------------------------------------------
// semantics/step-up-mfa — wrong-state guards
// ---------------------------------------------------------------------------

describe('semantics: step-up-mfa state guards', () => {
  const { startStepUp, satisfyAal2, satisfyAal3 } = semantics;

  it('satisfyAal2 throws when session is idle (not escalation-requested) and preserves session state', () => {
    const s = startStepUp({ platform: 'chromium', userId: 'u', currentAal: 'AAL1' });
    const snapshot = structuredClone(s);
    expect(() => satisfyAal2(s, { factor: 'sms', nowMs: 0 })).toThrow(
      /expected escalation-requested/,
    );
    // HIGH-RISK auth: wrong-state throw must not mutate session (state / AAL /
    // trust cache / history all preserved so a retry after the correct
    // requestEscalation() call keeps the security invariant intact).
    expect(s.state).toBe(snapshot.state);
    expect(s.currentAal).toBe(snapshot.currentAal);
    expect(s.requiredAal).toBe(snapshot.requiredAal);
    expect(s.trustExpiresAtMs).toBe(snapshot.trustExpiresAtMs);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('satisfyAal3 throws when session is idle (not escalation-requested) and preserves session state', () => {
    const s = startStepUp({ platform: 'webkit', userId: 'u', currentAal: 'AAL1' });
    const snapshot = structuredClone(s);
    expect(() => satisfyAal3(s, { factor: 'webauthn', nowMs: 0 })).toThrow(
      /expected escalation-requested/,
    );
    // HIGH-RISK auth: wrong-state throw must not mutate session (state / AAL /
    // trust cache / history all preserved).
    expect(s.state).toBe(snapshot.state);
    expect(s.currentAal).toBe(snapshot.currentAal);
    expect(s.requiredAal).toBe(snapshot.requiredAal);
    expect(s.trustExpiresAtMs).toBe(snapshot.trustExpiresAtMs);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// semantics/conditional-ui — wrong-state guards
// ---------------------------------------------------------------------------

describe('semantics: conditional-ui state guards', () => {
  const { startConditionalUi, triggerFallback, markTimeout } = semantics;

  it('triggerFallback throws when state is idle (not hint-shown) and preserves session state', () => {
    const s = startConditionalUi({ platform: 'chromium', formId: 'login' });
    const snapshot = structuredClone(s);
    expect(() => triggerFallback(s, { reason: 'no-cred', elapsedMs: 100 })).toThrow(
      /expected hint-shown/,
    );
    // HIGH-RISK auth: wrong-state throw must not partially apply — elapsedMs
    // must NOT flip to the requested value, state must NOT flip to
    // fallback-triggered, and no history entry may leak in.
    expect(s.state).toBe(snapshot.state);
    expect(s.elapsedMs).toBe(snapshot.elapsedMs);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('markTimeout throws when state is idle (not hint-shown) and preserves session state', () => {
    const s = startConditionalUi({ platform: 'firefox', formId: 'login', timeoutMs: 10 });
    const snapshot = structuredClone(s);
    expect(() => markTimeout(s, { nowMs: 1000 })).toThrow(/expected hint-shown/);
    // HIGH-RISK auth: wrong-state throw must not partially apply — elapsedMs
    // and state must not update, no history entry may leak in.
    expect(s.state).toBe(snapshot.state);
    expect(s.elapsedMs).toBe(snapshot.elapsedMs);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// semantics/device-bound-passkey — wrong-state guards
// ---------------------------------------------------------------------------

describe('semantics: device-bound-passkey state guards', () => {
  const { startDevicePasskey, verifySyncFabric, migrateCredential } = semantics;

  it('verifySyncFabric throws when session is idle (not device-bound) and preserves session state', () => {
    const s = startDevicePasskey({
      platform: 'chromium',
      credentialId: 'c',
      boundDeviceId: 'd',
      syncFabric: 'chrome',
    });
    const snapshot = structuredClone(s);
    expect(() => verifySyncFabric(s)).toThrow(/expected device-bound/);
    // HIGH-RISK auth: wrong-state throw must not flip state to sync-verified
    // or append a history entry — a passkey must not appear "sync-verified"
    // without having been device-bound first.
    expect(s.state).toBe(snapshot.state);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('migrateCredential throws when session is idle (not device-bound or sync-verified) and preserves session state', () => {
    const s = startDevicePasskey({
      platform: 'webkit',
      credentialId: 'c',
      boundDeviceId: 'd',
      syncFabric: 'icloud',
    });
    const snapshot = structuredClone(s);
    expect(() => migrateCredential(s, { toDeviceId: 'd2' })).toThrow(/cannot migrate/);
    // HIGH-RISK auth: wrong-state throw must not partially migrate — the bound
    // device ID must stay pinned to the original device, state stays idle,
    // history stays empty. Otherwise an unbound credential could be migrated
    // to an attacker's device.
    expect(s.state).toBe(snapshot.state);
    expect(s.boundDeviceId).toBe(snapshot.boundDeviceId);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// semantics/risk-based-auth — wrong-state guards
// ---------------------------------------------------------------------------

describe('semantics: risk-based-auth state guards', () => {
  const { startRiskEval, evaluateScore, injectChallenge, applyPolicy } = semantics;

  const signals = {
    deviceScore: 10,
    ipReputation: 10,
    geoAnomaly: 10,
    velocityScore: 10,
    behavioralScore: 10,
  };

  it('evaluateScore throws when state is not idle and preserves session state', () => {
    const s = startRiskEval({ platform: 'chromium', userId: 'u' });
    evaluateScore(s, { signals });
    // Snapshot AFTER the first (valid) evaluateScore — state=evaluated,
    // score=50, one history entry — so the second call's throw must not
    // clobber those.
    const snapshot = structuredClone(s);
    expect(() => evaluateScore(s, { signals })).toThrow(/expected idle/);
    // HIGH-RISK auth: a wrong-state re-evaluation must not overwrite the
    // already-evaluated score / state / history — otherwise an attacker could
    // trigger a rescore with benign signals to erase a high-risk verdict.
    expect(s.state).toBe(snapshot.state);
    expect(s.score).toBe(snapshot.score);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('injectChallenge throws when state is idle (not evaluated) and preserves session state', () => {
    const s = startRiskEval({ platform: 'firefox', userId: 'u' });
    const snapshot = structuredClone(s);
    expect(() => injectChallenge(s, { challenge: 'sms' })).toThrow(/expected evaluated/);
    // HIGH-RISK auth: wrong-state throw must not flip state to challenged or
    // record a history entry — a challenge must never be injected without a
    // preceding score evaluation.
    expect(s.state).toBe(snapshot.state);
    expect(s.score).toBe(snapshot.score);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('injectChallenge throws when score is below allowThreshold and preserves session state', () => {
    const s = startRiskEval({
      platform: 'chromium',
      userId: 'u',
      allowThreshold: 60,
      blockThreshold: 90,
    });
    evaluateScore(s, {
      signals: {
        deviceScore: 5,
        ipReputation: 5,
        geoAnomaly: 5,
        velocityScore: 5,
        behavioralScore: 5,
      },
    });
    // Snapshot the evaluated session (state=evaluated, score=25) so the
    // out-of-range throw cannot promote it to challenged.
    const snapshot = structuredClone(s);
    expect(() => injectChallenge(s, { challenge: 'sms' })).toThrow(/not in challenge range/);
    // HIGH-RISK auth: below-threshold means "allow silently"; a stray
    // challenged state here would surface a phishable challenge to a
    // low-risk user.
    expect(s.state).toBe(snapshot.state);
    expect(s.score).toBe(snapshot.score);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('injectChallenge throws when score is at/above blockThreshold and preserves session state', () => {
    const s = startRiskEval({
      platform: 'chromium',
      userId: 'u',
      allowThreshold: 10,
      blockThreshold: 40,
    });
    evaluateScore(s, {
      signals: {
        deviceScore: 20,
        ipReputation: 20,
        geoAnomaly: 20,
        velocityScore: 20,
        behavioralScore: 20,
      },
    });
    // Snapshot the evaluated block-range session (state=evaluated, score=100)
    // so the throw cannot demote it to challenged.
    const snapshot = structuredClone(s);
    expect(() => injectChallenge(s, { challenge: 'sms' })).toThrow(/not in challenge range/);
    // HIGH-RISK auth: at/above-block means "hard block"; a stray challenged
    // state here would let an attacker satisfy a challenge and bypass the
    // block verdict.
    expect(s.state).toBe(snapshot.state);
    expect(s.score).toBe(snapshot.score);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('applyPolicy throws when state is idle and preserves session state', () => {
    const s = startRiskEval({ platform: 'webkit', userId: 'u' });
    const snapshot = structuredClone(s);
    expect(() => applyPolicy(s)).toThrow(/cannot apply policy/);
    // HIGH-RISK auth: applyPolicy from idle must not flip state to allowed
    // (score=0 would otherwise wrongly satisfy the block-threshold check and
    // silently allow the request).
    expect(s.state).toBe(snapshot.state);
    expect(s.score).toBe(snapshot.score);
    expect(s.history).toEqual(snapshot.history);
    expect(s).toEqual(snapshot);
  });

  it('applyPolicy blocks when score >= blockThreshold', () => {
    const s = startRiskEval({
      platform: 'firefox',
      userId: 'u',
      allowThreshold: 10,
      blockThreshold: 50,
    });
    evaluateScore(s, {
      signals: {
        deviceScore: 20,
        ipReputation: 20,
        geoAnomaly: 20,
        velocityScore: 20,
        behavioralScore: 20,
      },
    });
    const step = applyPolicy(s);
    expect(step.state).toBe('blocked');
    expect(step.neutralEvent).toBe('risk.policy-blocked');
  });
});

// ---------------------------------------------------------------------------
// semantics/types — platformEventName `?? neutral` fallback
// ---------------------------------------------------------------------------

describe('semantics: platformEventName ?? neutral fallback', () => {
  it('returns the neutral event name when the dialect map has no entry', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unknown = 'invented.axis.event' as any;
    const result = semantics.platformEventName('chromium', unknown);
    expect(result).toBe('invented.axis.event');
  });
});

// ---------------------------------------------------------------------------
// supabase-advanced/siwe — serializeSiweMessage optional field branches
// ---------------------------------------------------------------------------

describe('supabase-advanced: serializeSiweMessage optional-field branches', () => {
  it('emits Not Before + Request ID + Resources lines when all optional fields set', () => {
    const serialized = serializeSupabaseSiweMessage({
      domain: 'example.test',
      address: '0xabc',
      statement: 'Sign in',
      uri: 'https://example.test/login',
      version: '1',
      chainId: 1,
      nonce: 'nonce123',
      issuedAt: '2026-07-11T00:00:00.000Z',
      expirationTime: '2026-07-11T00:10:00.000Z',
      notBefore: '2026-07-11T00:00:00.000Z',
      requestId: 'req-xyz',
      resources: ['https://example.test/scope-a', 'https://example.test/scope-b'],
    });
    expect(serialized).toContain('Not Before: 2026-07-11T00:00:00.000Z');
    expect(serialized).toContain('Request ID: req-xyz');
    expect(serialized).toContain('Resources:');
    expect(serialized).toContain('- https://example.test/scope-a');
    expect(serialized).toContain('- https://example.test/scope-b');
  });

  it('omits Not Before / Request ID / Resources when optional fields undefined', () => {
    const serialized = serializeSupabaseSiweMessage({
      domain: 'example.test',
      address: '0xabc',
      statement: 'Sign in',
      uri: 'https://example.test/login',
      version: '1',
      chainId: 1,
      nonce: 'nonce123',
      issuedAt: '2026-07-11T00:00:00.000Z',
      expirationTime: undefined,
      notBefore: undefined,
      requestId: undefined,
      resources: undefined,
    });
    expect(serialized).not.toContain('Not Before:');
    expect(serialized).not.toContain('Request ID:');
    expect(serialized).not.toContain('Resources:');
  });

  it('omits Resources block when resources array is empty', () => {
    const serialized = serializeSupabaseSiweMessage({
      domain: 'example.test',
      address: '0xabc',
      statement: 'Sign in',
      uri: 'https://example.test/login',
      version: '1',
      chainId: 1,
      nonce: 'nonce123',
      issuedAt: '2026-07-11T00:00:00.000Z',
      expirationTime: undefined,
      notBefore: undefined,
      requestId: undefined,
      resources: [],
    });
    expect(serialized).not.toContain('Resources:');
  });
});

// ---------------------------------------------------------------------------
// supabase-advanced/saml — mapAttributes email / groups branches
// ---------------------------------------------------------------------------

describe('supabase-advanced: saml mapAttributes branches', () => {
  const envs: SupabaseAdvancedTestEnv[] = [];

  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop();
    }
  });

  async function makeEnv(): Promise<SupabaseAdvancedTestEnv> {
    const env = await setupSupabaseAdvancedEnv({});
    envs.push(env);
    return env;
  }

  it('exchangeAssertion throws when the mapped email attribute is missing', async () => {
    const env = await makeEnv();
    env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'mail' },
      metadata: { displayName: 'Acme', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'x@acme.test' });
    // Mint an assertion whose attributes DO NOT include the mapped `mail` key.
    const assertion = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'x@acme.test',
      attributes: { other: 'noise' },
    });
    await expect(env.saml.exchangeAssertion({ assertion })).rejects.toThrow(
      /missing or non-string email attribute/,
    );
  });

  it('mapAttributes propagates groups when attribute is an array', async () => {
    const env = await makeEnv();
    env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'mail', groups: 'memberOf' },
      metadata: { displayName: 'Acme', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'emp@acme.test' });
    const assertion = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'emp@acme.test',
      attributes: {
        mail: 'emp@acme.test',
        memberOf: ['engineers', 'admins'],
      },
    });
    const result = await env.saml.exchangeAssertion({ assertion });
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.user_metadata).toEqual(
      expect.objectContaining({ groups: ['engineers', 'admins'] }),
    );
  });

  it('mapAttributes promotes a string groups attribute into a 1-element array', async () => {
    const env = await makeEnv();
    env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'mail', groups: 'memberOf' },
      metadata: { displayName: 'Acme', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'mono@acme.test' });
    const assertion = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'mono@acme.test',
      attributes: {
        mail: 'mono@acme.test',
        memberOf: 'engineers',
      },
    });
    const result = await env.saml.exchangeAssertion({ assertion });
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.user_metadata).toEqual(
      expect.objectContaining({ groups: ['engineers'] }),
    );
  });
});

// ---------------------------------------------------------------------------
// webauthn/encoding — normalizeChallenge branches
// ---------------------------------------------------------------------------

describe('webauthn: normalizeChallenge branches', () => {
  it('accepts a Uint8Array by encoding to base64url', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = webAuthnNormalizeChallenge(bytes);
    // base64url encoding of [1,2,3,4,5] — no padding, no + or /
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('returns a base64url-shaped string as-is', () => {
    const input = 'AbCdEf_-01';
    expect(webAuthnNormalizeChallenge(input)).toBe(input);
  });

  it('encodes a non-base64url string via base64url encode', () => {
    // Space is not in the base64url alphabet, forcing the encode branch.
    const encoded = webAuthnNormalizeChallenge('hello world');
    expect(encoded).not.toBe('hello world');
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ---------------------------------------------------------------------------
// webauthn: credentialCreation / credentialAssertion argument guards
// ---------------------------------------------------------------------------

describe('webauthn: credentialCreation argument guards', () => {
  const envs: WebAuthnTestEnv[] = [];

  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop();
    }
  });

  async function makeEnv(): Promise<WebAuthnTestEnv> {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    return env;
  }

  it('throws when rp.id is missing', async () => {
    const env = await makeEnv();
    await expect(
      env.credentialCreation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rp: { name: 'Example RP' } as any,
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'c',
      }),
    ).rejects.toThrow(/rp\.id is required/);
  });

  it('throws when user.id is missing', async () => {
    const env = await makeEnv();
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: { name: 'alice', displayName: 'Alice' } as any,
        challenge: 'c',
      }),
    ).rejects.toThrow(/user\.id is required/);
  });

  it('throws when challenge is null', async () => {
    const env = await makeEnv();
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        challenge: null as any,
      }),
    ).rejects.toThrow(/challenge is required/);
  });
});

describe('webauthn: credentialAssertion argument guards + userVerification=discouraged', () => {
  const envs: WebAuthnTestEnv[] = [];

  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop();
    }
  });

  async function makeEnv(): Promise<WebAuthnTestEnv> {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    return env;
  }

  it('throws when rpId is missing', async () => {
    const env = await makeEnv();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env.credentialAssertion({ challenge: 'c-get' } as any),
    ).rejects.toThrow(/rpId is required/);
  });

  it('throws when challenge is undefined', async () => {
    const env = await makeEnv();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env.credentialAssertion({ rpId: 'example.test' } as any),
    ).rejects.toThrow(/challenge is required/);
  });

  it('throws when no credentials are registered', async () => {
    const env = await makeEnv();
    await expect(
      env.credentialAssertion({ rpId: 'example.test', challenge: 'c-get' }),
    ).rejects.toThrow(/no credentials are registered/);
  });

  it('clears the UV bit when userVerification is discouraged', async () => {
    const env = await makeEnv();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    const response = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'c-get',
      userVerification: 'discouraged',
    });
    expect(response.credentialId).toMatch(/^credential-\d+$/);
    // authenticatorData byte 32 = flags. UP=0x01, UV=0x04. discouraged path
    // must clear UV even on a UV-capable authenticator.
    const authDataBytes = base64UrlDecode(response.authenticatorData);
    const flags = authDataBytes[32] ?? 0;
    expect(flags & 0x04).toBe(0);
    expect(flags & 0x01).toBe(0x01);
  });
});

// ---------------------------------------------------------------------------
// webauthn/authenticator (via passkey) + passkey/platform + passkey/roaming
// ---------------------------------------------------------------------------

describe('passkey: platform / roaming argument guards', () => {
  it('createPlatformAuthenticator throws on unknown biometric', () => {
    expect(() =>
      createPlatformAuthenticator({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        biometric: 'iris-scan' as any,
      }),
    ).toThrow(/unknown biometric/);
  });

  it('createPlatformAuthenticator throws when hasResidentKey=false explicitly', () => {
    expect(() =>
      createPlatformAuthenticator({
        biometric: 'touch-id',
        // Type signature blocks `hasResidentKey: false` at compile time — cast
        // through unknown so the runtime guard branch is still exercised.
        hasResidentKey: false as unknown as true,
      }),
    ).toThrow(/require hasResidentKey=true/);
  });

  it('createRoamingAuthenticator throws on unknown roaming kind', () => {
    expect(() =>
      createRoamingAuthenticator({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kind: 'smartcard' as any,
      }),
    ).toThrow(/unknown roaming kind/);
  });

  it('createPlatformAuthenticator honors isUserPresent=false when explicitly passed', () => {
    const { handle } = createPlatformAuthenticator({
      biometric: 'face-id',
      isUserPresent: false,
    });
    expect(handle.isUserPresent).toBe(false);
  });

  it('createRoamingAuthenticator honors isUserPresent=false when explicitly passed', () => {
    const { handle } = createRoamingAuthenticator({
      kind: 'security-key',
      isUserPresent: false,
    });
    expect(handle.isUserPresent).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// passkey/setup-passkey-env — restoreCredential / authenticator not-found guards
// ---------------------------------------------------------------------------

describe('passkey: setup env restoreCredential guards', () => {
  const envs: PasskeyTestEnv[] = [];

  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop();
    }
  });

  it('restoreCredential throws when the fabric does not hold the credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'mac-1', platform: { biometric: 'touch-id' } },
      ],
      fabrics: ['icloud-keychain'],
    });
    envs.push(env);
    await expect(async () =>
      env.restoreCredential('mac-1', 'user-x', 'credential-nonexistent', 'icloud-keychain'),
    ).rejects.toThrow(/fabric "icloud-keychain" does not hold credential/);
  });

  it('restoreCredential throws when user does not match the credential owner', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'mac-1', platform: { biometric: 'touch-id' } },
        { deviceId: 'iphone-1', platform: { biometric: 'face-id' } },
      ],
      fabrics: ['icloud-keychain'],
    });
    envs.push(env);
    const response = await env.createPasskey('mac-1', 'user-alice', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-alice', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    env.backupCredential(response.credentialId, 'icloud-keychain');
    await expect(async () =>
      env.restoreCredential('iphone-1', 'user-bob', response.credentialId, 'icloud-keychain'),
    ).rejects.toThrow(/belongs to user "user-alice"/);
  });
});

// ---------------------------------------------------------------------------
// passkey/caBLE/hybrid-transport — unestablished/closed tunnel guards
// ---------------------------------------------------------------------------

describe('passkey caBLE: hybrid-transport tunnel state guards', () => {
  const dummyPasskey = {
    credentialId: 'credential-1',
    userHandle: 'user-1',
    publicKey: 'pk',
    signCount: 0,
    transports: ['hybrid'] as Array<'hybrid'>,
    attachment: 'cross-platform' as const,
    discoverable: true,
    createdAt: 0,
    originDeviceId: 'phone-1',
    userId: 'user-1',
    syncedFabrics: [] as ReadonlyArray<'icloud-keychain' | 'google-password-manager'>,
    syncEpoch: 0,
    backupEligible: true,
  };

  function makeUnestablishedTunnel(): CaBLEWebSocketTunnel {
    // Synthetic tunnel — the real establishWebSocketTunnel always sets
    // established=true, so we build one directly to hit the guard.
    // Cast through unknown because the interface requires `established: boolean`
    // but object literal inference narrows to `false` which some TS versions
    // reject as too-narrow relative to widened surrounding usages.
    const t: unknown = {
      sessionId: 'session-x',
      tunnelServerHint: 'tunnel.example',
      established: false,
      send() {
        throw new Error('should not send');
      },
      drain() {
        return [];
      },
      close() {
        /* no-op */
      },
      closed: false,
    };
    return t as CaBLEWebSocketTunnel;
  }

  it('migrateCredential throws when tunnel is not established', () => {
    const tunnel = makeUnestablishedTunnel();
    expect(() => caBleMigrateCredential(tunnel, dummyPasskey)).toThrow(
      /unestablished tunnel/,
    );
  });

  it('performSignatureRoundtrip throws when tunnel is not established', () => {
    const tunnel = makeUnestablishedTunnel();
    expect(() => performSignatureRoundtrip(tunnel, dummyPasskey, 'ch')).toThrow(
      /unestablished tunnel/,
    );
  });
});

// ---------------------------------------------------------------------------
// webauthn/authenticator — createVirtualAuthenticator direct guards
// ---------------------------------------------------------------------------

describe('webauthn: createVirtualAuthenticator direct guards', () => {
  it('throws on unknown attachment', () => {
    expect(() =>
      createVirtualAuthenticator({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachment: 'peripheral' as any,
        transport: 'usb',
      }),
    ).toThrow(/unknown attachment/);
  });

  it('throws on unknown transport', () => {
    expect(() =>
      createVirtualAuthenticator({
        attachment: 'cross-platform',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: 'wifi' as any,
      }),
    ).toThrow(/unknown transport/);
  });
});

// ---------------------------------------------------------------------------
// webauthn/creation — resolveDiscoverable branches
// ---------------------------------------------------------------------------

describe('webauthn: credentialCreation residentKey discouraged fallback', () => {
  const envs: WebAuthnTestEnv[] = [];

  afterEach(async () => {
    while (envs.length > 0) {
      const env = envs.pop();
      if (env) await env.stop();
    }
  });

  it('residentKey=discouraged forces non-discoverable even with resident-key authenticator', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
      authenticatorSelection: { residentKey: 'discouraged' },
    });
    const stored = env.getCredential(response.credentialId);
    expect(stored?.discoverable).toBe(false);
  });

  it('requireResidentKey=true legacy flag sets discoverable when residentKey unset', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
      authenticatorSelection: { requireResidentKey: true },
    });
    const stored = env.getCredential(response.credentialId);
    expect(stored?.discoverable).toBe(true);
  });

  it('userVerification=required throws when authenticator has no UV support', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: false,
        },
      ],
    });
    envs.push(env);
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'c-create',
        authenticatorSelection: { userVerification: 'required' },
      }),
    ).rejects.toThrow(/userVerification=required but authenticator does not support/);
  });

  it('accepts Uint8Array user.id via base64url encode', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: new Uint8Array([1, 2, 3, 4]) as unknown as any,
        name: 'alice',
        displayName: 'Alice',
      },
      challenge: 'c-create',
    });
    expect(response.credentialId).toMatch(/^credential-\d+$/);
    // The Uint8Array user.id must round-trip through base64url encoding into
    // the stored credential's userHandle (WebAuthn L3 §5.2). Bytes
    // [0x01, 0x02, 0x03, 0x04] base64url-encode to "AQIDBA" (no padding).
    // Without this assertion the test only proved the credentialId shape and
    // silently missed a broken encoder branch.
    expect(env.getCredential(response.credentialId)?.userHandle).toBe('AQIDBA');
  });
});

// ---------------------------------------------------------------------------
// supabase-advanced/mfa — base32 encode/decode branches
// ---------------------------------------------------------------------------

describe('supabase-advanced: mfa base32 branches', () => {
  it('generateTotpSecret with byteLength not divisible by 5 hits trailing-bits branch', () => {
    // 3 bytes = 24 bits, not a multiple of 5 → trailing bits appended in
    // base32Encode `bits > 0` branch.
    const secret = generateSupabaseTotpSecret(3);
    expect(secret.length).toBeGreaterThan(0);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('verifyTotpCode throws on invalid base32 character in secret', () => {
    // '!' is not in the base32 alphabet — hits the invalid-char throw in
    // base32Decode. nowSeconds >= 30 keeps the counter non-negative so the
    // decode step actually runs.
    expect(() => verifySupabaseTotpCode('BADSECRET!', '000000', 1_000)).toThrow(
      /invalid character/,
    );
  });

  it('generateBackupCodes honors custom count', () => {
    const codes = generateSupabaseBackupCodes(3);
    expect(codes).toHaveLength(3);
    for (const c of codes) {
      expect(c).toMatch(/^[0-9a-f]{10}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return new Uint8Array(Buffer.from(padded + padding, 'base64'));
}
