import type {
  BroadcastEvent,
  ConnectionState,
  PostgresChangeEvent,
  PresenceEvent,
  PresenceMember,
  RealtimeAnyEvent,
  RealtimeEventHandler,
  RealtimeMetrics,
  RealtimeMock,
  RealtimeMockConfig,
  ReconnectPolicy,
  ScenarioEvent,
  SubscriptionHandle,
} from './types.js';

/**
 * 4 provider adapter で共通の内部エンジン。 channel registry + event queue +
 * presence state + connection lifecycle + reconnect backoff を集約する。
 * SDK 別 adapter (supabase / ably / pusher / socketio) は本エンジンを wrap
 * するだけ。
 *
 * 実装方針 ...
 * - subscribe / unsubscribe は per-channel handler list を管理
 * - scenario event は subscribe 時に「順次発火 queue」 として登録、
 *   各 event は `delay` ms 後に非同期発火 (setTimeout ベース)
 * - presence state は `{ [channel]: Map<userId, PresenceMember> }`、
 *   track / untrack で自動 sync event を発火
 * - connection state は 5 state machine、 reconnect() で指数 backoff
 * - backpressureLimit で pending event queue 上限を課し、 溢れは drop count 加算
 */
interface ResolvedConfig {
  artificialLatencyMs: number;
  provider: string;
  reconnect: Required<ReconnectPolicy>;
  scenarios: Record<string, ScenarioEvent[]>;
  backpressureLimit: number;
}

interface ChannelState {
  handlers: Set<RealtimeEventHandler>;
  presence: Map<string, PresenceMember>;
  /** scenario 発火用 pending timer id 群 (unsubscribe 時に clear)。 */
  timers: Set<ReturnType<typeof setTimeout>>;
  /** 発火 index (scenario の次の event を指す)。 */
  scenarioIndex: number;
  /** subscribe 時刻 (latency 計測用)。 */
  subscribedAt: number;
  /** 初回 event 発火済 flag。 */
  firstEventDelivered: boolean;
}

export class RealtimeEngine {
  readonly config: ResolvedConfig;
  private channels = new Map<string, ChannelState>();
  private connectionState: ConnectionState = 'disconnected';
  private metrics: RealtimeMetrics = {
    subscribeCount: 0,
    publishCount: 0,
    eventsDelivered: 0,
    eventsDropped: 0,
    reconnectCount: 0,
    subscribeLatencyMs: [],
    publishLatencyMs: [],
  };
  private pendingQueue: Array<() => void> = [];

  constructor(config: RealtimeMockConfig = {}) {
    this.config = {
      artificialLatencyMs: config.artificialLatencyMs ?? 5,
      provider: config.provider ?? 'mock-realtime',
      reconnect: {
        maxAttempts: config.reconnect?.maxAttempts ?? 5,
        initialBackoffMs: config.reconnect?.initialBackoffMs ?? 100,
        maxBackoffMs: config.reconnect?.maxBackoffMs ?? 5000,
        backoffMultiplier: config.reconnect?.backoffMultiplier ?? 2,
        jitter: config.reconnect?.jitter ?? 0.1,
      },
      scenarios: config.scenarios ?? {},
      backpressureLimit: config.backpressureLimit ?? Number.POSITIVE_INFINITY,
    };
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  async ensureConnected(): Promise<void> {
    if (this.connectionState === 'connected') return;
    this.setConnectionState('connecting');
    await this.sleep(this.config.artificialLatencyMs);
    this.setConnectionState('connected');
  }

  async disconnect(): Promise<void> {
    if (this.connectionState === 'disconnected' || this.connectionState === 'closed') return;
    for (const [, ch] of this.channels) {
      for (const t of ch.timers) clearTimeout(t);
      ch.timers.clear();
    }
    this.setConnectionState('disconnected');
  }

  async reconnect(): Promise<void> {
    this.metrics.reconnectCount += 1;
    this.setConnectionState('reconnecting');
    // 指数 backoff の 1 段目のみ待機 (test 時間短縮のため full retry loop 未展開)
    const delay = this.computeBackoff(0);
    await this.sleep(delay);
    this.setConnectionState('connected');
    // 再接続後 pending queue を flush
    const q = this.pendingQueue;
    this.pendingQueue = [];
    for (const task of q) task();
  }

  async subscribe(
    channel: string,
    handler: RealtimeEventHandler,
  ): Promise<SubscriptionHandle> {
    await this.ensureConnected();
    const start = Date.now();
    const state = this.channels.get(channel) ?? {
      handlers: new Set(),
      presence: new Map(),
      timers: new Set(),
      scenarioIndex: 0,
      subscribedAt: Date.now(),
      firstEventDelivered: false,
    };
    state.handlers.add(handler);
    if (!this.channels.has(channel)) {
      state.subscribedAt = Date.now();
      this.channels.set(channel, state);
    }
    this.metrics.subscribeCount += 1;
    await this.sleep(this.config.artificialLatencyMs);
    // scenario event が定義されている場合は subscribe 後に順次発火
    this.scheduleScenarioEvents(channel);
    // connection state event を初期通知
    this.deliverToChannel(channel, { kind: 'connection', state: 'connected', timestamp: Date.now() });
    const latency = Math.max(0, Date.now() - start);
    pushBounded(this.metrics.subscribeLatencyMs, latency, 1000);
    return {
      channel,
      unsubscribe: async () => {
        const s = this.channels.get(channel);
        if (!s) return;
        s.handlers.delete(handler);
        if (s.handlers.size === 0) {
          for (const t of s.timers) clearTimeout(t);
          s.timers.clear();
          this.channels.delete(channel);
        }
      },
    };
  }

  async publish(channel: string, event: string, payload: unknown): Promise<void> {
    if (this.connectionState !== 'connected') {
      // 再接続待機中は pending queue に積む (Socket.io backpressure sim)
      if (this.pendingQueue.length >= this.config.backpressureLimit) {
        this.metrics.eventsDropped += 1;
        return;
      }
      this.pendingQueue.push(() => {
        void this.publish(channel, event, payload);
      });
      return;
    }
    const start = Date.now();
    this.metrics.publishCount += 1;
    await this.sleep(this.config.artificialLatencyMs);
    const bev: BroadcastEvent = {
      channel,
      event,
      payload,
      id: `evt_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: Date.now(),
    };
    this.deliverToChannel(channel, { kind: 'broadcast', ...bev });
    const latency = Math.max(0, Date.now() - start);
    pushBounded(this.metrics.publishLatencyMs, latency, 1000);
  }

  async trackPresence(
    channel: string,
    userId: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    await this.ensureConnected();
    const state = this.getOrCreateChannel(channel);
    const member: PresenceMember = {
      userId,
      payload,
      updatedAt: Date.now(),
    };
    state.presence.set(userId, member);
    const pev: PresenceEvent = {
      type: 'join',
      channel,
      members: [member],
      timestamp: Date.now(),
    };
    this.deliverToChannel(channel, { kind: 'presence', ...pev });
    // sync event も 1 回発火 (Supabase 挙動に合わせる)
    const syncEv: PresenceEvent = {
      type: 'sync',
      channel,
      members: [...state.presence.values()],
      timestamp: Date.now(),
    };
    this.deliverToChannel(channel, { kind: 'presence', ...syncEv });
  }

  async untrackPresence(channel: string, userId: string): Promise<void> {
    const state = this.channels.get(channel);
    if (!state) return;
    const member = state.presence.get(userId);
    if (!member) return;
    state.presence.delete(userId);
    const pev: PresenceEvent = {
      type: 'leave',
      channel,
      members: [member],
      timestamp: Date.now(),
    };
    this.deliverToChannel(channel, { kind: 'presence', ...pev });
  }

  /** postgres_changes event を手動で emit (test / scenario 用)。 */
  emitPostgresChange(
    channel: string,
    ev: Omit<PostgresChangeEvent, 'timestamp' | 'channel'>,
  ): void {
    const full: PostgresChangeEvent = {
      channel,
      ...ev,
      timestamp: Date.now(),
    };
    this.deliverToChannel(channel, { kind: 'postgres_changes', ...full });
  }

  getMetrics(): ReturnType<RealtimeMock['getMetrics']> {
    return {
      subscribeCount: this.metrics.subscribeCount,
      publishCount: this.metrics.publishCount,
      eventsDelivered: this.metrics.eventsDelivered,
      eventsDropped: this.metrics.eventsDropped,
      reconnectCount: this.metrics.reconnectCount,
      subscribeLatencyMs: [...this.metrics.subscribeLatencyMs],
      publishLatencyMs: [...this.metrics.publishLatencyMs],
    };
  }

  reset(): void {
    for (const [, ch] of this.channels) {
      for (const t of ch.timers) clearTimeout(t);
    }
    this.channels.clear();
    this.connectionState = 'disconnected';
    this.metrics = {
      subscribeCount: 0,
      publishCount: 0,
      eventsDelivered: 0,
      eventsDropped: 0,
      reconnectCount: 0,
      subscribeLatencyMs: [],
      publishLatencyMs: [],
    };
    this.pendingQueue = [];
  }

  // ---- private helpers ----

  private getOrCreateChannel(channel: string): ChannelState {
    let state = this.channels.get(channel);
    if (!state) {
      state = {
        handlers: new Set(),
        presence: new Map(),
        timers: new Set(),
        scenarioIndex: 0,
        subscribedAt: Date.now(),
        firstEventDelivered: false,
      };
      this.channels.set(channel, state);
    }
    return state;
  }

  private setConnectionState(next: ConnectionState): void {
    this.connectionState = next;
    // 全 subscribed channel に connection event を通知
    const stamp = Date.now();
    for (const [, ch] of this.channels) {
      for (const h of ch.handlers) {
        try {
          h({ kind: 'connection', state: next, timestamp: stamp });
        } catch {
          // handler 例外は他 handler を止めない
        }
      }
    }
  }

  private deliverToChannel(channel: string, event: RealtimeAnyEvent): void {
    const state = this.channels.get(channel);
    if (!state) return;
    this.metrics.eventsDelivered += 1;
    state.firstEventDelivered = true;
    for (const h of state.handlers) {
      try {
        h(event);
      } catch {
        // handler 例外は他 handler を止めない
      }
    }
  }

  private scheduleScenarioEvents(channel: string): void {
    const scenario = this.config.scenarios[channel];
    if (!scenario || scenario.length === 0) return;
    const state = this.getOrCreateChannel(channel);
    let cumulative = 0;
    for (let i = state.scenarioIndex; i < scenario.length; i += 1) {
      const ev = scenario[i]!;
      cumulative += ev.delay ?? this.config.artificialLatencyMs;
      const idx = i;
      const timer = setTimeout(() => {
        this.fireScenarioEvent(channel, ev, idx);
      }, cumulative);
      state.timers.add(timer);
    }
    state.scenarioIndex = scenario.length;
  }

  private fireScenarioEvent(channel: string, ev: ScenarioEvent, _index: number): void {
    const stamp = Date.now();
    switch (ev.kind) {
      case 'presence': {
        const pev: PresenceEvent = {
          type: ev.type,
          channel,
          members: ev.members,
          timestamp: stamp,
        };
        this.deliverToChannel(channel, { kind: 'presence', ...pev });
        break;
      }
      case 'broadcast': {
        const bev: BroadcastEvent = {
          channel,
          event: ev.event,
          payload: ev.payload,
          id: ev.id ?? `evt_${Math.random().toString(36).slice(2, 10)}`,
          timestamp: stamp,
        };
        this.deliverToChannel(channel, { kind: 'broadcast', ...bev });
        break;
      }
      case 'postgres_changes': {
        const pgev: PostgresChangeEvent = {
          channel,
          eventType: ev.eventType,
          schema: ev.schema,
          table: ev.table,
          oldRecord: ev.oldRecord,
          newRecord: ev.newRecord,
          timestamp: stamp,
        };
        this.deliverToChannel(channel, { kind: 'postgres_changes', ...pgev });
        break;
      }
      case 'disconnect': {
        void this.disconnect();
        break;
      }
      case 'reconnect': {
        void this.reconnect();
        break;
      }
    }
  }

  private computeBackoff(attempt: number): number {
    const { initialBackoffMs, maxBackoffMs, backoffMultiplier, jitter } = this.config.reconnect;
    const base = Math.min(maxBackoffMs, initialBackoffMs * backoffMultiplier ** attempt);
    const jitterAmount = base * jitter * (Math.random() * 2 - 1);
    return Math.max(0, base + jitterAmount);
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * pushBounded — append `value` to `arr`; if length exceeds `cap`, drop the
 * oldest sample. Used for latency sample arrays so long-running mocks do
 * not retain unbounded heap.
 */
function pushBounded<T>(arr: T[], value: T, cap: number): void {
  arr.push(value);
  if (arr.length > cap) {
    arr.splice(0, arr.length - cap);
  }
}
