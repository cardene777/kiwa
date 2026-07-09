/**
 * `/api/stream` route handler — SSE (Server-Sent Events) Response with
 * backpressure. Uses the `@kiwa-lab/edge` v0.2 `streaming-response` axis
 * via the adapter. On GET the handler opens a stream, writes N chunks
 * (respecting the high-water mark), and closes cleanly. The mock returns
 * a `SseBackpressureSnapshot` observable so the fidelity harness can
 * assert on the produced chunks + backpressure fired flag.
 *
 * Real Vercel Edge Response uses `TransformStream` behind
 * `new Response(readable, { headers: { 'content-type': 'text/event-stream' } })`;
 * the mock reproduces the observable state transitions (`open` →
 * `backpressure` → `closed`) without a live TCP socket.
 */

import type { VercelEdgeAdapter } from '../../../lib/vercel-adapter.js';

export const runtime = 'edge';

/**
 * SSE payload shape returned by the handler. The `chunks` field mirrors
 * the frames a real SSE client would receive; `hitBackpressure` fires
 * when total bytes exceeded the stream's high-water mark; `closed` marks
 * the terminal state.
 */
export interface SseStreamPayload {
  ok: boolean;
  streamId: string;
  chunksSent: number;
  bytesSent: number;
  hitBackpressure: boolean;
  closed: boolean;
}

/**
 * Open + drive the stream. `openInput` seeds the initial event, `driveInput`
 * writes N chunks and closes.
 */
export async function handleSse(
  adapter: VercelEdgeAdapter,
  input: {
    streamId: string;
    firstChunk: string;
    followUpChunks: readonly string[];
    highWaterMark: number;
  },
): Promise<{ status: number; body: SseStreamPayload }> {
  await adapter.driveSseOpen({
    streamId: input.streamId,
    firstChunk: input.firstChunk,
  });
  const snapshot = await adapter.driveSseBackpressure({
    streamId: input.streamId,
    chunks: input.followUpChunks,
    highWaterMark: input.highWaterMark,
  });
  return {
    status: 200,
    body: {
      ok: true,
      streamId: snapshot.streamId,
      chunksSent: snapshot.chunksSent,
      bytesSent: snapshot.bytesSent,
      hitBackpressure: snapshot.hitBackpressure,
      closed: snapshot.closed,
    },
  };
}

/**
 * Serialize an event to the SSE wire format. Used by callers that inspect
 * the framed output; the adapter itself works with plain chunk strings.
 */
export function serializeSseFrame(event: {
  id?: string | number;
  event?: string;
  data: string;
}): string {
  const lines: string[] = [];
  if (event.id !== undefined) lines.push(`id: ${event.id}`);
  if (event.event !== undefined) lines.push(`event: ${event.event}`);
  for (const line of event.data.split('\n')) lines.push(`data: ${line}`);
  return lines.join('\n') + '\n\n';
}
