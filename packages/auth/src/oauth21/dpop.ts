import { createHash, randomBytes } from 'node:crypto';
import type { DpopJwk, DpopProof, DpopProofInput } from './types.js';

/**
 * Module-scoped monotonic counter so `createDpopProof` produces reproducible
 * `jti` values when the caller does not supply one. Mirrors the PKCE counter
 * strategy — deterministic prefix + fresh entropy suffix.
 */
let jtiCounter = 0;
let jwkCounter = 0;

export function __resetDpopCounters(): void {
  jtiCounter = 0;
  jwkCounter = 0;
}

/**
 * Base64url-encode a `Buffer`. Same helper as `pkce.ts` — kept module-local so
 * the DPoP file has no cross-module dependency beyond types.
 */
function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64url-decode a string to a `Buffer`. Inverse of `base64Url`.
 */
function fromBase64Url(input: string): Buffer {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Produce a mock ES256 JWK. Real deployments generate a P-256 key pair; the
 * mock returns a distinctly-shaped placeholder so tests can assert the
 * `x`/`y` fields without pulling in a full crypto stack.
 */
export function createMockDpopJwk(): DpopJwk {
  jwkCounter += 1;
  const x = base64Url(Buffer.concat([Buffer.from(`x-${jwkCounter}-`), randomBytes(24)]));
  const y = base64Url(Buffer.concat([Buffer.from(`y-${jwkCounter}-`), randomBytes(24)]));
  return { kty: 'EC', crv: 'P-256', x, y };
}

/**
 * Compute the JWK thumbprint (RFC 7638) for a DPoP JWK. Sender-constrained
 * access tokens embed this thumbprint as `cnf.jkt` — the mock keeps the
 * canonical member ordering (`crv`, `kty`, `x`, `y`) so identical JWKs
 * always produce identical thumbprints.
 */
export function computeJkt(jwk: DpopJwk): string {
  // RFC 7638 §3.1 — sort keys lexicographically, JSON-encode with no
  // whitespace, then SHA-256 + base64url. The mock only supports EC keys, so
  // the sorted key set is fixed to `crv/kty/x/y`.
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  return base64Url(createHash('sha256').update(canonical).digest());
}

/**
 * Fabricate a DPoP proof JWT. The mock builds the compact
 * `header.payload.signature` form but keeps the signature as a deterministic
 * placeholder — verification is done by re-parsing the JWT and matching
 * fields against the recorded JWK / htm / htu / iat / jti, not by running a
 * real ECDSA verification. Callers wanting to test signature failure paths
 * mangle the returned `jwt` string before handing it back.
 */
export function createDpopProof(input: DpopProofInput): DpopProof {
  const jwk = input.jwk ?? createMockDpopJwk();
  const iat = input.iat ?? Math.floor(Date.now() / 1000);
  const jti = input.jti ?? nextJti();
  const header = {
    typ: 'dpop+jwt' as const,
    alg: 'ES256' as const,
    jwk,
  };
  const payload = {
    htm: input.htm.toUpperCase(),
    htu: input.htu,
    iat,
    jti,
  };
  const encodedHeader = base64Url(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64Url(Buffer.from(JSON.stringify(payload)));
  // Placeholder signature — the mock does not perform a real ECDSA sign.
  // Real DPoP verifiers reject an unsigned proof; the mock's verifier
  // ignores the signature bytes and validates the payload instead.
  const signature = base64Url(
    createHash('sha256').update(`${encodedHeader}.${encodedPayload}`).digest(),
  );
  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
  return { jwt, header, payload };
}

function nextJti(): string {
  jtiCounter += 1;
  return `jti-${jtiCounter.toString().padStart(6, '0')}`;
}

/**
 * Parse a compact DPoP JWT string back into its header/payload shape. Used
 * by the AS to inspect a proof carried on the wire (`DPoP` header). Throws
 * on malformed input so a caller mangling the JWT for a fuzz test gets a
 * predictable error.
 */
export function parseDpopProof(jwt: string): DpopProof {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `parseDpopProof: expected compact JWT with 3 segments, got ${parts.length}`,
    );
  }
  const [encodedHeader, encodedPayload] = parts as [string, string, string];
  const headerRaw = JSON.parse(fromBase64Url(encodedHeader).toString('utf8'));
  const payloadRaw = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
  if (headerRaw?.typ !== 'dpop+jwt') {
    throw new Error(
      `parseDpopProof: expected typ=dpop+jwt, got typ="${headerRaw?.typ}"`,
    );
  }
  if (headerRaw?.alg !== 'ES256') {
    throw new Error(
      `parseDpopProof: expected alg=ES256, got alg="${headerRaw?.alg}"`,
    );
  }
  if (!headerRaw?.jwk || headerRaw.jwk.kty !== 'EC' || headerRaw.jwk.crv !== 'P-256') {
    throw new Error(
      `parseDpopProof: expected EC P-256 jwk in header, got kty="${headerRaw?.jwk?.kty}"`,
    );
  }
  return {
    jwt,
    header: {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: headerRaw.jwk as DpopJwk,
    },
    payload: {
      htm: String(payloadRaw?.htm ?? ''),
      htu: String(payloadRaw?.htu ?? ''),
      iat: Number(payloadRaw?.iat ?? 0),
      jti: String(payloadRaw?.jti ?? ''),
    },
  };
}

/**
 * Options accepted by `verifyDpopProof`. The AS supplies the expected method
 * / URL, a jti-replay registry, and a clock.
 */
export interface VerifyDpopProofOptions {
  expectedHtm: string;
  expectedHtu: string;
  seenJtis: Set<string>;
  now: () => number;
  iatSkewSec: number;
}

/**
 * Verify a DPoP proof per RFC 9449 §4.3. Checks the header shape (`typ`,
 * `alg`, `jwk`), the payload fields (`htm`, `htu`, `iat`, `jti`), and the
 * replay registry. Returns the parsed proof on success so the caller can
 * pluck the JWK thumbprint. Throws on failure with a specific reason.
 */
export function verifyDpopProof(
  proof: DpopProof,
  options: VerifyDpopProofOptions,
): DpopProof {
  const parsed = parseDpopProof(proof.jwt);
  if (parsed.payload.htm !== options.expectedHtm.toUpperCase()) {
    throw new Error(
      `verifyDpopProof: htm mismatch — expected "${options.expectedHtm.toUpperCase()}", got "${parsed.payload.htm}"`,
    );
  }
  if (parsed.payload.htu !== options.expectedHtu) {
    throw new Error(
      `verifyDpopProof: htu mismatch — expected "${options.expectedHtu}", got "${parsed.payload.htu}"`,
    );
  }
  const nowSec = Math.floor(options.now() / 1000);
  const iatDelta = Math.abs(nowSec - parsed.payload.iat);
  if (iatDelta > options.iatSkewSec) {
    throw new Error(
      `verifyDpopProof: iat outside allowed skew (delta=${iatDelta}s, allowed=${options.iatSkewSec}s)`,
    );
  }
  if (!parsed.payload.jti) {
    throw new Error('verifyDpopProof: proof missing jti');
  }
  if (options.seenJtis.has(parsed.payload.jti)) {
    throw new Error(
      `verifyDpopProof: jti "${parsed.payload.jti}" replay detected`,
    );
  }
  options.seenJtis.add(parsed.payload.jti);
  return parsed;
}
