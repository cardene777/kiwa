/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { signJWT, verifyJWT } from '../../src/jwt.js';
import { aesEncrypt, aesDecrypt } from '../../src/aes.js';
import { hashData, hmacDigest } from '../../src/hash.js';
import { generateRsaKeyPair, rsaSign, rsaVerify } from '../../src/rsa.js';
import { deriveKey, verifyPassword } from '../../src/kdf.js';
import { streamEncrypt, streamDecrypt } from '../../src/stream.js';
import { generateKeyPair } from '../../src/keypair.js';
import { ed25519Sign, ed25519Verify } from '../../src/ed25519.js';
import { randomBytes } from 'node:crypto';

const MODULE = 'crypto-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('crypto app scenario perf v2.1 (real workload)', () => {
  it('5-op perf: auth / encryption / kdf / stream / ed25519', async () => {
    const { publicKey, privateKey } = generateRsaKeyPair(2048);
    const secret = 'shared-secret-for-jwt';
    const aesKey = randomBytes(32);
    const edKeys = generateKeyPair('ed25519');

    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 200,
      serialWarmup: 20,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'auth_token_workflow (10 sign+verify+hash)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const token = signJWT({ sub: `u-${i}`, iat: i }, secret, 'HS256');
              const result = verifyJWT(token, secret, 'HS256');
              if (!result.valid) throw new Error('unexpected verify fail');
              hmacDigest(token, secret, 'sha256');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const plaintext = `sensitive data ${i}`;
              const enc = aesEncrypt(plaintext, aesKey, 'aes-256-gcm');
              const dec = aesDecrypt(enc, aesKey, 'aes-256-gcm');
              if (dec.toString('utf8') !== plaintext) throw new Error('roundtrip failed');
              hashData(dec, 'sha256');
            }
          },
          serialP95CapMs: 200,
        },
        {
          name: 'kdf_password_batch (5 pbkdf2 derive+verify)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const stored = deriveKey(`pw-${i}`, { algorithm: 'pbkdf2', iterations: 1000 });
              if (!verifyPassword(`pw-${i}`, stored)) throw new Error('kdf verify fail');
            }
          },
          serialP95CapMs: 1000,
        },
        {
          name: 'stream_cipher_batch (5 chacha20 encrypt+decrypt)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const enc = streamEncrypt(`stream-${i}`, aesKey, 'chacha20-poly1305');
              const dec = streamDecrypt(enc, aesKey);
              if (dec !== `stream-${i}`) throw new Error('stream roundtrip fail');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'ed25519_batch (5 sign+verify + 5 RSA sig error)',
          fn: async () => {
            const data = 'signed payload';
            for (let i = 0; i < 5; i++) {
              const { signature } = ed25519Sign(`msg-${i}`, edKeys.privateKey);
              const v = ed25519Verify(`msg-${i}`, signature, edKeys.publicKey);
              if (!v.valid) throw new Error('ed25519 verify fail');
            }
            const sig = rsaSign(data, privateKey);
            for (let i = 0; i < 5; i++) {
              const tampered = Buffer.concat([sig, Buffer.from([i])]);
              const result = rsaVerify(data, tampered, publicKey);
              if (result.valid) throw new Error('tampered sig should not verify');
            }
          },
          serialP95CapMs: 500,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
