import { describe, expect, it } from 'vitest';
import {
  MOBILE_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type MobileAxis,
} from '../../src/index.js';

describe('mobile fidelity coverage', () => {
  it('collects 3 targets × 11 axes = 33 rows (v1.52 advanced III、 pair 3 段拡張 5 例目)', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['ios', 'android', 'web']);
    expect(coverage.axes).toHaveLength(11);
    expect(coverage.rows).toHaveLength(33);
  });

  it('maps every axis to 4 neutral events', () => {
    for (const events of Object.values(MOBILE_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('combined 11-axis story (v1.50 3 base + v1.51 4 advanced II + v1.52 4 advanced III)', () => {
    const axes = Object.keys(MOBILE_AXIS_TO_EVENTS) as MobileAxis[];
    expect(axes).toEqual([
      'react-native',
      'expo',
      'metro',
      'navigation',
      'reanimated',
      'async-storage',
      'secure-storage',
      'fabric',
      'turbo-modules',
      'codegen',
      'new-architecture',
    ]);
  });

  it('translates ios / android dialects differently', () => {
    expect(providerEventName('ios', 'metro.bundle_started')).toBe('ios.metro.transform.start');
    expect(providerEventName('android', 'metro.bundle_started')).toBe('android.metro.transform.start');
    expect(providerEventName('web', 'metro.bundle_started')).toBe('web.metro-web.transform.start');
  });

  it('subset provider works (11 axis)', () => {
    const coverage = collectFidelityCoverage(['ios']);
    expect(coverage.rows).toHaveLength(11);
    expect(coverage.rows.every((r) => r.provider === 'ios')).toBe(true);
  });

  it('v1.51 advanced II dialects mapped for all 3 targets', () => {
    expect(providerEventName('ios', 'secure-storage.biometric_challenged')).toBe('ios.biometry.face-id');
    expect(providerEventName('android', 'secure-storage.biometric_challenged')).toBe('android.biometry.fingerprint');
    expect(providerEventName('web', 'secure-storage.biometric_challenged')).toBe('web.webauthn.challenge');
  });

  it('v1.52 advanced III dialects mapped for all 3 targets (Fabric / TurboModules / Codegen / New Architecture)', () => {
    expect(providerEventName('ios', 'fabric.mount_completed')).toBe('ios.fabric.mount.done');
    expect(providerEventName('android', 'new-architecture.ready')).toBe('android.new-arch.ready');
    expect(providerEventName('web', 'new-architecture.concurrent_enabled')).toBe('web.concurrent-react.enable');
  });

  it('providerEventName falls back to the neutral name for a per-target dialect miss', () => {
    // The dialect map is typed `Partial<Record<...>>`, so a future neutral event added to the
    // union but not to a per-target sub-map surfaces with its vendor-neutral name instead of
    // undefined. Reaching this from a type-safe caller is not possible today; the cast
    // exercises the runtime fallback that keeps future partial-map states safe.
    // biome-ignore lint/suspicious/noExplicitAny: exercising the `?? neutral` runtime fallback
    expect(providerEventName('ios', 'not-in-dialect' as any)).toBe('not-in-dialect');
    // biome-ignore lint/suspicious/noExplicitAny: exercising the `?? neutral` runtime fallback
    expect(providerEventName('android', 'not-in-dialect' as any)).toBe('not-in-dialect');
    // biome-ignore lint/suspicious/noExplicitAny: exercising the `?? neutral` runtime fallback
    expect(providerEventName('web', 'not-in-dialect' as any)).toBe('not-in-dialect');
  });
});
