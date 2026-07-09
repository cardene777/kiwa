import {
  dispatchEvent,
  startSession,
  summarizeSession,
  type RealtimeEvent,
  type RealtimeSession,
  type RealtimeSessionSummary,
} from '@kiwa-lab/realtime';

/** Pattern 1 — WebSocket handshake で session 開始。 */
export function openWebSocketSession(input: { timestamp: string }): RealtimeSession {
  return startSession({ timestamp: input.timestamp });
}

/** Pattern 2 — event stream (heartbeat / broadcast) を batch dispatch。 */
export function pumpEventStream(input: {
  session: RealtimeSession;
  events: { event: RealtimeEvent; timestamp: string }[];
}): RealtimeSession {
  return input.events.reduce<RealtimeSession>(
    (acc, e) => dispatchEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

/** Pattern 3 — 監視 dashboard 用 session summary。 */
export function renderSessionDashboard(session: RealtimeSession): RealtimeSessionSummary {
  return summarizeSession(session);
}

/** Pattern 4 — reconnect 経路のみ 抽出、 QoS analysis 用。 */
export function extractReconnectStats(session: RealtimeSession): {
  reconnectAttempts: number;
  reconnectSucceeded: number;
  reconnectExhausted: number;
  degradedEnters: number;
} {
  const reconnectAttempts = session.reconnectRounds;
  const succeeded = session.events.filter((e: string) => e === 'event:reconnect-succeeded').length;
  const exhausted = session.events.filter((e: string) => e === 'event:reconnect-exhausted').length;
  // degraded 遷移 = heartbeat-lost 3 回目 で 起こる、 event log では state 遷移直接 見えないので 近似
  const heartbeats = session.events.filter((e: string) => e === 'event:heartbeat-lost').length;
  return {
    reconnectAttempts,
    reconnectSucceeded: succeeded,
    reconnectExhausted: exhausted,
    degradedEnters: Math.floor(heartbeats / 3),
  };
}
