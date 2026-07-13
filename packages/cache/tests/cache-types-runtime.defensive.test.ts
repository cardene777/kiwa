import { describe, expect, it } from 'vitest';
import {
  CACHE_CLIENTS,
  CACHE_MODES,
  isCacheClient,
  isCacheMode,
} from '../src/types.js';
import {
  KEYDB_CLIENTS,
  KEYDB_MODES,
  isKeyDBClient,
  isKeyDBMode,
} from '../src/keydb/types.js';
import {
  MEMCACHED_CLIENTS,
  MEMCACHED_MODES,
  isMemcachedClient,
  isMemcachedMode,
} from '../src/memcached/types.js';

describe('cache/types runtime helpers', () => {
  it('CACHE_MODES + isCacheMode round trip', () => {
    expect([...CACHE_MODES]).toEqual(['testcontainers', 'in-memory']);
    for (const mode of CACHE_MODES) expect(isCacheMode(mode)).toBe(true);
    expect(isCacheMode('bogus')).toBe(false);
    expect(isCacheMode(null)).toBe(false);
    expect(isCacheMode(1)).toBe(false);
  });

  it('CACHE_CLIENTS + isCacheClient round trip', () => {
    expect([...CACHE_CLIENTS]).toEqual(['ioredis', 'node-redis']);
    for (const c of CACHE_CLIENTS) expect(isCacheClient(c)).toBe(true);
    expect(isCacheClient('bogus')).toBe(false);
    expect(isCacheClient(undefined)).toBe(false);
  });
});

describe('cache/keydb/types runtime helpers', () => {
  it('KEYDB_MODES + isKeyDBMode round trip', () => {
    expect([...KEYDB_MODES]).toEqual(['stub', 'testcontainers']);
    for (const mode of KEYDB_MODES) expect(isKeyDBMode(mode)).toBe(true);
    expect(isKeyDBMode('bogus')).toBe(false);
    expect(isKeyDBMode(42)).toBe(false);
  });

  it('KEYDB_CLIENTS + isKeyDBClient round trip', () => {
    expect([...KEYDB_CLIENTS]).toEqual(['ioredis', 'node-redis']);
    for (const c of KEYDB_CLIENTS) expect(isKeyDBClient(c)).toBe(true);
    expect(isKeyDBClient('bogus')).toBe(false);
  });
});

describe('cache/memcached/types runtime helpers', () => {
  it('MEMCACHED_MODES + isMemcachedMode round trip', () => {
    expect([...MEMCACHED_MODES]).toEqual(['stub', 'testcontainers']);
    for (const mode of MEMCACHED_MODES)
      expect(isMemcachedMode(mode)).toBe(true);
    expect(isMemcachedMode('bogus')).toBe(false);
  });

  it('MEMCACHED_CLIENTS + isMemcachedClient round trip', () => {
    expect([...MEMCACHED_CLIENTS]).toEqual(['memjs', 'memcached']);
    for (const c of MEMCACHED_CLIENTS)
      expect(isMemcachedClient(c)).toBe(true);
    expect(isMemcachedClient('bogus')).toBe(false);
  });
});
