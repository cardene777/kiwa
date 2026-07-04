/**
 * WebAuthn wire format helpers. WebAuthn L3 §5.2 encodes challenge, credential
 * ID, clientDataJSON, attestationObject, authenticatorData, and signature as
 * base64url without padding. The mock uses the same encoding so the shapes
 * round-trip through real RP libraries (`@simplewebauthn/server`, `fido2-lib`,
 * etc.) even though the mock signature is deterministic.
 */

function toBytes(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new TextEncoder().encode(input);
}

export function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = toBytes(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const b64 = padded + padding;
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Normalize a challenge or credential.id that a caller may hand in as either
 * `string` (base64url or plain UTF-8) or `Uint8Array`.
 */
export function normalizeChallenge(input: string | Uint8Array): string {
  if (input instanceof Uint8Array) return base64UrlEncode(input);
  // If the string is already base64url (no invalid chars) return as-is.
  if (/^[A-Za-z0-9_-]+$/.test(input)) return input;
  return base64UrlEncode(input);
}

/**
 * Deterministic mock signature over `(publicKey || authenticatorData || clientDataJSONHash)`.
 * Real WebAuthn signatures are ES256 / RS256 / EdDSA over that concatenation
 * (WebAuthn L3 §6.5.4). The mock uses a fnv-1a hash for stability across runs
 * so fixture comparisons stay deterministic.
 */
export function mockSignature(
  publicKey: string,
  authenticatorData: string,
  clientDataHash: string,
): string {
  const input = `${publicKey}::${authenticatorData}::${clientDataHash}`;
  // fnv-1a 32-bit; sufficient for a deterministic mock.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    bytes[i] = (hash >>> ((i % 4) * 8)) & 0xff;
  }
  return base64UrlEncode(bytes);
}

/**
 * SHA-256-like deterministic digest for clientDataJSON. WebAuthn L3 §7.1 uses
 * SHA-256; the mock uses fnv-1a widened to 32 bytes for a deterministic short
 * digest that fits the same byte width as SHA-256.
 */
export function clientDataHash(clientDataJSON: string): string {
  let hash = 0x811c9dc5;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < clientDataJSON.length; i += 1) {
    hash ^= clientDataJSON.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    const slot = i % 32;
    bytes[slot] = (bytes[slot] ?? 0) ^ ((hash >>> ((i % 4) * 8)) & 0xff);
  }
  return base64UrlEncode(bytes);
}
