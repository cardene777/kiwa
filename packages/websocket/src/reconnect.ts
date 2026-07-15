export interface ReconnectPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitter?: boolean;
}

export interface ReconnectAttempt {
  attempt: number;
  delayMs: number;
  giveUp: boolean;
}

/**
 * exponential backoff で reconnect delay を計算。 real WS client の reconnect
 * strategy (Socket.IO / uWebSockets client) を mock。 jitter で thundering herd 回避。
 */
export function computeReconnectDelay(attempt: number, policy: ReconnectPolicy, rng: () => number = () => 0.5): ReconnectAttempt {
  if (attempt > policy.maxAttempts) return { attempt, delayMs: 0, giveUp: true };
  const base = Math.min(policy.maxDelayMs, policy.initialDelayMs * 2 ** (attempt - 1));
  const jitter = policy.jitter ? base * (0.5 + rng() * 0.5) : base;
  return { attempt, delayMs: Math.round(jitter), giveUp: false };
}

export interface HeartbeatState {
  lastPingAt: number;
  lastPongAt: number;
  missedPongs: number;
  healthy: boolean;
}

/**
 * ping/pong heartbeat 状態を追跡、 pong 未受信で missedPongs を increment、
 * 閾値超えで healthy=false。 real WS keepalive パターンの mock。
 */
export function createHeartbeatState(now: () => number = () => 0): {
  state: HeartbeatState;
  ping: () => void;
  pong: () => void;
  check: (thresholdMs: number, maxMissed: number) => HeartbeatState;
} {
  const state: HeartbeatState = { lastPingAt: 0, lastPongAt: 0, missedPongs: 0, healthy: true };
  let outstanding = false;
  return {
    state,
    ping() {
      state.lastPingAt = now();
      outstanding = true;
    },
    pong() {
      state.lastPongAt = now();
      state.missedPongs = 0;
      state.healthy = true;
      outstanding = false;
    },
    check(thresholdMs, maxMissed) {
      if (outstanding && now() - state.lastPingAt > thresholdMs) {
        state.missedPongs += 1;
        outstanding = false;
        if (state.missedPongs >= maxMissed) state.healthy = false;
      }
      return state;
    },
  };
}
