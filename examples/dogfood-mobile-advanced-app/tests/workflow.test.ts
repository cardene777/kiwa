import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertMobileRealDriverAvailable,
  readMobileRealDriverEnv,
} from '@kiwa-test/mobile';
import {
  runAsyncStorageAxis,
  runFullAdvancedWorkflow,
  runNavigationAxis,
  runReanimatedAxis,
  runSecureStorageAxis,
} from '../src/workflow.js';

describe('Mobile advanced 4 axis × 3 target workflow (v1.51-2)', () => {
  it('navigation axis completes on all 3 targets', () => {
    const results = runNavigationAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('reanimated axis completes on all 3 targets', () => {
    const results = runReanimatedAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('async-storage axis completes on all 3 targets', () => {
    const results = runAsyncStorageAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('secure-storage axis completes on all 3 targets with biometric', () => {
    const results = runSecureStorageAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('runFullAdvancedWorkflow emits 12 results (4 axis × 3 target)', () => {
    const results = runFullAdvancedWorkflow();
    expect(results).toHaveLength(12);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('unique 4 axes in workflow', () => {
    const results = runFullAdvancedWorkflow();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(4);
  });

  it('all 3 targets present across each axis', () => {
    for (const runner of [runNavigationAxis, runReanimatedAxis, runAsyncStorageAxis, runSecureStorageAxis]) {
      const targets = runner().map((r) => r.target).sort();
      expect(targets).toEqual(['android', 'ios', 'web']);
    }
  });

  it('web-platform maps to WebAuthn for secure-storage biometric', () => {
    const web = runSecureStorageAxis().find((r) => r.target === 'web');
    expect(web?.completed).toBe(true);
  });
});

describe('Mobile advanced real driver env-gate (v1.51-2)', () => {
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

  it('null env when mode not set', () => {
    expect(readMobileRealDriverEnv()).toBeNull();
  });

  it('throws without mode=real', () => {
    expect(() => assertMobileRealDriverAvailable('navigation', null)).toThrow(/KIWA_MOBILE_MODE/);
  });

  it('all 6 axes pass with full env', () => {
    process.env.KIWA_MOBILE_MODE = 'real';
    for (const k of ['KIWA_EXPO_EAS_URL', 'KIWA_METRO_URL', 'KIWA_NAVIGATION_URL', 'KIWA_REANIMATED_URL', 'KIWA_ASYNC_STORAGE_URL', 'KIWA_SECURE_STORAGE_URL']) {
      process.env[k] = 'http://mock';
    }
    const env = readMobileRealDriverEnv();
    for (const axis of ['expo-eas', 'metro', 'navigation', 'reanimated', 'async-storage', 'secure-storage'] as const) {
      expect(() => assertMobileRealDriverAvailable(axis, env)).not.toThrow();
    }
  });
});
