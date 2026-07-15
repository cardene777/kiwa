/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { signJWT, verifyJWT } from '../../src/jwt.js';
import { aesEncrypt, aesDecrypt } from '../../src/aes.js';
import { hashData, hmacDigest } from '../../src/hash.js';
import { generateRsaKeyPair, rsaSign, rsaVerify } from '../../src/rsa.js';
import { randomBytes } from 'node:crypto';

const MODULE = 'crypto-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('crypto app scenario perf (real workload)', () => {
  it('3-layer perf: auth_token_workflow / data_encryption_batch / signature_verify_error', async () => {
    const { publicKey, privateKey } = generateRsaKeyPair(2048);
    const secret = 'shared-secret-for-jwt';
    const aesKey = randomBytes(32);

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
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
          name: 'signature_verify_error_handling (5 invalid RSA verify)',
          fn: async () => {
            const data = 'signed payload';
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
    expect(result).toBeDefined();
  });
});
