import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { hashData, hmacDigest } from '../../src/hash.js';
import { signJWT, verifyJWT } from '../../src/jwt.js';

describe('crypto primitives fidelity vs node:crypto reference', () => {
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
});
