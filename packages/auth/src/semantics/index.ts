export type {
  AuthAxis,
  AuthPlatform,
  AxisStep,
  NeutralEventName,
} from './types.js';
export { platformEventName } from './types.js';

export type { FidelityCoverage, FidelityRow } from './fidelity.js';
export { AXIS_TO_EVENTS, collectFidelityCoverage } from './fidelity.js';

export type { PasskeyBindState, DevicePasskeySession } from './device-bound-passkey.js';
export {
  startDevicePasskey,
  bindToDevice,
  verifySyncFabric,
  migrateCredential,
  confirmCredProps,
} from './device-bound-passkey.js';

export type { ConditionalUiState, ConditionalUiSession } from './conditional-ui.js';
export {
  startConditionalUi,
  showHint,
  selectAutofill,
  triggerFallback,
  markTimeout,
} from './conditional-ui.js';

export type { AalLevel, StepUpState, StepUpSession } from './step-up-mfa.js';
export {
  startStepUp,
  requestEscalation,
  satisfyAal2,
  satisfyAal3,
  checkTrustCache,
} from './step-up-mfa.js';

export type { RiskState, RiskSignals, RiskSession } from './risk-based-auth.js';
export {
  startRiskEval,
  evaluateScore,
  injectChallenge,
  applyPolicy,
} from './risk-based-auth.js';

export type { ContinuityState, ContinuitySession } from './auth-continuity.js';
export {
  startContinuity,
  seamlessReauth,
  rotateRefresh,
  extendSession,
  hitRevocationWindow,
} from './auth-continuity.js';

export type { CrossDeviceState, CrossDeviceSession } from './cross-device-flow.js';
export {
  startCrossDevice,
  generateQr,
  pairBle,
  openTunnel,
  completeHandshake,
} from './cross-device-flow.js';

export type { HijackState, HijackSession } from './session-hijack-detect.js';
export {
  startHijackWatch,
  reportFingerprintDrift,
  reportGeoAnomaly,
  reportConcurrentSession,
  triggerLogoutCascade,
} from './session-hijack-detect.js';

export type {
  TelemetryState,
  TelemetryBuckets,
  AuthTelemetrySession,
} from './auth-telemetry.js';
export {
  startAuthTelemetry,
  recordAttempt,
  updateSuccessRate,
  bucketLatency,
  detectAbuse,
} from './auth-telemetry.js';

// v0.7 continuous-auth = risk-based-auth + auth-continuity + session-hijack-detect の 継続合成 layer
export type {
  ContinuousAuthState,
  ContinuousAuthSession,
  RiskLevel,
} from './continuous-auth.js';
export {
  startContinuousAuth,
  scoreToLevel,
  evaluateRisk,
  completeStepUp,
  freezeSession,
  terminateContinuousAuth,
} from './continuous-auth.js';

// v0.8 session-lifecycle-orchestrator = continuous-auth + step-up-mfa + auth-continuity +
// session-hijack-detect + auth-telemetry の 継続合成 layer (depth-5 pattern 10 例目 candidate)
export type {
  SessionState,
  SessionEvent,
  SessionOrchestratorSession,
  SessionOrchestratorSummary,
} from './session-lifecycle-orchestrator.js';
export {
  startSession,
  dispatchEvent as dispatchSessionEvent,
  summarizeSession,
} from './session-lifecycle-orchestrator.js';
