/**
 * Nuxt 3 `/api/reset` handler — the boundary the Nuxt runtime exposes for
 * stream reset + connection migration ops. Split from `/api/stream` so the
 * two surfaces mirror how aioquic splits its stream API (send / recv side)
 * from its transport API (path validation / connection ID rotation) — reset
 * kills a specific stream mid-flight, connection migration rebinds the
 * transport itself to a new UDP path.
 */

import type { WebTransportStreamAdapter } from '../../src/adapters/interface.js';

export type ResetOpKind = 'reset-stream' | 'migrate-connection';

export interface ResetStreamRequest {
  kind: 'reset-stream';
  sessionId: string;
  streamId: string;
  errorCode: number;
}

export interface MigrateConnectionRequest {
  kind: 'migrate-connection';
  sessionId: string;
  validate?: boolean;
}

export type ResetRequest = ResetStreamRequest | MigrateConnectionRequest;

export interface ResetResponse {
  ok: boolean;
  kind: ResetOpKind;
  sessionId: string;
  streamId?: string;
  errorCode?: number;
  validated?: boolean;
  latencyMs?: number;
  errorKind?: string;
}

const KIND_VALUES: ResetOpKind[] = ['reset-stream', 'migrate-connection'];

/**
 * Validate a reset payload independently of the adapter.
 */
export function validateResetRequest(
  body: unknown,
): { ok: true; value: ResetRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'missing_session_id' };
  }
  if (typeof b['kind'] !== 'string' || !KIND_VALUES.includes(b['kind'] as ResetOpKind)) {
    return { ok: false, errorKind: 'unknown_kind' };
  }
  const kind = b['kind'] as ResetOpKind;
  if (kind === 'reset-stream') {
    if (typeof b['streamId'] !== 'string' || !b['streamId']) {
      return { ok: false, errorKind: 'missing_stream_id' };
    }
    if (typeof b['errorCode'] !== 'number') {
      return { ok: false, errorKind: 'missing_error_code' };
    }
    return {
      ok: true,
      value: {
        kind,
        sessionId: b['sessionId'] as string,
        streamId: b['streamId'] as string,
        errorCode: b['errorCode'] as number,
      },
    };
  }
  const value: MigrateConnectionRequest = {
    kind,
    sessionId: b['sessionId'] as string,
  };
  if (typeof b['validate'] === 'boolean') value.validate = b['validate'];
  return { ok: true, value };
}

export interface CreateResetHandlerInput {
  adapter: WebTransportStreamAdapter;
}

export function createResetHandler(
  input: CreateResetHandlerInput,
): (req: ResetRequest) => Promise<ResetResponse> {
  const adapter = input.adapter;
  return async (req) => {
    if (req.kind === 'reset-stream') {
      const res = await adapter.resetStream({
        sessionId: req.sessionId,
        streamId: req.streamId,
        errorCode: req.errorCode,
      });
      return {
        ok: true,
        kind: 'reset-stream',
        sessionId: res.sessionId,
        streamId: res.streamId,
        errorCode: res.errorCode,
        latencyMs: res.latencyMs,
      };
    }
    const args: { sessionId: string; validate?: boolean } = {
      sessionId: req.sessionId,
    };
    if (req.validate !== undefined) args.validate = req.validate;
    const res = await adapter.migrateConnection(args);
    return {
      ok: true,
      kind: 'migrate-connection',
      sessionId: res.sessionId,
      validated: res.validated,
      latencyMs: res.latencyMs,
    };
  };
}
