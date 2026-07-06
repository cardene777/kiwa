import { describe, expect, it } from 'vitest';
import { assertMode, resolveAllModes, resolveMode } from '../src/index.js';

describe('component real-driver env-gate', () => {
  it('resolves to mock when KIWA_MODE unset', () => {
    const res = resolveMode('storybook8', {});
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('default-mock');
  });

  it('resolves storybook8 to real with URL', () => {
    const res = resolveMode('storybook8', {
      KIWA_MODE: 'real',
      STORYBOOK_URL: 'http://localhost:6006',
    });
    expect(res.mode).toBe('real');
  });

  it('resolves playwright-ct to real with URL', () => {
    const res = resolveMode('playwright-ct', {
      KIWA_MODE: 'real',
      PLAYWRIGHT_CT_URL: 'http://localhost:3100',
    });
    expect(res.reason).toBe('kiwa-mode-real');
  });

  it('resolves chromatic to real with token', () => {
    const res = resolveMode('chromatic', { KIWA_MODE: 'REAL', CHROMATIC_TOKEN: 'token' });
    expect(res.mode).toBe('real');
  });

  it('falls back when key missing', () => {
    const res = resolveMode('chromatic', { KIWA_MODE: 'real' });
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('missing-key');
  });

  it('falls back when key empty', () => {
    const res = resolveMode('storybook8', { KIWA_MODE: 'real', STORYBOOK_URL: '' });
    expect(res.reason).toBe('missing-key');
  });

  it('rejects invalid mode', () => {
    const res = resolveMode('storybook8', { KIWA_MODE: 'staging' });
    expect(res.reason).toBe('invalid-mode');
  });

  it('resolveAllModes iterates three targets', () => {
    const results = resolveAllModes({
      KIWA_MODE: 'real',
      STORYBOOK_URL: 'http://localhost:6006',
      PLAYWRIGHT_CT_URL: 'http://localhost:3100',
    });
    expect(results).toHaveLength(3);
    expect(results.find((r) => r.provider === 'chromatic')?.mode).toBe('mock');
  });

  it('assertMode passes and throws with reason', () => {
    expect(() =>
      assertMode('storybook8', 'real', {
        KIWA_MODE: 'real',
        STORYBOOK_URL: 'http://localhost:6006',
      }),
    ).not.toThrow();
    expect(() => assertMode('chromatic', 'real', {})).toThrow(/expected chromatic in real mode/);
  });
});
