// Q6 real driver env-gate primitive の unit test。
//
// SSOT = docs/concepts/test-taxonomy.md § fidelity real driver。
// 4 case = default disabled / KIWA_MODE=real + 全 env set = enabled / KIWA_MODE=real +
// env missing = disabled + skipReason / KIWA_MODE 明示 mock = disabled + skipReason。

import { describe, expect, it } from 'vitest';
import { resolveRealFidelityMode } from '../src/index.js';

describe('resolveRealFidelityMode', () => {
  it('KIWA_MODE 未設定 (default mock) = disabled + skipReason kiwa-mode-not-real', () => {
    const result = resolveRealFidelityMode({
      lib: 'cache',
      requiredEnvKeys: ['REDIS_URL'],
      envSource: {},
    });
    expect(result.enabled).toBe(false);
    expect(result.skipReason).toBe('kiwa-mode-not-real:mock');
    expect(result.missingKeys).toEqual([]);
  });

  it('KIWA_MODE=mock 明示 = disabled + skipReason kiwa-mode-not-real:mock', () => {
    const result = resolveRealFidelityMode({
      lib: 'cache',
      requiredEnvKeys: ['REDIS_URL'],
      envSource: { KIWA_MODE: 'mock' },
    });
    expect(result.enabled).toBe(false);
    expect(result.skipReason).toBe('kiwa-mode-not-real:mock');
  });

  it('KIWA_MODE=real + 必須 env 全 set = enabled=true', () => {
    const result = resolveRealFidelityMode({
      lib: 'cache',
      requiredEnvKeys: ['REDIS_URL'],
      envSource: { KIWA_MODE: 'real', REDIS_URL: 'redis://localhost:6379' },
    });
    expect(result.enabled).toBe(true);
    expect(result.skipReason).toBeUndefined();
    expect(result.missingKeys).toEqual([]);
  });

  it('KIWA_MODE=real + 必須 env 1 件 missing = disabled + skipReason env-missing:X', () => {
    const result = resolveRealFidelityMode({
      lib: 'payment',
      requiredEnvKeys: ['STRIPE_SECRET_KEY'],
      envSource: { KIWA_MODE: 'real' },
    });
    expect(result.enabled).toBe(false);
    expect(result.skipReason).toBe('env-missing:STRIPE_SECRET_KEY');
    expect(result.missingKeys).toEqual(['STRIPE_SECRET_KEY']);
  });

  it('KIWA_MODE=real + 複数 env missing = 全 missing 名 skipReason に列挙', () => {
    const result = resolveRealFidelityMode({
      lib: 'auth',
      requiredEnvKeys: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
      envSource: { KIWA_MODE: 'real', AUTH0_DOMAIN: 'example.auth0.com' },
    });
    expect(result.enabled).toBe(false);
    expect(result.skipReason).toBe('env-missing:AUTH0_CLIENT_ID,AUTH0_CLIENT_SECRET');
    expect(result.missingKeys).toEqual(['AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET']);
  });

  it('env 空文字列 = missing 扱い', () => {
    const result = resolveRealFidelityMode({
      lib: 'cache',
      requiredEnvKeys: ['REDIS_URL'],
      envSource: { KIWA_MODE: 'real', REDIS_URL: '' },
    });
    expect(result.enabled).toBe(false);
    expect(result.skipReason).toBe('env-missing:REDIS_URL');
    expect(result.missingKeys).toEqual(['REDIS_URL']);
  });

  it('envSource 省略 = process.env 参照 (default 経路)', () => {
    const before = process.env.KIWA_MODE;
    try {
      process.env.KIWA_MODE = 'mock';
      const result = resolveRealFidelityMode({
        lib: 'cache',
        requiredEnvKeys: ['REDIS_URL'],
      });
      expect(result.enabled).toBe(false);
      expect(result.skipReason).toBe('kiwa-mode-not-real:mock');
    } finally {
      if (before === undefined) {
        delete process.env.KIWA_MODE;
      } else {
        process.env.KIWA_MODE = before;
      }
    }
  });
});
