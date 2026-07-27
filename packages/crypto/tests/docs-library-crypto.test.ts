import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  aesDecrypt,
  aesEncrypt,
  deriveKey,
  hmacDigest,
  signJWT,
  verifyJWT,
  verifyPassword,
} from '../src/index.js';

describe('library documentation crypto recipes', () => {
  it('uses only a JWT verified with its expected secret and algorithm', () => {
    const token = signJWT({ sub: 'user-42', role: 'admin' }, 'srv-secret', 'HS256');
    const verified = verifyJWT(token, 'srv-secret', 'HS256');
    const rejected = verifyJWT(token, 'wrong-secret', 'HS256');

    expect(verified).toMatchObject({ valid: true, payload: { sub: 'user-42', role: 'admin' } });
    expect(rejected).toMatchObject({ valid: false, reason: 'signature mismatch' });
  });

  it('round-trips AES GCM and rejects a modified authentication tag', () => {
    const key = randomBytes(32);
    const encrypted = aesEncrypt('sensitive message', key, 'aes-256-gcm');
    const tag = Buffer.from(encrypted.authTag!);
    tag[0] = tag[0]! ^ 0xff;

    expect(aesDecrypt(encrypted, key, 'aes-256-gcm').toString('utf8')).toBe('sensitive message');
    expect(() => aesDecrypt(
      { ciphertext: encrypted.ciphertext, iv: encrypted.iv, authTag: tag },
      key,
      'aes-256-gcm',
    )).toThrow();
  });

  it('stores a derived password value and detects a modified HMAC payload', () => {
    const stored = deriveKey('user-pw-2024', { algorithm: 'pbkdf2', iterations: 2000 });
    const payload = '{"event":"account.created"}';
    const signature = hmacDigest(payload, 'webhook-secret', 'sha256');

    expect(verifyPassword('user-pw-2024', stored)).toBe(true);
    expect(verifyPassword('wrong-pw', stored)).toBe(false);
    expect(hmacDigest(payload, 'webhook-secret', 'sha256')).toBe(signature);
    expect(hmacDigest(`${payload}changed`, 'webhook-secret', 'sha256')).not.toBe(signature);
  });
});
