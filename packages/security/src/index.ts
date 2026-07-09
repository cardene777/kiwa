// @kiwa-lab/security — public API surface。
// v0.1 covers 8 axis (CSP / rate-limit / authorization / WAF / threat-model /
// secrets-scan / SBOM / security-headers advanced) unified across 4 providers
// (helmet / express-rate-limit / casbin / coraza) with 4 x 8 = 32 combination
// fidelity harness and KIWA_MODE=real env-gate.
//
// v0.2 adds advanced II 8 axis (mTLS / zero-trust / SIEM-audit /
// incident-response / crypto-advanced / container-k8s / supply-chain /
// web-vitals-security) unified across 4 providers (istio / opa / siem-splunk /
// vault) with a second 4 x 8 = 32 combination fidelity grid, re-exported via
// `./semantics/index.js`.

// Shared types.
export type {
  SecurityAxis,
  SecurityDriver,
  SecurityEvent,
  SecurityProvider,
  SecurityVerdict,
} from './types.js';

// Axis 1 — CSP.
export {
  buildCspHeader,
  toCspEvent,
  validateNonce,
  type CspDirective,
  type CspHashAlgo,
  type CspHashOptions,
  type CspHeaderOutput,
  type CspNonceOptions,
  type CspPolicyInput,
} from './csp.js';

// Axis 2 — Rate limiting.
export {
  DistributedRateLimiter,
  LeakyBucket,
  resolveClientId,
  SlidingWindow,
  TokenBucket,
  toRateLimitEvent,
  type ClientIdKind,
  type DistributedRateLimitConfig,
  type LeakyBucketConfig,
  type RateLimitDecision,
  type RateLimitStrategy,
  type SlidingWindowConfig,
  type TokenBucketConfig,
} from './rate-limit.js';

// Axis 3 — Authorization.
export {
  createRbacPolicy,
  evaluateAbac,
  evaluateCombined,
  expandRoles,
  rbacAllows,
  toAuthorizationEvent,
  type AbacAttributes,
  type AbacCombiningAlgo,
  type AbacDecision,
  type AbacPolicy,
  type AbacRule,
  type AbacRuleEffect,
  type CombinedPolicyInput,
  type RbacPolicy,
  type RbacRole,
  type RbacSubject,
} from './authorization.js';

// Axis 4 — WAF.
export {
  addCustomRule,
  createWafPolicy,
  evaluateWaf,
  OWASP_CRS_DEFAULT,
  suppressFalsePositive,
  toWafEvent,
  type WafDecision,
  type WafPolicy,
  type WafRequest,
  type WafRule,
  type WafRuleAction,
} from './waf.js';

// Axis 5 — Threat model.
export {
  detectBoundaryCrossings,
  pastaCoverage,
  scoreDread,
  scoreStride,
  toThreatModelEvent,
  type BoundaryCrossing,
  type DataFlow,
  type DreadInput,
  type DreadResult,
  type PastaFinding,
  type PastaStage,
  type StrideCategory,
  type StrideThreat,
  type TrustZone,
} from './threat-model.js';

// Axis 6 — Secrets scanning.
export {
  DEFAULT_SIGNATURES,
  isRotationOverdue,
  markRotated,
  scanSecrets,
  shannonEntropy,
  toSecretsEvent,
  type RotationPolicy,
  type RotationTracker,
  type SecretFinding,
  type SecretKind,
  type SecretSignature,
} from './secrets-scan.js';

// Axis 7 — SBOM.
export {
  DEFAULT_LICENSE_POLICY,
  evaluateLicense,
  lookupAdvisories,
  toCycloneDx,
  toSbomEvent,
  toSpdx,
  validateSbom,
  versionInRange,
  type Advisory,
  type AdvisoryFeed,
  type AdvisoryLookupResult,
  type LicensePolicy,
  type LicenseVerdict,
  type SbomComponent,
  type SbomDocument,
} from './sbom.js';

// Axis 8 — Security headers advanced.
export {
  buildSecurityHeaders,
  toSecurityHeadersEvent,
  validateSecurityHeaders,
  type HstsOptions,
  type PermissionsFeature,
  type PermissionsSource,
  type ReferrerPolicyValue,
  type SecurityHeadersInput,
  type SecurityHeadersOutput,
  type XFrameOption,
} from './security-headers.js';

// Fidelity harness — 4 provider x 8 axis = 32 combination grid.
export {
  reasonSimilarity,
  runSecurityFidelityCheck,
  SECURITY_FIDELITY_GRID,
  verdictSimilarity,
  type SecurityFidelityInput,
  type SecurityFidelityRecord,
  type SecurityFidelityReport,
} from './fidelity.js';

// Real driver env-gate — KIWA_MODE=real + testcontainers.
export {
  isKiwaModeReal,
  REAL_DRIVER_REQUIRED_KEYS,
  resolveEndpoint,
  resolveRealtimeDriver,
  skipUnlessReal,
  type RealDriverEndpoint,
  type RealDriverGateInput,
  type RealDriverGateResult,
} from './real-driver.js';

/**
 * v0.2 advanced II semantics — 4 provider (istio / opa / siem-splunk / vault)
 * x 8 axis (mtls / zero-trust / siem-audit / incident-response /
 * crypto-advanced / container-k8s / supply-chain / web-vitals-security) SSOT.
 *
 * v0.1 axis と直交する 2 段目の fidelity grid + KIWA_MODE=real gate。
 */
export * from './semantics/index.js';
