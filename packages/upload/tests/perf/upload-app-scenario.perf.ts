/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createUploadClient, createPresignedUrl, uploadMultipart, verifyUpload } from '../../src/index.js';

const MODULE = 'upload-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('upload app scenario perf (real workload)', () => {
  it('3-layer perf: upload_workflow / presigned_batch / size_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'upload_workflow (10 upload across 4 providers + multipart)',
          fn: async () => {
            const providers = ['s3', 'gcs', 'r2', 'cloudinary'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createUploadClient({ provider: providers[i % 4] });
              if (i % 3 === 0) {
                await uploadMultipart(client, 'bkt', `mp-${i}`, [
                  { partNumber: 1, body: `part1-${i}` },
                  { partNumber: 2, body: `part2-${i}` },
                ]);
              } else {
                await client.upload({ bucket: 'bkt', key: `k-${i}`, body: Buffer.from(`data-${i}`) });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'presigned_batch (5 presigned URL PUT/GET across providers)',
          fn: async () => {
            const providers = ['s3', 'gcs', 'r2', 'cloudinary'] as const;
            for (let i = 0; i < 5; i++) {
              createPresignedUrl({
                provider: providers[i % 4]!,
                bucket: 'bkt',
                key: `presign-${i}`,
                operation: i % 2 === 0 ? 'put' : 'get',
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'size_error_handling (5 oversize + checksum verify)',
          fn: async () => {
            const client = createUploadClient({ provider: 's3', maxSizeBytes: 100 });
            const big = Buffer.alloc(200);
            for (let i = 0; i < 5; i++) {
              const res = await client.upload({ bucket: 'b', key: `over-${i}`, body: big });
              if (res.status !== 'failed') throw new Error('expected size failure');
              verifyUpload({ body: big, expectedSize: 100 });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
