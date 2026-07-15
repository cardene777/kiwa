import { createHash } from 'node:crypto';

export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256';

export interface VerifyUploadInput {
  body: Buffer | Uint8Array | string;
  expectedSize?: number;
  expectedChecksum?: string;
  algorithm?: ChecksumAlgorithm;
}

export interface VerifyUploadResult {
  valid: boolean;
  size: number;
  checksum: string;
  algorithm: ChecksumAlgorithm;
  reason?: string;
}

/**
 * upload された object の checksum + size を検証。 provider 側の etag と caller side で
 * 事前計算した checksum の一致確認に使う。
 */
export function verifyUpload(input: VerifyUploadInput): VerifyUploadResult {
  const algorithm = input.algorithm ?? 'md5';
  const buf = typeof input.body === 'string' ? Buffer.from(input.body) : Buffer.from(input.body);
  const size = buf.byteLength;
  const checksum = computeChecksum(buf, algorithm);

  if (input.expectedSize !== undefined && input.expectedSize !== size) {
    return { valid: false, size, checksum, algorithm, reason: `size mismatch: expected ${input.expectedSize}, got ${size}` };
  }
  if (input.expectedChecksum !== undefined && input.expectedChecksum !== checksum) {
    return { valid: false, size, checksum, algorithm, reason: `checksum mismatch: expected ${input.expectedChecksum}, got ${checksum}` };
  }
  return { valid: true, size, checksum, algorithm };
}

export function computeChecksum(body: Buffer | Uint8Array | string, algorithm: ChecksumAlgorithm = 'md5'): string {
  const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);
  return createHash(algorithm).update(buf).digest('hex');
}
