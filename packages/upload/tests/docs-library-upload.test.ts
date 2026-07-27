import { describe, expect, it } from 'vitest';
import {
  computeChecksum,
  createPresignedUrl,
  createUploadClient,
  uploadMultipart,
  verifyUpload,
} from '../src/index.js';

describe('library documentation upload recipes', () => {
  it('stores an avatar and does not keep an upload over its limit', async () => {
    const stored = createUploadClient({ provider: 's3', maxSizeBytes: 1024 });
    const uploaded = await stored.upload({ bucket: 'avatars', key: 'u1/avatar.png', body: Buffer.from('image'), contentType: 'image/png' });
    const rejected = createUploadClient({ provider: 's3', maxSizeBytes: 4 });
    const failed = await rejected.upload({ bucket: 'avatars', key: 'u1/large.png', body: Buffer.from('image') });

    expect(uploaded.status).toBe('uploaded');
    expect(stored.get('avatars', 'u1/avatar.png')).toMatchObject({ size: 5, request: { contentType: 'image/png' } });
    expect(failed.status).toBe('failed');
    expect(rejected.get('avatars', 'u1/large.png')).toBeUndefined();
  });

  it('creates a PUT URL and restores a multipart body in part order', async () => {
    const client = createUploadClient({ provider: 'r2' });
    const url = createPresignedUrl({ provider: 'r2', bucket: 'avatars', key: 'u-1/avatar.txt', operation: 'put' });
    const result = await uploadMultipart(client, 'avatars', 'u-1/avatar.txt', [
      { partNumber: 2, body: Buffer.from('world') },
      { partNumber: 1, body: Buffer.from('hello ') },
    ]);
    const body = Buffer.from('hello world');

    expect(url).toMatchObject({ provider: 'r2', operation: 'put' });
    expect(url.url).toContain('avatars.r2.cloudflarestorage.com/u-1/avatar.txt');
    expect(result).toMatchObject({ parts: 2, totalSize: 11, result: { status: 'uploaded' } });
    expect(client.get('avatars', 'u-1/avatar.txt')?.body).toEqual(body);
    expect(verifyUpload({ body, expectedChecksum: computeChecksum(body) })).toMatchObject({ valid: true });
  });

  it('reports a checksum mismatch without looking up an object', () => {
    const result = verifyUpload({ body: Buffer.from('hello world'), expectedChecksum: 'deadbeef' });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('checksum mismatch');
  });
});
