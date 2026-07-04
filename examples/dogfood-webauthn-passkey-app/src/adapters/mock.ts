/**
 * Mock adapter — drives `@kiwa-test/auth`'s `setupWebAuthnEnv` +
 * `credentialCreation` so the same app code exercises a deterministic
 * WebAuthn ceremony without touching Chrome. Both mock and real adapters
 * satisfy {@link WebAuthnRPAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * The mock preseeds a single platform authenticator with UV + resident-key
 * support because that is the shape a Passkey-capable device (Touch ID /
 * Windows Hello) surfaces. Sub-Issue #859 layers additional authenticators
 * on top for the `/manage` scenario.
 */

import {
  setupWebAuthnEnv,
  type WebAuthnCredential,
  type WebAuthnTestEnv,
} from '@kiwa-test/auth';
import type {
  RegisterInput,
  RegisterResult,
  TraceEvent,
  WebAuthnRPAdapter,
} from './interface.js';
import { createWebAuthnServer, type WebAuthnServer } from '../lib/webauthn-server.js';

export interface MakeMockAdapterOptions {
  /**
   * When true, preseed a UV-capable + resident-key-capable platform
   * authenticator. Default = true. Sub-Issue #858 flips this to exercise
   * the "no UV support" rejection path.
   */
  hasUserVerification?: boolean;
  hasResidentKey?: boolean;
}

/**
 * Map a kiwa `credentialCreation` rejection to a stable trace `errorKind`.
 * Sub-Issue #858 (userVerification 4 pattern) asserts on these — keeping the
 * mapping in one place lets subsequent Sub-Issues extend it without editing
 * every test.
 */
function classifyCredentialCreationError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('userVerification=required')) return 'user_verification_unsupported';
  if (message.includes('authenticatorAttachment')) return 'attachment_mismatch';
  if (message.includes('residentKey=required')) return 'resident_key_unsupported';
  if (message.includes('excludeCredentials matched')) return 'excluded_credential_reused';
  if (message.includes('challenge is required')) return 'missing_challenge';
  return 'credential_creation_failed';
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): WebAuthnRPAdapter & {
  /** Escape hatch for tests that need to inspect the raw kiwa env. */
  readonly env: () => WebAuthnTestEnv | null;
  readonly server: () => WebAuthnServer;
} {
  const trace: TraceEvent[] = [];
  const server = createWebAuthnServer();
  let env: WebAuthnTestEnv | null = null;

  async function getEnv(): Promise<WebAuthnTestEnv> {
    if (env) return env;
    env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'platform',
          transport: 'internal',
          hasUserVerification: opts.hasUserVerification ?? true,
          hasResidentKey: opts.hasResidentKey ?? true,
        },
      ],
    });
    return env;
  }

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],
    env: () => env,
    server: () => server,

    async register(input: RegisterInput): Promise<RegisterResult> {
      const kiwaEnv = await getEnv();
      // The RP issues its own challenge, then hands it to the authenticator.
      // We honour the caller-supplied challenge because tests exercise
      // known-challenge scenarios; production RPs would call
      // `server.issueChallenge` themselves.
      try {
        const attestationResponse = await kiwaEnv.credentialCreation({
          rp: input.rp,
          user: input.user,
          challenge: input.challenge,
          attestation: input.attestation ?? 'none',
          ...(input.authenticatorSelection
            ? { authenticatorSelection: input.authenticatorSelection }
            : {}),
        });
        // credentialCreation writes into the shared registry — pull the
        // canonical stored credential + persist it into our RP-side store.
        const stored = kiwaEnv.getCredential(attestationResponse.credentialId);
        if (!stored) {
          record('register', false, { errorKind: 'credential_not_persisted' });
          throw new Error(
            `makeMockAdapter.register: kiwa env did not persist credential "${attestationResponse.credentialId}"`,
          );
        }
        server.persistCredential(stored);
        record('register', true, {
          detail: {
            credentialId: stored.credentialId,
            attestation: attestationResponse.attestation,
            discoverable: stored.discoverable,
          },
        });
        return { credential: stored, attestationResponse };
      } catch (err) {
        // Trace every register failure — the kiwa mock rejects UV=required
        // when the authenticator lacks user verification, attachment
        // mismatches, and duplicate credential-id excludes. Sub-Issue #858
        // asserts on the errorKind to prove userVerification pattern
        // rejections are surfaced correctly.
        const errorKind = classifyCredentialCreationError(err);
        record('register', false, { errorKind });
        throw err;
      }
    },

    listCredentials(): WebAuthnCredential[] {
      const creds = server.listCredentials();
      record('listCredentials', true, { detail: { count: creds.length } });
      return creds;
    },

    deleteCredential(credentialId): boolean {
      // Delete from both the RP-side store and the kiwa env so the
      // authenticator side stays consistent with the DB.
      const removedFromServer = server.deleteCredential(credentialId);
      if (env) env.deleteCredential(credentialId);
      record('deleteCredential', removedFromServer, { detail: { credentialId } });
      return removedFromServer;
    },

    async reset(): Promise<void> {
      server.reset();
      if (env) {
        await env.stop();
        env = null;
      }
      trace.length = 0;
      record('reset', true);
    },
  };
}
