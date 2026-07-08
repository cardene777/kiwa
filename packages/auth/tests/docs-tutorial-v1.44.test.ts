/**
 * v1.44-5 docs 補強 — tutorial 97-99 code snippet 検証。
 *
 * `docs/tutorials/97-passwordless-ux.md` /
 * `docs/tutorials/98-step-up-mfa.md` /
 * `docs/tutorials/99-risk-based-auth.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * 22 milestone 連続 snippet validation streak = v1.23 → v1.44。
 *
 * v1.44 は @kiwa/auth v0.6 advanced Passwordless UX 8 axis を扱う。
 */
import { describe, expect, it } from 'vitest';
import { semantics } from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 97 — Passwordless UX
// ---------------------------------------------------------------------------

describe('tutorial 97 — device-bound passkey', () => {
  it('binds credential to device + verifies sync fabric', () => {
    const s = semantics.startDevicePasskey({
      platform: 'chromium',
      credentialId: 'cred-1',
      boundDeviceId: 'dev-1',
      syncFabric: 'chrome',
    });
    const bound = semantics.bindToDevice(s);
    expect(bound.state).toBe('device-bound');
    const verified = semantics.verifySyncFabric(s);
    expect(verified.state).toBe('sync-verified');
    const credprops = semantics.confirmCredProps(s);
    expect(credprops.metadata.isResidentKey).toBe(true);
  });
});

describe('tutorial 97 — conditional UI', () => {
  it('shows hint and selects autofill', () => {
    const s = semantics.startConditionalUi({ platform: 'webkit', formId: 'login' });
    semantics.showHint(s);
    const step = semantics.selectAutofill(s, { credentialId: 'cred-1', elapsedMs: 250 });
    expect(step.state).toBe('autofill-selected');
    expect(step.metadata.elapsedMs).toBe(250);
  });
});

describe('tutorial 97 — cross-device flow', () => {
  it('completes QR handshake for desktop-with-phone sign-in', () => {
    const s = semantics.startCrossDevice({ platform: 'firefox', requestId: 'req-1' });
    semantics.generateQr(s, { qrPayload: 'FIDO:/1234' });
    semantics.pairBle(s, { bleAdvKey: 'k-1', rssi: -60 });
    semantics.openTunnel(s, { tunnelUrl: 'wss://caBLE.example/tunnel' });
    const done = semantics.completeHandshake(s, { assertionSignature: 'sig-abcd' });
    expect(done.state).toBe('handshake-completed');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 98 — Step-up MFA
// ---------------------------------------------------------------------------

describe('tutorial 98 — AAL escalation', () => {
  it('escalates AAL1 → AAL2 with sms factor', () => {
    const s = semantics.startStepUp({
      platform: 'chromium',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL2' });
    const step = semantics.satisfyAal2(s, { factor: 'sms', nowMs: 1000 });
    expect(step.state).toBe('aal2-satisfied');
  });

  it('escalates AAL1 → AAL3 with passkey-biometric', () => {
    const s = semantics.startStepUp({
      platform: 'webkit',
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL3' });
    const step = semantics.satisfyAal3(s, { factor: 'passkey-biometric', nowMs: 1000 });
    expect(step.state).toBe('aal3-satisfied');
  });
});

describe('tutorial 98 — trust cache', () => {
  it('hits within trust duration', () => {
    const s = semantics.startStepUp({
      platform: 'firefox',
      userId: 'u-1',
      currentAal: 'AAL1',
      trustDurationMs: 60_000,
    });
    semantics.requestEscalation(s, { requiredAal: 'AAL2' });
    semantics.satisfyAal2(s, { factor: 'totp', nowMs: 0 });
    const step = semantics.checkTrustCache(s, { nowMs: 30_000 });
    expect(step.metadata.hit).toBe(true);
  });
});

describe('tutorial 98 — auth continuity', () => {
  it('rotates refresh token safely', () => {
    const s = semantics.startContinuity({
      platform: 'chromium',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    const step = semantics.rotateRefresh(s, { newToken: 'r-2', nowMs: 500 });
    expect(step.state).toBe('refresh-rotated');
    expect(s.refreshToken).toBe('r-2');
  });

  it('revocation window blocks further actions', () => {
    const s = semantics.startContinuity({
      platform: 'webkit',
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 10_000,
    });
    semantics.hitRevocationWindow(s, { reason: 'refresh-reuse' });
    expect(() => semantics.rotateRefresh(s, { newToken: 'r-2', nowMs: 0 })).toThrow(
      /revocation window/,
    );
  });
});

// ---------------------------------------------------------------------------
// Tutorial 99 — Risk-based auth
// ---------------------------------------------------------------------------

describe('tutorial 99 — risk-based auth', () => {
  it('low signals → allowed', () => {
    const s = semantics.startRiskEval({
      platform: 'chromium',
      userId: 'u-1',
      allowThreshold: 30,
      blockThreshold: 70,
    });
    semantics.evaluateScore(s, {
      signals: {
        deviceScore: 5,
        ipReputation: 5,
        geoAnomaly: 5,
        velocityScore: 5,
        behavioralScore: 5,
      },
    });
    const step = semantics.applyPolicy(s);
    expect(step.state).toBe('allowed');
  });

  it('high signals → blocked', () => {
    const s = semantics.startRiskEval({
      platform: 'webkit',
      userId: 'u-1',
    });
    semantics.evaluateScore(s, {
      signals: {
        deviceScore: 20,
        ipReputation: 20,
        geoAnomaly: 20,
        velocityScore: 15,
        behavioralScore: 15,
      },
    });
    const step = semantics.applyPolicy(s);
    expect(step.state).toBe('blocked');
  });
});

describe('tutorial 99 — auth telemetry', () => {
  it('detects abuse when failure rate exceeds threshold', () => {
    const s = semantics.startAuthTelemetry({ platform: 'firefox', endpointId: '/login' });
    semantics.recordAttempt(s, { success: false, latencyMs: 100 });
    semantics.recordAttempt(s, { success: false, latencyMs: 200 });
    semantics.recordAttempt(s, { success: true, latencyMs: 150 });
    const step = semantics.detectAbuse(s, {
      failureRateThreshold: 0.5,
      ipAddress: '1.2.3.4',
    });
    expect(step.metadata.isAbuse).toBe(true);
  });
});

describe('tutorial 99 — session hijack detect', () => {
  it('reports geo anomaly + concurrent + triggers cascade', () => {
    const s = semantics.startHijackWatch({
      platform: 'chromium',
      sessionId: 'sess-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    semantics.reportGeoAnomaly(s, { observedRegion: 'BR', km: 18_000, withinMinutes: 5 });
    semantics.reportConcurrentSession(s, { concurrentSessionCount: 4 });
    const step = semantics.triggerLogoutCascade(s, {
      revokedSessionIds: ['sess-a', 'sess-b'],
    });
    expect(step.state).toBe('logout-cascade');
    expect(step.metadata.revokedCount).toBe(2);
  });
});
