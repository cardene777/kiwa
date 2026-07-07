import {
  platformEventName,
  type AuthAxis,
  type AuthPlatform,
  type NeutralEventName,
} from './types.js';

export interface FidelityRow {
  platform: AuthPlatform;
  axis: AuthAxis;
  neutralEvents: NeutralEventName[];
  platformEvents: string[];
}

export interface FidelityCoverage {
  platforms: AuthPlatform[];
  axes: AuthAxis[];
  rows: FidelityRow[];
}

export const AXIS_TO_EVENTS: Record<AuthAxis, NeutralEventName[]> = {
  'device-bound-passkey': [
    'passkey.device-bound',
    'passkey.credential-migrated',
    'passkey.sync-fabric-verified',
    'passkey.credprops-confirmed',
  ],
  'conditional-ui': [
    'conditional-ui.hint-shown',
    'conditional-ui.autofill-selected',
    'conditional-ui.fallback-triggered',
    'conditional-ui.timeout-exceeded',
  ],
  'step-up-mfa': [
    'step-up.escalation-requested',
    'step-up.aal2-satisfied',
    'step-up.aal3-satisfied',
    'step-up.trust-cached',
  ],
  'risk-based-auth': [
    'risk.score-evaluated',
    'risk.challenge-injected',
    'risk.policy-blocked',
    'risk.policy-allowed',
  ],
  'auth-continuity': [
    'continuity.seamless-reauth',
    'continuity.refresh-rotated',
    'continuity.session-extended',
    'continuity.revocation-window-hit',
  ],
  'cross-device-flow': [
    'cross-device.qr-generated',
    'cross-device.ble-paired',
    'cross-device.tunnel-opened',
    'cross-device.handshake-completed',
  ],
  'session-hijack-detect': [
    'hijack.fingerprint-drift',
    'hijack.geo-anomaly',
    'hijack.concurrent-session',
    'hijack.logout-cascade',
  ],
  'auth-telemetry': [
    'telemetry.attempt-recorded',
    'telemetry.success-rate-updated',
    'telemetry.latency-bucketed',
    'telemetry.abuse-detected',
  ],
};

/**
 * Collect the platform × axis coverage grid. Output is 3 platform × 8 axis
 * = 24 rows for the full sweep, plus per-platform / per-axis slices.
 */
export function collectFidelityCoverage(platforms: AuthPlatform[]): FidelityCoverage {
  const axes = Object.keys(AXIS_TO_EVENTS) as AuthAxis[];
  const rows: FidelityRow[] = [];
  for (const platform of platforms) {
    for (const axis of axes) {
      const neutralEvents = AXIS_TO_EVENTS[axis];
      const platformEvents = neutralEvents.map((n) => platformEventName(platform, n));
      rows.push({ platform, axis, neutralEvents, platformEvents });
    }
  }
  return { platforms, axes, rows };
}
