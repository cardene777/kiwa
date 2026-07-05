import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * WebSocket at the edge — the HTTP-upgrade handshake plus the message /
 * close lifecycle. All three runtimes accept a `101 Switching Protocols`
 * upgrade (Cloudflare `WebSocketPair`, Vercel edge websockets, Deno
 * `Deno.upgradeWebSocket`) but expose different telemetry strings. The mock
 * drives the neutral lifecycle so a test can assert the handshake ordering
 * without a live socket.
 *
 * State transitions:
 *   requestWebSocketUpgrade → 'pending'
 *   acceptWebSocket         → 'open'    (only from 'pending')
 *   sendMessage             → 'open'    (only while 'open')
 *   closeWebSocket          → 'closed'
 */
export type WsState = 'pending' | 'open' | 'closing' | 'closed';

export interface WebSocketSession {
  id: string;
  platform: EdgePlatform;
  state: WsState;
  messages: string[];
  history: AxisStep<WsState>[];
}

/** Push a fully-formed step onto the session history and return it. */
function record(session: WebSocketSession, step: AxisStep<WsState>): AxisStep<WsState> {
  session.history.push(step);
  return step;
}

/**
 * Begin the upgrade handshake. State starts 'pending' until the server
 * accepts. Emits `websocket.upgrade-requested`.
 */
export function requestWebSocketUpgrade(input: {
  id: string;
  platform: EdgePlatform;
}): WebSocketSession {
  const session: WebSocketSession = {
    id: input.id,
    platform: input.platform,
    state: 'pending',
    messages: [],
    history: [],
  };
  record(session, {
    neutralEvent: 'websocket.upgrade-requested',
    platformEvent: platformEventName(input.platform, 'websocket.upgrade-requested'),
    state: 'pending',
    platform: input.platform,
    metadata: { id: input.id },
  });
  return session;
}

/**
 * Accept the pending upgrade, moving the socket 'open'. Rejects if the socket
 * is not awaiting acceptance. Emits `websocket.accepted`.
 */
export function acceptWebSocket(session: WebSocketSession): AxisStep<WsState> {
  if (session.state !== 'pending') {
    throw new Error(`acceptWebSocket: socket is ${session.state}, expected pending`);
  }
  session.state = 'open';
  return record(session, {
    neutralEvent: 'websocket.accepted',
    platformEvent: platformEventName(session.platform, 'websocket.accepted'),
    state: session.state,
    platform: session.platform,
    metadata: { id: session.id },
  });
}

/**
 * Send a frame over the open socket. Rejects unless the socket is 'open'.
 * Emits `websocket.message`.
 */
export function sendMessage(
  session: WebSocketSession,
  input: { data: string },
): AxisStep<WsState> {
  if (session.state !== 'open') {
    throw new Error(`sendMessage: socket is ${session.state}, expected open`);
  }
  session.messages.push(input.data);
  return record(session, {
    neutralEvent: 'websocket.message',
    platformEvent: platformEventName(session.platform, 'websocket.message'),
    state: session.state,
    platform: session.platform,
    metadata: { size: input.data.length, index: session.messages.length - 1 },
  });
}

/**
 * Close the socket with a status code. Rejects if already closed. Emits
 * `websocket.closed`.
 */
export function closeWebSocket(
  session: WebSocketSession,
  input: { code: number },
): AxisStep<WsState> {
  if (session.state === 'closed') {
    throw new Error('closeWebSocket: socket already closed');
  }
  session.state = 'closed';
  return record(session, {
    neutralEvent: 'websocket.closed',
    platformEvent: platformEventName(session.platform, 'websocket.closed'),
    state: session.state,
    platform: session.platform,
    metadata: { code: input.code, totalMessages: session.messages.length },
  });
}
