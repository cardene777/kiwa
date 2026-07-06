/**
 * Object Store chunking flow (v1.31-4) — wraps
 * `@kiwa-test/streaming`'s `createNatsKvObject` object surface so the
 * dogfood can exercise chunk-boundary splitting + LZ4-tagged compression
 * + reassembly round-trip.
 *
 * The canned scenario:
 *   1. Create an object bucket with `chunkSizeBytes=256` +
 *      `compression='lz4'`.
 *   2. Put a 1024-byte deterministic payload — after LZ4 tagging the
 *      compressed stream is 1028 bytes → 4 chunks + 4 remainder bytes → 5
 *      chunks total.
 *   3. Assert every chunk has a distinct digest (or explain collisions).
 *   4. Reassemble + compare to original bytes.
 */

import {
  createNatsKvObject,
  type NatsKvObject,
  type ObjectRecord,
} from '@kiwa-test/streaming';

export interface ObjectChunkingFlowInput {
  readonly bucket?: string;
  readonly name?: string;
  readonly chunkSizeBytes?: number;
  readonly payloadSize?: number;
  readonly compression?: 'none' | 'lz4';
}

export interface ObjectChunkingFlowResult {
  readonly store: NatsKvObject;
  readonly bucket: string;
  readonly name: string;
  readonly chunkSizeBytes: number;
  readonly originalSize: number;
  readonly record: ObjectRecord;
  readonly chunkDigests: readonly string[];
  readonly compression: 'none' | 'lz4';
  readonly reassembledMatches: boolean;
}

/**
 * Deterministic payload builder — every byte mixes the index into a xorshift
 * sequence so digests are stable per index without repeating within the
 * chunkSize window (a linear congruence bytewise repeats every 256 bytes,
 * which collapses to the same digest across chunks of size 256).
 */
function buildPayload(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  let state = 0x9e3779b1;
  for (let i = 0; i < size; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = state >>> 0;
    bytes[i] = (state ^ i) & 0xff;
  }
  return bytes;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function driveObjectChunking(
  input: ObjectChunkingFlowInput = {},
): ObjectChunkingFlowResult {
  const bucket = input.bucket ?? 'invoices-v2';
  const name = input.name ?? 'invoice-1024.bin';
  const chunkSizeBytes = input.chunkSizeBytes ?? 256;
  const compression = input.compression ?? 'lz4';
  const payloadSize = input.payloadSize ?? 1024;

  const store = createNatsKvObject();
  store.createObjectBucket({ bucket, chunkSizeBytes, compression });

  const payload = buildPayload(payloadSize);
  const record = store.putObject(bucket, name, payload);

  const chunkDigests = record.chunks.map((c) => c.digest);
  const reassembled = store.reassembleObject(bucket, name);
  const reassembledMatches = reassembled !== null && bytesEqual(reassembled, payload);

  return {
    store,
    bucket,
    name,
    chunkSizeBytes,
    originalSize: payloadSize,
    record,
    chunkDigests,
    compression,
    reassembledMatches,
  };
}
