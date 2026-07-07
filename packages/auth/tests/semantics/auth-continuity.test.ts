import { describe, expect, it } from 'vitest';
import {
  extendSession,
  hitRevocationWindow,
  platformEventName,
  rotateRefresh,
  seamlessReauth,
  startContinuity,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('auth-continuity axis — 3 platform', () => {
  it.each(platforms)('%s: seamlessReauth transitions state', (platform) => {
    const s = startContinuity({
      platform,
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    const step = seamlessReauth(s, { nowMs: 500 });
    expect(step.state).toBe('seamless-reauthed');
    expect(step.platformEvent).toBe(platformEventName(platform, 'continuity.seamless-reauth'));
  });

  it('rotateRefresh replaces refreshToken', () => {
    const s = startContinuity({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    const step = rotateRefresh(s, { newToken: 'r-2', nowMs: 100 });
    expect(step.state).toBe('refresh-rotated');
    expect(s.refreshToken).toBe('r-2');
    expect(step.metadata.oldToken).toBe('r-1');
  });

  it('extendSession bumps expiresAtMs', () => {
    const s = startContinuity({
      platform: 'webkit',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    const step = extendSession(s, { extendByMs: 500 });
    expect(step.state).toBe('extended');
    expect(s.expiresAtMs).toBe(1500);
  });

  it('hitRevocationWindow blocks further actions', () => {
    const s = startContinuity({
      platform: 'firefox',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    hitRevocationWindow(s, { reason: 'refresh-reuse' });
    expect(() => seamlessReauth(s, { nowMs: 0 })).toThrow(/revocation window/);
    expect(() => rotateRefresh(s, { newToken: 'r-2', nowMs: 0 })).toThrow(/revocation window/);
    expect(() => extendSession(s, { extendByMs: 100 })).toThrow(/revocation window/);
  });

  it('refreshFamily stays constant across rotation', () => {
    const s = startContinuity({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    const step = rotateRefresh(s, { newToken: 'r-2', nowMs: 0 });
    expect(step.metadata.refreshFamily).toBe('r-1');
  });

  it('default revocationWindowMs is 30000', () => {
    const s = startContinuity({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    expect(s.revocationWindowMs).toBe(30_000);
  });

  it('hitRevocationWindow records reason', () => {
    const s = startContinuity({
      platform: 'chromium',
      userId: 'u',
      refreshToken: 'r',
      expiresAtMs: 1,
    });
    const step = hitRevocationWindow(s, { reason: 'admin-revoke' });
    expect(step.metadata.reason).toBe('admin-revoke');
  });

  it('history accumulates in order', () => {
    const s = startContinuity({
      platform: 'webkit',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 1000,
    });
    seamlessReauth(s, { nowMs: 100 });
    rotateRefresh(s, { newToken: 'r-2', nowMs: 200 });
    extendSession(s, { extendByMs: 500 });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'continuity.seamless-reauth',
      'continuity.refresh-rotated',
      'continuity.session-extended',
    ]);
  });
});
