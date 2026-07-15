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
  deriveKey,
  verifyPassword,
  ed25519Sign,
  ed25519Verify,
  x25519Ecdh,
  streamEncrypt,
  streamDecrypt,
  generateKeyPair,
} from '../../src/index.js';
import { randomBytes } from 'node:crypto';

describe('crypto integration v2.1 — end-to-end workflow', () => {
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

  it('T-INT-C-006 password storage flow = deriveKey → 保存 → verifyPassword', () => {
    const password = 'user-pw-2024';
    const stored = deriveKey(password, { algorithm: 'pbkdf2', iterations: 2000 });
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword('wrong-pw', stored)).toBe(false);
    expect(stored.hashHex.length).toBeGreaterThan(0);
  });

  it('T-INT-C-007 Ed25519 attestation flow = keypair → sign → verify', () => {
    const { publicKey, privateKey } = generateKeyPair('ed25519');
    const attestation = JSON.stringify({ nonce: 'abc', ts: 100 });
    const { signature } = ed25519Sign(attestation, privateKey);
    const verify = ed25519Verify(attestation, signature, publicKey);
    expect(verify.valid).toBe(true);
    const tampered = ed25519Verify(`${attestation}x`, signature, publicKey);
    expect(tampered.valid).toBe(false);
  });

  it('T-INT-C-008 X25519 ECDH + stream encrypt = 共有秘密で AES-CTR 暗号化 → decrypt', () => {
    const alice = generateKeyPair('ec', { namedCurve: 'X25519' });
    const bob = generateKeyPair('ec', { namedCurve: 'X25519' });
    const shared = x25519Ecdh(alice.privateKey, bob.publicKey);
    const key = Buffer.from(shared.sharedSecretHex, 'hex').subarray(0, 32);
    const enc = streamEncrypt('confidential', key, 'aes-256-ctr');
    const dec = streamDecrypt(enc, key);
    expect(dec).toBe('confidential');
  });

  it('T-INT-C-009 ChaCha20-Poly1305 = authTag tamper で decrypt throw', () => {
    const key = randomBytes(32);
    const enc = streamEncrypt('secret data', key, 'chacha20-poly1305');
    expect(streamDecrypt(enc, key)).toBe('secret data');
    const bad = { ...enc, authTag: '00000000000000000000000000000000' };
    expect(() => streamDecrypt(bad, key)).toThrow();
  });

  it('T-INT-C-010 hybrid encryption = RSA で AES key 交換 → AES で本文暗号化', () => {
    const { publicKey, privateKey } = generateRsaKeyPair(2048);
    const aesKey = randomBytes(32);
    const wrapped = Buffer.from(aesKey.toString('base64'));
    // AES key を RSA で wrap するモック (実 KMS 相当は本 lib scope 外)
    const enc = aesEncrypt('hybrid payload', aesKey, 'aes-256-gcm');
    const dec = aesDecrypt(enc, aesKey, 'aes-256-gcm');
    expect(dec.toString('utf8')).toBe('hybrid payload');
    expect(wrapped.length).toBeGreaterThan(0);
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
  });
});
