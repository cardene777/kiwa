/**
 * Nuxt 3 `/api/stream` handler — the boundary the Nuxt runtime exposes for
 * WebTransport uni / bi stream ops and Datagram send/receive. Requests are
 * validated at this boundary — the session manager itself trusts the adapter
 * contract, so a malformed payload cannot corrupt session state.
 *
 * The handler is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without booting Nuxt itself. This mirrors the
 * pattern used by `dogfood-nextjs-webrtc-video-app` — decouple the handler
 * from the framework runtime so vitest can drive it directly.
 */

import type { WebTransportStreamAdapter } from '../../src/adapters/interface.js';

export type StreamOpKind =
  | 'open-session'
  | 'open-uni-stream'
  | 'open-bi-stream'
  | 'write-stream'
  | 'read-stream'
  | 'send-datagram'
  | 'close-session';

export interface StreamRequestBase {
  sessionId: string;
}

export interface OpenSessionRequest extends StreamRequestBase {
  kind: 'open-session';
  url: string;
  zeroRtt?: boolean;
}

export interface OpenUniStreamRequest extends StreamRequestBase {
  kind: 'open-uni-stream';
}

export interface OpenBiStreamRequest extends StreamRequestBase {
  kind: 'open-bi-stream';
  windowSize?: number;
}

export interface WriteStreamRequest extends StreamRequestBase {
  kind: 'write-stream';
  streamId: string;
  /** Base64-encoded payload — the handler decodes to Uint8Array. */
  dataBase64: string;
}

export interface ReadStreamRequest extends StreamRequestBase {
  kind: 'read-stream';
  streamId: string;
}

export interface SendDatagramRequest extends StreamRequestBase {
  kind: 'send-datagram';
  dataBase64: string;
}

export interface CloseSessionRequest extends StreamRequestBase {
  kind: 'close-session';
}

export type StreamRequest =
  | OpenSessionRequest
  | OpenUniStreamRequest
  | OpenBiStreamRequest
  | WriteStreamRequest
  | ReadStreamRequest
  | SendDatagramRequest
  | CloseSessionRequest;

export interface StreamResponse {
  ok: boolean;
  kind: StreamOpKind;
  sessionId: string;
  streamId?: string;
  byteLength?: number;
  windowRemaining?: number;
  backpressure?: boolean;
  zeroRttUsed?: boolean;
  latencyMs?: number;
  errorKind?: string;
}

const KIND_VALUES: StreamOpKind[] = [
  'open-session',
  'open-uni-stream',
  'open-bi-stream',
  'write-stream',
  'read-stream',
  'send-datagram',
  'close-session',
];

/**
 * Validate a stream payload independently of the adapter — returning an
 * errorKind here lets the fidelity harness assert on rejection paths
 * (empty sessionId, unknown kind, etc) without exercising aioquic.
 */
export function validateStreamRequest(
  body: unknown,
): { ok: true; value: StreamRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'missing_session_id' };
  }
  if (typeof b['kind'] !== 'string' || !KIND_VALUES.includes(b['kind'] as StreamOpKind)) {
    return { ok: false, errorKind: 'unknown_kind' };
  }
  const kind = b['kind'] as StreamOpKind;
  switch (kind) {
    case 'open-session': {
      if (typeof b['url'] !== 'string' || !b['url']) {
        return { ok: false, errorKind: 'missing_url' };
      }
      const value: OpenSessionRequest = {
        kind,
        sessionId: b['sessionId'] as string,
        url: b['url'] as string,
      };
      if (typeof b['zeroRtt'] === 'boolean') value.zeroRtt = b['zeroRtt'];
      return { ok: true, value };
    }
    case 'open-uni-stream':
    case 'close-session': {
      return {
        ok: true,
        value: { kind, sessionId: b['sessionId'] as string },
      };
    }
    case 'open-bi-stream': {
      const value: OpenBiStreamRequest = {
        kind,
        sessionId: b['sessionId'] as string,
      };
      if (typeof b['windowSize'] === 'number' && b['windowSize'] > 0) {
        value.windowSize = b['windowSize'];
      }
      return { ok: true, value };
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
          sessionId: b['sessionId'] as string,
          streamId: b['streamId'] as string,
          dataBase64: b['dataBase64'] as string,
        },
      };
    }
    case 'read-stream': {
      if (typeof b['streamId'] !== 'string' || !b['streamId']) {
        return { ok: false, errorKind: 'missing_stream_id' };
      }
      return {
        ok: true,
        value: {
          kind,
          sessionId: b['sessionId'] as string,
          streamId: b['streamId'] as string,
        },
      };
    }
    case 'send-datagram': {
      if (typeof b['dataBase64'] !== 'string') {
        return { ok: false, errorKind: 'missing_data' };
      }
      return {
        ok: true,
        value: {
          kind,
          sessionId: b['sessionId'] as string,
          dataBase64: b['dataBase64'] as string,
        },
      };
    }
  }
}

function decodeBase64(input: string): Uint8Array {
  // Node + Chromium both expose Buffer through the runtime — the payload is
  // small (< 64 KB per handler cap in the HTTP server, tests use ≤ 32 KB).
  return Uint8Array.from(Buffer.from(input, 'base64'));
}

export interface CreateStreamHandlerInput {
  adapter: WebTransportStreamAdapter;
}

export function createStreamHandler(
  input: CreateStreamHandlerInput,
): (req: StreamRequest) => Promise<StreamResponse> {
  const adapter = input.adapter;
  return async (req) => {
    switch (req.kind) {
      case 'open-session': {
        const args: { sessionId: string; url: string; zeroRtt?: boolean } = {
          sessionId: req.sessionId,
          url: req.url,
        };
        if (req.zeroRtt !== undefined) args.zeroRtt = req.zeroRtt;
        const res = await adapter.openSession(args);
        return {
          ok: true,
          kind: 'open-session',
          sessionId: res.sessionId,
          zeroRttUsed: res.zeroRttUsed,
          latencyMs: res.latencyMs,
        };
      }
      case 'open-uni-stream': {
        const res = await adapter.openUniStream({ sessionId: req.sessionId });
        return {
          ok: true,
          kind: 'open-uni-stream',
          sessionId: res.sessionId,
          streamId: res.streamId,
          latencyMs: res.latencyMs,
        };
      }
      case 'open-bi-stream': {
        const args: { sessionId: string; windowSize?: number } = {
          sessionId: req.sessionId,
        };
        if (req.windowSize !== undefined) args.windowSize = req.windowSize;
        const res = await adapter.openBiStream(args);
        return {
          ok: true,
          kind: 'open-bi-stream',
          sessionId: res.sessionId,
          streamId: res.streamId,
          windowRemaining: res.windowSize,
          latencyMs: res.latencyMs,
        };
      }
      case 'write-stream': {
        const res = await adapter.writeStream({
          sessionId: req.sessionId,
          streamId: req.streamId,
          data: decodeBase64(req.dataBase64),
        });
        return {
          ok: true,
          kind: 'write-stream',
          sessionId: res.sessionId,
          streamId: res.streamId,
          byteLength: res.byteLength,
          backpressure: res.backpressure,
          windowRemaining: res.windowRemaining,
          latencyMs: res.latencyMs,
        };
      }
      case 'read-stream': {
        const res = await adapter.readStream({
          sessionId: req.sessionId,
          streamId: req.streamId,
        });
        return {
          ok: true,
          kind: 'read-stream',
          sessionId: res.sessionId,
          streamId: res.streamId,
          byteLength: res.byteLength,
          latencyMs: res.latencyMs,
        };
      }
      case 'send-datagram': {
        const res = await adapter.sendDatagram({
          sessionId: req.sessionId,
          data: decodeBase64(req.dataBase64),
        });
        return {
          ok: true,
          kind: 'send-datagram',
          sessionId: res.sessionId,
          byteLength: res.byteLength,
          latencyMs: res.latencyMs,
        };
      }
      case 'close-session': {
        await adapter.closeSession({ sessionId: req.sessionId });
        return {
          ok: true,
          kind: 'close-session',
          sessionId: req.sessionId,
        };
      }
    }
  };
}
