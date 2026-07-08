import { createNatsMock } from '@kiwa/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createKVRun } from '../src/kv/index.js';

let nats: ReturnType<typeof createNatsMock> | null = null;

afterEach(() => {
  nats?.reset();
  nats = null;
});

function makeNats() {
  nats = createNatsMock({ name: 'kv-test' });
  return nats;
}

describe('kv — put + get + delete + revision-based versioning', () => {
  it('T-DNK-001 first put on a new key reports created + bumps revision', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    const result = await kv.put('u-1', { userId: 'u-1', displayName: 'A', region: 'us' });
    expect(result.kind).toBe('created');
    expect(result.revision).toBe(1);
    expect(kv.lastRevision()).toBe(1);
  });

  it('T-DNK-002 second put on the same key reports updated + bumps revision', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    await kv.put('u-1', { region: 'us' });
    const second = await kv.put('u-1', { region: 'eu' });
    expect(second.kind).toBe('updated');
    expect(second.revision).toBe(2);
  });

  it('T-DNK-003 get returns the latest entry with revision + timestamp', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    await kv.put('u-1', { region: 'us' });
    const entry = await kv.get<{ region: string }>('u-1');
    expect(entry).not.toBeNull();
    expect(entry?.revision).toBe(1);
    expect(entry?.value.region).toBe('us');
    expect(entry?.bucket).toBe('profiles');
  });

  it('T-DNK-004 delete removes the key + increments the deletes counter', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    await kv.put('u-1', { region: 'us' });
    await kv.delete('u-1');
    expect(await kv.get('u-1')).toBeNull();
    expect(kv.deletesCount()).toBe(1);
  });

  it('T-DNK-005 keys() returns the surviving key set after mutations', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    await kv.put('u-1', { region: 'us' });
    await kv.put('u-2', { region: 'eu' });
    await kv.put('u-3', { region: 'jp' });
    await kv.delete('u-2');
    const keys = await kv.keys();
    expect(new Set(keys)).toEqual(new Set(['u-1', 'u-3']));
  });

  it('T-DNK-006 revisions are bucket-wide monotonic across keys', async () => {
    const client = makeNats();
    const kv = createKVRun({ nats: client, bucket: 'profiles' });
    const a = await kv.put('u-1', {});
    const b = await kv.put('u-2', {});
    const c = await kv.put('u-1', { updated: true });
    expect(a.revision).toBe(1);
    expect(b.revision).toBe(2);
    expect(c.revision).toBe(3);
  });
});
