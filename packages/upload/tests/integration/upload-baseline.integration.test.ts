/**
 * integration test — upload domain の end-to-end workflow (presigned URL 発行 →
 * multipart upload → checksum verify → delete lifecycle) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createUploadClient,
  createPresignedUrl,
  uploadMultipart,
  verifyUpload,
  computeChecksum,
} from '../../src/index.js';

describe('upload integration — presign → multipart → verify workflow', () => {
  it('T-INT-U-001 presigned URL 発行 → upload → get で lifecycle 完結', async () => {
    const client = createUploadClient({ provider: 's3' });
    const url = createPresignedUrl({ provider: 's3', bucket: 'b', key: 'k', operation: 'put' });
    expect(url.url).toContain('s3');
    const res = await client.upload({ bucket: 'b', key: 'k', body: Buffer.from('hi') });
    expect(res.status).toBe('uploaded');
    expect(client.get('b', 'k')?.size).toBe(2);
  });

  it('T-INT-U-002 multipart upload で parts が結合され checksum が一致', async () => {
    const client = createUploadClient({ provider: 'r2' });
    const parts = [
      { partNumber: 1, body: Buffer.from('AAA') },
      { partNumber: 2, body: Buffer.from('BBB') },
      { partNumber: 3, body: Buffer.from('CCC') },
    ];
    const mp = await uploadMultipart(client, 'b', 'mp', parts);
    const merged = Buffer.concat(parts.map((p) => p.body));
    const verify = verifyUpload({ body: merged, expectedChecksum: computeChecksum(merged) });
    expect(mp.totalSize).toBe(9);
    expect(verify.valid).toBe(true);
    expect(mp.result.etag).toBe(computeChecksum(merged));
  });

  it('T-INT-U-003 provider 別 upload で id prefix + host が異なる', async () => {
    const s3 = createUploadClient({ provider: 's3' });
    const gcs = createUploadClient({ provider: 'gcs' });
    const s3res = await s3.upload({ bucket: 'b', key: 'k', body: Buffer.from('x') });
    const gcsres = await gcs.upload({ bucket: 'b', key: 'k', body: Buffer.from('x') });
    expect(s3res.id.startsWith('s3-')).toBe(true);
    expect(gcsres.id.startsWith('gcs-')).toBe(true);
  });

  it('T-INT-U-004 size 超過 upload が failure status を返す', async () => {
    const client = createUploadClient({ provider: 'cloudinary', maxSizeBytes: 5 });
    const res = await client.upload({ bucket: 'b', key: 'big', body: Buffer.alloc(10) });
    expect(res.status).toBe('failed');
    expect(res.reason).toContain('size');
  });

  it('T-INT-U-005 checksum mismatch を verifyUpload が reject', () => {
    const body = Buffer.from('data');
    const result = verifyUpload({ body, expectedChecksum: 'deadbeef' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('checksum mismatch');
  });

  it('T-INT-U-006 uploadWithRetry: success 1 attempt', async () => {
    const { uploadWithRetry } = await import('../../src/index.js');
    const client = createUploadClient({ provider: 's3' });
    const result = await uploadWithRetry(client, { bucket: 'b', key: 'k', body: 'data' });
    expect(result.attempts).toBe(1);
    expect(result.status).toBe('uploaded');
  });

  it('T-INT-U-007 uploadBatch: 5 file concurrent upload', async () => {
    const { uploadBatch } = await import('../../src/index.js');
    const client = createUploadClient({ provider: 's3' });
    const reqs = Array.from({ length: 5 }, (_, i) => ({ bucket: 'b', key: `k${i}`, body: `data${i}` }));
    const result = await uploadBatch(client, reqs, 2);
    expect(result.total).toBe(5);
    expect(result.succeeded).toBe(5);
  });

  it('T-INT-U-008 uploadIdempotent: 同 key dedup', async () => {
    const { createIdempotencyCache, uploadIdempotent } = await import('../../src/index.js');
    const client = createUploadClient({ provider: 's3' });
    const cache = createIdempotencyCache();
    const first = await uploadIdempotent(client, { bucket: 'b', key: 'k', body: 'data' }, 'idem-1', cache);
    expect(first.cached).toBe(false);
    const second = await uploadIdempotent(client, { bucket: 'b', key: 'k', body: 'data' }, 'idem-1', cache);
    expect(second.cached).toBe(true);
  });

  it('T-INT-U-009 uploadObservable: before + after hook', async () => {
    const { createHookRegistry, uploadObservable } = await import('../../src/index.js');
    const client = createUploadClient({ provider: 's3' });
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-upload', () => events.push('before'));
    hooks.register('after-upload', () => events.push('after'));
    await uploadObservable(client, { bucket: 'b', key: 'k', body: 'data' }, hooks);
    expect(events).toEqual(['before', 'after']);
  });

  it('T-INT-U-010 circuit-breaker: threshold で open', async () => {
    const { createCircuitBreaker } = await import('../../src/index.js');
    let currentTime = 1000;
    const client = createUploadClient({ provider: 's3', maxSizeBytes: 1 });
    const breaker = createCircuitBreaker(client, { failureThreshold: 3, resetTimeoutMs: 100, now: () => currentTime });
    for (let i = 0; i < 3; i++) await breaker.upload({ bucket: 'b', key: `k${i}`, body: Buffer.alloc(10) });
    expect(breaker.state()).toBe('open');
    const blocked = await breaker.upload({ bucket: 'b', key: 'x', body: 'data' });
    expect(blocked.id).toBe('circuit-open');
  });
});
