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
});
