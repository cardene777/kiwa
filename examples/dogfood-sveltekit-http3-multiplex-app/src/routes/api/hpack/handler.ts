/**
 * SvelteKit `/api/hpack` handler — the boundary the SvelteKit runtime
 * exposes for HPACK dynamic-table insertion + compression-ratio observation.
 * Nginx-quic exposes the dynamic table size + a rolling compression ratio
 * on its access log; the mock adapter surfaces the same shape so the
 * fidelity harness can diff table growth + ratio across mock vs real.
 */

import type { Http3MultiplexAdapter } from '../../../adapters/interface.js';

export type HpackOpKind = 'insert-header';

export interface InsertHeaderRequest {
  kind: 'insert-header';
  connectionId: string;
  name: string;
  value: string;
}

export type HpackRequest = InsertHeaderRequest;

export interface HpackResponse {
  ok: boolean;
  kind: HpackOpKind;
  connectionId: string;
  name?: string;
  value?: string;
  index?: number;
  tableSize?: number;
  compressionRatio?: number;
  latencyMs?: number;
  errorKind?: string;
}

const KIND_VALUES: HpackOpKind[] = ['insert-header'];

/**
 * Validate an HPACK payload independently of the adapter.
 */
export function validateHpackRequest(
  body: unknown,
): { ok: true; value: HpackRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['connectionId'] !== 'string' || !b['connectionId']) {
    return { ok: false, errorKind: 'missing_connection_id' };
  }
  if (
    typeof b['kind'] !== 'string' ||
    !KIND_VALUES.includes(b['kind'] as HpackOpKind)
  ) {
    return { ok: false, errorKind: 'unknown_kind' };
  }
  if (typeof b['name'] !== 'string' || !b['name']) {
    return { ok: false, errorKind: 'missing_header_name' };
  }
  if (typeof b['value'] !== 'string') {
    return { ok: false, errorKind: 'missing_header_value' };
  }
  return {
    ok: true,
    value: {
      kind: 'insert-header',
      connectionId: b['connectionId'] as string,
      name: b['name'] as string,
      value: b['value'] as string,
    },
  };
}

export interface CreateHpackHandlerInput {
  adapter: Http3MultiplexAdapter;
}

export function createHpackHandler(
  input: CreateHpackHandlerInput,
): (req: HpackRequest) => Promise<HpackResponse> {
  const adapter = input.adapter;
  return async (req) => {
    const res = await adapter.insertHpackHeader({
      connectionId: req.connectionId,
      name: req.name,
      value: req.value,
    });
    return {
      ok: true,
      kind: 'insert-header',
      connectionId: res.connectionId,
      name: res.name,
      value: res.value,
      index: res.index,
      tableSize: res.tableSize,
      compressionRatio: res.compressionRatio,
      latencyMs: res.latencyMs,
    };
  };
}
