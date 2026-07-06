import { describe, expect, it } from 'vitest';
import { driveObjectChunking } from '../src/object/chunking.js';

describe('Object Store chunking — chunk boundary + LZ4 compression + reassembly', () => {
  it('T-DNO-101 1024 bytes with chunkSize=256 + LZ4 produces 5 chunks (LZ4: prefix tags 4 bytes)', () => {
    const result = driveObjectChunking();
    // 1024 bytes + 4 byte LZ4: prefix = 1028 bytes → chunkSize=256 → 5 chunks
    // (256 * 4 + 4 remainder).
    expect(result.chunkSizeBytes).toBe(256);
    expect(result.originalSize).toBe(1024);
    expect(result.record.chunks).toHaveLength(5);
    expect(result.compression).toBe('lz4');
  });

  it('T-DNO-102 chunk digests observed in delivery order + at least 4 distinct values', () => {
    const result = driveObjectChunking();
    expect(result.chunkDigests).toHaveLength(5);
    // At least 4 distinct digests — the deterministic payload guarantees the
    // first 4 chunks are unique; the LZ4 prefix collision leaves only the
    // 5th (4-byte remainder) as a potential duplicate.
    const unique = new Set(result.chunkDigests);
    expect(unique.size).toBeGreaterThanOrEqual(4);
  });

  it('T-DNO-103 chunk indexes match delivery order (0..4)', () => {
    const result = driveObjectChunking();
    const indexes = result.record.chunks.map((c) => c.index);
    expect(indexes).toEqual([0, 1, 2, 3, 4]);
  });

  it('T-DNO-104 reassembleObject returns the original bytes', () => {
    const result = driveObjectChunking();
    expect(result.reassembledMatches).toBe(true);
  });

  it('T-DNO-105 compression=none skips the LZ4 prefix (1024 bytes = 4 chunks)', () => {
    const result = driveObjectChunking({ compression: 'none' });
    expect(result.compression).toBe('none');
    expect(result.record.chunks).toHaveLength(4);
    expect(result.reassembledMatches).toBe(true);
  });
});
