import { describe, expect, it } from 'vitest';
import {
  isKiwaModeReal,
  REAL_DRIVER_REQUIRED_KEYS,
  resolveEndpoint,
  resolveRealtimeDriver,
  skipUnlessReal,
} from '../src/index.js';

describe('Real driver env-gate — resolveRealtimeDriver', () => {
  it('T-SEC-RD-001 disables real driver when KIWA_MODE is unset', () => {
    const r = resolveRealtimeDriver({ provider: 'helmet', env: {} });
    expect(r.useRealDriver).toBe(false);
    expect(r.reason).toContain('KIWA_MODE');
  });

  it('T-SEC-RD-002 disables real driver when KIWA_MODE is not "real"', () => {
    const r = resolveRealtimeDriver({ provider: 'helmet', env: { KIWA_MODE: 'mock' } });
    expect(r.useRealDriver).toBe(false);
  });

  it('T-SEC-RD-003 enables real driver for helmet when KIWA_MODE=real', () => {
    const r = resolveRealtimeDriver({
      provider: 'helmet',
      env: { KIWA_MODE: 'real' },
    });
    expect(r.useRealDriver).toBe(true);
    expect(r.missingKeys).toEqual([]);
  });

  it('T-SEC-RD-004 reports missing keys for express-rate-limit', () => {
    const r = resolveRealtimeDriver({
      provider: 'express-rate-limit',
      env: { KIWA_MODE: 'real' },
    });
    expect(r.useRealDriver).toBe(false);
    expect(r.missingKeys).toContain('KIWA_REDIS_URL');
  });

  it('T-SEC-RD-005 enables real driver for express-rate-limit with all keys', () => {
    const r = resolveRealtimeDriver({
      provider: 'express-rate-limit',
      env: { KIWA_MODE: 'real', KIWA_REDIS_URL: 'redis://localhost:6379' },
    });
    expect(r.useRealDriver).toBe(true);
  });

  it('T-SEC-RD-006 reports missing keys for casbin', () => {
    const r = resolveRealtimeDriver({
      provider: 'casbin',
      env: { KIWA_MODE: 'real' },
    });
    expect(r.missingKeys).toContain('KIWA_CASBIN_POLICY_PATH');
  });

  it('T-SEC-RD-007 reports missing keys for coraza', () => {
    const r = resolveRealtimeDriver({
      provider: 'coraza',
      env: { KIWA_MODE: 'real' },
    });
    expect(r.missingKeys).toContain('KIWA_CORAZA_RULES_PATH');
  });
});

describe('Real driver env-gate — isKiwaModeReal', () => {
  it('T-SEC-RD-008 returns true for KIWA_MODE=real', () => {
    expect(isKiwaModeReal({ KIWA_MODE: 'real' })).toBe(true);
  });

  it('T-SEC-RD-009 returns false for other values', () => {
    expect(isKiwaModeReal({ KIWA_MODE: 'mock' })).toBe(false);
    expect(isKiwaModeReal({})).toBe(false);
  });
});

describe('Real driver env-gate — skipUnlessReal', () => {
  it('T-SEC-RD-010 skips when KIWA_MODE is not real', () => {
    const r = skipUnlessReal('helmet', {});
    expect(r.skip).toBe(true);
  });

  it('T-SEC-RD-011 does not skip when real driver is fully enabled', () => {
    const r = skipUnlessReal('helmet', { KIWA_MODE: 'real' });
    expect(r.skip).toBe(false);
  });

  it('T-SEC-RD-012 skips when required keys are missing', () => {
    const r = skipUnlessReal('coraza', { KIWA_MODE: 'real' });
    expect(r.skip).toBe(true);
    expect(r.reason).toContain('KIWA_CORAZA_RULES_PATH');
  });
});

describe('Real driver env-gate — resolveEndpoint', () => {
  it('T-SEC-RD-013 resolves helmet endpoint from env', () => {
    const r = resolveEndpoint('helmet', { KIWA_HELMET_URL: 'https://example.com' });
    expect(r.endpoint).toBe('https://example.com');
  });

  it('T-SEC-RD-014 resolves express-rate-limit endpoint + key', () => {
    const r = resolveEndpoint('express-rate-limit', {
      KIWA_REDIS_URL: 'redis://localhost:6379',
      KIWA_REDIS_PASSWORD: 'pw',
    });
    expect(r.endpoint).toBe('redis://localhost:6379');
    expect(r.apiKey).toBe('pw');
  });

  it('T-SEC-RD-015 resolves casbin policy path', () => {
    const r = resolveEndpoint('casbin', {
      KIWA_CASBIN_POLICY_PATH: '/etc/casbin/policy.csv',
    });
    expect(r.endpoint).toBe('/etc/casbin/policy.csv');
  });

  it('T-SEC-RD-016 resolves coraza rules path', () => {
    const r = resolveEndpoint('coraza', {
      KIWA_CORAZA_RULES_PATH: '/etc/coraza/rules.conf',
    });
    expect(r.endpoint).toBe('/etc/coraza/rules.conf');
  });

  it('T-SEC-RD-017 returns null when env is unset', () => {
    const r = resolveEndpoint('helmet', {});
    expect(r.endpoint).toBeNull();
  });
});

describe('Real driver env-gate — REAL_DRIVER_REQUIRED_KEYS', () => {
  it('T-SEC-RD-018 lists KIWA_MODE for every provider', () => {
    for (const provider of Object.keys(REAL_DRIVER_REQUIRED_KEYS) as Array<
      keyof typeof REAL_DRIVER_REQUIRED_KEYS
    >) {
      expect(REAL_DRIVER_REQUIRED_KEYS[provider]).toContain('KIWA_MODE');
    }
  });

  it('T-SEC-RD-019 covers 4 providers', () => {
    expect(Object.keys(REAL_DRIVER_REQUIRED_KEYS).sort()).toEqual([
      'casbin',
      'coraza',
      'express-rate-limit',
      'helmet',
    ]);
  });
});
