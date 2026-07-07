/**
 * Mock adapter — drives `@kiwa-test/security` v0.1 csp builder +
 * security-headers builder + validator so the same app code exercises a
 * deterministic CSP header + violation reporting + advanced security
 * headers ceremony without launching Chromium. Both mock and real adapters
 * satisfy {@link SecurityAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one session per (routeId, policyId / bundleId / reportId)
 * tuple; each session is isolated so per-surface metrics stay separated.
 * That matches how Next.js 15.4 middleware / route handlers allocate one
 * CSP nonce + header bundle per request pass in production.
 *
 * The mock intentionally piggy-backs on the same neutral event vocabulary
 * that the parent v1.37-1 semantics packages emit — every op appends the
 * matching neutral event into the trace so the fidelity harness can
 * assert the mock and real adapters produce identical event orderings.
 */

import {
  buildCspHeader,
  buildSecurityHeaders,
  toCspEvent,
  toSecurityHeadersEvent,
  validateNonce,
  validateSecurityHeaders,
  type CspHashAlgo,
  type CspHashOptions,
  type CspNonceOptions,
  type PermissionsFeature,
  type PermissionsSource,
  type ReferrerPolicyValue,
} from '@kiwa-test/security';
import type {
  BuildCspResult,
  BuildHeadersResult,
  ReportViolationResult,
  SecurityAdapter,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface CspSession {
  routeId: string;
  policyId: string;
  nonces: CspNonceOptions[];
  hashes: CspHashOptions[];
  strictDynamic: boolean;
  trustedTypes?: { policies: string[]; requireForScript: boolean };
  emitted: boolean;
}

interface ViolationSession {
  routeId: string;
  policyId: string;
  reportId: string;
  violations: {
    directive: string;
    blockedUri: string;
    disposition: 'enforce' | 'report';
    verdict?: 'allow' | 'deny' | 'warn';
    reason?: string;
  }[];
  closed: boolean;
}

interface HeadersSession {
  routeId: string;
  bundleId: string;
  hsts?: {
    maxAgeSec: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  referrerPolicy?: ReferrerPolicyValue;
  permissionsPolicy: Partial<Record<PermissionsFeature, PermissionsSource>>;
  applied: string[];
  emitted: boolean;
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): SecurityAdapter {
  const trace: TraceEvent[] = [];
  const latency = Math.max(opts.latencyMs ?? 1, 0);

  const cspSessions = new Map<string, CspSession>();
  const violationSessions = new Map<string, ViolationSession>();
  const headersSessions = new Map<string, HeadersSession>();

  let noncesAttached = 0;
  let hashesAttached = 0;
  let strictDynamicApplications = 0;
  let trustedTypesApplications = 0;
  let cspEmissions = 0;
  let violationsIngested = 0;
  let violationEventsRecorded = 0;
  let violationsClosed = 0;
  let hstsApplications = 0;
  let referrerApplications = 0;
  let permissionsApplications = 0;
  let headerEmissions = 0;
  let requests = 0;

  const cspLatencySamplesMs: number[] = [];
  const violationLatencySamplesMs: number[] = [];
  const headersLatencySamplesMs: number[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function delay(): Promise<number> {
    const start = Date.now();
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }
    return Date.now() - start;
  }

  function cspKey(routeId: string, policyId: string): string {
    return `${routeId}::${policyId}`;
  }

  function violationKey(
    routeId: string,
    policyId: string,
    reportId: string,
  ): string {
    return `${routeId}::${policyId}::${reportId}`;
  }

  function headersKey(routeId: string, bundleId: string): string {
    return `${routeId}::${bundleId}`;
  }

  return {
    mode: 'mock',

    async startCsp(input) {
      requests += 1;
      cspSessions.set(cspKey(input.routeId, input.policyId), {
        routeId: input.routeId,
        policyId: input.policyId,
        nonces: [],
        hashes: [],
        strictDynamic: false,
        emitted: false,
      });
      record('startCsp', true, {
        detail: { routeId: input.routeId, policyId: input.policyId },
      });
    },

    async attachNonce(input) {
      requests += 1;
      const session = cspSessions.get(cspKey(input.routeId, input.policyId));
      if (!session) {
        record('attachNonce', false, { errorKind: 'csp_session_missing' });
        throw new Error('csp_session_missing');
      }
      const check = validateNonce(input.nonce);
      if (!check.ok) {
        record('attachNonce', false, { errorKind: check.reason });
        throw new Error(check.reason);
      }
      session.nonces.push({ nonce: input.nonce });
      noncesAttached += 1;
      record('attachNonce', true, { detail: { nonce: input.nonce } });
    },

    async attachHash(input) {
      requests += 1;
      const session = cspSessions.get(cspKey(input.routeId, input.policyId));
      if (!session) {
        record('attachHash', false, { errorKind: 'csp_session_missing' });
        throw new Error('csp_session_missing');
      }
      session.hashes.push({
        algorithm: input.algorithm satisfies CspHashAlgo,
        digest: input.digest,
      });
      hashesAttached += 1;
      record('attachHash', true, {
        detail: { algorithm: input.algorithm, digest: input.digest },
      });
    },

    async applyStrictDynamic(input) {
      requests += 1;
      const session = cspSessions.get(cspKey(input.routeId, input.policyId));
      if (!session) {
        record('applyStrictDynamic', false, {
          errorKind: 'csp_session_missing',
        });
        throw new Error('csp_session_missing');
      }
      session.strictDynamic = true;
      strictDynamicApplications += 1;
      record('applyStrictDynamic', true);
    },

    async applyTrustedTypes(input) {
      requests += 1;
      const session = cspSessions.get(cspKey(input.routeId, input.policyId));
      if (!session) {
        record('applyTrustedTypes', false, {
          errorKind: 'csp_session_missing',
        });
        throw new Error('csp_session_missing');
      }
      session.trustedTypes = {
        policies: [...input.policies],
        requireForScript: input.requireForScript,
      };
      trustedTypesApplications += 1;
      record('applyTrustedTypes', true, {
        detail: {
          policies: input.policies,
          requireForScript: input.requireForScript,
        },
      });
    },

    async emitCspHeader(input): Promise<BuildCspResult> {
      requests += 1;
      const session = cspSessions.get(cspKey(input.routeId, input.policyId));
      if (!session) {
        record('emitCspHeader', false, { errorKind: 'csp_session_missing' });
        throw new Error('csp_session_missing');
      }
      const latencyMs = await delay();
      cspLatencySamplesMs.push(latencyMs);

      const cspInput: Parameters<typeof buildCspHeader>[0] = {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
        },
        nonces: session.nonces,
        hashes: session.hashes,
        strictDynamic: session.strictDynamic,
        reportOnly: input.reportOnly,
      };
      if (session.trustedTypes) {
        cspInput.trustedTypes = session.trustedTypes;
      }
      if (input.reportGroup !== undefined) {
        cspInput.reportGroup = input.reportGroup;
      }
      const build = buildCspHeader(cspInput);

      toCspEvent({
        provider: 'helmet',
        verdict: 'allow',
        reason: 'mock_csp_built',
        payload: build.expandedDirectives,
        timestamp: Date.now(),
      });

      session.emitted = true;
      cspEmissions += 1;

      const result: BuildCspResult = {
        routeId: session.routeId,
        policyId: session.policyId,
        headerName: build.headerName,
        headerValue: build.headerValue,
        nonce: session.nonces[0]?.nonce ?? '',
        strictDynamicApplied: session.strictDynamic,
        trustedTypesApplied: session.trustedTypes !== undefined,
        reportOnly: input.reportOnly,
        latencyMs,
      };
      record('emitCspHeader', true, {
        detail: {
          headerName: result.headerName,
          reportOnly: result.reportOnly,
          nonceCount: session.nonces.length,
          hashCount: session.hashes.length,
        },
      });
      return result;
    },

    async startViolation(input) {
      requests += 1;
      violationSessions.set(
        violationKey(input.routeId, input.policyId, input.reportId),
        {
          routeId: input.routeId,
          policyId: input.policyId,
          reportId: input.reportId,
          violations: [],
          closed: false,
        },
      );
      record('startViolation', true, {
        detail: {
          routeId: input.routeId,
          policyId: input.policyId,
          reportId: input.reportId,
        },
      });
    },

    async ingestViolation(input): Promise<ReportViolationResult> {
      requests += 1;
      const session = violationSessions.get(
        violationKey(input.routeId, input.policyId, input.reportId),
      );
      if (!session) {
        record('ingestViolation', false, {
          errorKind: 'violation_session_missing',
        });
        throw new Error('violation_session_missing');
      }
      if (session.closed) {
        record('ingestViolation', false, {
          errorKind: 'violation_session_closed',
        });
        throw new Error('violation_session_closed');
      }
      const latencyMs = await delay();
      violationLatencySamplesMs.push(latencyMs);
      session.violations.push({
        directive: input.directive,
        blockedUri: input.blockedUri,
        disposition: input.disposition,
      });
      violationsIngested += 1;
      const result: ReportViolationResult = {
        routeId: session.routeId,
        policyId: session.policyId,
        reportId: session.reportId,
        directive: input.directive,
        blockedUri: input.blockedUri,
        disposition: input.disposition,
        accepted: true,
        latencyMs,
      };
      record('ingestViolation', true, {
        detail: {
          directive: input.directive,
          blockedUri: input.blockedUri,
          disposition: input.disposition,
        },
      });
      return result;
    },

    async recordViolationEvent(input) {
      requests += 1;
      const session = violationSessions.get(
        violationKey(input.routeId, input.policyId, input.reportId),
      );
      if (!session) {
        record('recordViolationEvent', false, {
          errorKind: 'violation_session_missing',
        });
        throw new Error('violation_session_missing');
      }
      const last = session.violations[session.violations.length - 1];
      if (last) {
        last.verdict = input.verdict;
        last.reason = input.reason;
      }
      violationEventsRecorded += 1;
      toCspEvent({
        provider: 'helmet',
        verdict: input.verdict,
        reason: input.reason,
        payload: { policyId: input.policyId, reportId: input.reportId },
        timestamp: Date.now(),
      });
      record('recordViolationEvent', true, {
        detail: { verdict: input.verdict, reason: input.reason },
      });
    },

    async closeViolation(input) {
      requests += 1;
      const session = violationSessions.get(
        violationKey(input.routeId, input.policyId, input.reportId),
      );
      if (!session) {
        record('closeViolation', false, {
          errorKind: 'violation_session_missing',
        });
        throw new Error('violation_session_missing');
      }
      session.closed = true;
      violationsClosed += 1;
      record('closeViolation', true, {
        detail: {
          reportId: input.reportId,
          violationCount: session.violations.length,
        },
      });
    },

    async startHeaders(input) {
      requests += 1;
      headersSessions.set(headersKey(input.routeId, input.bundleId), {
        routeId: input.routeId,
        bundleId: input.bundleId,
        permissionsPolicy: {},
        applied: [],
        emitted: false,
      });
      record('startHeaders', true, {
        detail: { routeId: input.routeId, bundleId: input.bundleId },
      });
    },

    async applyHsts(input) {
      requests += 1;
      const session = headersSessions.get(
        headersKey(input.routeId, input.bundleId),
      );
      if (!session) {
        record('applyHsts', false, { errorKind: 'headers_session_missing' });
        throw new Error('headers_session_missing');
      }
      session.hsts = {
        maxAgeSec: input.maxAgeSec,
        includeSubDomains: input.includeSubDomains,
        preload: input.preload,
      };
      session.applied.push('Strict-Transport-Security');
      hstsApplications += 1;
      record('applyHsts', true, {
        detail: {
          maxAgeSec: input.maxAgeSec,
          includeSubDomains: input.includeSubDomains,
          preload: input.preload,
        },
      });
    },

    async applyReferrerPolicy(input) {
      requests += 1;
      const session = headersSessions.get(
        headersKey(input.routeId, input.bundleId),
      );
      if (!session) {
        record('applyReferrerPolicy', false, {
          errorKind: 'headers_session_missing',
        });
        throw new Error('headers_session_missing');
      }
      session.referrerPolicy = input.policy as ReferrerPolicyValue;
      session.applied.push('Referrer-Policy');
      referrerApplications += 1;
      record('applyReferrerPolicy', true, {
        detail: { policy: input.policy },
      });
    },

    async applyPermissionsPolicy(input) {
      requests += 1;
      const session = headersSessions.get(
        headersKey(input.routeId, input.bundleId),
      );
      if (!session) {
        record('applyPermissionsPolicy', false, {
          errorKind: 'headers_session_missing',
        });
        throw new Error('headers_session_missing');
      }
      for (const [feature, source] of Object.entries(input.features)) {
        session.permissionsPolicy[feature as PermissionsFeature] =
          source as PermissionsSource;
      }
      session.applied.push('Permissions-Policy');
      permissionsApplications += 1;
      record('applyPermissionsPolicy', true, {
        detail: { featureCount: Object.keys(input.features).length },
      });
    },

    async emitHeaderBundle(input): Promise<BuildHeadersResult> {
      requests += 1;
      const session = headersSessions.get(
        headersKey(input.routeId, input.bundleId),
      );
      if (!session) {
        record('emitHeaderBundle', false, {
          errorKind: 'headers_session_missing',
        });
        throw new Error('headers_session_missing');
      }
      const latencyMs = await delay();
      headersLatencySamplesMs.push(latencyMs);

      const headersInput: Parameters<typeof buildSecurityHeaders>[0] = {
        xContentTypeOptions: input.xContentTypeOptions ?? false,
      };
      if (session.hsts) {
        headersInput.hsts = session.hsts;
      }
      if (input.xFrame === 'DENY') {
        headersInput.xFrame = { mode: 'DENY' };
      } else if (input.xFrame === 'SAMEORIGIN') {
        headersInput.xFrame = { mode: 'SAMEORIGIN' };
      }
      if (session.referrerPolicy) {
        headersInput.referrerPolicy = session.referrerPolicy;
      }
      if (Object.keys(session.permissionsPolicy).length > 0) {
        headersInput.permissionsPolicy = session.permissionsPolicy;
      }

      const validation = validateSecurityHeaders(headersInput);
      const build = buildSecurityHeaders(headersInput);

      if (input.xFrame) {
        session.applied.push('X-Frame-Options');
      }
      if (input.xContentTypeOptions) {
        session.applied.push('X-Content-Type-Options');
      }

      toSecurityHeadersEvent({
        provider: 'helmet',
        verdict: validation.ok ? 'allow' : 'warn',
        reason: validation.ok ? 'mock_headers_built' : validation.errors.join(';'),
        payload: build.headers,
        timestamp: Date.now(),
      });

      session.emitted = true;
      headerEmissions += 1;

      const result: BuildHeadersResult = {
        routeId: session.routeId,
        bundleId: session.bundleId,
        headers: build.headers,
        applied: [...new Set(session.applied)],
        validationOk: validation.ok,
        validationErrors: validation.errors,
        latencyMs,
      };
      record('emitHeaderBundle', true, {
        detail: {
          headerCount: Object.keys(build.headers).length,
          validationOk: validation.ok,
        },
      });
      return result;
    },

    traces() {
      return trace;
    },

    async reset() {
      cspSessions.clear();
      violationSessions.clear();
      headersSessions.clear();
      trace.length = 0;
      noncesAttached = 0;
      hashesAttached = 0;
      strictDynamicApplications = 0;
      trustedTypesApplications = 0;
      cspEmissions = 0;
      violationsIngested = 0;
      violationEventsRecorded = 0;
      violationsClosed = 0;
      hstsApplications = 0;
      referrerApplications = 0;
      permissionsApplications = 0;
      headerEmissions = 0;
      requests = 0;
      cspLatencySamplesMs.length = 0;
      violationLatencySamplesMs.length = 0;
      headersLatencySamplesMs.length = 0;
    },
  };
}

/** Exported so downstream tests can peek without depending on `.traces()` shape. */
export interface MockAdapterCounters {
  noncesAttached: number;
  hashesAttached: number;
  strictDynamicApplications: number;
  trustedTypesApplications: number;
  cspEmissions: number;
  violationsIngested: number;
  violationEventsRecorded: number;
  violationsClosed: number;
  hstsApplications: number;
  referrerApplications: number;
  permissionsApplications: number;
  headerEmissions: number;
  requests: number;
}
