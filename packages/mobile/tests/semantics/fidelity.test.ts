import { describe, expect, it } from 'vitest';
import {
  MOBILE_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type MobileAxis,
} from '../../src/index.js';

describe('mobile fidelity coverage', () => {
  it('collects 3 targets × 3 axes = 9 rows', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['ios', 'android', 'web']);
    expect(coverage.axes).toHaveLength(3);
    expect(coverage.rows).toHaveLength(9);
  });

  it('maps every axis to 4 neutral events', () => {
    for (const events of Object.values(MOBILE_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('combined 3-axis story', () => {
    const axes = Object.keys(MOBILE_AXIS_TO_EVENTS) as MobileAxis[];
    expect(axes).toEqual(['react-native', 'expo', 'metro']);
  });

  it('translates ios / android dialects differently', () => {
    expect(providerEventName('ios', 'metro.bundle_started')).toBe('ios.metro.transform.start');
    expect(providerEventName('android', 'metro.bundle_started')).toBe('android.metro.transform.start');
    expect(providerEventName('web', 'metro.bundle_started')).toBe('web.metro-web.transform.start');
  });

  it('subset provider works', () => {
    const coverage = collectFidelityCoverage(['ios']);
    expect(coverage.rows).toHaveLength(3);
    expect(coverage.rows.every((r) => r.provider === 'ios')).toBe(true);
  });
});
