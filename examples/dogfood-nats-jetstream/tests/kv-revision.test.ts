import { describe, expect, it } from 'vitest';
import { driveKvRevision } from '../src/kv/revision.js';

describe('KV bucket revision — history depth + delete tombstone + watch', () => {
  it('T-DNK-101 5 revisions land under historyDepth=5', async () => {
    const result = await driveKvRevision();
    expect(result.historyDepth).toBe(5);
    expect(result.revisions).toHaveLength(5);
  });

  it('T-DNK-102 revisions arrive in monotonic order with final delete tombstone', async () => {
    const result = await driveKvRevision();
    const ops = result.revisions.map((r) => r.operation);
    // 4 puts followed by 1 delete tombstone.
    expect(ops.slice(0, 4).every((o) => o === 'put')).toBe(true);
    expect(ops[4]).toBe('delete');
    // Revision numbers are 1..5.
    expect(result.revisions.map((r) => r.revision)).toEqual([1, 2, 3, 4, 5]);
  });

  it('T-DNK-103 getKv after tombstone returns null', async () => {
    const result = await driveKvRevision();
    expect(result.deleteTombstoneObserved).toBe(true);
  });

  it('T-DNK-104 watch iterator drains every history event', async () => {
    const result = await driveKvRevision();
    expect(result.watchEventCount).toBe(result.revisions.length);
  });

  it('T-DNK-105 historyKv on the shared store surfaces the same chain', async () => {
    const result = await driveKvRevision();
    const chain = result.store.historyKv(result.bucket, result.key);
    expect(chain).toHaveLength(5);
    expect(chain[4]?.operation).toBe('delete');
  });
});
