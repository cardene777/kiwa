import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { hashData, hmacDigest } from '../../src/hash.js';
import { signJWT, verifyJWT } from '../../src/jwt.js';
import { deriveKey, verifyPassword } from '../../src/kdf.js';
import { generateKeyPair } from '../../src/keypair.js';
import { ed25519Sign, ed25519Verify, x25519Ecdh } from '../../src/ed25519.js';
import { streamEncrypt, streamDecrypt } from '../../src/stream.js';

describe('crypto primitives fidelity v2.1', () => {
  it('hashData(sha256) = node createHash sha256 と一致', async () => {
    const result = await assertFidelity({
      mockFn: async (data: string) => hashData(data, 'sha256'),
      realFn: async (data: string) => createHash('sha256').update(data).digest('hex'),
      cases: [
        { name: 'short string', args: ['hello'] },
        { name: 'empty string', args: [''] },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('hmacDigest(sha256) = node createHmac sha256 と一致', async () => {
    const result = await assertFidelity({
      mockFn: async (data: string) => hmacDigest(data, 'secret', 'sha256'),
      realFn: async (data: string) => createHmac('sha256', 'secret').update(data).digest('hex'),
      cases: [{ name: 'payload', args: ['payload'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('JWT sign+verify HS256 で valid=true', () => {
    const token = signJWT({ sub: 'user' }, 'secret', 'HS256');
    const result = verifyJWT(token, 'secret', 'HS256');
    expect(result.valid).toBe(true);
    expect(result.payload).toEqual({ sub: 'user' });
  });

  it('JWT verify で secret 不一致は valid=false', () => {
    const token = signJWT({ sub: 'x' }, 'secret', 'HS256');
    const result = verifyJWT(token, 'wrong-secret', 'HS256');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature mismatch');
  });

  it('hashData の 4 algorithm (sha256/sha512/blake2b512/sha1) 全て deterministic', () => {
    const data = 'test';
    const algs = ['sha256', 'sha512', 'blake2b512', 'sha1'] as const;
    for (const alg of algs) {
      const a = hashData(data, alg);
      const b = hashData(data, alg);
      expect(a).toBe(b);
      expect(a.length).toBeGreaterThan(0);
    }
  });

  it('KDF pbkdf2 = deriveKey → verifyPassword ラウンドトリップ', () => {
    const stored = deriveKey('password123', { algorithm: 'pbkdf2', iterations: 1000 });
    expect(verifyPassword('password123', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
  });

  it('KDF scrypt = deriveKey → verifyPassword ラウンドトリップ', () => {
    const stored = deriveKey('pass', { algorithm: 'scrypt', N: 1024 });
    expect(verifyPassword('pass', stored)).toBe(true);
    expect(verifyPassword('nope', stored)).toBe(false);
  });

  it('Ed25519 sign + verify = valid=true', () => {
    const { publicKey, privateKey } = generateKeyPair('ed25519');
    const { signature } = ed25519Sign('message', privateKey);
    const verify = ed25519Verify('message', signature, publicKey);
    expect(verify.valid).toBe(true);
  });

  it('X25519 ECDH = 双方向で同 shared secret を導出', () => {
    const alice = generateKeyPair('ec', { namedCurve: 'X25519' });
    const bob = generateKeyPair('ec', { namedCurve: 'X25519' });
    const a = x25519Ecdh(alice.privateKey, bob.publicKey);
    const b = x25519Ecdh(bob.privateKey, alice.publicKey);
    expect(a.sharedSecretHex).toBe(b.sharedSecretHex);
  });

  it('stream cipher (aes-256-ctr / chacha20-poly1305) roundtrip decrypt が原文一致', () => {
    const key = randomBytes(32);
    const ctr = streamEncrypt('hello', key, 'aes-256-ctr');
    expect(streamDecrypt(ctr, key)).toBe('hello');
    const chacha = streamEncrypt('world', key, 'chacha20-poly1305');
    expect(streamDecrypt(chacha, key)).toBe('world');
  });
});
