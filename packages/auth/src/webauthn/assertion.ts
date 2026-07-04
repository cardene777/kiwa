import {
  base64UrlEncode,
  clientDataHash,
  mockSignature,
  normalizeChallenge,
} from './encoding.js';
import type {
  AuthenticatorAssertionResponse,
  PublicKeyCredentialRequestOptionsInit,
  VirtualAuthenticator,
  WebAuthnCredential,
} from './types.js';

/**
 * Bit flags encoded in authenticatorData (WebAuthn L3 §6.1). Only UP and UV
 * are surfaced through the mock; ED / AT / BE / BS are set to 0 for the
 * deterministic mock encoding.
 */
const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;

/**
 * Build the authenticatorData string. Real WebAuthn packs (rpIdHash || flags
 * || signCount || attestedCredentialData || extensions) as raw bytes; the
 * mock stands the SHA-256 rpIdHash off as the raw rpId bytes truncated to 32
 * so tests can decode `flags` and `signCount` off the wire without relying on
 * a real hash implementation.
 */
function encodeAuthenticatorData(
  rpId: string,
  flags: number,
  signCount: number,
): string {
  const bytes = new Uint8Array(37);
  const rpIdBytes = new TextEncoder().encode(rpId);
  for (let i = 0; i < 32; i += 1) {
    bytes[i] = rpIdBytes[i] ?? 0;
  }
  bytes[32] = flags;
  bytes[33] = (signCount >>> 24) & 0xff;
  bytes[34] = (signCount >>> 16) & 0xff;
  bytes[35] = (signCount >>> 8) & 0xff;
  bytes[36] = signCount & 0xff;
  return base64UrlEncode(bytes);
}

/**
 * Simulate `navigator.credentials.get({ publicKey })`. Produces an
 * `AuthenticatorAssertionResponse` shaped like WebAuthn L3 §5.2.2. Enforces
 * the RP-facing checks that a real RP library performs on the response —
 * clientData.type must be `webauthn.get`, challenge must match, user
 * verification bit must be set when requested, and signCount must increase
 * monotonically (§7.2 step 21).
 *
 * `credentialOwnership` maps `credentialId -> authenticatorId` so the mock
 * routes each assertion through the authenticator that actually holds the
 * credential. Real WebAuthn enforces this at the client-side discovery step
 * (§5.5) — the mock mirrors it so a bug that assumes credentials float
 * between authenticators surfaces at test time.
 */
export function credentialAssertion(
  options: PublicKeyCredentialRequestOptionsInit,
  registry: Map<string, WebAuthnCredential>,
  authenticators: readonly VirtualAuthenticator[],
  credentialOwnership: Map<string, string>,
): AuthenticatorAssertionResponse {
  if (!options.rpId) {
    throw new Error('credentialAssertion: rpId is required');
  }
  if (options.challenge === undefined || options.challenge === null) {
    throw new Error('credentialAssertion: challenge is required');
  }
  const allowList = options.allowCredentials ?? [];
  const candidates = allowList.length
    ? allowList
        .map((entry) => registry.get(entry.id))
        .filter((value): value is WebAuthnCredential => value !== undefined)
    : Array.from(registry.values());
  if (candidates.length === 0) {
    throw new Error(
      allowList.length
        ? 'credentialAssertion: allowCredentials matched no stored credential'
        : 'credentialAssertion: no credentials are registered — call credentialCreation first',
    );
  }
  // Pick the first credential whose owning authenticator is currently
  // user-present. Mirrors the client discovery step §5.5.
  let credential: WebAuthnCredential | undefined;
  let servingAuthenticator: VirtualAuthenticator | undefined;
  for (const candidate of candidates) {
    const ownerId = credentialOwnership.get(candidate.credentialId);
    const authenticator = ownerId
      ? authenticators.find((auth) => auth.id === ownerId)
      : undefined;
    if (authenticator && authenticator.isUserPresent) {
      credential = candidate;
      servingAuthenticator = authenticator;
      break;
    }
  }
  if (!credential || !servingAuthenticator) {
    throw new Error(
      'credentialAssertion: no user-present authenticator can serve the requested credentials',
    );
  }
  const userVerification = options.userVerification ?? 'preferred';
  const uvSatisfied = servingAuthenticator.hasUserVerification;
  if (userVerification === 'required' && !uvSatisfied) {
    throw new Error(
      'credentialAssertion: userVerification=required but authenticator does not support user verification',
    );
  }

  const challenge = normalizeChallenge(options.challenge);
  const clientData = {
    type: 'webauthn.get',
    challenge,
    origin: `https://${options.rpId}`,
    crossOrigin: false,
  };
  const clientDataJSON = base64UrlEncode(JSON.stringify(clientData));
  const clientDataDigest = clientDataHash(JSON.stringify(clientData));

  let flags = FLAG_USER_PRESENT;
  if (uvSatisfied) flags |= FLAG_USER_VERIFIED;
  // Monotonic increment on every successful assertion (§6.1.1).
  credential.signCount += 1;
  credential.lastUsedAt = Date.now();

  const authenticatorData = encodeAuthenticatorData(
    options.rpId,
    flags,
    credential.signCount,
  );
  const signature = mockSignature(
    credential.publicKey,
    authenticatorData,
    clientDataDigest,
  );

  return {
    credentialId: credential.credentialId,
    clientDataJSON,
    authenticatorData,
    signature,
    userHandle: credential.userHandle,
    signCount: credential.signCount,
  };
}
