import { describe, expect, it } from 'vitest';
import { createNatsKvObject, isNatsKvObject } from '../../src/index.js';

describe('createNatsKvObject KV', () => {
  it('T-NKO-001 putKv assigns monotonic revisions per key', () => {
    const store = createNatsKvObject();
    expect(isNatsKvObject(store)).toBe(true);
    store.createKvBucket({ bucket: 'config', historyDepth: 5 });
    const a = store.putKv('config', 'timeout', 100);
    const b = store.putKv('config', 'timeout', 200);
    expect(a.revision).toBe(1);
    expect(b.revision).toBe(2);
    expect(store.getKv<number>('config', 'timeout')?.value).toBe(200);
  });

  it('T-NKO-002 historyDepth trims older revisions', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config', historyDepth: 2 });
    store.putKv('config', 'k', 1);
    store.putKv('config', 'k', 2);
    store.putKv('config', 'k', 3);
    const history = store.historyKv<number>('config', 'k');
    expect(history).toHaveLength(2);
    expect(history.map((r) => r.value)).toEqual([2, 3]);
  });

  it('T-NKO-003 deleteKv writes a tombstone and getKv returns null', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config', historyDepth: 5 });
    store.putKv('config', 'k', 'v');
    const del = store.deleteKv('config', 'k');
    expect(del.operation).toBe('delete');
    expect(store.getKv('config', 'k')).toBeNull();
  });

  it('T-NKO-004 watchKv iterates the historical event stream', async () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config', historyDepth: 10 });
    store.putKv('config', 'k', 'a');
    store.putKv('config', 'k', 'b');
    const iter = store.watchKv('config')[Symbol.asyncIterator]();
    const first = await iter.next();
    const second = await iter.next();
    expect(first.value?.revision.value).toBe('a');
    expect(second.value?.revision.value).toBe('b');
  });

  it('T-NKO-005 unknown bucket throws', () => {
    const store = createNatsKvObject();
    expect(() => store.putKv('missing', 'k', 1)).toThrow(/unknown KV bucket/);
  });
});

describe('createNatsKvObject Object', () => {
  it('T-NKO-006 putObject chunks input into fixed-size pieces', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 4 });
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const record = store.putObject('assets', 'file.bin', bytes);
    expect(record.chunks).toHaveLength(3);
    expect(record.size).toBe(9);
    expect(record.chunks[0]?.digest).toMatch(/^[0-9a-f]{8}$/);
  });

  it('T-NKO-007 reassembleObject reconstitutes the original bytes', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 3 });
    const bytes = new Uint8Array([10, 11, 12, 13, 14, 15]);
    store.putObject('assets', 'file.bin', bytes);
    const rebuilt = store.reassembleObject('assets', 'file.bin');
    expect(rebuilt).toEqual(bytes);
  });

  it('T-NKO-008 lz4 compression applies a marker and reassembly strips it', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 128, compression: 'lz4' });
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const record = store.putObject('assets', 'file.bin', bytes);
    expect(record.compression).toBe('lz4');
    // First bytes of chunk 0 carry the LZ4: marker.
    expect(new TextDecoder().decode(record.chunks[0]?.bytes.slice(0, 4))).toBe('LZ4:');
    expect(store.reassembleObject('assets', 'file.bin')).toEqual(bytes);
  });
});
