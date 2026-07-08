import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertMobileRealDriverAvailable,
  readMobileRealDriverEnv,
} from '../../src/index.js';

const KEYS = [
  'KIWA_MOBILE_MODE',
  'KIWA_EXPO_EAS_URL',
  'KIWA_METRO_URL',
  'KIWA_NAVIGATION_URL',
  'KIWA_REANIMATED_URL',
  'KIWA_ASYNC_STORAGE_URL',
  'KIWA_SECURE_STORAGE_URL',
];
const saved: Record<string, string | undefined> = {};

describe('v1.51 mobile real driver env-gate', () => {
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('reads null when KIWA_MOBILE_MODE not real', () => {
    expect(readMobileRealDriverEnv()).toBeNull();
  });

  it('reads env when mode=real', () => {
    process.env.KIWA_MOBILE_MODE = 'real';
    process.env.KIWA_EXPO_EAS_URL = 'http://eas';
    process.env.KIWA_METRO_URL = 'http://metro';
    const env = readMobileRealDriverEnv();
    expect(env?.mode).toBe('real');
    expect(env?.expoEasUrl).toBe('http://eas');
    expect(env?.metroUrl).toBe('http://metro');
  });

  it('assertMobileRealDriverAvailable throws without mode=real', () => {
    expect(() => assertMobileRealDriverAvailable('metro', null)).toThrow(/KIWA_MOBILE_MODE/);
  });

  it('assertMobileRealDriverAvailable throws for missing URL env', () => {
    process.env.KIWA_MOBILE_MODE = 'real';
    const env = readMobileRealDriverEnv();
    expect(() => assertMobileRealDriverAvailable('expo-eas', env)).toThrow(/expo-eas URL env/);
  });

  it('assertMobileRealDriverAvailable passes when env set', () => {
    process.env.KIWA_MOBILE_MODE = 'real';
    process.env.KIWA_EXPO_EAS_URL = 'http://eas';
    const env = readMobileRealDriverEnv();
    expect(() => assertMobileRealDriverAvailable('expo-eas', env)).not.toThrow();
  });

  it('supports all 6 axis env keys', () => {
    process.env.KIWA_MOBILE_MODE = 'real';
    process.env.KIWA_EXPO_EAS_URL = 'x';
    process.env.KIWA_METRO_URL = 'x';
    process.env.KIWA_NAVIGATION_URL = 'x';
    process.env.KIWA_REANIMATED_URL = 'x';
    process.env.KIWA_ASYNC_STORAGE_URL = 'x';
    process.env.KIWA_SECURE_STORAGE_URL = 'x';
    const env = readMobileRealDriverEnv();
    for (const axis of ['expo-eas', 'metro', 'navigation', 'reanimated', 'async-storage', 'secure-storage'] as const) {
      expect(() => assertMobileRealDriverAvailable(axis, env)).not.toThrow();
    }
  });
});
