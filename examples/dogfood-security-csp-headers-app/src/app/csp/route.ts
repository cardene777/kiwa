/**
 * `/csp` HTTP handler — CSP builder ops the Next.js runtime exposes to
 * the csp surface. The route is intentionally shape-neutral — the fidelity
 * harness feeds plain objects in and asserts on plain objects out, so the
 * same test can exercise mock and real without spinning up Next.js.
 *
 * The csp surface pairs the parent v1.37-1 `csp` axis (nonce + hash +
 * strict-dynamic + trusted-types + report-only) with `@kiwa-test/security`
 * v0.1 — every op has a neutral event counterpart the fidelity harness
 * can compare across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type CspOpKind = 'build';

export interface CspRequest {
  kind: CspOpKind;
  routeId: string;
  policyId: string;
  nonce?: string;
  hash?: { algorithm: 'sha256' | 'sha384' | 'sha512'; digest: string };
  strictDynamic?: boolean;
  trustedTypes?: { policies: string[]; requireForScript: boolean };
  reportOnly?: boolean;
  reportGroup?: string;
}

export interface CspResponse {
  ok: boolean;
  kind: CspOpKind;
  routeId: string;
  policyId: string;
  headerName?: string;
  headerValue?: string;
  nonce?: string;
  strictDynamicApplied?: boolean;
  trustedTypesApplied?: boolean;
  reportOnly?: boolean;
  errorKind?: string;
}

export function validateCspRequest(
  body: unknown,
): { ok: true; value: CspRequest } | { ok: false; errorKind: string } {
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
  if (b['kind'] !== 'build') {
    return { ok: false, errorKind: 'kind_must_be_build' };
  }
  const value: CspRequest = {
    kind: 'build',
    routeId: b['routeId'],
    policyId: b['policyId'],
    reportOnly: b['reportOnly'] === true,
  };
  if (typeof b['nonce'] === 'string' && b['nonce'].length > 0) {
    value.nonce = b['nonce'];
  }
  if (
    b['hash'] &&
    typeof b['hash'] === 'object' &&
    typeof (b['hash'] as Record<string, unknown>)['algorithm'] === 'string' &&
    typeof (b['hash'] as Record<string, unknown>)['digest'] === 'string'
  ) {
    const h = b['hash'] as { algorithm: string; digest: string };
    if (
      h.algorithm === 'sha256' ||
      h.algorithm === 'sha384' ||
      h.algorithm === 'sha512'
    ) {
      value.hash = { algorithm: h.algorithm, digest: h.digest };
    }
  }
  if (b['strictDynamic'] === true) {
    value.strictDynamic = true;
  }
  if (
    b['trustedTypes'] &&
    typeof b['trustedTypes'] === 'object' &&
    Array.isArray(
      (b['trustedTypes'] as Record<string, unknown>)['policies'],
    )
  ) {
    const t = b['trustedTypes'] as {
      policies: unknown;
      requireForScript?: unknown;
    };
    const policies = (t.policies as unknown[]).filter(
      (p): p is string => typeof p === 'string',
    );
    value.trustedTypes = {
      policies,
      requireForScript: t.requireForScript === true,
    };
  }
  if (typeof b['reportGroup'] === 'string' && b['reportGroup'].length > 0) {
    value.reportGroup = b['reportGroup'];
  }
  return { ok: true, value };
}

export async function handleCspRequest(
  adapter: SecurityAdapter,
  req: CspRequest,
): Promise<CspResponse> {
  try {
    await adapter.startCsp({
      routeId: req.routeId,
      policyId: req.policyId,
    });
    if (req.nonce) {
      await adapter.attachNonce({
        routeId: req.routeId,
        policyId: req.policyId,
        nonce: req.nonce,
      });
    }
    if (req.hash) {
      await adapter.attachHash({
        routeId: req.routeId,
        policyId: req.policyId,
        algorithm: req.hash.algorithm,
        digest: req.hash.digest,
      });
    }
    if (req.strictDynamic) {
      await adapter.applyStrictDynamic({
        routeId: req.routeId,
        policyId: req.policyId,
      });
    }
    if (req.trustedTypes) {
      await adapter.applyTrustedTypes({
        routeId: req.routeId,
        policyId: req.policyId,
        policies: req.trustedTypes.policies,
        requireForScript: req.trustedTypes.requireForScript,
      });
    }
    const emitInput: Parameters<SecurityAdapter['emitCspHeader']>[0] = {
      routeId: req.routeId,
      policyId: req.policyId,
      reportOnly: req.reportOnly ?? false,
    };
    if (req.reportGroup !== undefined) {
      emitInput.reportGroup = req.reportGroup;
    }
    const result = await adapter.emitCspHeader(emitInput);
    return {
      ok: true,
      kind: 'build',
      routeId: result.routeId,
      policyId: result.policyId,
      headerName: result.headerName,
      headerValue: result.headerValue,
      nonce: result.nonce,
      strictDynamicApplied: result.strictDynamicApplied,
      trustedTypesApplied: result.trustedTypesApplied,
      reportOnly: result.reportOnly,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'build',
      routeId: req.routeId,
      policyId: req.policyId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
