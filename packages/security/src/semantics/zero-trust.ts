import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Zero-trust axis — device posture + risk scoring + Just-in-Time access +
 * micro-segmentation state machine。
 *
 * Deterministic mock で 4 signal 系統を提供。 real driver 経路では OPA rego
 * policy や Google BeyondCorp 相当の verifier に対して posture 判定を
 * 発火する。
 */

export type ZeroTrustState =
  | 'idle'
  | 'posture-evaluated'
  | 'risk-scored'
  | 'jit-granted'
  | 'jit-denied'
  | 'segment-enforced';

export interface ZeroTrustSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: ZeroTrustState;
  history: AxisAdvStep<ZeroTrustState>[];
  riskScore: number;
  grantedRoles: string[];
}

export interface DevicePosture {
  osUpToDate: boolean;
  diskEncrypted: boolean;
  edrRunning: boolean;
  mdmEnrolled: boolean;
}

export interface JitRequest {
  requestedRole: string;
  justification: string;
  ttlSeconds: number;
}

export interface SegmentPolicy {
  workload: string;
  allowedPeers: string[];
  requestedPeer: string;
}

export function startZeroTrustSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): ZeroTrustSession {
  if (input.sessionId.length === 0) {
    throw new Error('startZeroTrustSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    riskScore: 0,
    grantedRoles: [],
  };
}

export function evaluatePosture(
  session: ZeroTrustSession,
  posture: DevicePosture,
): AxisAdvStep<ZeroTrustState> {
  if (session.state !== 'idle') {
    throw new Error(`evaluatePosture: session is ${session.state}, must be idle`);
  }
  const passed =
    posture.osUpToDate && posture.diskEncrypted && posture.edrRunning && posture.mdmEnrolled;
  session.state = 'posture-evaluated';
  return emit(session, 'zt.device_posture_evaluated', {
    osUpToDate: posture.osUpToDate,
    diskEncrypted: posture.diskEncrypted,
    edrRunning: posture.edrRunning,
    mdmEnrolled: posture.mdmEnrolled,
    passed,
  });
}

export function scoreRisk(
  session: ZeroTrustSession,
  input: {
    unusualLocation: boolean;
    unusualTime: boolean;
    newDevice: boolean;
    threatIntelHit: boolean;
  },
): AxisAdvStep<ZeroTrustState> {
  if (session.state !== 'posture-evaluated') {
    throw new Error('scoreRisk: posture must be evaluated first');
  }
  let score = 0;
  if (input.unusualLocation) score += 25;
  if (input.unusualTime) score += 15;
  if (input.newDevice) score += 20;
  if (input.threatIntelHit) score += 40;
  session.riskScore = score;
  session.state = 'risk-scored';
  return emit(session, 'zt.risk_scored', {
    riskScore: score,
    unusualLocation: input.unusualLocation,
    unusualTime: input.unusualTime,
    newDevice: input.newDevice,
    threatIntelHit: input.threatIntelHit,
  });
}

export function requestJit(
  session: ZeroTrustSession,
  request: JitRequest,
): AxisAdvStep<ZeroTrustState> {
  if (session.state !== 'risk-scored') {
    throw new Error('requestJit: risk must be scored first');
  }
  if (request.ttlSeconds <= 0 || request.ttlSeconds > 3600) {
    throw new Error('requestJit: ttlSeconds must be 1..3600');
  }
  if (request.justification.length < 10) {
    throw new Error('requestJit: justification must be >= 10 chars');
  }
  const granted = session.riskScore < 50;
  if (granted) {
    session.grantedRoles.push(request.requestedRole);
    session.state = 'jit-granted';
  } else {
    session.state = 'jit-denied';
  }
  return emit(session, 'zt.jit_granted', {
    requestedRole: request.requestedRole,
    ttlSeconds: request.ttlSeconds,
    granted,
    riskScore: session.riskScore,
  });
}

export function enforceMicroSegment(
  session: ZeroTrustSession,
  policy: SegmentPolicy,
): AxisAdvStep<ZeroTrustState> {
  if (session.state !== 'jit-granted') {
    throw new Error('enforceMicroSegment: JIT must be granted first');
  }
  const allowed = policy.allowedPeers.includes(policy.requestedPeer);
  session.state = 'segment-enforced';
  return emit(session, 'zt.micro_segment_enforced', {
    workload: policy.workload,
    requestedPeer: policy.requestedPeer,
    allowed,
  });
}

function emit(
  session: ZeroTrustSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<ZeroTrustState> {
  const step: AxisAdvStep<ZeroTrustState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
