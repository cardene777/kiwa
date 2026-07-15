import type { UploadClient, UploadResult } from './client.js';

export interface MultipartPart {
  partNumber: number;
  body: Buffer | Uint8Array | string;
}

export interface MultipartUploadResult {
  bucket: string;
  key: string;
  parts: number;
  totalSize: number;
  result: UploadResult;
}

/**
 * multipart chunked upload workflow。 部分 part を結合して 1 回の upload に集約する mock。
 * 実 provider (S3 multipart / GCS resumable / R2 multipart) と同じ「N part を 1 object に統合」
 * 経路を再現。
 */
export async function uploadMultipart(
  client: UploadClient,
  bucket: string,
  key: string,
  parts: MultipartPart[],
  contentType?: string,
): Promise<MultipartUploadResult> {
  if (parts.length === 0) throw new Error('uploadMultipart: parts must not be empty');
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const buffers = sorted.map((p) => (typeof p.body === 'string' ? Buffer.from(p.body) : Buffer.from(p.body)));
  const body = Buffer.concat(buffers);

  const request = contentType !== undefined ? { bucket, key, body, contentType } : { bucket, key, body };
  const result = await client.upload(request);

  return {
    bucket,
    key,
    parts: sorted.length,
    totalSize: body.byteLength,
    result,
  };
}
