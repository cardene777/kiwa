import { describe, expect, it } from 'vitest';
import { createKvNamespace } from '../src/kv-mock.js';

describe('createKvNamespace', () => {
  it('T-KV-001 get returns null for missing key', async () => {
    const kv = createKvNamespace();
    expect(await kv.get('nope')).toBeNull();
  });

  it('T-KV-002 get returns string by default', async () => {
    const kv = createKvNamespace({ greeting: 'hello' });
    expect(await kv.get('greeting')).toBe('hello');
  });

  it('T-KV-003 get with type=text returns string', async () => {
    const kv = createKvNamespace({ msg: 'world' });
    expect(await kv.get('msg', 'text')).toBe('world');
  });

  it('T-KV-004 get with type=json parses', async () => {
    const kv = createKvNamespace({ user: JSON.stringify({ id: 1, name: 'Alice' }) });
    expect(await kv.get<{ id: number; name: string }>('user', 'json')).toEqual({ id: 1, name: 'Alice' });
  });

  it('T-KV-005 get with type=arrayBuffer returns ArrayBuffer', async () => {
    const kv = createKvNamespace({ key: 'kiwa' });
    const buf = await kv.get('key', 'arrayBuffer');
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(new TextDecoder().decode(buf as ArrayBuffer)).toBe('kiwa');
  });

  it('T-KV-006 put + get roundtrip', async () => {
    const kv = createKvNamespace();
    await kv.put('foo', 'bar');
    expect(await kv.get('foo')).toBe('bar');
  });

  it('T-KV-007 put with metadata round-trip via list', async () => {
    const kv = createKvNamespace();
    await kv.put('item:1', 'one', { metadata: { tag: 'a' } });
    const { keys } = await kv.list({ prefix: 'item:' });
    expect(keys).toHaveLength(1);
    const first = keys[0];
    expect(first?.metadata).toEqual({ tag: 'a' });
  });

  it('T-KV-008 delete removes the key', async () => {
    const kv = createKvNamespace({ session: 'sid_42' });
    await kv.delete('session');
    expect(await kv.get('session')).toBeNull();
  });

  it('T-KV-009 list with prefix returns only matching keys', async () => {
    const kv = createKvNamespace({
      'user:1': 'a',
      'user:2': 'b',
      'item:1': 'c',
    });
    const { keys } = await kv.list({ prefix: 'user:' });
    const names = keys.map((k) => k.name).sort();
    expect(names).toEqual(['user:1', 'user:2']);
  });

  it('T-KV-010 list respects limit', async () => {
    const kv = createKvNamespace({ a: '1', b: '2', c: '3', d: '4' });
    const { keys } = await kv.list({ limit: 2 });
    expect(keys).toHaveLength(2);
  });

  it('T-KV-011 list default has no prefix filter', async () => {
    const kv = createKvNamespace({ a: '1', b: '2' });
    const { keys, list_complete } = await kv.list();
    expect(keys.map((k) => k.name).sort()).toEqual(['a', 'b']);
    expect(list_complete).toBe(true);
  });

  it('T-KV-012 list keys without metadata when none was set', async () => {
    const kv = createKvNamespace();
    await kv.put('plain', 'no meta');
    const { keys } = await kv.list();
    const first = keys[0];
    expect(first?.name).toBe('plain');
    expect(first?.metadata).toBeUndefined();
  });
});
