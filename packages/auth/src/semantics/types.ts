/**
 * Advanced auth semantics — platform-neutral axis SSOT (v0.6 Passwordless UX III).
 *
 * v0.4 auth (v1.21) landed 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1
 * / OIDC). v0.5 (v1.22) added real driver env-gate + Federation JWKS rotation
 * e2e + a11y gate. v0.6 (v1.44) adds 8 advanced Passwordless UX axes on top of
 * the existing 4 protocol adapter — device-bound-passkey (device bind + credProps.rk
 * + sync fabric verification), conditional-ui (autofill hint + mediation="conditional"
 * + fallback ladder), step-up-mfa (AAL escalation ladder + biometric prompt +
 * trust duration cache), risk-based-auth (risk score + adaptive challenge +
 * policy chain), auth-continuity (seamless re-auth + refresh + session extension
 * + revocation window), cross-device-flow (QR handshake + BLE proximity + hybrid
 * transport + tunnel state machine), session-hijack-detect (fingerprint drift
 * + geo anomaly + concurrent session + logout cascade), and auth-telemetry
 * (attempt log + success rate histogram + latency histogram + abuse detection).
 *
 * Each axis is expressed as a small pure state-machine helper that returns
 * a neutral envelope, so downstream tests can drive the axis without knowing
 * the browser vendor's payload dialect (chromium / webkit / firefox each ship
 * different WebAuthn conditional UI + sync fabric ergonomics).
 */
export type AuthPlatform = 'chromium' | 'webkit' | 'firefox';

export type AuthAxis =
  | 'device-bound-passkey'
  | 'conditional-ui'
  | 'step-up-mfa'
  | 'risk-based-auth'
  | 'auth-continuity'
  | 'cross-device-flow'
  | 'session-hijack-detect'
  | 'auth-telemetry';

/**
 * Platform-neutral event names emitted by the axis helpers. Browsers expose
 * different string ids for the same semantic — the {@link platformEventName}
 * map handles the translation. Tests can assert on the neutral name via
 * `step.neutralEvent` or on the browser dialect via `step.platformEvent`.
 */
export type NeutralEventName =
  // device-bound-passkey
  | 'passkey.device-bound'
  | 'passkey.credential-migrated'
  | 'passkey.sync-fabric-verified'
  | 'passkey.credprops-confirmed'
  // conditional-ui
  | 'conditional-ui.hint-shown'
  | 'conditional-ui.autofill-selected'
  | 'conditional-ui.fallback-triggered'
  | 'conditional-ui.timeout-exceeded'
  // step-up-mfa
  | 'step-up.escalation-requested'
  | 'step-up.aal2-satisfied'
  | 'step-up.aal3-satisfied'
  | 'step-up.trust-cached'
  // risk-based-auth
  | 'risk.score-evaluated'
  | 'risk.challenge-injected'
  | 'risk.policy-blocked'
  | 'risk.policy-allowed'
  // auth-continuity
  | 'continuity.seamless-reauth'
  | 'continuity.refresh-rotated'
  | 'continuity.session-extended'
  | 'continuity.revocation-window-hit'
  // cross-device-flow
  | 'cross-device.qr-generated'
  | 'cross-device.ble-paired'
  | 'cross-device.tunnel-opened'
  | 'cross-device.handshake-completed'
  // session-hijack-detect
  | 'hijack.fingerprint-drift'
  | 'hijack.geo-anomaly'
  | 'hijack.concurrent-session'
  | 'hijack.logout-cascade'
  // auth-telemetry
  | 'telemetry.attempt-recorded'
  | 'telemetry.success-rate-updated'
  | 'telemetry.latency-bucketed'
  | 'telemetry.abuse-detected';

const dialect: Record<AuthPlatform, Partial<Record<NeutralEventName, string>>> = {
  chromium: {
    'passkey.device-bound': 'webauthn.device_bound',
    'passkey.credential-migrated': 'webauthn.credential_migrated',
    'passkey.sync-fabric-verified': 'chrome_sync.passkey_verified',
    'passkey.credprops-confirmed': 'webauthn.credprops_rk_confirmed',
    'conditional-ui.hint-shown': 'webauthn.autofill.hint_shown',
    'conditional-ui.autofill-selected': 'webauthn.autofill.selected',
    'conditional-ui.fallback-triggered': 'webauthn.autofill.fallback',
    'conditional-ui.timeout-exceeded': 'webauthn.autofill.timeout',
    'step-up.escalation-requested': 'webauthn.step_up.requested',
    'step-up.aal2-satisfied': 'webauthn.step_up.aal2',
    'step-up.aal3-satisfied': 'webauthn.step_up.aal3',
    'step-up.trust-cached': 'webauthn.step_up.trust_cached',
    'risk.score-evaluated': 'risk_engine.score_evaluated',
    'risk.challenge-injected': 'risk_engine.challenge_injected',
    'risk.policy-blocked': 'risk_engine.policy_blocked',
    'risk.policy-allowed': 'risk_engine.policy_allowed',
    'continuity.seamless-reauth': 'session.seamless_reauth',
    'continuity.refresh-rotated': 'session.refresh_rotated',
    'continuity.session-extended': 'session.extended',
    'continuity.revocation-window-hit': 'session.revocation_window',
    'cross-device.qr-generated': 'cable.qr_generated',
    'cross-device.ble-paired': 'cable.ble_paired',
    'cross-device.tunnel-opened': 'cable.tunnel_opened',
    'cross-device.handshake-completed': 'cable.handshake_completed',
    'hijack.fingerprint-drift': 'session.fingerprint_drift',
    'hijack.geo-anomaly': 'session.geo_anomaly',
    'hijack.concurrent-session': 'session.concurrent',
    'hijack.logout-cascade': 'session.logout_cascade',
    'telemetry.attempt-recorded': 'auth_telemetry.attempt',
    'telemetry.success-rate-updated': 'auth_telemetry.success_rate',
    'telemetry.latency-bucketed': 'auth_telemetry.latency_bucket',
    'telemetry.abuse-detected': 'auth_telemetry.abuse',
  },
  webkit: {
    'passkey.device-bound': 'wk_webauthn.device_bound',
    'passkey.credential-migrated': 'icloud_keychain.migrated',
    'passkey.sync-fabric-verified': 'icloud_keychain.verified',
    'passkey.credprops-confirmed': 'wk_webauthn.credprops_rk',
    'conditional-ui.hint-shown': 'wk_webauthn.autofill.hint',
    'conditional-ui.autofill-selected': 'wk_webauthn.autofill.selected',
    'conditional-ui.fallback-triggered': 'wk_webauthn.autofill.fallback',
    'conditional-ui.timeout-exceeded': 'wk_webauthn.autofill.timeout',
    'step-up.escalation-requested': 'wk_webauthn.step_up.requested',
    'step-up.aal2-satisfied': 'wk_webauthn.step_up.aal2',
    'step-up.aal3-satisfied': 'wk_webauthn.step_up.aal3',
    'step-up.trust-cached': 'wk_webauthn.step_up.trust_cached',
    'risk.score-evaluated': 'risk_engine.score_evaluated',
    'risk.challenge-injected': 'risk_engine.challenge_injected',
    'risk.policy-blocked': 'risk_engine.policy_blocked',
    'risk.policy-allowed': 'risk_engine.policy_allowed',
    'continuity.seamless-reauth': 'safari_session.seamless_reauth',
    'continuity.refresh-rotated': 'safari_session.refresh_rotated',
    'continuity.session-extended': 'safari_session.extended',
    'continuity.revocation-window-hit': 'safari_session.revocation_window',
    'cross-device.qr-generated': 'wk_cable.qr_generated',
    'cross-device.ble-paired': 'wk_cable.ble_paired',
    'cross-device.tunnel-opened': 'wk_cable.tunnel_opened',
    'cross-device.handshake-completed': 'wk_cable.handshake_completed',
    'hijack.fingerprint-drift': 'safari_session.fingerprint_drift',
    'hijack.geo-anomaly': 'safari_session.geo_anomaly',
    'hijack.concurrent-session': 'safari_session.concurrent',
    'hijack.logout-cascade': 'safari_session.logout_cascade',
    'telemetry.attempt-recorded': 'wk_auth_telemetry.attempt',
    'telemetry.success-rate-updated': 'wk_auth_telemetry.success_rate',
    'telemetry.latency-bucketed': 'wk_auth_telemetry.latency_bucket',
    'telemetry.abuse-detected': 'wk_auth_telemetry.abuse',
  },
  firefox: {
    'passkey.device-bound': 'ff_webauthn.device_bound',
    'passkey.credential-migrated': 'ff_webauthn.migrated',
    'passkey.sync-fabric-verified': 'ff_sync.passkey_verified',
    'passkey.credprops-confirmed': 'ff_webauthn.credprops_rk',
    'conditional-ui.hint-shown': 'ff_webauthn.autofill.hint',
    'conditional-ui.autofill-selected': 'ff_webauthn.autofill.selected',
    'conditional-ui.fallback-triggered': 'ff_webauthn.autofill.fallback',
    'conditional-ui.timeout-exceeded': 'ff_webauthn.autofill.timeout',
    'step-up.escalation-requested': 'ff_webauthn.step_up.requested',
    'step-up.aal2-satisfied': 'ff_webauthn.step_up.aal2',
    'step-up.aal3-satisfied': 'ff_webauthn.step_up.aal3',
    'step-up.trust-cached': 'ff_webauthn.step_up.trust_cached',
    'risk.score-evaluated': 'risk_engine.score_evaluated',
    'risk.challenge-injected': 'risk_engine.challenge_injected',
    'risk.policy-blocked': 'risk_engine.policy_blocked',
    'risk.policy-allowed': 'risk_engine.policy_allowed',
    'continuity.seamless-reauth': 'ff_session.seamless_reauth',
    'continuity.refresh-rotated': 'ff_session.refresh_rotated',
    'continuity.session-extended': 'ff_session.extended',
    'continuity.revocation-window-hit': 'ff_session.revocation_window',
    'cross-device.qr-generated': 'ff_cable.qr_generated',
    'cross-device.ble-paired': 'ff_cable.ble_paired',
    'cross-device.tunnel-opened': 'ff_cable.tunnel_opened',
    'cross-device.handshake-completed': 'ff_cable.handshake_completed',
    'hijack.fingerprint-drift': 'ff_session.fingerprint_drift',
    'hijack.geo-anomaly': 'ff_session.geo_anomaly',
    'hijack.concurrent-session': 'ff_session.concurrent',
    'hijack.logout-cascade': 'ff_session.logout_cascade',
    'telemetry.attempt-recorded': 'ff_auth_telemetry.attempt',
    'telemetry.success-rate-updated': 'ff_auth_telemetry.success_rate',
    'telemetry.latency-bucketed': 'ff_auth_telemetry.latency_bucket',
    'telemetry.abuse-detected': 'ff_auth_telemetry.abuse',
  },
};

export function platformEventName(
  platform: AuthPlatform,
  neutral: NeutralEventName,
): string {
  return dialect[platform][neutral] ?? neutral;
}

export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  platformEvent: string;
  state: TState;
  platform: AuthPlatform;
  metadata: Record<string, string | number | boolean>;
}
