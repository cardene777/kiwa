import { describe, expect, it } from 'vitest';
import {
  assertMode,
  resolveAllModes,
  resolveMode,
} from '../src/index.js';

describe('real-driver env-gate', () => {
  it('resolves to mock when KIWA_MODE unset', () => {
    const res = resolveMode('stripe', {});
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('default-mock');
  });

  it('resolves to real when KIWA_MODE=real and key present', () => {
    const res = resolveMode('stripe', {
      KIWA_MODE: 'real',
      STRIPE_KEY: 'sk_test_abc',
    });
    expect(res.mode).toBe('real');
    expect(res.reason).toBe('kiwa-mode-real');
  });

  it('falls back to mock when KIWA_MODE=real but key missing', () => {
    const res = resolveMode('paddle', { KIWA_MODE: 'real' });
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('missing-key');
  });

  it('falls back to mock when KIWA_MODE=real but key is empty', () => {
    const res = resolveMode('lemonsqueezy', {
      KIWA_MODE: 'real',
      LEMONSQUEEZY_KEY: '',
    });
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('missing-key');
  });

  it('rejects invalid mode', () => {
    const res = resolveMode('stripe', { KIWA_MODE: 'staging' });
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('invalid-mode');
  });

  it('accepts case-insensitive KIWA_MODE', () => {
    const res = resolveMode('stripe', {
      KIWA_MODE: 'REAL',
      STRIPE_KEY: 'sk_1',
    });
    expect(res.mode).toBe('real');
  });

  it('resolveAllModes iterates over 3 providers', () => {
    const env = {
      KIWA_MODE: 'real',
      STRIPE_KEY: 'sk',
      PADDLE_KEY: 'pk',
      // LEMONSQUEEZY_KEY missing on purpose
    };
    const results = resolveAllModes(env);
    expect(results).toHaveLength(3);
    expect(results.find((r) => r.provider === 'stripe')?.mode).toBe('real');
    expect(results.find((r) => r.provider === 'paddle')?.mode).toBe('real');
    expect(results.find((r) => r.provider === 'lemonsqueezy')?.mode).toBe('mock');
  });

  it('assertMode passes when expectation matches', () => {
    expect(() =>
      assertMode('stripe', 'real', { KIWA_MODE: 'real', STRIPE_KEY: 'sk' }),
    ).not.toThrow();
  });

  it('assertMode throws with reason when expectation fails', () => {
    expect(() => assertMode('stripe', 'real', {})).toThrow(/expected stripe in real mode/);
  });
});
