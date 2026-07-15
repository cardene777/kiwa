import { computeChecksum } from './checksum.js';

export type UploadProvider = 's3' | 'gcs' | 'r2' | 'cloudinary';

export interface UploadRequest {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read';
}

export interface UploadResult {
  id: string;
  provider: UploadProvider;
  status: 'uploaded' | 'failed';
  bucket: string;
  key: string;
  size: number;
  etag: string;
  uploadedAt: number;
  reason?: string;
}

export interface UploadedObjectRecord extends UploadResult {
  request: UploadRequest;
  body: Buffer;
}

export interface UploadClient {
  provider: UploadProvider;
  upload: (req: UploadRequest) => Promise<UploadResult>;
  get: (bucket: string, key: string) => UploadedObjectRecord | undefined;
  delete: (bucket: string, key: string) => boolean;
  list: (bucket: string) => UploadedObjectRecord[];
  clear: () => void;
}

export interface CreateUploadClientOptions {
  provider?: UploadProvider;
  maxSizeBytes?: number;
  failOn?: (req: UploadRequest) => boolean;
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別のみ mock 差 (id prefix / etag format) を持たせつつ、 全 API 共通 interface。
 * 実 provider (S3 / GCS / R2 / Cloudinary) の SDK を差し替えても同じ signature で呼べる想定。
 */
export function createUploadClient(options: CreateUploadClientOptions = {}): UploadClient {
  const provider = options.provider ?? 's3';
  const maxSize = options.maxSizeBytes ?? 100 * 1024 * 1024;
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const failOn = options.failOn;
  const idPrefix = { s3: 's3', gcs: 'gcs', r2: 'r2', cloudinary: 'cld' }[provider];
  const store = new Map<string, UploadedObjectRecord>();
  let counter = options.idSeed ?? 0;

  const storeKey = (bucket: string, key: string) => `${bucket}/${key}`;

  return {
    provider,
    async upload(req: UploadRequest): Promise<UploadResult> {
      counter += 1;
      const id = `${idPrefix}-${counter}`;
      const uploadedAt = now();
      const body = typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(req.body);
      const size = body.byteLength;

      if (failOn && failOn(req)) {
        const failed: UploadResult = { id, provider, status: 'failed', bucket: req.bucket, key: req.key, size, etag: '', uploadedAt, reason: 'provider rejected' };
        return failed;
      }
      if (size > maxSize) {
        const failed: UploadResult = { id, provider, status: 'failed', bucket: req.bucket, key: req.key, size, etag: '', uploadedAt, reason: `size ${size} exceeds max ${maxSize}` };
        return failed;
      }

      const etag = computeChecksum(body, 'md5');
      const baseResult: UploadResult = { id, provider, status: 'uploaded', bucket: req.bucket, key: req.key, size, etag, uploadedAt };
      const record: UploadedObjectRecord = { ...baseResult, request: req, body };
      store.set(storeKey(req.bucket, req.key), record);
      return baseResult;
    },
    get(bucket: string, key: string): UploadedObjectRecord | undefined {
      return store.get(storeKey(bucket, key));
    },
    delete(bucket: string, key: string): boolean {
      return store.delete(storeKey(bucket, key));
    },
    list(bucket: string): UploadedObjectRecord[] {
      const items: UploadedObjectRecord[] = [];
      for (const [k, v] of store) {
        if (k.startsWith(`${bucket}/`)) items.push(v);
      }
      return items;
    },
    clear(): void {
      store.clear();
    },
  };
}
