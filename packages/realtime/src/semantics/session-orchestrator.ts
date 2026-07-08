/**
 * v2.1 realtime session-orchestrator = presence + broadcast + subscription +
 * heartbeat + reconnect の 5 axis を 継続合成 する 上位 layer。
 *
 * Realtime pair v0.1 → v2.1 = 5 段深化到達、 **depth-5 pattern 5 例目発生**
 * (Mobile + Desktop + quality-metrics + Payment + Realtime = 5 pair 到達で
 * pattern 「rule」 化 → **systematic law** 昇格 candidate)。 auth v0.7 +
 * payment v2.1 の 上位層 pattern を Realtime pair に転用、 systematic pattern
 * 47 度目適用 (continuous state machine variant Realtime 転用)。
 *
 * 4 provider (Supabase / Ably / Pusher / Socket.io) 抽象 の 上位、 provider
 * 独立 な pure state machine、 5 state SSOT + 8 event SSOT + 40 セル 遷移表。
 *
 * shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.2) 変更 0、 新規 file
 * 追加 のみ、 backward compat 絶対維持。
 */

export type RealtimeSessionState =
  | 'connecting'        // 初期接続中
  | 'subscribed'        // 通常 subscribe active、 broadcast / presence 受信中
  | 'reconnecting'      // reconnect 中、 backoff 待ち
  | 'degraded'          // heartbeat 失敗多発、 lower QoS mode
  | 'closed';           // session 完全終了 (terminal)

export type RealtimeEvent =
  | 'connect-succeeded'
  | 'connect-failed'
  | 'subscribe-succeeded'
  | 'heartbeat-lost'
  | 'heartbeat-recovered'
  | 'reconnect-succeeded'
  | 'reconnect-exhausted'
  | 'user-disconnect';

export interface RealtimeSession {
  state: RealtimeSessionState;
  connectAttempts: number;
  reconnectRounds: number;
  heartbeatFailures: number;
  broadcastsReceived: number;
  lastEventAt: string;
  events: string[];
}

export function startSession(input: { timestamp: string }): RealtimeSession {
  return {
    state: 'connecting',
    connectAttempts: 1,
    reconnectRounds: 0,
    heartbeatFailures: 0,
    broadcastsReceived: 0,
    lastEventAt: input.timestamp,
    events: ['session-started'],
  };
}

/**
 * event driven state 遷移 SSOT。 5 state × 8 event = 40 セル。
 * payment 同様 soft-reject + invalid log (realtime 経路 も webhook 相当 の
 * event 重複配信 が normal、 throw だと consumer が例外処理コード膨張)。
 */
export function dispatchEvent(input: {
  session: RealtimeSession;
  event: RealtimeEvent;
  timestamp: string;
}): RealtimeSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'connecting': {
      if (event === 'connect-succeeded') {
        return { ...base, state: 'subscribed' };
      }
      if (event === 'connect-failed') {
        return {
          ...base,
          state: 'reconnecting',
          reconnectRounds: session.reconnectRounds + 1,
        };
      }
      if (event === 'user-disconnect') {
        return { ...base, state: 'closed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'subscribed': {
      if (event === 'subscribe-succeeded') {
        return { ...base, broadcastsReceived: session.broadcastsReceived + 1 };
      }
      if (event === 'heartbeat-lost') {
        const failures = session.heartbeatFailures + 1;
        // 3 回連続 heartbeat 失敗 で degraded 降格
        if (failures >= 3) {
          return { ...base, state: 'degraded', heartbeatFailures: failures };
        }
        return { ...base, heartbeatFailures: failures };
      }
      if (event === 'connect-failed') {
        return {
          ...base,
          state: 'reconnecting',
          reconnectRounds: session.reconnectRounds + 1,
        };
      }
      if (event === 'user-disconnect') {
        return { ...base, state: 'closed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'reconnecting': {
      if (event === 'reconnect-succeeded') {
        return {
          ...base,
          state: 'subscribed',
          heartbeatFailures: 0, // reconnect 成功 で heartbeat counter リセット
        };
      }
      if (event === 'reconnect-exhausted') {
        return { ...base, state: 'closed' };
      }
      if (event === 'user-disconnect') {
        return { ...base, state: 'closed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'degraded': {
      if (event === 'heartbeat-recovered') {
        return {
          ...base,
          state: 'subscribed',
          heartbeatFailures: 0,
        };
      }
      if (event === 'heartbeat-lost') {
        return { ...base, heartbeatFailures: session.heartbeatFailures + 1 };
      }
      if (event === 'connect-failed') {
        return {
          ...base,
          state: 'reconnecting',
          reconnectRounds: session.reconnectRounds + 1,
        };
      }
      if (event === 'user-disconnect') {
        return { ...base, state: 'closed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'closed': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface RealtimeSessionSummary {
  currentState: RealtimeSessionState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  broadcastsReceived: number;
  reconnectRounds: number;
  heartbeatFailures: number;
}

export function summarizeSession(session: RealtimeSession): RealtimeSessionSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    broadcastsReceived: session.broadcastsReceived,
    reconnectRounds: session.reconnectRounds,
    heartbeatFailures: session.heartbeatFailures,
  };
}
