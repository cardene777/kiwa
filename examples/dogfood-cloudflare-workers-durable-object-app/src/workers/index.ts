/**
 * Worker fetch entrypoint — routes incoming requests to the appropriate
 * Durable Object instance based on the URL path. A real Cloudflare Workers
 * deployment would forward `/room/:roomId/*` to the DO via
 * `env.CHAT_ROOM.get(id).fetch(request)`; the mock reproduces the routing
 * logic + WebSocket upgrade handshake using the `@kiwa/edge` v0.2
 * websocket-edge axis semantics.
 *
 * Routing table.
 *
 *  - `GET  /room/:roomId/join`      — JOIN the room (Durable Object created
 *    on first call, then requested on subsequent calls)
 *  - `POST /room/:roomId/send`      — broadcast a message to room occupants
 *  - `GET  /room/:roomId/ws`        — upgrade to WebSocket for realtime
 *  - `POST /room/:roomId/persist`   — write a key/value to DO storage
 *  - `POST /room/:roomId/alarm`     — schedule the 24-h purge alarm
 *  - `GET  /health`                 — trivial health check
 *
 * All non-health routes route through the `ChatRoomRegistry` so the axis
 * telemetry lands on the correct DurableObjectSession.
 */

import {
  acceptWebSocket,
  requestWebSocketUpgrade,
  sendMessage,
  closeWebSocket,
  type WebSocketSession,
} from '@kiwa/edge';
import type { ChatMessage, ChatRoomRegistry } from './chat-room.js';

export const ROUTE_PATHS = {
  health: '/health',
  join: '/room/:roomId/join',
  send: '/room/:roomId/send',
  ws: '/room/:roomId/ws',
  persist: '/room/:roomId/persist',
  alarm: '/room/:roomId/alarm',
} as const;

/**
 * Per-member WebSocket session registry. Tracks the WsState axis session
 * for each `(roomId, memberId)` pair so the fidelity harness can assert
 * on the neutral events fired during the connection lifecycle.
 */
export class WebSocketRegistry {
  private readonly sessions = new Map<string, WebSocketSession>();

  private key(roomId: string, memberId: string): string {
    return `${roomId}::${memberId}`;
  }

  /**
   * Begin the upgrade handshake. Emits `websocket.upgrade-requested`. The
   * session starts in `pending` state until `accept` moves it to `open`.
   */
  requestUpgrade(roomId: string, memberId: string): WebSocketSession {
    const id = this.key(roomId, memberId);
    const session = requestWebSocketUpgrade({ id, platform: 'cloudflare' });
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Accept a pending upgrade. Returns the session so the caller can drive
   * subsequent sendMessage / closeWebSocket steps.
   */
  accept(roomId: string, memberId: string): WebSocketSession {
    const session = this.sessions.get(this.key(roomId, memberId));
    if (!session) throw new Error(`accept: no pending session for ${roomId}/${memberId}`);
    acceptWebSocket(session);
    return session;
  }

  /**
   * Send a frame over the open socket. Sequential sends preserve insertion
   * order in `session.messages`.
   */
  send(roomId: string, memberId: string, data: string): WebSocketSession {
    const session = this.sessions.get(this.key(roomId, memberId));
    if (!session) throw new Error(`send: no session for ${roomId}/${memberId}`);
    sendMessage(session, { data });
    return session;
  }

  /**
   * Close the socket with an explicit code. 1000 = normal closure, 1006 =
   * abnormal (hibernation eviction), 1011 = server error.
   */
  close(roomId: string, memberId: string, code: number): WebSocketSession {
    const session = this.sessions.get(this.key(roomId, memberId));
    if (!session) throw new Error(`close: no session for ${roomId}/${memberId}`);
    closeWebSocket(session, { code });
    return session;
  }

  get(roomId: string, memberId: string): WebSocketSession | undefined {
    return this.sessions.get(this.key(roomId, memberId));
  }

  /** List all live sessions for a room (state !== 'closed'). */
  liveMembers(roomId: string): string[] {
    const prefix = `${roomId}::`;
    const out: string[] = [];
    for (const [key, session] of this.sessions) {
      if (key.startsWith(prefix) && session.state !== 'closed') {
        out.push(key.slice(prefix.length));
      }
    }
    return out;
  }

  clear(): void {
    this.sessions.clear();
  }
}

/**
 * Route classification for an incoming request. `dispatchToRoom` parses the
 * URL and returns which route was matched — it does NOT execute the DO op
 * (that is the adapter's responsibility, so mock and real drivers share the
 * same routing surface while owning execution). Real Cloudflare Workers
 * dispatch via `env.CHAT_ROOM.idFromName(roomId).get().fetch(request)`;
 * this function reproduces the URL → route classification without the
 * runtime forwarding.
 */
export interface DispatchResult {
  status: number;
  body: unknown;
  routed: keyof typeof ROUTE_PATHS | 'unknown';
  roomId?: string;
}

export function dispatchToRoom(
  method: 'GET' | 'POST',
  path: string,
): DispatchResult {
  if (path === ROUTE_PATHS.health) {
    return { status: 200, body: { ok: true, route: 'health' }, routed: 'health' };
  }
  const match = path.match(/^\/room\/([^/]+)\/(join|send|ws|persist|alarm)$/);
  if (!match) return { status: 404, body: { ok: false, error: 'not_found' }, routed: 'unknown' };
  const [, roomId, kind] = match;
  if (!roomId || !kind) {
    return { status: 400, body: { ok: false, error: 'bad_request' }, routed: 'unknown' };
  }
  switch (kind) {
    case 'join':
      return { status: 200, body: { ok: true, roomId }, routed: 'join', roomId };
    case 'send':
      return { status: 200, body: { ok: true, roomId }, routed: 'send', roomId };
    case 'ws':
      return {
        status: method === 'GET' ? 101 : 400,
        body: { ok: method === 'GET', roomId, upgrade: 'websocket' },
        routed: 'ws',
        roomId,
      };
    case 'persist':
      return { status: 200, body: { ok: true, roomId }, routed: 'persist', roomId };
    case 'alarm':
      return { status: 200, body: { ok: true, roomId }, routed: 'alarm', roomId };
    default:
      return { status: 400, body: { ok: false, error: 'bad_request' }, routed: 'unknown' };
  }
}

/** Build the canonical send-frame payload used across the broadcast op. */
export function buildBroadcastFrame(input: {
  senderId: string;
  message: ChatMessage;
  receiverId: string;
}): string {
  return JSON.stringify({
    type: 'chat',
    roomId: input.receiverId,
    senderId: input.senderId,
    body: input.message.body,
    at: input.message.at,
  });
}
