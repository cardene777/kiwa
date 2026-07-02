import { createHmac, randomBytes } from 'node:crypto';
import type { SiweMessage } from './types.js';

/**
 * EIP-4361 (Sign-In with Ethereum) helpers. Real SIWE relies on secp256k1
 * message signing + ecrecover to derive the address from a signature — the
 * mock replaces the signature primitive with an HMAC over the canonical
 * message + address, which is enough to model happy-path + tamper-detection
 * behaviors without pulling in a full crypto library.
 */

export function generateSiweNonce(): string {
  // EIP-4361 requires >= 8 alphanumeric chars.
  return randomBytes(12).toString('hex').slice(0, 17);
}

/**
 * Build the canonical EIP-4361 message string. Consumers can hash + sign this
 * verbatim with a real client library, and the mock will verify it back.
 */
export function serializeSiweMessage(msg: SiweMessage): string {
  const lines: string[] = [];
  lines.push(`${msg.domain} wants you to sign in with your Ethereum account:`);
  lines.push(msg.address);
  lines.push('');
  lines.push(msg.statement);
  lines.push('');
  lines.push(`URI: ${msg.uri}`);
  lines.push(`Version: ${msg.version}`);
  lines.push(`Chain ID: ${msg.chainId}`);
  lines.push(`Nonce: ${msg.nonce}`);
  lines.push(`Issued At: ${msg.issuedAt}`);
  if (msg.expirationTime !== undefined) lines.push(`Expiration Time: ${msg.expirationTime}`);
  if (msg.notBefore !== undefined) lines.push(`Not Before: ${msg.notBefore}`);
  if (msg.requestId !== undefined) lines.push(`Request ID: ${msg.requestId}`);
  if (msg.resources !== undefined && msg.resources.length > 0) {
    lines.push('Resources:');
    for (const r of msg.resources) lines.push(`- ${r}`);
  }
  return lines.join('\n');
}

/**
 * HMAC-based "sign" — stand-in for secp256k1 that lets the test verify the
 * same key material produced both the challenge issuance and the signature.
 * The mock key is treated as both the private key + address input.
 */
export function signSiweMessage(input: { message: SiweMessage; privateKey: string }): string {
  const canonical = serializeSiweMessage(input.message);
  // Bind the signature to the address so a signature for one address cannot
  // be replayed for another — mirroring ecrecover's uniqueness guarantee.
  const domain = `${canonical}|${input.message.address.toLowerCase()}`;
  return createHmac('sha256', input.privateKey).update(domain).digest('base64');
}

export function verifySiweSignature(input: {
  message: SiweMessage;
  signature: string;
  privateKey: string;
}): boolean {
  const expected = signSiweMessage({
    message: input.message,
    privateKey: input.privateKey,
  });
  return expected === input.signature;
}

/**
 * Derive a deterministic pseudo-Ethereum address from a private key. Real
 * addresses come from keccak256(pubkey)[-20:]; the mock uses a deterministic
 * HMAC → 20 bytes → 0x-prefixed hex string. Good enough for tests that need
 * uniqueness + a consistent address per key.
 */
export function deriveMockAddress(privateKey: string): string {
  const hex = createHmac('sha256', privateKey).update('address').digest('hex').slice(0, 40);
  return `0x${hex}`;
}
