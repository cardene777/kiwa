/**
 * `/violation` HTTP handler — CSP violation reporting ops the Next.js
 * runtime exposes to the violation surface. Maps browser CSP report body
 * shapes (`{ 'csp-report': { ... } }` legacy report-uri form + newer
 * report-to `application/reports+json` form) to a neutral shape the
 * adapter can drive.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type ViolationOpKind = 'ingest' | 'close';

export interface ViolationRequest {
  kind: ViolationOpKind;
  routeId: string;
  policyId: string;
  reportId: string;
  directive?: string;
  blockedUri?: string;
  disposition?: 'enforce' | 'report';
  verdict?: 'allow' | 'deny' | 'warn';
  reason?: string;
}

export interface ViolationResponse {
  ok: boolean;
  kind: ViolationOpKind;
  routeId: string;
  policyId: string;
  reportId: string;
  accepted?: boolean;
  directive?: string;
  errorKind?: string;
}

export function validateViolationRequest(
  body: unknown,
): { ok: true; value: ViolationRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (typeof b['policyId'] !== 'string' || !b['policyId']) {
    return { ok: false, errorKind: 'policyId_required' };
  }
  if (typeof b['reportId'] !== 'string' || !b['reportId']) {
    return { ok: false, errorKind: 'reportId_required' };
  }
  if (b['kind'] !== 'ingest' && b['kind'] !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_ingest_or_close' };
  }
  const value: ViolationRequest = {
    kind: b['kind'],
    routeId: b['routeId'],
    policyId: b['policyId'],
    reportId: b['reportId'],
  };
  if (b['kind'] === 'ingest') {
    if (typeof b['directive'] !== 'string' || !b['directive']) {
      return { ok: false, errorKind: 'directive_required' };
    }
    if (typeof b['blockedUri'] !== 'string' || !b['blockedUri']) {
      return { ok: false, errorKind: 'blockedUri_required' };
    }
    if (b['disposition'] !== 'enforce' && b['disposition'] !== 'report') {
      return { ok: false, errorKind: 'disposition_must_be_enforce_or_report' };
    }
    value.directive = b['directive'];
    value.blockedUri = b['blockedUri'];
    value.disposition = b['disposition'];
    if (
      b['verdict'] === 'allow' ||
      b['verdict'] === 'deny' ||
      b['verdict'] === 'warn'
    ) {
      value.verdict = b['verdict'];
    }
    if (typeof b['reason'] === 'string' && b['reason'].length > 0) {
      value.reason = b['reason'];
    }
  }
  return { ok: true, value };
}

export async function handleViolationRequest(
  adapter: SecurityAdapter,
  req: ViolationRequest,
): Promise<ViolationResponse> {
  try {
    if (req.kind === 'ingest') {
      // Adapter contract auto-starts a session if the report is new.
      await adapter.startViolation({
        routeId: req.routeId,
        policyId: req.policyId,
        reportId: req.reportId,
      });
      const result = await adapter.ingestViolation({
        routeId: req.routeId,
        policyId: req.policyId,
        reportId: req.reportId,
        directive: req.directive ?? 'default-src',
        blockedUri: req.blockedUri ?? 'unknown',
        disposition: req.disposition ?? 'enforce',
      });
      if (req.verdict) {
        await adapter.recordViolationEvent({
          routeId: req.routeId,
          policyId: req.policyId,
          reportId: req.reportId,
          verdict: req.verdict,
          reason: req.reason ?? 'unspecified',
        });
      }
      return {
        ok: true,
        kind: 'ingest',
        routeId: result.routeId,
        policyId: result.policyId,
        reportId: result.reportId,
        directive: result.directive,
        accepted: result.accepted,
      };
    }
    await adapter.closeViolation({
      routeId: req.routeId,
      policyId: req.policyId,
      reportId: req.reportId,
    });
    return {
      ok: true,
      kind: 'close',
      routeId: req.routeId,
      policyId: req.policyId,
      reportId: req.reportId,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      routeId: req.routeId,
      policyId: req.policyId,
      reportId: req.reportId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
