/**
 * `/reproducible` HTTP handler — reproducible build hash matching op the
 * runtime exposes to the reproducible surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a matching-build
 * toolchain.
 *
 * The reproducible surface pairs the parent v1.39-1 `supply-chain` axis
 * (matchReproducibleBuild) with `@kiwa-lab/security` v0.2 — the op
 * emits a neutral event the fidelity harness can compare across mock
 * vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type ReproducibleOpKind = 'match-build';

export interface ReproducibleRequest {
  kind: ReproducibleOpKind;
  sessionId: string;
  // match-build
  buildA_hash?: string;
  buildB_hash?: string;
  toolchainVersion?: string;
}

export interface ReproducibleResponse {
  ok: boolean;
  kind: ReproducibleOpKind;
  sessionId: string;
  matched?: boolean;
  toolchainVersion?: string;
  hashA?: string;
  hashB?: string;
  errorKind?: string;
}

export function validateReproducibleRequest(
  body: unknown,
):
  | { ok: true; value: ReproducibleRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'match-build') {
    return {
      ok: false,
      errorKind: 'kind_must_be_match_build',
    };
  }
  const value: ReproducibleRequest = { kind, sessionId: b['sessionId'] };
  if (typeof b['buildA_hash'] !== 'string' || !b['buildA_hash']) {
    return { ok: false, errorKind: 'buildA_hash_required' };
  }
  if (typeof b['buildB_hash'] !== 'string' || !b['buildB_hash']) {
    return { ok: false, errorKind: 'buildB_hash_required' };
  }
  if (typeof b['toolchainVersion'] !== 'string' || !b['toolchainVersion']) {
    return { ok: false, errorKind: 'toolchainVersion_required' };
  }
  value.buildA_hash = b['buildA_hash'];
  value.buildB_hash = b['buildB_hash'];
  value.toolchainVersion = b['toolchainVersion'];
  return { ok: true, value };
}

export async function handleReproducibleRequest(
  adapter: SecurityAdapter,
  req: ReproducibleRequest,
): Promise<ReproducibleResponse> {
  try {
    const result = await adapter.matchReproducibleBuild({
      sessionId: req.sessionId,
      buildA_hash: req.buildA_hash!,
      buildB_hash: req.buildB_hash!,
      toolchainVersion: req.toolchainVersion!,
    });
    return {
      ok: true,
      kind: 'match-build',
      sessionId: result.sessionId,
      matched: result.matched,
      toolchainVersion: result.toolchainVersion,
      hashA: result.hashA,
      hashB: result.hashB,
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
