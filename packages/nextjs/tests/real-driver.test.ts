import { describe, expect, it } from 'vitest';
import { assertMode, resolveAllModes, resolveMode } from '../src/index.js';

describe('nextjs real-driver env-gate', () => {
  it('resolves to mock when KIWA_MODE unset', () => {
    const res = resolveMode('app-router', {});
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('default-mock');
  });

  it('resolves app-router to real with URL', () => {
    const res = resolveMode('app-router', { KIWA_MODE: 'real', NEXT_APP_URL: 'http://localhost:3000' });
    expect(res.mode).toBe('real');
  });

  it('resolves pages-router to real with URL', () => {
    const res = resolveMode('pages-router', { KIWA_MODE: 'real', NEXT_PAGES_URL: 'http://localhost:3001' });
    expect(res.reason).toBe('kiwa-mode-real');
  });

  it('resolves edge-runtime to real with URL', () => {
    const res = resolveMode('edge-runtime', { KIWA_MODE: 'REAL', EDGE_RUNTIME_URL: 'http://localhost:3002' });
    expect(res.mode).toBe('real');
  });

  it('falls back when key missing', () => {
    const res = resolveMode('edge-runtime', { KIWA_MODE: 'real' });
    expect(res.mode).toBe('mock');
    expect(res.reason).toBe('missing-key');
  });

  it('falls back when key empty', () => {
    const res = resolveMode('app-router', { KIWA_MODE: 'real', NEXT_APP_URL: '' });
    expect(res.reason).toBe('missing-key');
  });

  it('rejects invalid mode', () => {
    const res = resolveMode('app-router', { KIWA_MODE: 'staging' });
    expect(res.reason).toBe('invalid-mode');
  });

  it('resolveAllModes iterates three targets', () => {
    const results = resolveAllModes({
      KIWA_MODE: 'real',
      NEXT_APP_URL: 'http://localhost:3000',
      NEXT_PAGES_URL: 'http://localhost:3001',
    });
    expect(results).toHaveLength(3);
    expect(results.find((r) => r.provider === 'edge-runtime')?.mode).toBe('mock');
  });

  it('assertMode passes and throws with reason', () => {
    expect(() =>
      assertMode('app-router', 'real', {
        KIWA_MODE: 'real',
        NEXT_APP_URL: 'http://localhost:3000',
      }),
    ).not.toThrow();
    expect(() => assertMode('edge-runtime', 'real', {})).toThrow(
      /expected edge-runtime in real mode/,
    );
  });
});
