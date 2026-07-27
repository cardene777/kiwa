import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { signJWT, verifyJWT } from '../../src/jwt.js';
import { hashData, hmacDigest } from '../../src/hash.js';
import { aesEncrypt, aesDecrypt } from '../../src/aes.js';
import { randomBytes } from 'node:crypto';

const MODULE = 'crypto';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: JWT sign+verify / hash / AES encrypt/decrypt primary paths',
    async () => {
      const secret = 'test-secret';
      const key = randomBytes(32);
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'signAndVerifyJWT',
            serialP95CapMs: 5,
            fn: async () => {
              const token = signJWT({ sub: '1' }, secret, 'HS256');
              verifyJWT(token, secret, 'HS256');
            },
          },
          {
            name: 'hashSha256',
            serialP95CapMs: 5,
            fn: async () => {
              hashData('payload', 'sha256');
              hmacDigest('payload', secret, 'sha256');
            },
          },
          {
            name: 'aesGcmRoundtrip',
            serialP95CapMs: 5,
            fn: async () => {
              const enc = aesEncrypt('secret data', key, 'aes-256-gcm');
              aesDecrypt(enc, key, 'aes-256-gcm');
            },
          },
        ],
      });
      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed).toBe(true);
        expect.soft(outcome.concurrentGatePassed).toBe(true);
        expect.soft(outcome.memoryGatePassed).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it('timing baseline: performance.now() 100 回連続で serial p95 < 1ms', () => {
    const N = 100;
    const samples: number[] = [];
    for (let i = 0; i < N; i += 1) {
      const s = performance.now();
      void performance.now();
      samples.push(performance.now() - s);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
    expect(p95).toBeLessThan(1);
  }, 30_000);

  it('allocation baseline: 小 object 100 回生成の max latency < 5ms', () => {
    const N = 100;
    let maxLatency = 0;
    for (let i = 0; i < N; i += 1) {
      const start = performance.now();
      const obj = { id: i, val: `v${i}`, ts: Date.now() };
      if (obj.id < 0) throw new Error('unreachable');
      const elapsed = performance.now() - start;
      if (elapsed > maxLatency) maxLatency = elapsed;
    }
    expect(maxLatency).toBeLessThan(5);
  }, 30_000);
});
