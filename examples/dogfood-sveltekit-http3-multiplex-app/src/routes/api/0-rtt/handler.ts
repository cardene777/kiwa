/**
 * SvelteKit `/api/0-rtt` handler — the boundary the SvelteKit runtime
 * exposes for 0-RTT resumption + anti-replay ops. Split from `/api/multi-stream`
 * so the two surfaces mirror how nginx-quic splits its stream API (send /
 * recv frames) from its transport API (session ticket / anti-replay) —
 * multi-stream is bulk data plane, 0-RTT is control plane.
 */

import type { Http3MultiplexAdapter } from '../../../adapters/interface.js';

export type ZeroRttOpKind = 'resume-zero-rtt';

export interface ResumeZeroRttRequest {
  kind: 'resume-zero-rtt';
  connectionId: string;
  earlyDataBytes: number;
}

export type ZeroRttRequest = ResumeZeroRttRequest;

export interface ZeroRttResponse {
  ok: boolean;
  kind: ZeroRttOpKind;
  connectionId: string;
  accepted?: boolean;
  earlyDataAccepted?: number;
  latencyMs?: number;
  errorKind?: string;
}

const KIND_VALUES: ZeroRttOpKind[] = ['resume-zero-rtt'];

/**
 * Validate a 0-RTT payload independently of the adapter.
 */
export function validateZeroRttRequest(
  body: unknown,
): { ok: true; value: ZeroRttRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['connectionId'] !== 'string' || !b['connectionId']) {
    return { ok: false, errorKind: 'missing_connection_id' };
  }
  if (
    typeof b['kind'] !== 'string' ||
    !KIND_VALUES.includes(b['kind'] as ZeroRttOpKind)
  ) {
    return { ok: false, errorKind: 'unknown_kind' };
  }
  if (typeof b['earlyDataBytes'] !== 'number' || b['earlyDataBytes'] < 0) {
    return { ok: false, errorKind: 'missing_early_data_bytes' };
  }
  return {
    ok: true,
    value: {
      kind: 'resume-zero-rtt',
      connectionId: b['connectionId'] as string,
      earlyDataBytes: b['earlyDataBytes'] as number,
    },
  };
}

export interface CreateZeroRttHandlerInput {
  adapter: Http3MultiplexAdapter;
}

export function createZeroRttHandler(
  input: CreateZeroRttHandlerInput,
): (req: ZeroRttRequest) => Promise<ZeroRttResponse> {
  const adapter = input.adapter;
  return async (req) => {
    const res = await adapter.resumeZeroRtt({
      connectionId: req.connectionId,
      earlyDataBytes: req.earlyDataBytes,
    });
    return {
      ok: true,
      kind: 'resume-zero-rtt',
      connectionId: res.connectionId,
      accepted: res.accepted,
      earlyDataAccepted: res.earlyDataAccepted,
      latencyMs: res.latencyMs,
    };
  };
}
