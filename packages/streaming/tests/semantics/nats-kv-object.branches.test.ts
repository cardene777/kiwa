import { describe, expect, it } from 'vitest';
import { createNatsKvObject } from '../../src/index.js';

// Follow-up file — covers watchKv end-of-history iterator return, emitWatchEvents
// symmetric no-op, getObject / reassembleObject unknown-name null, and reset().

describe('createNatsKvObject state guards', () => {
  it('T-NKO-B-001 watchKv returns done=true when history is empty', async () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'empty' });
    const iter = store.watchKv('empty')[Symbol.asyncIterator]();
    const result = await iter.next();
    expect(result.done).toBe(true);
    expect(result.value).toBeUndefined();
  });

  it('T-NKO-B-002 watchKv drains all history revisions then returns done=true', async () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config', historyDepth: 5 });
    store.putKv('config', 'k', 'a');
    const iter = store.watchKv('config')[Symbol.asyncIterator]();
    const first = await iter.next();
    expect(first.done).toBe(false);
    const second = await iter.next();
    expect(second.done).toBe(true);
  });

  it('T-NKO-B-003 emitWatchEvents is a no-op that still validates bucket existence', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config' });
    expect(() => store.emitWatchEvents('config', 0)).not.toThrow();
    expect(() => store.emitWatchEvents('missing', 0)).toThrow(/unknown KV bucket/);
  });

  it('T-NKO-B-004 getObject returns null for an unknown name and the record when known', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 4 });
    expect(store.getObject('assets', 'missing.bin')).toBeNull();
    const bytes = new Uint8Array([1, 2, 3]);
    const record = store.putObject('assets', 'file.bin', bytes);
    expect(store.getObject('assets', 'file.bin')).toEqual(record);
  });

  it('T-NKO-B-005 reassembleObject returns null when the name is unknown', () => {
    const store = createNatsKvObject();
    store.createObjectBucket({ bucket: 'assets' });
    expect(store.reassembleObject('assets', 'missing.bin')).toBeNull();
  });

  it('T-NKO-B-006 unknown object bucket throws for putObject and reassembleObject', () => {
    const store = createNatsKvObject();
    expect(() => store.putObject('missing', 'f', new Uint8Array())).toThrow(/unknown object bucket/);
    expect(() => store.reassembleObject('missing', 'f')).toThrow(/unknown object bucket/);
    expect(() => store.getObject('missing', 'f')).toThrow(/unknown object bucket/);
  });

  it('T-NKO-B-007 createKvBucket / createObjectBucket are idempotent', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config', historyDepth: 3 });
    store.putKv('config', 'k', 1);
    // Second create with the same name returns early — bucket state is preserved.
    store.createKvBucket({ bucket: 'config', historyDepth: 100 });
    expect(store.getKv<number>('config', 'k')?.value).toBe(1);

    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 8 });
    store.putObject('assets', 'a.bin', new Uint8Array([1, 2, 3]));
    store.createObjectBucket({ bucket: 'assets', chunkSizeBytes: 64 });
    expect(store.getObject('assets', 'a.bin')?.size).toBe(3);
  });

  it('T-NKO-B-008 reset clears both KV and Object buckets', () => {
    const store = createNatsKvObject();
    store.createKvBucket({ bucket: 'config' });
    store.putKv('config', 'k', 1);
    store.createObjectBucket({ bucket: 'assets' });
    store.putObject('assets', 'a.bin', new Uint8Array([1]));
    store.reset();
    expect(() => store.getKv('config', 'k')).toThrow(/unknown KV bucket/);
    expect(() => store.getObject('assets', 'a.bin')).toThrow(/unknown object bucket/);
  });
});
