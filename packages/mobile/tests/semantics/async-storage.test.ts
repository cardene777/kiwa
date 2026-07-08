import { describe, expect, it } from 'vitest';
import {
  flushAsyncStorageBatch,
  initAsyncStorage,
  readAsyncStorageItem,
  removeAsyncStorageItem,
  setAsyncStorageItem,
} from '../../src/index.js';

describe('v1.51 async-storage semantics', () => {
  it('set + read + remove + flush', () => {
    const s = initAsyncStorage({ target: 'ios', storeId: 'main' });
    setAsyncStorageItem(s, { key: 'user-id', value: '42' });
    readAsyncStorageItem(s, 'user-id');
    setAsyncStorageItem(s, { key: 'theme', value: 'dark' });
    removeAsyncStorageItem(s, 'theme');
    flushAsyncStorageBatch(s);
    expect(s.state).toBe('batch-flushed');
    expect(s.items.size).toBe(1);
    expect(s.items.get('user-id')).toBe('42');
    expect(s.operations).toBe(4);
  });

  it('read reports miss for absent key', () => {
    const s = initAsyncStorage({ target: 'android', storeId: 'x' });
    const step = readAsyncStorageItem(s, 'ghost');
    expect(step.metadata.hit).toBe(false);
  });

  it('rejects empty storeId + key', () => {
    expect(() => initAsyncStorage({ target: 'ios', storeId: '' })).toThrow(/storeId/);
    const s = initAsyncStorage({ target: 'ios', storeId: 'x' });
    expect(() => setAsyncStorageItem(s, { key: '', value: 'x' })).toThrow(/key/);
  });

  it('web dialect maps to localStorage', () => {
    const s = initAsyncStorage({ target: 'web', storeId: 'x' });
    setAsyncStorageItem(s, { key: 'k', value: 'v' });
    expect(s.history[0]?.providerEvent).toBe('web.localStorage.setItem');
  });
});
