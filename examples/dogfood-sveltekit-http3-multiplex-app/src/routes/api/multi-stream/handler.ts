/**
 * SvelteKit `/api/multi-stream` handler — the boundary the SvelteKit runtime
 * exposes for HTTP/3 multi-stream concurrent send + priority scheduling ops.
 * Requests are validated at this boundary — the connection manager itself
 * trusts the adapter contract, so a malformed payload cannot corrupt
 * connection state.
 *
 * The handler is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without booting SvelteKit itself. This mirrors the
 * pattern used by `dogfood-nuxt-webtransport-stream-app` — decouple the
 * handler from the framework runtime so vitest can drive it directly.
 */

import type { Http3MultiplexAdapter } from '../../../adapters/interface.js';

export type MultiStreamOpKind =
  | 'open-connection'
  | 'close-connection'
  | 'open-stream'
  | 'concurrent-send'
  | 'write-stream'
  | 'read-stream'
  | 'close-stream';

export interface MultiStreamRequestBase {
  connectionId: string;
}

export interface OpenConnectionRequest extends MultiStreamRequestBase {
  kind: 'open-connection';
  url: string;
  zeroRtt?: boolean;
  earlyDataBytes?: number;
}

export interface CloseConnectionRequest extends MultiStreamRequestBase {
  kind: 'close-connection';
}

export interface OpenStreamRequest extends MultiStreamRequestBase {
  kind: 'open-stream';
  priority?: number;
  direction?: 'client-initiated' | 'server-push';
}

export interface ConcurrentSendRequest extends MultiStreamRequestBase {
  kind: 'concurrent-send';
  streams: Array<{ priority: number; byteLength: number }>;
}

export interface WriteStreamRequest extends MultiStreamRequestBase {
  kind: 'write-stream';
  streamId: string;
  /** Base64-encoded payload — the handler decodes to Uint8Array. */
  dataBase64: string;
}

export interface ReadStreamRequest extends MultiStreamRequestBase {
  kind: 'read-stream';
  streamId: string;
}

export interface CloseStreamRequest extends MultiStreamRequestBase {
  kind: 'close-stream';
  streamId: string;
}

export type MultiStreamRequest =
  | OpenConnectionRequest
  | CloseConnectionRequest
  | OpenStreamRequest
  | ConcurrentSendRequest
  | WriteStreamRequest
  | ReadStreamRequest
  | CloseStreamRequest;

export interface MultiStreamResponse {
  ok: boolean;
  kind: MultiStreamOpKind;
  connectionId: string;
  streamId?: string;
  streamIds?: string[];
  drainOrder?: string[];
  byteLength?: number;
  totalBytes?: number;
  priority?: number;
  zeroRttUsed?: boolean;
  earlyDataAccepted?: number;
  latencyMs?: number;
  errorKind?: string;
}

const KIND_VALUES: MultiStreamOpKind[] = [
  'open-connection',
  'close-connection',
  'open-stream',
  'concurrent-send',
  'write-stream',
  'read-stream',
  'close-stream',
];

const DIRECTION_VALUES = new Set(['client-initiated', 'server-push']);

/**
 * Validate a multi-stream payload independently of the adapter — returning
 * an errorKind here lets the fidelity harness assert on rejection paths
 * (empty connectionId, unknown kind, etc) without exercising nginx-quic.
 */
export function validateMultiStreamRequest(
  body: unknown,
): { ok: true; value: MultiStreamRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['connectionId'] !== 'string' || !b['connectionId']) {
    return { ok: false, errorKind: 'missing_connection_id' };
  }
  if (
    typeof b['kind'] !== 'string' ||
    !KIND_VALUES.includes(b['kind'] as MultiStreamOpKind)
  ) {
    return { ok: false, errorKind: 'unknown_kind' };
  }
  const kind = b['kind'] as MultiStreamOpKind;
  switch (kind) {
    case 'open-connection': {
      if (typeof b['url'] !== 'string' || !b['url']) {
        return { ok: false, errorKind: 'missing_url' };
      }
      const value: OpenConnectionRequest = {
        kind,
        connectionId: b['connectionId'] as string,
        url: b['url'] as string,
      };
      if (typeof b['zeroRtt'] === 'boolean') value.zeroRtt = b['zeroRtt'];
      if (typeof b['earlyDataBytes'] === 'number' && b['earlyDataBytes'] >= 0) {
        value.earlyDataBytes = b['earlyDataBytes'];
      }
      return { ok: true, value };
    }
    case 'close-connection': {
      return {
        ok: true,
        value: { kind, connectionId: b['connectionId'] as string },
      };
    }
    case 'open-stream': {
      const value: OpenStreamRequest = {
        kind,
        connectionId: b['connectionId'] as string,
      };
      // F4 (Issue #981) — open-stream must reject a non-integer / NaN
      // priority the same way concurrent-send does so the two paths stay in
      // sync. A caller that omits priority still gets the mock default (128).
      const priority = b['priority'];
      if (priority !== undefined) {
        if (
          typeof priority !== 'number' ||
          !Number.isFinite(priority) ||
          !Number.isInteger(priority) ||
          priority < 0 ||
          priority > 255
        ) {
          return { ok: false, errorKind: 'invalid_priority' };
        }
        value.priority = priority;
      }
      if (
        typeof b['direction'] === 'string' &&
        DIRECTION_VALUES.has(b['direction'])
      ) {
        value.direction = b['direction'] as 'client-initiated' | 'server-push';
      }
      return { ok: true, value };
    }
    case 'concurrent-send': {
      if (!Array.isArray(b['streams']) || b['streams'].length === 0) {
        return { ok: false, errorKind: 'missing_streams' };
      }
      const streams: Array<{ priority: number; byteLength: number }> = [];
      for (const item of b['streams']) {
        if (!item || typeof item !== 'object') {
          return { ok: false, errorKind: 'invalid_stream_entry' };
        }
        const it = item as Record<string, unknown>;
        // F4 (Issue #981) — HTTP/3 stream priority is an 8-bit urgency field
        // (RFC 9218 §4 + nginx-quic default), so accepting `-1`, `999`, or
        // `NaN` here would let a malformed client sneak an out-of-range
        // priority into the scheduler. Reject anything that is not a finite
        // integer in [0, 255] on the same errorKind the missing / non-number
        // cases already use so the fidelity harness sees one rejection axis.
        const priority = it['priority'];
        if (
          typeof priority !== 'number' ||
          !Number.isFinite(priority) ||
          !Number.isInteger(priority) ||
          priority < 0 ||
          priority > 255
        ) {
          return { ok: false, errorKind: 'invalid_stream_entry' };
        }
        const byteLength = it['byteLength'];
        if (
          typeof byteLength !== 'number' ||
          !Number.isFinite(byteLength) ||
          byteLength < 0
        ) {
          return { ok: false, errorKind: 'invalid_stream_entry' };
        }
        streams.push({ priority, byteLength });
      }
      return {
        ok: true,
        value: {
          kind,
          connectionId: b['connectionId'] as string,
          streams,
        },
      };
    }
    case 'write-stream': {
      if (typeof b['streamId'] !== 'string' || !b['streamId']) {
        return { ok: false, errorKind: 'missing_stream_id' };
      }
      if (typeof b['dataBase64'] !== 'string') {
        return { ok: false, errorKind: 'missing_data' };
      }
      return {
        ok: true,
        value: {
          kind,
          connectionId: b['connectionId'] as string,
          streamId: b['streamId'] as string,
          dataBase64: b['dataBase64'] as string,
        },
      };
    }
    case 'read-stream':
    case 'close-stream': {
      if (typeof b['streamId'] !== 'string' || !b['streamId']) {
        return { ok: false, errorKind: 'missing_stream_id' };
      }
      return {
        ok: true,
        value: {
          kind,
          connectionId: b['connectionId'] as string,
          streamId: b['streamId'] as string,
        },
      };
    }
  }
}

function decodeBase64(input: string): Uint8Array {
  // Node + Chromium both expose Buffer through the runtime — the payload is
  // small (< 64 KB per handler cap in the HTTP server).
  return Uint8Array.from(Buffer.from(input, 'base64'));
}

export interface CreateMultiStreamHandlerInput {
  adapter: Http3MultiplexAdapter;
}

export function createMultiStreamHandler(
  input: CreateMultiStreamHandlerInput,
): (req: MultiStreamRequest) => Promise<MultiStreamResponse> {
  const adapter = input.adapter;
  return async (req) => {
    switch (req.kind) {
      case 'open-connection': {
        const args: {
          connectionId: string;
          url: string;
          zeroRtt?: boolean;
          earlyDataBytes?: number;
        } = {
          connectionId: req.connectionId,
          url: req.url,
        };
        if (req.zeroRtt !== undefined) args.zeroRtt = req.zeroRtt;
        if (req.earlyDataBytes !== undefined) {
          args.earlyDataBytes = req.earlyDataBytes;
        }
        const res = await adapter.openConnection(args);
        return {
          ok: true,
          kind: 'open-connection',
          connectionId: res.connectionId,
          zeroRttUsed: res.zeroRttUsed,
          earlyDataAccepted: res.earlyDataAccepted,
          latencyMs: res.latencyMs,
        };
      }
      case 'close-connection': {
        await adapter.closeConnection({ connectionId: req.connectionId });
        return {
          ok: true,
          kind: 'close-connection',
          connectionId: req.connectionId,
        };
      }
      case 'open-stream': {
        const args: {
          connectionId: string;
          priority?: number;
          direction?: 'client-initiated' | 'server-push';
        } = { connectionId: req.connectionId };
        if (req.priority !== undefined) args.priority = req.priority;
        if (req.direction !== undefined) args.direction = req.direction;
        const res = await adapter.openStream(args);
        return {
          ok: true,
          kind: 'open-stream',
          connectionId: res.connectionId,
          streamId: res.streamId,
          priority: res.priority,
          latencyMs: res.latencyMs,
        };
      }
      case 'concurrent-send': {
        const res = await adapter.concurrentSend({
          connectionId: req.connectionId,
          streams: req.streams,
        });
        return {
          ok: true,
          kind: 'concurrent-send',
          connectionId: res.connectionId,
          streamIds: res.streamIds,
          drainOrder: res.drainOrder,
          totalBytes: res.totalBytes,
          latencyMs: res.latencyMs,
        };
      }
      case 'write-stream': {
        const res = await adapter.writeStream({
          connectionId: req.connectionId,
          streamId: req.streamId,
          data: decodeBase64(req.dataBase64),
        });
        return {
          ok: true,
          kind: 'write-stream',
          connectionId: res.connectionId,
          streamId: res.streamId,
          byteLength: res.byteLength,
          latencyMs: res.latencyMs,
        };
      }
      case 'read-stream': {
        const res = await adapter.readStream({
          connectionId: req.connectionId,
          streamId: req.streamId,
        });
        return {
          ok: true,
          kind: 'read-stream',
          connectionId: res.connectionId,
          streamId: res.streamId,
          byteLength: res.byteLength,
          latencyMs: res.latencyMs,
        };
      }
      case 'close-stream': {
        const res = await adapter.closeStream({
          connectionId: req.connectionId,
          streamId: req.streamId,
        });
        return {
          ok: true,
          kind: 'close-stream',
          connectionId: res.connectionId,
          streamId: res.streamId,
          latencyMs: res.latencyMs,
        };
      }
    }
  };
}
