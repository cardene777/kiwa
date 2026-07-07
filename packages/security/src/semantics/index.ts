/**
 * @kiwa-test/security v0.2 advanced II SSOT — 4 provider x 8 axis semantics.
 *
 * v0.1 (`../index.ts`) の base 8 axis (CSP / rate-limit / authorization / WAF /
 * threat-model / secrets-scan / SBOM / security-headers) と直交する
 * 高度 8 axis を扱う。
 */

export {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvAxis,
  type SecurityAdvTarget,
} from './types.js';

export {
  checkCtLog,
  completeHandshake,
  startMtlsSession,
  verifyOcsp,
  verifyPin,
  type CtLogInput,
  type HandshakeInput,
  type MtlsSession,
  type MtlsState,
  type OcspInput,
  type PinInput,
} from './mtls.js';

export {
  enforceMicroSegment,
  evaluatePosture,
  requestJit,
  scoreRisk,
  startZeroTrustSession,
  type DevicePosture,
  type JitRequest,
  type SegmentPolicy,
  type ZeroTrustSession,
  type ZeroTrustState,
} from './zero-trust.js';

export {
  applyRetention,
  correlate,
  sealEvents,
  startSiemAuditSession,
  structureEvent,
  type CorrelationRule,
  type RetentionPolicy,
  type SiemAuditSession,
  type SiemAuditState,
  type SiemEvent,
  type StructuredEvent,
} from './siem-audit.js';

export {
  captureForensics,
  classifySeverity,
  escalate,
  recordPostMortem,
  startIncidentSession,
  triggerPlaybook,
  type EscalationInput,
  type ForensicsInput,
  type IncidentSession,
  type IncidentSeverity,
  type IncidentState,
  type PlaybookInput,
  type PostMortemInput,
  type SeverityInput,
} from './incident-response.js';

export {
  deriveKey,
  encapsulatePq,
  rotateKey,
  sealAead,
  signWithHsm,
  startCryptoSession,
  wrapEnvelope,
  type AeadAlgo,
  type AeadInput,
  type CryptoSession,
  type CryptoState,
  type EnvelopeInput,
  type HsmSignInput,
  type KdfAlgo,
  type KdfInput,
  type KeyRotationInput,
  type PqKemAlgo,
  type PqKemInput,
} from './crypto-advanced.js';

export {
  applyNetworkPolicy,
  decideAdmission,
  enforcePodSecurity,
  startK8sSession,
  type AdmissionRequest,
  type K8sSession,
  type K8sState,
  type NetworkPolicySpec,
  type PodSecurityLevel,
  type PodSpec,
} from './container-k8s.js';

export {
  matchReproducibleBuild,
  signProvenance,
  startSupplyChainSession,
  verifyAttestation,
  verifySlsaLevel,
  type AttestationInput,
  type ProvenanceInput,
  type ReproducibleInput,
  type SlsaLevel,
  type SlsaLevelInput,
  type SupplyChainSession,
  type SupplyChainState,
} from './supply-chain.js';

export {
  applyPermissionsPolicy,
  enforceCrossOriginIsolation,
  enforceTrustedTypes,
  startWvsSession,
  verifySri,
  type CrossOriginInput,
  type PermissionsPolicyInput,
  type SriInput,
  type TrustedTypesInput,
  type WvsSession,
  type WvsState,
} from './web-vitals-security.js';

export {
  collectAdvFidelityCoverage,
  SECURITY_ADV_AXIS_TO_EVENTS,
  SECURITY_ADV_FIDELITY_GRID,
  type AdvFidelityCoverage,
  type AdvFidelityRow,
} from './fidelity.js';

export {
  ADV_API_KEY_ENV_KEY,
  ADV_ENDPOINT_ENV_KEY,
  ADV_REQUIRED_KEYS,
  buildAdvRealDriverConfig,
  isKiwaAdvModeReal,
  resolveAdvApiKey,
  resolveAdvEndpoint,
  resolveAdvRealDriver,
  skipUnlessAdvReal,
  type AdvRealDriverConfig,
  type AdvRealDriverGateInput,
  type AdvRealDriverGateResult,
} from './real-driver.js';
