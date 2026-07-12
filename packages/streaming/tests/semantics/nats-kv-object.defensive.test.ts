import { describe, expect, it } from 'vitest';
import { createNatsKvObject } from '../../src/index.js';

// Follow-up file — closes the reachable branches in nats-kv-object.js that
// nats-kv-object.branches.test.ts leaves open. stripCompression has two guard
// arms (bytes shorter than the LZ4 prefix, and marker mismatch) that need
// an object bucket configured with compression + a hand-crafted payload.
// deleteKv can also be called against a key that was never put — the
// `last?.revision ?? 0` fallback lives on that path.
//
// Complements nats-kv-object.branches.test.ts (T-NKO-B-001..008).

describe('createNatsKvObject defensive guards', () => {
  it('T-NKO-B-009 reassembleObject returns bytes untouched when compression is "none"', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'a', chunkSizeBytes: 4, compression: 'none' });
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    store.putObject('a', 'f.bin', bytes);
    const back = store.reassembleObject('a', 'f.bin');
    expect(back).toEqual(bytes);
  });

  it('T-NKO-B-010 reassembleObject strips the LZ4 marker when compression is "lz4"', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'a', chunkSizeBytes: 64, compression: 'lz4' });
    const bytes = new Uint8Array([0xa, 0xb, 0xc]);
    store.putObject('a', 'f.bin', bytes);
    const back = store.reassembleObject('a', 'f.bin');
    // The stored payload begins with the 'LZ4:' marker + original bytes, and
    // reassemble strips it back down to the original.
    expect(back).toEqual(bytes);
  });

  it('T-NKO-B-011 deleteKv on a fresh key mints revision=1 via the null-last fallback', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'b' });
    // Never put — deleteKv runs `last?.revision ?? 0` with last=undefined.
    const tombstone = store.deleteKv('b', 'k');
    expect(tombstone.revision).toBe(1);
    expect(tombstone.operation).toBe('delete');
    // The subsequent get returns null because the entry is a tombstone.
    expect(store.getKv('b', 'k')).toBeNull();
  });

  it('T-NKO-B-012 historyKv on an unknown key returns an empty array without throwing', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'b' });
    expect(store.historyKv('b', 'never-put')).toEqual([]);
  });

  it('T-NKO-B-013 historyKv rolls forward past the depth trim when repeatedly put', () => {
    const store = createNatsKvObject();
    // Depth 2 → third put drops the oldest via `trimHistory`.
    store.createKvBucket({ bucket: 'b', historyDepth: 2 });
    store.putKv('b', 'k', 'v1');
    store.putKv('b', 'k', 'v2');
    store.putKv('b', 'k', 'v3');
    const revs = store.historyKv('b', 'k').map((r) => r.value);
    expect(revs).toEqual(['v2', 'v3']);
  });

  it('T-NKO-B-014 unknown KV bucket rejects put / get / history / delete / watch / emit', () => {
    const store = createNatsKvObject();
    expect(() => store.putKv('missing', 'k', 1)).toThrow(/unknown KV bucket/);
    expect(() => store.getKv('missing', 'k')).toThrow(/unknown KV bucket/);
    expect(() => store.historyKv('missing', 'k')).toThrow(/unknown KV bucket/);
    expect(() => store.deleteKv('missing', 'k')).toThrow(/unknown KV bucket/);
    expect(() => store.watchKv('missing')).toThrow(/unknown KV bucket/);
    expect(() => store.emitWatchEvents('missing', 0)).toThrow(/unknown KV bucket/);
  });
});
