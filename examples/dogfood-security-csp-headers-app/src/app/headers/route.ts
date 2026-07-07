/**
 * `/headers` HTTP handler — advanced security header ops (HSTS +
 * X-Frame + X-Content-Type + Referrer-Policy + Permissions-Policy)
 * the Next.js runtime exposes to the headers surface.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type HeadersOpKind = 'build';

export interface HeadersRequest {
  kind: HeadersOpKind;
  routeId: string;
  bundleId: string;
  hsts?: { maxAgeSec: number; includeSubDomains: boolean; preload: boolean };
  referrerPolicy?: string;
  permissionsPolicy?: Record<
    string,
    'self' | '*' | 'none' | { origins: string[] }
  >;
  xFrame?: 'DENY' | 'SAMEORIGIN';
  xContentTypeOptions?: boolean;
}

export interface HeadersResponse {
  ok: boolean;
  kind: HeadersOpKind;
  routeId: string;
  bundleId: string;
  headers?: Record<string, string>;
  applied?: string[];
  validationOk?: boolean;
  validationErrors?: string[];
  errorKind?: string;
}

export function validateHeadersRequest(
  body: unknown,
): { ok: true; value: HeadersRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (typeof b['bundleId'] !== 'string' || !b['bundleId']) {
    return { ok: false, errorKind: 'bundleId_required' };
  }
  if (b['kind'] !== 'build') {
    return { ok: false, errorKind: 'kind_must_be_build' };
  }
  const value: HeadersRequest = {
    kind: 'build',
    routeId: b['routeId'],
    bundleId: b['bundleId'],
    xContentTypeOptions: b['xContentTypeOptions'] === true,
  };
  if (b['hsts'] && typeof b['hsts'] === 'object') {
    const h = b['hsts'] as Record<string, unknown>;
    if (typeof h['maxAgeSec'] !== 'number' || h['maxAgeSec'] < 0) {
      return { ok: false, errorKind: 'hsts_maxAgeSec_required' };
    }
    value.hsts = {
      maxAgeSec: h['maxAgeSec'] as number,
      includeSubDomains: h['includeSubDomains'] === true,
      preload: h['preload'] === true,
    };
  }
  if (typeof b['referrerPolicy'] === 'string') {
    value.referrerPolicy = b['referrerPolicy'];
  }
  if (b['permissionsPolicy'] && typeof b['permissionsPolicy'] === 'object') {
    value.permissionsPolicy = b['permissionsPolicy'] as Record<
      string,
      'self' | '*' | 'none' | { origins: string[] }
    >;
  }
  if (b['xFrame'] === 'DENY' || b['xFrame'] === 'SAMEORIGIN') {
    value.xFrame = b['xFrame'];
  }
  return { ok: true, value };
}

export async function handleHeadersRequest(
  adapter: SecurityAdapter,
  req: HeadersRequest,
): Promise<HeadersResponse> {
  try {
    await adapter.startHeaders({
      routeId: req.routeId,
      bundleId: req.bundleId,
    });
    if (req.hsts) {
      await adapter.applyHsts({
        routeId: req.routeId,
        bundleId: req.bundleId,
        maxAgeSec: req.hsts.maxAgeSec,
        includeSubDomains: req.hsts.includeSubDomains,
        preload: req.hsts.preload,
      });
    }
    if (req.referrerPolicy) {
      await adapter.applyReferrerPolicy({
        routeId: req.routeId,
        bundleId: req.bundleId,
        policy: req.referrerPolicy,
      });
    }
    if (req.permissionsPolicy) {
      await adapter.applyPermissionsPolicy({
        routeId: req.routeId,
        bundleId: req.bundleId,
        features: req.permissionsPolicy,
      });
    }
    const emitInput: Parameters<SecurityAdapter['emitHeaderBundle']>[0] = {
      routeId: req.routeId,
      bundleId: req.bundleId,
    };
    if (req.xFrame !== undefined) {
      emitInput.xFrame = req.xFrame;
    }
    if (req.xContentTypeOptions !== undefined) {
      emitInput.xContentTypeOptions = req.xContentTypeOptions;
    }
    const result = await adapter.emitHeaderBundle(emitInput);
    return {
      ok: true,
      kind: 'build',
      routeId: result.routeId,
      bundleId: result.bundleId,
      headers: result.headers,
      applied: result.applied,
      validationOk: result.validationOk,
      validationErrors: result.validationErrors,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'build',
      routeId: req.routeId,
      bundleId: req.bundleId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
