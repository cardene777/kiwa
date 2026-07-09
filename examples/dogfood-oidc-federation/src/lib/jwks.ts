/**
 * JWKS route helpers — expose the active JWKS key shape assertions + the
 * rotation retention semantics that fidelity axis 4 pins.
 *
 * The mock's `env.jwks.rotate()` mints a fresh signing key + retires the
 * previous key with a retention window; the helpers here are used by the
 * fidelity harness + Sub-Issue v1.21-4d's rotation e2e to prove that a
 * retired key remains verifiable until its `retiredAt` fires.
 */

import type { JwksDocument, JwksKey } from '@kiwa-lab/auth';

/**
 * Error thrown when the JWKS document violates RFC 7517 §4 mandatory
 * fields. The mock always returns compliant keys; the guard exists so a
 * downstream regression that drops `kid` (or emits an alg outside RS256 /
 * ES256) trips the fidelity harness.
 */
export class JwksShapeError extends Error {
  constructor(message: string) {
    super(`jwks: ${message}`);
    this.name = 'JwksShapeError';
  }
}

/**
 * Assert a JWKS key satisfies the RS256 / ES256 shape the mock advertises.
 * RS256 keys carry `kty=RSA` + `n` + `e`; ES256 keys carry `kty=EC` +
 * `crv=P-256` + `x` + `y`. `use=sig` + `kid` are mandatory in both
 * variants.
 */
export function assertKeyShape(key: JwksKey): void {
  if (typeof key.kid !== 'string' || key.kid.length === 0) {
    throw new JwksShapeError('key missing kid');
  }
  if (key.use !== 'sig') {
    throw new JwksShapeError(`key ${key.kid} has non-sig use "${key.use}"`);
  }
  if (key.alg === 'RS256') {
    if (key.kty !== 'RSA') {
      throw new JwksShapeError(`key ${key.kid} alg=RS256 must have kty=RSA`);
    }
    if (typeof key.n !== 'string' || typeof key.e !== 'string') {
      throw new JwksShapeError(`key ${key.kid} RSA key missing n/e`);
    }
    return;
  }
  if (key.alg === 'ES256') {
    if (key.kty !== 'EC') {
      throw new JwksShapeError(`key ${key.kid} alg=ES256 must have kty=EC`);
    }
    if (key.crv !== 'P-256' || typeof key.x !== 'string' || typeof key.y !== 'string') {
      throw new JwksShapeError(
        `key ${key.kid} EC key missing crv=P-256/x/y`,
      );
    }
    return;
  }
  throw new JwksShapeError(`key ${key.kid} has unsupported alg "${key.alg}"`);
}

/**
 * Assert every key in a JWKS document satisfies {@link assertKeyShape}.
 * The document itself must carry a non-empty `keys` array (RFC 7517 §5).
 */
export function assertJwksDocumentShape(document: JwksDocument): void {
  if (!Array.isArray(document.keys) || document.keys.length === 0) {
    throw new JwksShapeError('document has empty keys array');
  }
  for (const key of document.keys) {
    assertKeyShape(key);
  }
}

/**
 * Return the currently-active key from a JWKS document. The mock treats the
 * key without a `retiredAt` field as active; there must be exactly one such
 * key at any time.
 */
export function pickActiveKey(document: JwksDocument): JwksKey {
  const active = document.keys.filter((key) => key.retiredAt === undefined);
  if (active.length === 0) {
    throw new JwksShapeError('document has no active (non-retired) key');
  }
  if (active.length > 1) {
    throw new JwksShapeError(
      `document has ${active.length} active keys; expected exactly 1`,
    );
  }
  const first = active[0];
  if (first === undefined) {
    // Unreachable — length === 1 branch above already returned. Kept for
    // TypeScript exact-index safety in strict mode.
    throw new JwksShapeError('document.keys[0] undefined');
  }
  return first;
}

/**
 * Return every retired key still in the retention window. The mock keeps
 * retired keys in the JWKS document until `now > retiredAt` so an id_token
 * signed under the old kid stays verifiable while the window is open.
 */
export function pickRetiredKeys(document: JwksDocument): readonly JwksKey[] {
  return document.keys.filter((key) => key.retiredAt !== undefined);
}
