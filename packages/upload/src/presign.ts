import { createHmac } from 'node:crypto';
import type { UploadProvider } from './client.js';

export type PresignedOperation = 'get' | 'put';

export interface PresignedUrlOptions {
  provider: UploadProvider;
  bucket: string;
  key: string;
  operation: PresignedOperation;
  expiresIn?: number;
  secret?: string;
  region?: string;
}

export interface PresignedUrlResult {
  url: string;
  provider: UploadProvider;
  operation: PresignedOperation;
  expiresAt: number;
  signature: string;
}

/**
 * provider 別 presigned URL 発行 mock。 real SDK が生成する URL 形式に近い shape で
 * host / query / signature を組み立てる。
 */
export function createPresignedUrl(options: PresignedUrlOptions): PresignedUrlResult {
  const { provider, bucket, key, operation, expiresIn = 3600, secret = 'test-secret', region = 'us-east-1' } = options;
  const now = 1_700_000_000;
  const expiresAt = now + expiresIn;

  const host = {
    s3: `${bucket}.s3.${region}.amazonaws.com`,
    gcs: `storage.googleapis.com/${bucket}`,
    r2: `${bucket}.r2.cloudflarestorage.com`,
    cloudinary: `res.cloudinary.com/${bucket}`,
  }[provider];

  const canonical = `${operation.toUpperCase()}\n/${key}\nexpires=${expiresAt}`;
  const signature = createHmac('sha256', secret).update(canonical).digest('hex');

  const url = `https://${host}/${key}?X-Provider=${provider}&X-Expires=${expiresAt}&X-Signature=${signature}`;
  return { url, provider, operation, expiresAt, signature };
}
