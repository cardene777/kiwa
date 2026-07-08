/**
 * Framework-agnostic RP (Relying Party) server logic. Mirrors the surface a
 * real `@simplewebauthn/server` deployment exposes — issue creation options,
 * verify attestation, persist credential, look up credential — so the same
 * Next.js route handlers can flip between the real SimpleWebAuthn-shaped
 * driver and the `@kiwa/auth` mock without knowing which is in play.
 *
 * The store is in-memory + per-instance; production RPs swap this for a
 * database. The mock is fine for a dogfood app because every test bootstraps
 * a fresh server.
 */

import type { WebAuthnCredential } from '@kiwa/auth';

/**
 * A challenge the RP issued during a registration or assertion ceremony.
 * Real deployments write this to a session-scoped store keyed by
 * `challenge` so the ceremony is single-use.
 */
export interface ChallengeRecord {
  challenge: string;
  userHandle: string;
  ceremony: 'register' | 'signin';
  issuedAt: number;
}

export interface WebAuthnServer {
  /**
   * Issue a fresh challenge for a registration or assertion ceremony.
   * Callers persist the challenge somewhere durable (session, KV) — the
   * mock keeps it in memory.
   */
  issueChallenge(input: {
    userHandle: string;
    ceremony: 'register' | 'signin';
  }): ChallengeRecord;

  /**
   * Consume a challenge — returns true when the challenge was previously
   * issued and has not been consumed yet. WebAuthn L3 §7.1 step 4 forbids
   * challenge reuse.
   */
  consumeChallenge(challenge: string): ChallengeRecord | null;

  /**
   * Persist a freshly registered credential.
   */
  persistCredential(credential: WebAuthnCredential): void;

  /**
   * List every stored credential (used by `/manage` in Sub-Issue #859).
   */
  listCredentials(): WebAuthnCredential[];

  /**
   * Look up a credential by its id (used by the assertion ceremony in
   * Sub-Issue #857).
   */
  getCredential(credentialId: string): WebAuthnCredential | null;

  /**
   * Delete a stored credential.
   */
  deleteCredential(credentialId: string): boolean;

  /**
   * Reset all in-memory state — for tests + `/manage` "clear all".
   */
  reset(): void;
}

/**
 * Construct a fresh {@link WebAuthnServer} instance. Every call produces an
 * independent challenge + credential store so tests do not leak state
 * across suites.
 */
export function createWebAuthnServer(): WebAuthnServer {
  const challenges = new Map<string, ChallengeRecord>();
  const credentials = new Map<string, WebAuthnCredential>();

  return {
    issueChallenge({ userHandle, ceremony }) {
      // Deterministic-ish challenge for the mock — enough entropy for
      // uniqueness in tests, replaced by `crypto.randomBytes(32)` in the
      // real SimpleWebAuthn adapter.
      const challenge = `${ceremony}-${userHandle}-${challenges.size + 1}-${Date.now().toString(36)}`;
      const record: ChallengeRecord = {
        challenge,
        userHandle,
        ceremony,
        issuedAt: Date.now(),
      };
      challenges.set(challenge, record);
      return record;
    },

    consumeChallenge(challenge) {
      const record = challenges.get(challenge);
      if (!record) return null;
      // WebAuthn L3 §7.1 step 4 — a challenge is single use.
      challenges.delete(challenge);
      return record;
    },

    persistCredential(credential) {
      credentials.set(credential.credentialId, credential);
    },

    listCredentials() {
      return Array.from(credentials.values());
    },

    getCredential(credentialId) {
      return credentials.get(credentialId) ?? null;
    },

    deleteCredential(credentialId) {
      return credentials.delete(credentialId);
    },

    reset() {
      challenges.clear();
      credentials.clear();
    },
  };
}
