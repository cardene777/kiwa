import { describe, expect, it } from 'vitest';
import {
  platformEventName,
  reportConcurrentSession,
  reportFingerprintDrift,
  reportGeoAnomaly,
  startHijackWatch,
  triggerLogoutCascade,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('session-hijack-detect axis — 3 platform', () => {
  it.each(platforms)('%s: reportFingerprintDrift transitions to drift-detected', (platform) => {
    const s = startHijackWatch({
      platform,
      sessionId: 'sess-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    const step = reportFingerprintDrift(s, { observedFingerprint: 'fp-B', distance: 0.8 });
    expect(step.state).toBe('drift-detected');
    expect(step.platformEvent).toBe(platformEventName(platform, 'hijack.fingerprint-drift'));
  });

  it('reportGeoAnomaly captures observed region', () => {
    const s = startHijackWatch({
      platform: 'chromium',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = reportGeoAnomaly(s, { observedRegion: 'BR', km: 18_000, withinMinutes: 10 });
    expect(step.state).toBe('geo-anomaly');
    expect(step.metadata.observedRegion).toBe('BR');
  });

  it('reportConcurrentSession requires count > 1', () => {
    const s = startHijackWatch({
      platform: 'webkit',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    expect(() => reportConcurrentSession(s, { concurrentSessionCount: 1 })).toThrow(/must be > 1/);
  });

  it('reportConcurrentSession updates activeSessionCount', () => {
    const s = startHijackWatch({
      platform: 'firefox',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    reportConcurrentSession(s, { concurrentSessionCount: 3 });
    expect(s.activeSessionCount).toBe(3);
  });

  it('triggerLogoutCascade records revokedCount', () => {
    const s = startHijackWatch({
      platform: 'chromium',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = triggerLogoutCascade(s, { revokedSessionIds: ['s-a', 's-b', 's-c'] });
    expect(step.state).toBe('logout-cascade');
    expect(step.metadata.revokedCount).toBe(3);
  });

  it('fingerprint drift metadata carries distance', () => {
    const s = startHijackWatch({
      platform: 'webkit',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    const step = reportFingerprintDrift(s, { observedFingerprint: 'fp-C', distance: 0.95 });
    expect(step.metadata.distance).toBe(0.95);
  });

  it('history accumulates across signals', () => {
    const s = startHijackWatch({
      platform: 'firefox',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    reportFingerprintDrift(s, { observedFingerprint: 'fp-2', distance: 0.7 });
    reportGeoAnomaly(s, { observedRegion: 'US', km: 10_000, withinMinutes: 5 });
    reportConcurrentSession(s, { concurrentSessionCount: 5 });
    triggerLogoutCascade(s, { revokedSessionIds: ['a', 'b'] });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'hijack.fingerprint-drift',
      'hijack.geo-anomaly',
      'hijack.concurrent-session',
      'hijack.logout-cascade',
    ]);
  });

  it('geo anomaly km metadata bounded by input', () => {
    const s = startHijackWatch({
      platform: 'chromium',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp',
      baselineRegion: 'JP',
    });
    const step = reportGeoAnomaly(s, { observedRegion: 'ZZ', km: 20_000, withinMinutes: 1 });
    expect(step.metadata.km).toBe(20_000);
    expect(step.metadata.withinMinutes).toBe(1);
  });
});
