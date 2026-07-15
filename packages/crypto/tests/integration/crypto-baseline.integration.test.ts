import { describe, expect, it } from 'vitest';
import {
  signJWT,
  verifyJWT,
  aesEncrypt,
  aesDecrypt,
  hashData,
  hmacDigest,
  generateRsaKeyPair,
  rsaSign,
  rsaVerify,
} from '../../src/index.js';
import { randomBytes } from 'node:crypto';

describe('crypto integration — end-to-end workflow', () => {
  it('T-INT-C-001 JWT auth flow = sign → transport → verify → payload extract', () => {
    const secret = 'srv-secret';
    const token = signJWT({ sub: 'user-42', role: 'admin' }, secret, 'HS256');
    const verified = verifyJWT(token, secret, 'HS256');
    expect(verified.valid).toBe(true);
    expect(verified.payload).toMatchObject({ sub: 'user-42', role: 'admin' });
  });

  it('T-INT-C-002 encrypted message pipeline = aes encrypt → hash → verify hash → decrypt', () => {
    const key = randomBytes(32);
    const plaintext = 'sensitive message';
    const enc = aesEncrypt(plaintext, key, 'aes-256-gcm');
    const encHash = hashData(enc.ciphertext, 'sha256');
    expect(encHash).toMatch(/^[0-9a-f]{64}$/);
    const dec = aesDecrypt(enc, key, 'aes-256-gcm');
    expect(dec.toString('utf8')).toBe(plaintext);
  });

  it('T-INT-C-003 RSA sign + verify で 3rd party gate 通過', () => {
    const { publicKey, privateKey } = generateRsaKeyPair(2048);
    const payload = 'contract terms';
    const sig = rsaSign(payload, privateKey);
    const r = rsaVerify(payload, sig, publicKey);
    expect(r.valid).toBe(true);
  });

  it('T-INT-C-004 webhook HMAC 検証 = hmacDigest(payload, secret) を signature と比較', () => {
    const secret = 'webhook-secret';
    const payload = '{"event":"payment.succeeded","id":"pi_123"}';
    const sig = hmacDigest(payload, secret, 'sha256');
    const check = hmacDigest(payload, secret, 'sha256');
    expect(sig).toBe(check);
    const tampered = hmacDigest(`${payload}extra`, secret, 'sha256');
    expect(tampered).not.toBe(sig);
  });

  it('T-INT-C-005 GCM authTag tamper 検知 = authTag 改竄で decrypt throw', () => {
    const key = randomBytes(32);
    const enc = aesEncrypt('secret', key, 'aes-256-gcm');
    if (!enc.authTag) throw new Error('expected authTag for GCM');
    const tamperedTag = Buffer.from(enc.authTag);
    tamperedTag[0] = tamperedTag[0]! ^ 0xff;
    expect(() =>
      aesDecrypt({ ciphertext: enc.ciphertext, iv: enc.iv, authTag: tamperedTag }, key, 'aes-256-gcm'),
    ).toThrow();
  });
});
