import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * mTLS + certificate pinning axis — mutual TLS handshake + pin verification +
 * OCSP stapling + Certificate Transparency log check state machine。
 *
 * Deterministic mock で 4 signal 系統を提供。 real driver 経路では実 istio /
 * envoy sidecar に対して TLS handshake を張り、 SPKI pin と OCSP staple を
 * 検証する。
 */

export type MtlsState =
  | 'idle'
  | 'handshake-completed'
  | 'pinned'
  | 'ocsp-verified'
  | 'ct-verified'
  | 'failed';

export interface MtlsSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: MtlsState;
  history: AxisAdvStep<MtlsState>[];
  pinnedFingerprints: string[];
}

export interface HandshakeInput {
  peerCn: string;
  cipherSuite: string;
  tlsVersion: '1.2' | '1.3';
}

export interface PinInput {
  spkiSha256: string;
  expectedPins: string[];
}

export interface OcspInput {
  stapled: boolean;
  goodResponse: boolean;
}

export interface CtLogInput {
  sctCount: number;
  minSctRequired: number;
}

export function startMtlsSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): MtlsSession {
  if (input.sessionId.length === 0) {
    throw new Error('startMtlsSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    pinnedFingerprints: [],
  };
}

export function completeHandshake(
  session: MtlsSession,
  input: HandshakeInput,
): AxisAdvStep<MtlsState> {
  if (session.state !== 'idle') {
    throw new Error(`completeHandshake: session is ${session.state}, cannot handshake`);
  }
  if (input.tlsVersion !== '1.3' && input.tlsVersion !== '1.2') {
    throw new Error('completeHandshake: only TLS 1.2 / 1.3 supported');
  }
  session.state = 'handshake-completed';
  return emit(session, 'mtls.handshake_completed', {
    peerCn: input.peerCn,
    cipherSuite: input.cipherSuite,
    tlsVersion: input.tlsVersion,
  });
}

export function verifyPin(session: MtlsSession, input: PinInput): AxisAdvStep<MtlsState> {
  if (session.state !== 'handshake-completed' && session.state !== 'ocsp-verified') {
    throw new Error(`verifyPin: session is ${session.state}, must have completed handshake`);
  }
  if (input.expectedPins.length === 0) {
    throw new Error('verifyPin: expectedPins must not be empty');
  }
  const matched = input.expectedPins.includes(input.spkiSha256);
  if (!matched) {
    session.state = 'failed';
    return emit(session, 'mtls.cert_pinned', {
      matched: false,
      fingerprint: input.spkiSha256,
    });
  }
  session.state = 'pinned';
  session.pinnedFingerprints.push(input.spkiSha256);
  return emit(session, 'mtls.cert_pinned', {
    matched: true,
    fingerprint: input.spkiSha256,
  });
}

export function verifyOcsp(session: MtlsSession, input: OcspInput): AxisAdvStep<MtlsState> {
  if (session.state !== 'pinned' && session.state !== 'handshake-completed') {
    throw new Error(`verifyOcsp: session is ${session.state}, need handshake / pin first`);
  }
  if (!input.stapled) {
    session.state = 'failed';
    return emit(session, 'mtls.ocsp_verified', { stapled: false, good: false });
  }
  session.state = input.goodResponse ? 'ocsp-verified' : 'failed';
  return emit(session, 'mtls.ocsp_verified', {
    stapled: true,
    good: input.goodResponse,
  });
}

export function checkCtLog(session: MtlsSession, input: CtLogInput): AxisAdvStep<MtlsState> {
  if (session.state === 'failed' || session.state === 'idle') {
    throw new Error(`checkCtLog: session is ${session.state}, must have handshake first`);
  }
  if (input.minSctRequired < 0) {
    throw new Error('checkCtLog: minSctRequired must be non-negative');
  }
  const ok = input.sctCount >= input.minSctRequired;
  session.state = ok ? 'ct-verified' : 'failed';
  return emit(session, 'mtls.ct_log_checked', {
    sctCount: input.sctCount,
    minSctRequired: input.minSctRequired,
    ok,
  });
}

function emit(
  session: MtlsSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<MtlsState> {
  const step: AxisAdvStep<MtlsState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
