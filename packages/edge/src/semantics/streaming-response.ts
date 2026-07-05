import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Streaming response — chunked / SSE / websocket body delivery with
 * backpressure. Edge runtimes stream responses through a bounded buffer: while
 * buffered bytes stay under the high-water mark the stream is `open` and chunks
 * flow freely; once the mark is exceeded the stream enters `backpressure` and
 * the producer must wait for the consumer to drain before resuming.
 */
export type StreamState = 'open' | 'backpressure' | 'closed';

/** Delivery mechanism for the streamed body. */
export type StreamKind = 'chunked' | 'sse' | 'websocket';

export interface StreamSession {
  id: string;
  platform: EdgePlatform;
  kind: StreamKind;
  state: StreamState;
  chunksSent: number;
  bytesSent: number;
  highWaterMark: number;
  history: AxisStep<StreamState>[];
}

/**
 * Open a response stream. `kind` defaults to `chunked` and `highWaterMark` to
 * 65536 bytes (64 KiB). Emits `stream.opened` and seeds counters at zero.
 */
export function openStream(input: {
  id: string;
  platform: EdgePlatform;
  kind?: StreamKind;
  highWaterMark?: number;
}): StreamSession {
  const kind = input.kind ?? 'chunked';
  const highWaterMark = input.highWaterMark ?? 65536;
  const session: StreamSession = {
    id: input.id,
    platform: input.platform,
    kind,
    state: 'open',
    chunksSent: 0,
    bytesSent: 0,
    highWaterMark,
    history: [],
  };
  const step: AxisStep<StreamState> = {
    neutralEvent: 'stream.opened',
    platformEvent: platformEventName(input.platform, 'stream.opened'),
    state: 'open',
    platform: input.platform,
    metadata: { id: input.id, kind, highWaterMark },
  };
  session.history.push(step);
  return session;
}

/**
 * Write a chunk to the stream. Advances `chunksSent` + `bytesSent`; when the
 * buffered byte total exceeds the high-water mark the stream flips to
 * `backpressure` and emits `stream.backpressure`, otherwise `stream.chunk-sent`.
 * Rejects if the stream is already `closed`.
 */
export function sendChunk(
  session: StreamSession,
  input: { data: string },
): AxisStep<StreamState> {
  if (session.state === 'closed') {
    throw new Error('sendChunk: stream is closed');
  }
  session.chunksSent += 1;
  session.bytesSent += input.data.length;
  if (session.bytesSent > session.highWaterMark) {
    session.state = 'backpressure';
    const step: AxisStep<StreamState> = {
      neutralEvent: 'stream.backpressure',
      platformEvent: platformEventName(session.platform, 'stream.backpressure'),
      state: 'backpressure',
      platform: session.platform,
      metadata: {
        bytesSent: session.bytesSent,
        highWaterMark: session.highWaterMark,
        chunksSent: session.chunksSent,
      },
    };
    session.history.push(step);
    return step;
  }
  const step: AxisStep<StreamState> = {
    neutralEvent: 'stream.chunk-sent',
    platformEvent: platformEventName(session.platform, 'stream.chunk-sent'),
    state: session.state,
    platform: session.platform,
    metadata: {
      bytesSent: session.bytesSent,
      chunksSent: session.chunksSent,
      size: input.data.length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Resume a back-pressured stream after the consumer drained. Transitions
 * `backpressure` → `open`, drains one high-water mark worth of buffered bytes,
 * and re-emits `stream.chunk-sent` tagged `resumed: true` (there is no distinct
 * neutral resume event). Rejects unless the stream is `backpressure`.
 */
export function resumeStream(session: StreamSession): AxisStep<StreamState> {
  if (session.state !== 'backpressure') {
    throw new Error(`resumeStream: stream is ${session.state}, expected backpressure`);
  }
  session.state = 'open';
  session.bytesSent = Math.max(0, session.bytesSent - session.highWaterMark);
  const step: AxisStep<StreamState> = {
    neutralEvent: 'stream.chunk-sent',
    platformEvent: platformEventName(session.platform, 'stream.chunk-sent'),
    state: 'open',
    platform: session.platform,
    metadata: {
      resumed: true,
      chunksSent: session.chunksSent,
      bytesSent: session.bytesSent,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Close the stream. Transitions to `closed` and emits `stream.closed` with the
 * final chunk + byte totals. Rejects if the stream is already `closed`.
 */
export function closeStream(
  session: StreamSession,
  input: { reason: string },
): AxisStep<StreamState> {
  if (session.state === 'closed') {
    throw new Error('closeStream: stream already closed');
  }
  session.state = 'closed';
  const step: AxisStep<StreamState> = {
    neutralEvent: 'stream.closed',
    platformEvent: platformEventName(session.platform, 'stream.closed'),
    state: 'closed',
    platform: session.platform,
    metadata: {
      reason: input.reason,
      totalChunks: session.chunksSent,
      totalBytes: session.bytesSent,
    },
  };
  session.history.push(step);
  return step;
}
