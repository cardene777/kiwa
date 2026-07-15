/**
 * skill test — upload skill が主要 API 4 種 (createUploadClient / createPresignedUrl /
 * uploadMultipart / verifyUpload + computeChecksum) を全て公開している + 4 provider で動作
 * することを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createUploadClient,
  createPresignedUrl,
  uploadMultipart,
  verifyUpload,
  computeChecksum,
} from '../../src/index.js';

describe('upload skill assertions', () => {
  it('createUploadClient を 4 provider (s3/gcs/r2/cloudinary) 全てで instantiate 可能', () => {
    for (const provider of ['s3', 'gcs', 'r2', 'cloudinary'] as const) {
      const client = createUploadClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('createPresignedUrl が 4 provider で URL + signature を発行', () => {
    for (const provider of ['s3', 'gcs', 'r2', 'cloudinary'] as const) {
      const res = createPresignedUrl({ provider, bucket: 'b', key: 'k', operation: 'put' });
      expect(res.url).toContain(provider === 'gcs' ? 'googleapis.com' : provider === 'cloudinary' ? 'cloudinary.com' : provider);
      expect(res.signature).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('uploadMultipart が parts を結合して 1 upload に集約', async () => {
    const client = createUploadClient({ provider: 's3' });
    const res = await uploadMultipart(client, 'b', 'mp', [
      { partNumber: 1, body: 'hello ' },
      { partNumber: 2, body: 'world' },
    ]);
    expect(res.parts).toBe(2);
    expect(res.totalSize).toBe('hello world'.length);
    expect(res.result.status).toBe('uploaded');
    expect(client.get('b', 'mp')?.body.toString()).toBe('hello world');
  });

  it('verifyUpload が size + checksum 一致で valid を返す', () => {
    const body = Buffer.from('data');
    const checksum = computeChecksum(body, 'md5');
    const result = verifyUpload({ body, expectedSize: body.byteLength, expectedChecksum: checksum });
    expect(result.valid).toBe(true);
  });

  it('computeChecksum が algorithm 別に異なる hex を返す', () => {
    const body = Buffer.from('same');
    const md5 = computeChecksum(body, 'md5');
    const sha1 = computeChecksum(body, 'sha1');
    const sha256 = computeChecksum(body, 'sha256');
    expect(md5).toHaveLength(32);
    expect(sha1).toHaveLength(40);
    expect(sha256).toHaveLength(64);
    expect(md5).not.toBe(sha1);
  });
});
