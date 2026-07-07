/**
 * `/broker` HTTP handler — combined mTLS + Zero-trust decision ops the
 * runtime exposes to the broker surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up an Istio + OPA sidecar.
 *
 * The broker surface layers a fused admission decision on top of the
 * two axis outputs — the caller reports whether the mtls path and the
 * zero-trust path each succeeded, and the broker enforces the "both
 * must pass" invariant. This mirrors an Istio AuthorizationPolicy that
 * requires both a PeerAuthentication STRICT mTLS handshake and an OPA
 * rego posture decision before admitting a request.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type BrokerOpKind = 'decide';

export interface BrokerRequest {
  kind: BrokerOpKind;
  sessionId: string;
  mtlsOk?: boolean;
  ztOk?: boolean;
}

export interface BrokerResponse {
  ok: boolean;
  kind: BrokerOpKind;
  sessionId: string;
  mtlsOk?: boolean;
  ztOk?: boolean;
  admitted?: boolean;
  reason?: string;
  errorKind?: string;
}

export function validateBrokerRequest(
  body: unknown,
): { ok: true; value: BrokerRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (b['kind'] !== 'decide') {
    return { ok: false, errorKind: 'kind_must_be_decide' };
  }
  if (typeof b['mtlsOk'] !== 'boolean') {
    return { ok: false, errorKind: 'mtlsOk_required_boolean' };
  }
  if (typeof b['ztOk'] !== 'boolean') {
    return { ok: false, errorKind: 'ztOk_required_boolean' };
  }
  return {
    ok: true,
    value: {
      kind: 'decide',
      sessionId: b['sessionId'],
      mtlsOk: b['mtlsOk'],
      ztOk: b['ztOk'],
    },
  };
}

export async function handleBrokerRequest(
  adapter: SecurityAdapter,
  req: BrokerRequest,
): Promise<BrokerResponse> {
  try {
    const result = await adapter.decideBroker({
      sessionId: req.sessionId,
      mtlsOk: req.mtlsOk!,
      ztOk: req.ztOk!,
    });
    return {
      ok: true,
      kind: 'decide',
      sessionId: result.sessionId,
      mtlsOk: result.mtlsOk,
      ztOk: result.ztOk,
      admitted: result.admitted,
      reason: result.reason,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
