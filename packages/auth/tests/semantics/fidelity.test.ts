import { describe, expect, it } from 'vitest';
import {
  AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type AuthAxis,
} from '../../src/semantics/index.js';

describe('fidelity harness — 3 platform × 8 axis grid', () => {
  it('produces 24 rows for full sweep', () => {
    const coverage = collectFidelityCoverage(['chromium', 'webkit', 'firefox']);
    expect(coverage.platforms).toEqual(['chromium', 'webkit', 'firefox']);
    expect(coverage.axes).toEqual([
      'device-bound-passkey',
      'conditional-ui',
      'step-up-mfa',
      'risk-based-auth',
      'auth-continuity',
      'cross-device-flow',
      'session-hijack-detect',
      'auth-telemetry',
    ]);
    expect(coverage.rows).toHaveLength(24);
  });

  it('every row has neutral events mapped to platform events', () => {
    const coverage = collectFidelityCoverage(['chromium', 'webkit', 'firefox']);
    for (const row of coverage.rows) {
      expect(row.neutralEvents.length).toBe(AXIS_TO_EVENTS[row.axis].length);
      expect(row.platformEvents.length).toBe(row.neutralEvents.length);
      expect(row.platformEvents.every((e) => typeof e === 'string' && e.length > 0)).toBe(true);
    }
  });

  it('single platform slice returns 8 rows', () => {
    const chromiumOnly = collectFidelityCoverage(['chromium']);
    expect(chromiumOnly.rows).toHaveLength(8);
  });

  it('each axis neutral event list matches spec', () => {
    const coverage = collectFidelityCoverage(['chromium']);
    for (const axis of Object.keys(AXIS_TO_EVENTS) as AuthAxis[]) {
      const row = coverage.rows.find((r) => r.axis === axis);
      expect(row?.neutralEvents).toEqual(AXIS_TO_EVENTS[axis]);
    }
  });

  it('chromium device-bound-passkey uses webauthn dialect', () => {
    const coverage = collectFidelityCoverage(['chromium']);
    const row = coverage.rows.find((r) => r.axis === 'device-bound-passkey');
    expect(row?.platformEvents).toContain('webauthn.device_bound');
  });

  it('webkit sync fabric maps to icloud_keychain', () => {
    const coverage = collectFidelityCoverage(['webkit']);
    const row = coverage.rows.find((r) => r.axis === 'device-bound-passkey');
    expect(row?.platformEvents).toContain('icloud_keychain.verified');
  });

  it('firefox conditional-ui uses ff_ prefix', () => {
    const coverage = collectFidelityCoverage(['firefox']);
    const row = coverage.rows.find((r) => r.axis === 'conditional-ui');
    expect(row?.platformEvents.some((e) => e.startsWith('ff_webauthn.'))).toBe(true);
  });

  it('risk axis shares neutral dialect across all platforms', () => {
    const cf = collectFidelityCoverage(['chromium']).rows.find((r) => r.axis === 'risk-based-auth');
    const wk = collectFidelityCoverage(['webkit']).rows.find((r) => r.axis === 'risk-based-auth');
    const ff = collectFidelityCoverage(['firefox']).rows.find((r) => r.axis === 'risk-based-auth');
    expect(cf?.platformEvents).toEqual(wk?.platformEvents);
    expect(cf?.platformEvents).toEqual(ff?.platformEvents);
  });
});
