/**
 * Provider-neutral Security Adapter surface for the mTLS + Zero-trust dogfood.
 *
 * The app talks to the mtls + zero-trust surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Istio + OPA style access
 *    broker (KIWA_ISTIO_URL + KIWA_OPA_URL + KIWA_MTLS_CA_PATH) when
 *    `KIWA_MODE=real` + `MTLS_STACK_READY=1` are set; otherwise every op
 *    reports `KIWA_MTLS_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/security` v0.2
 *    mtls + zero-trust semantics (startMtlsSession / completeHandshake /
 *    verifyPin / verifyOcsp / checkCtLog / startZeroTrustSession /
 *    evaluatePosture / scoreRisk / requestJit / enforceMicroSegment).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 2 axes v1.39-2
 * dogfoods —
 *  - mTLS (handshake + pin + OCSP + CT log)
 *  - zero-trust (posture + risk score + JIT + micro-segmentation)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - mtls-e2e (handshake + SPKI pin + OCSP staple + CT log check)
 *  - zero-trust-e2e (device posture + risk score + JIT grant + segment)
 *  - broker-e2e (combined mtls + zero-trust decision path)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of completing an mTLS handshake with a peer. */
export interface MtlsHandshakeResult {
  sessionId: string;
  peerCn: string;
  tlsVersion: '1.2' | '1.3';
  cipherSuite: string;
  latencyMs: number;
}

/** Result of verifying an SPKI pin against expected fingerprints. */
export interface MtlsPinResult {
  sessionId: string;
  matched: boolean;
  fingerprint: string;
  latencyMs: number;
}

/** Result of verifying an OCSP staple. */
export interface MtlsOcspResult {
  sessionId: string;
  stapled: boolean;
  good: boolean;
  latencyMs: number;
}

/** Result of checking a Certificate Transparency log. */
export interface MtlsCtResult {
  sessionId: string;
  sctCount: number;
  minSctRequired: number;
  ok: boolean;
  latencyMs: number;
}

/** Result of evaluating a device posture. */
export interface ZtPostureResult {
  sessionId: string;
  passed: boolean;
  osUpToDate: boolean;
  diskEncrypted: boolean;
  edrRunning: boolean;
  mdmEnrolled: boolean;
  latencyMs: number;
}

/** Result of scoring the risk signals for a session. */
export interface ZtRiskResult {
  sessionId: string;
  riskScore: number;
  latencyMs: number;
}

/** Result of a JIT (Just-in-Time) access request. */
export interface ZtJitResult {
  sessionId: string;
  requestedRole: string;
  granted: boolean;
  riskScore: number;
  ttlSeconds: number;
  latencyMs: number;
}

/** Result of enforcing micro-segmentation for a peer. */
export interface ZtSegmentResult {
  sessionId: string;
  workload: string;
  requestedPeer: string;
  allowed: boolean;
  latencyMs: number;
}

/** Result of a combined mtls + zero-trust broker decision. */
export interface BrokerDecideResult {
  sessionId: string;
  mtlsOk: boolean;
  ztOk: boolean;
  admitted: boolean;
  reason: string;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startMtls'
    | 'completeHandshake'
    | 'verifyPin'
    | 'verifyOcsp'
    | 'checkCtLog'
    | 'closeMtls'
    | 'startZeroTrust'
    | 'evaluatePosture'
    | 'scoreRisk'
    | 'requestJit'
    | 'enforceMicroSegment'
    | 'closeZeroTrust'
    | 'startBroker'
    | 'decideBroker'
    | 'closeBroker';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening an mTLS session. */
export interface MtlsSessionInput {
  sessionId: string;
  target: 'istio' | 'opa' | 'siem-splunk' | 'vault';
}

/** Input for opening a zero-trust session. */
export interface ZeroTrustSessionInput {
  sessionId: string;
  target: 'istio' | 'opa' | 'siem-splunk' | 'vault';
}

/** Input for the combined broker session. */
export interface BrokerSessionInput {
  sessionId: string;
  mtlsTarget: 'istio' | 'opa' | 'siem-splunk' | 'vault';
  ztTarget: 'istio' | 'opa' | 'siem-splunk' | 'vault';
}

/** The Security Adapter — 15 ops across 3 domain surfaces + 2 axes. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // mtls surface (mtls-e2e axis: handshake + pin + OCSP + CT log)
  startMtls(input: MtlsSessionInput): Promise<void>;
  completeHandshake(input: {
    sessionId: string;
    peerCn: string;
    cipherSuite: string;
    tlsVersion: '1.2' | '1.3';
  }): Promise<MtlsHandshakeResult>;
  verifyPin(input: {
    sessionId: string;
    spkiSha256: string;
    expectedPins: string[];
  }): Promise<MtlsPinResult>;
  verifyOcsp(input: {
    sessionId: string;
    stapled: boolean;
    goodResponse: boolean;
  }): Promise<MtlsOcspResult>;
  checkCtLog(input: {
    sessionId: string;
    sctCount: number;
    minSctRequired: number;
  }): Promise<MtlsCtResult>;
  closeMtls(input: { sessionId: string }): Promise<void>;

  // zero-trust surface (zero-trust-e2e axis: posture + risk + JIT + segment)
  startZeroTrust(input: ZeroTrustSessionInput): Promise<void>;
  evaluatePosture(input: {
    sessionId: string;
    osUpToDate: boolean;
    diskEncrypted: boolean;
    edrRunning: boolean;
    mdmEnrolled: boolean;
  }): Promise<ZtPostureResult>;
  scoreRisk(input: {
    sessionId: string;
    unusualLocation: boolean;
    unusualTime: boolean;
    newDevice: boolean;
    threatIntelHit: boolean;
  }): Promise<ZtRiskResult>;
  requestJit(input: {
    sessionId: string;
    requestedRole: string;
    justification: string;
    ttlSeconds: number;
  }): Promise<ZtJitResult>;
  enforceMicroSegment(input: {
    sessionId: string;
    workload: string;
    allowedPeers: string[];
    requestedPeer: string;
  }): Promise<ZtSegmentResult>;
  closeZeroTrust(input: { sessionId: string }): Promise<void>;

  // broker surface (broker-e2e axis: combined mtls + zero-trust decision)
  startBroker(input: BrokerSessionInput): Promise<void>;
  decideBroker(input: {
    sessionId: string;
    mtlsOk: boolean;
    ztOk: boolean;
  }): Promise<BrokerDecideResult>;
  closeBroker(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
