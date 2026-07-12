import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * Supabase Auth advanced adapter. Layers RLS policy simulation + MFA (TOTP +
 * backup codes + SMS) + SSO SAML mock + Web3 wallet auth (EIP-4361 SIWE) on top
 * of the core adapter surface. Both adapters share the JWT / user / session
 * shapes so a suite can build on the core env and layer advanced flows on top.
 */

/**
 * RLS (Row Level Security) policy — mirrors a subset of PostgreSQL RLS with a
 * `USING` predicate evaluated against a subject's JWT claims. Callers register
 * a policy against a table + command + role, then invoke `checkAccess` to see
 * whether the subject can execute the command on a candidate row.
 *
 * The mock covers `SELECT` / `INSERT` / `UPDATE` / `DELETE` and evaluates the
 * predicate as a pure JS function so tests can express arbitrary conditions
 * without a real Postgres round-trip.
 */
export type RlsCommand = 'select' | 'insert' | 'update' | 'delete' | 'all';

export const RLS_COMMANDS: readonly RlsCommand[] = ['select', 'insert', 'update', 'delete', 'all'];

export function isRlsCommand(value: string): value is RlsCommand {
  return RLS_COMMANDS.includes(value as RlsCommand);
}

export interface RlsPolicyContext {
  /** Subject's role — `authenticated` / `anon` / `service_role`. */
  role: 'authenticated' | 'anon' | 'service_role';
  /** Subject's user id (sub claim). Undefined when role is `anon`. */
  userId: string | undefined;
  /** app_metadata + user_metadata from the JWT — used in RLS predicates. */
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  /** JWT claim set — advanced predicates can read any custom claim. */
  jwt: Record<string, unknown>;
}

export interface RlsPolicy {
  name: string;
  table: string;
  command: RlsCommand;
  /**
   * Roles the policy applies to. Empty array = applies to all roles including
   * `anon`, matching PostgreSQL's default `TO PUBLIC`.
   */
  roles: Array<'authenticated' | 'anon' | 'service_role'>;
  /**
   * USING predicate — returns true when the subject can access the row. Called
   * for read-side checks (SELECT / UPDATE / DELETE) with the candidate row.
   */
  using?: (row: Record<string, unknown>, ctx: RlsPolicyContext) => boolean;
  /**
   * WITH CHECK predicate — returns true when the subject can write the row.
   * Called for write-side checks (INSERT / UPDATE) with the incoming row.
   */
  withCheck?: (row: Record<string, unknown>, ctx: RlsPolicyContext) => boolean;
}

export interface RlsCheckInput {
  /** Table the RLS check runs against. */
  table: string;
  /** SQL command being attempted. */
  command: Exclude<RlsCommand, 'all'>;
  /** Access token whose claims drive the policy evaluation. */
  accessToken: string;
  /** Candidate row for USING (SELECT / UPDATE / DELETE) predicates. */
  row?: Record<string, unknown>;
  /** New row for WITH CHECK (INSERT / UPDATE) predicates. */
  newRow?: Record<string, unknown>;
}

export interface RlsCheckOutcome {
  allowed: boolean;
  /** Name of the policy that granted access, undefined when denied. */
  matchedPolicy: string | undefined;
  /** Reason the access was denied — populated only when allowed is false. */
  reason: string | undefined;
}

/**
 * MFA factor — Supabase's `auth.mfa` surface exposes TOTP + phone as first
 * class factors plus 10 backup codes per user. The mock mirrors these three
 * factor kinds.
 */
export type MfaFactorKind = 'totp' | 'phone' | 'backup';

export interface MfaFactor {
  id: string;
  userId: string;
  kind: MfaFactorKind;
  friendlyName: string;
  /** Base32 TOTP secret (kind='totp') or phone number (kind='phone'). */
  secret: string;
  /** Verified factors participate in AAL upgrades. */
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MfaBackupCode {
  userId: string;
  code: string;
  consumedAt: Date | undefined;
}

export interface MfaChallenge {
  id: string;
  factorId: string;
  /** For phone factors — the SMS code that was delivered. */
  smsCode: string | undefined;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

/** Authenticator Assurance Level, exactly matching Supabase's terminology. */
export type MfaAal = 'aal1' | 'aal2';

/**
 * SAML SSO IdP mock. Real Supabase supports SAML 2.0 IdP-initiated + SP-initiated
 * SSO. The mock simulates SP-initiated flow — the app requests a SAML AuthnRequest
 * URL, the IdP responds with an assertion, and the mock validates + exchanges it
 * for a session.
 */
export interface SamlIdentityProvider {
  id: string;
  entityId: string;
  ssoUrl: string;
  /** X.509 certificate used to sign IdP assertions (PEM-encoded). */
  signingCertificate: string;
  /** Attribute mapping — IdP attribute name → Supabase user field. */
  attributeMap: {
    email: string;
    firstName?: string;
    lastName?: string;
    groups?: string;
  };
  metadata: {
    /** Human-friendly IdP name. */
    displayName: string;
    /** IdP domain the mock will match against email suffix. */
    domain: string;
  };
}

export interface SamlAuthnRequest {
  id: string;
  idpId: string;
  /** Request URL the client would redirect the user to. */
  redirectUrl: string;
  /** RelayState (opaque token round-tripped through the IdP). */
  relayState: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface SamlAssertion {
  /** SAML NameID — typically the user's email. */
  nameId: string;
  /** IdP attribute statements — mapped through `attributeMap` on verification. */
  attributes: Record<string, string | string[]>;
  /** Session index issued by the IdP. */
  sessionIndex: string;
  /** UTC time the assertion was minted (`NotBefore`). */
  issuedAt: Date;
  /** UTC time the assertion expires (`NotOnOrAfter`). */
  expiresAt: Date;
  /** RelayState the assertion is bound to. */
  relayState: string;
  /** HMAC signature (mock stand-in for a real X.509 signature). */
  signature: string;
}

/**
 * EIP-4361 Sign-In with Ethereum message. Real SIWE messages are constructed
 * from a fixed set of fields — domain, address, statement, uri, version,
 * chainId, nonce, issuedAt + optional expirationTime / notBefore / requestId /
 * resources. The mock stores each field so consumers can craft messages the
 * same way the real client does.
 */
export interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: '1';
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string | undefined;
  notBefore: string | undefined;
  requestId: string | undefined;
  resources: string[] | undefined;
}

export interface SiweChallenge {
  id: string;
  nonce: string;
  message: SiweMessage;
  issuedAt: Date;
  expiresAt: Date;
  consumed: boolean;
}

/**
 * Options accepted by {@link setupSupabaseAdvancedEnv}. Every field is optional —
 * defaults produce a usable env with no policies, no factors, and no SAML IdPs.
 */
export interface SetupSupabaseAdvancedEnvOptions {
  projectUrl?: string | undefined;
  /** Session access-token lifetime (seconds). Default 3600. */
  sessionExpiration?: number | undefined;
  /** MFA challenge lifetime (seconds). Default 300 (5 minutes). */
  mfaChallengeExpiration?: number | undefined;
  /** SIWE nonce lifetime (seconds). Default 600 (10 minutes). */
  siweNonceExpiration?: number | undefined;
  /** Pre-seeded users (same shape as core adapter). */
  users?: Array<{
    email?: string;
    phone?: string;
    password?: string;
    emailConfirmed?: boolean;
    phoneConfirmed?: boolean;
    appMetadata?: Record<string, unknown>;
    userMetadata?: Record<string, unknown>;
    role?: 'authenticated' | 'anon' | 'service_role';
  }> | undefined;
  /** Pre-seeded RLS policies. */
  policies?: RlsPolicy[] | undefined;
  /** Pre-seeded SAML IdPs. */
  samlIdps?: Array<Omit<SamlIdentityProvider, 'id'>> | undefined;
}

/**
 * The advanced test env returned by {@link setupSupabaseAdvancedEnv}. Adds `rls`,
 * `mfa`, `saml`, and `web3` handles on top of the core `auth` + `admin` API.
 */
export interface SupabaseAdvancedTestEnv extends TestEnvBase<'mock'> {
  projectUrl: string;
  sessionExpiration: number;
  mfaChallengeExpiration: number;
  siweNonceExpiration: number;

  /**
   * RLS policy simulation. Consumers call `defineRlsPolicy` at setup + `checkRlsAccess`
   * at request time to assert whether the subject can access a given row.
   */
  rls: {
    defineRlsPolicy: (policy: RlsPolicy) => void;
    dropRlsPolicy: (table: string, name: string) => void;
    checkRlsAccess: (input: RlsCheckInput) => Promise<RlsCheckOutcome>;
    listPolicies: (table?: string) => RlsPolicy[];
  };

  /**
   * MFA (multi-factor authentication) — TOTP + backup codes + phone factors.
   * Mirrors Supabase's `auth.mfa.*` surface.
   */
  mfa: {
    /** Enroll a TOTP factor — returns the shared secret + otpauth URI. */
    enrollTotp: (input: {
      userId: string;
      friendlyName?: string;
    }) => Promise<{ factor: MfaFactor; otpAuthUri: string }>;
    /** Enroll an SMS phone factor — challenges it via SMS OTP. */
    enrollPhone: (input: {
      userId: string;
      phone: string;
      friendlyName?: string;
    }) => Promise<{ factor: MfaFactor }>;
    /** Issue 10 fresh backup codes, replacing any prior set. */
    issueBackupCodes: (input: { userId: string }) => Promise<{ codes: string[] }>;
    /** Start an MFA challenge for a specific factor. */
    challenge: (input: { factorId: string }) => Promise<MfaChallenge>;
    /** Verify a challenge with a TOTP or SMS code. */
    verifyChallenge: (input: {
      challengeId: string;
      code: string;
    }) => Promise<{ factor: MfaFactor; aal: MfaAal }>;
    /** Consume a backup code — upgrades the current session to aal2. */
    consumeBackupCode: (input: {
      userId: string;
      code: string;
    }) => Promise<{ aal: MfaAal }>;
    listFactors: (userId: string) => MfaFactor[];
    listBackupCodes: (userId: string) => MfaBackupCode[];
    /** Current AAL for a session — aal2 if any verified factor upgrade occurred. */
    getSessionAal: (sessionId: string) => MfaAal;
  };

  /**
   * SAML 2.0 SSO IdP mock. Consumers register an IdP + email domain, request
   * an AuthnRequest URL, then submit a mocked assertion to obtain a session.
   */
  saml: {
    registerIdp: (idp: Omit<SamlIdentityProvider, 'id'>) => SamlIdentityProvider;
    initiateSsoLogin: (input: {
      email: string;
      relayState?: string;
    }) => Promise<SamlAuthnRequest>;
    /**
     * Mint a signed assertion for testing — mimics what the real IdP would
     * return. Callers pass the intended attributes + the AuthnRequest id.
     */
    mintAssertion: (input: {
      authnRequestId: string;
      nameId: string;
      attributes: Record<string, string | string[]>;
      /** Override expirationTime — defaults to 10 minutes. */
      expiresIn?: number;
    }) => SamlAssertion;
    /**
     * Verify + exchange the assertion for a Supabase session. Real Supabase
     * validates the IdP signature + attribute mapping + NotBefore / NotOnOrAfter
     * bounds.
     */
    exchangeAssertion: (input: {
      assertion: SamlAssertion;
    }) => Promise<{ accessToken: string; refreshToken: string; sessionId: string; userId: string }>;
    listIdps: () => SamlIdentityProvider[];
  };

  /**
   * Web3 wallet auth via EIP-4361 Sign-In with Ethereum. Consumers request a
   * challenge nonce, sign the message, and exchange the signature for a session.
   */
  web3: {
    createSiweChallenge: (input: {
      address: string;
      domain: string;
      uri: string;
      chainId?: number;
      statement?: string;
      requestId?: string;
      resources?: string[];
    }) => Promise<SiweChallenge>;
    /**
     * Sign the SIWE message with a private key — the mock uses an HMAC over
     * the canonical EIP-4361 message to stand in for `secp256k1` recover,
     * verified back with the same key.
     */
    signSiweMessage: (input: {
      message: SiweMessage;
      privateKey: string;
    }) => string;
    /**
     * Verify + exchange the SIWE signature for a session. Real Supabase would
     * recover the address from the signature and match against the message
     * `address` field; the mock does the same via HMAC + address check.
     */
    verifySiweMessage: (input: {
      challengeId: string;
      signature: string;
      privateKey: string;
    }) => Promise<{ accessToken: string; refreshToken: string; sessionId: string; userId: string }>;
    listChallenges: () => SiweChallenge[];
  };

  /** Verify an access token issued by the advanced env. */
  verifyToken: (token: string) => Promise<Record<string, unknown>>;

  /**
   * Direct handle to the user store — advanced flows need to reach into user
   * records that were created by SIWE / SAML flows without going through the
   * core `admin.getUserByEmail`.
   */
  getUserById: (id: string) => { id: string; email: string | undefined; role: string } | null;
}
