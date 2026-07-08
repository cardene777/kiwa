import { describe, expect, it } from 'vitest';
import {
  MOBILE_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type MobileAxis,
} from '../../src/index.js';

describe('mobile fidelity coverage', () => {
  it('collects 3 targets × 7 axes = 21 rows (v1.51 advanced II)', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['ios', 'android', 'web']);
    expect(coverage.axes).toHaveLength(7);
    expect(coverage.rows).toHaveLength(21);
  });

  it('maps every axis to 4 neutral events', () => {
    for (const events of Object.values(MOBILE_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('combined 7-axis story (v1.50 3 base + v1.51 4 advanced II)', () => {
    const axes = Object.keys(MOBILE_AXIS_TO_EVENTS) as MobileAxis[];
    expect(axes).toEqual([
      'react-native',
      'expo',
      'metro',
      'navigation',
      'reanimated',
      'async-storage',
      'secure-storage',
    ]);
  });

  it('translates ios / android dialects differently', () => {
    expect(providerEventName('ios', 'metro.bundle_started')).toBe('ios.metro.transform.start');
    expect(providerEventName('android', 'metro.bundle_started')).toBe('android.metro.transform.start');
    expect(providerEventName('web', 'metro.bundle_started')).toBe('web.metro-web.transform.start');
  });

  it('subset provider works (7 axis)', () => {
    const coverage = collectFidelityCoverage(['ios']);
    expect(coverage.rows).toHaveLength(7);
    expect(coverage.rows.every((r) => r.provider === 'ios')).toBe(true);
  });

  it('v1.51 advanced II dialects mapped for all 3 targets', () => {
    expect(providerEventName('ios', 'secure-storage.biometric_challenged')).toBe('ios.biometry.face-id');
    expect(providerEventName('android', 'secure-storage.biometric_challenged')).toBe('android.biometry.fingerprint');
    expect(providerEventName('web', 'secure-storage.biometric_challenged')).toBe('web.webauthn.challenge');
  });
});
