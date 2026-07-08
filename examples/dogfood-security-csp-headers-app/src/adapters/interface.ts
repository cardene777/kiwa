/**
 * Provider-neutral Security Adapter surface for the CSP + headers dogfood.
 *
 * The Next.js app talks to the CSP + violation + advanced security headers
 * surface only through this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives Playwright + Chromium headless when
 *    `KIWA_MODE=real` + `CSP_BROWSER_READY=1` are set; otherwise every op
 *    reports `KIWA_CSP_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/security` v0.1
 *    csp + security-headers semantics.
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.37-2
 * dogfoods —
 *  - CSP builder (nonce + hash + strict-dynamic + trusted-types + report-only)
 *  - Violation reporting (report-to + report-uri + trace of violations)
 *  - Security headers advanced (HSTS + X-Frame + X-Content-Type + Referrer + Permissions)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - csp-e2e (nonce + hash + strict-dynamic + trusted-types)
 *  - violation-e2e (report-to + report-uri + violation trace)
 *  - headers-e2e (HSTS + X-Frame + X-Content-Type + Referrer + Permissions)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of building a CSP header with nonce + strict-dynamic + trusted-types. */
export interface BuildCspResult {
  routeId: string;
  policyId: string;
  headerName: string;
  headerValue: string;
  nonce: string;
  strictDynamicApplied: boolean;
  trustedTypesApplied: boolean;
  reportOnly: boolean;
  latencyMs: number;
}

/** Result of ingesting a CSP violation report. */
export interface ReportViolationResult {
  routeId: string;
  policyId: string;
  reportId: string;
  directive: string;
  blockedUri: string;
  disposition: 'enforce' | 'report';
  accepted: boolean;
  latencyMs: number;
}

/** Result of building the advanced security headers bundle. */
export interface BuildHeadersResult {
  routeId: string;
  bundleId: string;
  headers: Record<string, string>;
  applied: string[];
  validationOk: boolean;
  validationErrors: string[];
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startCsp'
    | 'attachNonce'
    | 'attachHash'
    | 'applyStrictDynamic'
    | 'applyTrustedTypes'
    | 'emitCspHeader'
    | 'startViolation'
    | 'ingestViolation'
    | 'recordViolationEvent'
    | 'closeViolation'
    | 'startHeaders'
    | 'applyHsts'
    | 'applyReferrerPolicy'
    | 'applyPermissionsPolicy'
    | 'emitHeaderBundle';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** The Security Adapter — 15 ops across 3 domain surfaces + 3 axes. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // csp surface (csp-e2e axis: nonce + hash + strict-dynamic + trusted-types)
  startCsp(input: {
    routeId: string;
    policyId: string;
  }): Promise<void>;
  attachNonce(input: {
    routeId: string;
    policyId: string;
    nonce: string;
  }): Promise<void>;
  attachHash(input: {
    routeId: string;
    policyId: string;
    algorithm: 'sha256' | 'sha384' | 'sha512';
    digest: string;
  }): Promise<void>;
  applyStrictDynamic(input: {
    routeId: string;
    policyId: string;
  }): Promise<void>;
  applyTrustedTypes(input: {
    routeId: string;
    policyId: string;
    policies: string[];
    requireForScript: boolean;
  }): Promise<void>;
  emitCspHeader(input: {
    routeId: string;
    policyId: string;
    reportOnly: boolean;
    reportGroup?: string;
  }): Promise<BuildCspResult>;

  // violation surface (violation-e2e axis: report-to + report-uri + trace)
  startViolation(input: {
    routeId: string;
    policyId: string;
    reportId: string;
  }): Promise<void>;
  ingestViolation(input: {
    routeId: string;
    policyId: string;
    reportId: string;
    directive: string;
    blockedUri: string;
    disposition: 'enforce' | 'report';
  }): Promise<ReportViolationResult>;
  recordViolationEvent(input: {
    routeId: string;
    policyId: string;
    reportId: string;
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
  }): Promise<void>;
  closeViolation(input: {
    routeId: string;
    policyId: string;
    reportId: string;
  }): Promise<void>;

  // headers surface (headers-e2e axis: HSTS + X-Frame + Referrer + Permissions)
  startHeaders(input: {
    routeId: string;
    bundleId: string;
  }): Promise<void>;
  applyHsts(input: {
    routeId: string;
    bundleId: string;
    maxAgeSec: number;
    includeSubDomains: boolean;
    preload: boolean;
  }): Promise<void>;
  applyReferrerPolicy(input: {
    routeId: string;
    bundleId: string;
    policy: string;
  }): Promise<void>;
  applyPermissionsPolicy(input: {
    routeId: string;
    bundleId: string;
    features: Record<string, 'self' | '*' | 'none' | { origins: string[] }>;
  }): Promise<void>;
  emitHeaderBundle(input: {
    routeId: string;
    bundleId: string;
    xFrame?: 'DENY' | 'SAMEORIGIN';
    xContentTypeOptions?: boolean;
  }): Promise<BuildHeadersResult>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
