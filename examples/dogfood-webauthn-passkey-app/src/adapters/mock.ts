/**
 * Mock adapter — drives `@kiwa/auth`'s `setupWebAuthnEnv` +
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
  type AuthenticatorSelectionCriteria,
  type WebAuthnCredential,
  type WebAuthnTestEnv,
  type WebAuthnUserVerificationRequirement,
} from '@kiwa/auth';
import type {
  DogfoodAuthenticatorSelectionCriteria,
  DogfoodUserVerification,
  RegisterInput,
  RegisterResult,
  SigninInput,
  SigninResult,
  TraceEvent,
  WebAuthnRPAdapter,
} from './interface.js';
import { createWebAuthnServer, type WebAuthnServer } from '../lib/webauthn-server.js';

/**
 * Narrow the dogfood UV vocabulary to the three spec values kiwa accepts.
 * Returns null when the caller passed either `impossible` (already rejected
 * by the caller before this runs) or omitted the field.
 */
function toKiwaUserVerification(
  value: DogfoodUserVerification | undefined,
): WebAuthnUserVerificationRequirement | null {
  if (value === 'required' || value === 'preferred' || value === 'discouraged') {
    return value;
  }
  return null;
}

/**
 * Build a kiwa-compatible `AuthenticatorSelectionCriteria` from the dogfood
 * variant. Drops the `impossible` sentinel + honours
 * `exactOptionalPropertyTypes` by omitting undefined fields rather than
 * assigning them.
 */
function buildKiwaAuthenticatorSelection(
  input: DogfoodAuthenticatorSelectionCriteria,
  uv: DogfoodUserVerification | undefined,
): AuthenticatorSelectionCriteria {
  const out: AuthenticatorSelectionCriteria = {};
  if (input.authenticatorAttachment !== undefined) {
    out.authenticatorAttachment = input.authenticatorAttachment;
  }
  if (input.residentKey !== undefined) out.residentKey = input.residentKey;
  if (input.requireResidentKey !== undefined) {
    out.requireResidentKey = input.requireResidentKey;
  }
  const kiwaUV = toKiwaUserVerification(uv);
  if (kiwaUV) out.userVerification = kiwaUV;
  return out;
}

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
  if (message.includes('userVerification=impossible')) return 'user_verification_impossible';
  if (message.includes('userVerification=required')) return 'user_verification_unsupported';
  if (message.includes('authenticatorAttachment')) return 'attachment_mismatch';
  if (message.includes('residentKey=required')) return 'resident_key_unsupported';
  if (message.includes('excludeCredentials matched')) return 'excluded_credential_reused';
  if (message.includes('challenge is required')) return 'missing_challenge';
  return 'credential_creation_failed';
}

/**
 * Map a kiwa `credentialAssertion` rejection to a stable trace `errorKind`.
 * Sub-Issue #858 (userVerification 4 pattern) will build on this — assertion
 * rejections map to a stable vocabulary so downstream tests do not scrape
 * error messages.
 */
function classifyCredentialAssertionError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('userVerification=impossible')) return 'user_verification_impossible';
  if (message.includes('userVerification=required')) return 'user_verification_unsupported';
  if (message.includes('allowCredentials matched no stored credential')) {
    return 'allow_credentials_no_match';
  }
  if (message.includes('no credentials are registered')) return 'no_credentials_registered';
  if (message.includes('no user-present authenticator')) return 'no_user_present_authenticator';
  if (message.includes('challenge is required')) return 'missing_challenge';
  if (message.includes('rpId is required')) return 'missing_rp_id';
  return 'credential_assertion_failed';
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
      // Sub-Issue #858 — the RP rejects the kiwa-only sentinel
      // `userVerification=impossible` before invoking the authenticator.
      // Real SimpleWebAuthn drivers reject this at the schema layer because
      // `UserVerificationRequirement` is a closed enum; the mock mirrors that
      // behaviour so downstream fidelity harnesses can diff the rejection.
      const requestedUV = input.authenticatorSelection?.userVerification;
      if (requestedUV === 'impossible') {
        record('register', false, { errorKind: 'user_verification_impossible' });
        throw new Error(
          'makeMockAdapter.register: userVerification=impossible is not a WebAuthn L3 §5.4.6 value',
        );
      }
      const kiwaEnv = await getEnv();
      // Strip the kiwa sentinel before handing the selection to the kiwa
      // primitive — the kiwa `AuthenticatorSelectionCriteria` type only
      // accepts the three spec values. `exactOptionalPropertyTypes` means we
      // must omit the field when it is undefined rather than assigning
      // undefined explicitly, so build the object piecewise.
      const authenticatorSelection = input.authenticatorSelection
        ? buildKiwaAuthenticatorSelection(input.authenticatorSelection, requestedUV)
        : undefined;
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
          ...(authenticatorSelection ? { authenticatorSelection } : {}),
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

    async signin(input: SigninInput): Promise<SigninResult> {
      // Validate the RP-facing input up-front so trace errorKind stays
      // stable no matter what the underlying kiwa primitive checks first.
      // WebAuthn L3 §7.2 step 5 requires the RP to have `challenge`
      // available and to know the target `rpId` before invoking the
      // authenticator.
      if (!input.rpId) {
        record('signin', false, { errorKind: 'missing_rp_id' });
        throw new Error('makeMockAdapter.signin: rpId is required');
      }
      if (!input.challenge) {
        record('signin', false, { errorKind: 'missing_challenge' });
        throw new Error('makeMockAdapter.signin: challenge is required');
      }
      // Sub-Issue #858 — reject the kiwa sentinel before touching the kiwa
      // env so the trace errorKind is stable regardless of internal ordering.
      if (input.userVerification === 'impossible') {
        record('signin', false, { errorKind: 'user_verification_impossible' });
        throw new Error(
          'makeMockAdapter.signin: userVerification=impossible is not a WebAuthn L3 §5.4.6 value',
        );
      }
      const kiwaEnv = await getEnv();
      // Look up the stored credential(s) the caller is asserting against so
      // the RP can (a) surface the pre-assertion `signCount` for the fidelity
      // harness and (b) reject up-front when the credential id does not
      // resolve. WebAuthn L3 §7.2 step 3 requires this lookup.
      const allowIds = input.allowCredentialIds ?? [];
      const candidateIds = allowIds.length
        ? allowIds
        : server.listCredentials().map((cred) => cred.credentialId);
      if (candidateIds.length === 0) {
        record('signin', false, { errorKind: 'no_credentials_registered' });
        throw new Error('makeMockAdapter.signin: no credentials are registered');
      }
      // Pre-assertion snapshot — mirrors what the RP would read from its
      // database before dispatching to the authenticator. §6.1.1 clone
      // detection compares this against the assertion's `signCount`.
      const preSnapshots = new Map<string, number>();
      for (const id of candidateIds) {
        const stored = server.getCredential(id);
        if (stored) preSnapshots.set(id, stored.signCount);
      }

      let assertionResponse;
      // Strip the kiwa sentinel — `impossible` was already rejected above, so
      // any surviving value is guaranteed to be one of the three spec enums
      // the kiwa `PublicKeyCredentialRequestOptions` type accepts. Defaults
      // to `preferred` when the caller omitted the field (matches WebAuthn
      // L3 §5.5.4 default).
      const kiwaUserVerification: WebAuthnUserVerificationRequirement =
        toKiwaUserVerification(input.userVerification) ?? 'preferred';
      try {
        assertionResponse = await kiwaEnv.credentialAssertion({
          rpId: input.rpId,
          challenge: input.challenge,
          userVerification: kiwaUserVerification,
          ...(allowIds.length
            ? { allowCredentials: allowIds.map((id) => ({ id, type: 'public-key' as const })) }
            : {}),
        });
      } catch (err) {
        // kiwa's credentialAssertion rejects on allowCredentials mismatch,
        // no user-present authenticator, and UV=required + no-UV-support.
        // Map to a stable errorKind so downstream Sub-Issues can assert on
        // the trace.
        record('signin', false, { errorKind: classifyCredentialAssertionError(err) });
        throw err;
      }

      const previousSignCount = preSnapshots.get(assertionResponse.credentialId) ?? 0;
      // The kiwa mock mutates the credential registry it shares with the env;
      // pull the freshly bumped credential so the RP-side store stays in sync
      // with the authenticator side.
      const bumped = kiwaEnv.getCredential(assertionResponse.credentialId);
      if (!bumped) {
        record('signin', false, {
          errorKind: 'credential_not_persisted',
          detail: { credentialId: assertionResponse.credentialId },
        });
        throw new Error(
          `makeMockAdapter.signin: kiwa env lost credential "${assertionResponse.credentialId}" mid-assertion`,
        );
      }
      // WebAuthn L3 §7.2 step 21 — RP MUST verify `signCount > storedSignCount`
      // (or storedSignCount === 0). Surface a stable errorKind for the
      // clone-detection scenario Sub-Issue #859 will build on, and record
      // both sides of the counter so the failure is diagnosable off the
      // trace alone.
      if (bumped.signCount <= previousSignCount) {
        record('signin', false, {
          errorKind: 'sign_count_regressed',
          detail: {
            credentialId: bumped.credentialId,
            previousSignCount,
            signCount: bumped.signCount,
          },
        });
        throw new Error(
          `makeMockAdapter.signin: signCount did not advance (previous=${previousSignCount}, new=${bumped.signCount})`,
        );
      }
      server.persistCredential(bumped);
      record('signin', true, {
        detail: {
          credentialId: bumped.credentialId,
          previousSignCount,
          signCount: bumped.signCount,
        },
      });
      return {
        assertionResponse,
        verifiedCredential: bumped,
        previousSignCount,
      };
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
