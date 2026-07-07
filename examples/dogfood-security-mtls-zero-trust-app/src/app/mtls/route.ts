/**
 * `/mtls` HTTP handler — mTLS handshake + pin verify + OCSP staple + CT
 * log check ops the runtime exposes to the mtls surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise
 * mock and real without spinning up an Istio sidecar.
 *
 * The mtls surface pairs the parent v1.39-1 `mtls` axis
 * (startMtlsSession + completeHandshake + verifyPin + verifyOcsp +
 * checkCtLog) with `@kiwa-test/security` v0.2 — every op has a neutral
 * event counterpart the fidelity harness can compare across mock vs
 * real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type MtlsOpKind = 'handshake' | 'pin' | 'ocsp' | 'ct';

export interface MtlsRequest {
  kind: MtlsOpKind;
  sessionId: string;
  peerCn?: string;
  cipherSuite?: string;
  tlsVersion?: '1.2' | '1.3';
  spkiSha256?: string;
  expectedPins?: string[];
  stapled?: boolean;
  goodResponse?: boolean;
  sctCount?: number;
  minSctRequired?: number;
}

export interface MtlsResponse {
  ok: boolean;
  kind: MtlsOpKind;
  sessionId: string;
  peerCn?: string;
  tlsVersion?: '1.2' | '1.3';
  matched?: boolean;
  fingerprint?: string;
  stapled?: boolean;
  good?: boolean;
  sctCount?: number;
  sctOk?: boolean;
  errorKind?: string;
}

export function validateMtlsRequest(
  body: unknown,
): { ok: true; value: MtlsRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'handshake' && kind !== 'pin' && kind !== 'ocsp' && kind !== 'ct') {
    return { ok: false, errorKind: 'kind_must_be_handshake_pin_ocsp_or_ct' };
  }
  const value: MtlsRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'handshake') {
    if (typeof b['peerCn'] !== 'string' || !b['peerCn']) {
      return { ok: false, errorKind: 'peerCn_required' };
    }
    if (typeof b['cipherSuite'] !== 'string' || !b['cipherSuite']) {
      return { ok: false, errorKind: 'cipherSuite_required' };
    }
    if (b['tlsVersion'] !== '1.2' && b['tlsVersion'] !== '1.3') {
      return { ok: false, errorKind: 'tlsVersion_must_be_12_or_13' };
    }
    value.peerCn = b['peerCn'];
    value.cipherSuite = b['cipherSuite'];
    value.tlsVersion = b['tlsVersion'];
    return { ok: true, value };
  }
  if (kind === 'pin') {
    if (typeof b['spkiSha256'] !== 'string' || !b['spkiSha256']) {
      return { ok: false, errorKind: 'spkiSha256_required' };
    }
    if (!Array.isArray(b['expectedPins'])) {
      return { ok: false, errorKind: 'expectedPins_required' };
    }
    value.spkiSha256 = b['spkiSha256'];
    value.expectedPins = (b['expectedPins'] as unknown[]).filter(
      (p): p is string => typeof p === 'string',
    );
    return { ok: true, value };
  }
  if (kind === 'ocsp') {
    if (typeof b['stapled'] !== 'boolean') {
      return { ok: false, errorKind: 'stapled_required_boolean' };
    }
    if (typeof b['goodResponse'] !== 'boolean') {
      return { ok: false, errorKind: 'goodResponse_required_boolean' };
    }
    value.stapled = b['stapled'];
    value.goodResponse = b['goodResponse'];
    return { ok: true, value };
  }
  // kind === 'ct'
  if (typeof b['sctCount'] !== 'number') {
    return { ok: false, errorKind: 'sctCount_required_number' };
  }
  if (typeof b['minSctRequired'] !== 'number') {
    return { ok: false, errorKind: 'minSctRequired_required_number' };
  }
  value.sctCount = b['sctCount'];
  value.minSctRequired = b['minSctRequired'];
  return { ok: true, value };
}

export async function handleMtlsRequest(
  adapter: SecurityAdapter,
  req: MtlsRequest,
): Promise<MtlsResponse> {
  try {
    if (req.kind === 'handshake') {
      const result = await adapter.completeHandshake({
        sessionId: req.sessionId,
        peerCn: req.peerCn!,
        cipherSuite: req.cipherSuite!,
        tlsVersion: req.tlsVersion!,
      });
      return {
        ok: true,
        kind: 'handshake',
        sessionId: result.sessionId,
        peerCn: result.peerCn,
        tlsVersion: result.tlsVersion,
      };
    }
    if (req.kind === 'pin') {
      const result = await adapter.verifyPin({
        sessionId: req.sessionId,
        spkiSha256: req.spkiSha256!,
        expectedPins: req.expectedPins!,
      });
      return {
        ok: true,
        kind: 'pin',
        sessionId: result.sessionId,
        matched: result.matched,
        fingerprint: result.fingerprint,
      };
    }
    if (req.kind === 'ocsp') {
      const result = await adapter.verifyOcsp({
        sessionId: req.sessionId,
        stapled: req.stapled!,
        goodResponse: req.goodResponse!,
      });
      return {
        ok: true,
        kind: 'ocsp',
        sessionId: result.sessionId,
        stapled: result.stapled,
        good: result.good,
      };
    }
    const result = await adapter.checkCtLog({
      sessionId: req.sessionId,
      sctCount: req.sctCount!,
      minSctRequired: req.minSctRequired!,
    });
    return {
      ok: true,
      kind: 'ct',
      sessionId: result.sessionId,
      sctCount: result.sctCount,
      sctOk: result.ok,
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
