import { createNatsMock } from '@kiwa-test/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createObjectRun } from '../src/object/index.js';

let nats: ReturnType<typeof createNatsMock> | null = null;

afterEach(() => {
  nats?.reset();
  nats = null;
});

function makeNats() {
  nats = createNatsMock({ name: 'object-test' });
  return nats;
}

describe('object — put + get + delete + chunk metadata', () => {
  it('T-DNO-001 put stores an object + returns digest + size', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    const put = await obj.put({ name: 'inv-1.pdf', data: 'hello-world' });
    expect(put.info.size).toBe(11);
    expect(put.info.digest).toMatch(/^sha256:/);
    expect(put.info.bucket).toBe('invoices');
  });

  it('T-DNO-002 chunkSize surfaces on the put result even when the mock does not chunk', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    const put = await obj.put({
      name: 'inv-1.pdf',
      data: new Uint8Array(1024),
      chunkSize: 256,
    });
    expect(put.chunks).toBe(4);
  });

  it('T-DNO-003 different payloads produce distinct digests', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    const a = await obj.put({ name: 'a', data: 'aaa' });
    const b = await obj.put({ name: 'b', data: 'bbb' });
    expect(a.info.digest).not.toBe(b.info.digest);
  });

  it('T-DNO-004 get returns the stored entry with matching metadata', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    await obj.put({ name: 'inv-1.pdf', data: 'hello' });
    const entry = await obj.get('inv-1.pdf');
    expect(entry?.info.size).toBe(5);
    expect(new TextDecoder().decode(entry?.data)).toBe('hello');
  });

  it('T-DNO-005 delete removes the object + decrements totalBytesStored', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    await obj.put({ name: 'a', data: 'aaa' });
    await obj.put({ name: 'b', data: 'bbbb' });
    expect(obj.totalBytesStored()).toBe(7);
    await obj.delete('a');
    expect(obj.totalBytesStored()).toBe(4);
    expect(await obj.get('a')).toBeNull();
  });

  it('T-DNO-006 metadata passed to put surfaces on the put result', async () => {
    const client = makeNats();
    const obj = createObjectRun({ nats: client, bucket: 'invoices' });
    const result = await obj.put({
      name: 'inv-1.pdf',
      data: 'hello',
      metadata: { 'content-type': 'application/pdf', 'x-request-id': 'req-1' },
    });
    expect(result.metadata['content-type']).toBe('application/pdf');
    expect(result.metadata['x-request-id']).toBe('req-1');
  });
});
