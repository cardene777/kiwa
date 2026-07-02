import { RealtimeEngine } from './engine.js';
import type {
  BroadcastEvent,
  PresenceEvent,
  RealtimeMock,
  RealtimeMockConfig,
} from './types.js';

/**
 * Ably mock。
 *
 * SDK 呼出形式 (real `ably`) は以下 ...
 *
 * ```ts
 * const client = new Ably.Realtime(...);
 * const channel = client.channels.get('room-1');
 * channel.subscribe('chat', (msg) => {...});
 * await channel.presence.subscribe('enter', (msg) => {...});
 * await channel.presence.enter({ name: 'user' });
 * const messages = await channel.history({ untilAttach: true });
 * ```
 *
 * 本 mock は上記 shape の薄い wrapper。 history rewind (`untilAttach`) は
 * 直近 broadcast event を N 件保持して返却する簡易実装。
 */

export interface AblyMessage<T = unknown> {
  name: string;
  data: T;
  id: string;
  timestamp: number;
  clientId?: string;
}

export interface AblyPresenceMessage {
  action: 'enter' | 'leave' | 'update' | 'present';
  clientId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface AblyChannel {
  readonly name: string;
  attach(): Promise<void>;
  detach(): Promise<void>;
  subscribe(event: string, handler: (msg: AblyMessage) => void): Promise<void>;
  subscribe(handler: (msg: AblyMessage) => void): Promise<void>;
  unsubscribe(): void;
  publish(event: string, data: unknown): Promise<void>;
  history(options?: { limit?: number }): Promise<{ items: AblyMessage[] }>;
  presence: AblyPresence;
}

export interface AblyPresence {
  subscribe(
    action: 'enter' | 'leave' | 'update',
    handler: (msg: AblyPresenceMessage) => void,
  ): Promise<void>;
  enter(data?: Record<string, unknown>): Promise<void>;
  leave(): Promise<void>;
  get(): Promise<AblyPresenceMessage[]>;
}

export interface AblyChannels {
  get(name: string): AblyChannel;
  release(name: string): void;
}

export interface AblyMock extends RealtimeMock {
  readonly provider: 'ably';
  channels: AblyChannels;
  connection: {
    state: string;
    on(state: string, handler: () => void): void;
    close(): Promise<void>;
  };
  /** clientId (Ably 固有、 presence の identify 用)。 */
  auth: { clientId: string };
}

export function createAblyMock(config: RealtimeMockConfig & { clientId?: string } = {}): AblyMock {
  const engine = new RealtimeEngine({ provider: 'ably', ...config });
  const openChannels = new Map<string, AblyChannel>();
  const clientId = config.clientId ?? `client_${Math.random().toString(36).slice(2, 8)}`;
  const connectionListeners = new Map<string, Array<() => void>>();

  const client: AblyMock = {
    provider: 'ably',
    channels: {
      get(name: string) {
        const existing = openChannels.get(name);
        if (existing) return existing;
        const ch = buildAblyChannel(engine, name, clientId);
        openChannels.set(name, ch);
        return ch;
      },
      release(name: string) {
        openChannels.delete(name);
      },
    },
    connection: {
      state: 'initialized',
      on(state, handler) {
        const arr = connectionListeners.get(state) ?? [];
        arr.push(handler);
        connectionListeners.set(state, arr);
      },
      async close() {
        await engine.disconnect();
        client.connection.state = 'closed';
        const arr = connectionListeners.get('closed') ?? [];
        for (const h of arr) h();
      },
    },
    auth: { clientId },
    subscribe: (channel, handler) => engine.subscribe(channel, handler),
    publish: (channel, event, payload) => engine.publish(channel, event, payload),
    trackPresence: (channel, userId, payload) => engine.trackPresence(channel, userId, payload),
    untrackPresence: (channel, userId) => engine.untrackPresence(channel, userId),
    getConnectionState: () => engine.getConnectionState(),
    disconnect: () => engine.disconnect(),
    reconnect: () => engine.reconnect(),
    getMetrics: () => engine.getMetrics(),
    reset: () => {
      engine.reset();
      openChannels.clear();
      connectionListeners.clear();
    },
  };
  return client;
}

function buildAblyChannel(engine: RealtimeEngine, name: string, clientId: string): AblyChannel {
  // per-event handler map + wildcard handler list
  const eventHandlers = new Map<string, Array<(msg: AblyMessage) => void>>();
  const wildcardHandlers: Array<(msg: AblyMessage) => void> = [];
  const presenceHandlers = new Map<
    'enter' | 'leave' | 'update',
    Array<(msg: AblyPresenceMessage) => void>
  >();
  const history: AblyMessage[] = [];
  let subHandle: { unsubscribe(): Promise<void> } | null = null;

  const attach = async (): Promise<void> => {
    if (subHandle) return;
    subHandle = await engine.subscribe(name, (event) => {
      if (event.kind === 'broadcast') {
        const msg = toAblyMessage(event);
        history.push(msg);
        if (history.length > 200) history.shift();
        const arr = eventHandlers.get(event.event) ?? [];
        for (const h of arr) h(msg);
        for (const h of wildcardHandlers) h(msg);
      } else if (event.kind === 'presence') {
        dispatchAblyPresence(presenceHandlers, event);
      }
    });
  };

  const presence: AblyPresence = {
    async subscribe(action, handler) {
      const arr = presenceHandlers.get(action) ?? [];
      arr.push(handler);
      presenceHandlers.set(action, arr);
      await attach();
    },
    async enter(data = {}) {
      await attach();
      await engine.trackPresence(name, clientId, data);
    },
    async leave() {
      await engine.untrackPresence(name, clientId);
    },
    async get() {
      // simplified: return current tracked members via engine metrics is not exposed,
      // fallback to empty (real Ably returns present members)
      return [];
    },
  };

  const channel: AblyChannel = {
    name,
    async attach() {
      await attach();
    },
    async detach() {
      if (subHandle) {
        await subHandle.unsubscribe();
        subHandle = null;
      }
    },
    async subscribe(...args: [string, (msg: AblyMessage) => void] | [(msg: AblyMessage) => void]) {
      if (args.length === 1) {
        wildcardHandlers.push(args[0]);
      } else {
        const [event, handler] = args;
        const arr = eventHandlers.get(event) ?? [];
        arr.push(handler);
        eventHandlers.set(event, arr);
      }
      await attach();
    },
    unsubscribe() {
      eventHandlers.clear();
      wildcardHandlers.length = 0;
    },
    async publish(event, data) {
      await engine.publish(name, event, data);
    },
    async history(options = {}) {
      const limit = options.limit ?? 100;
      return { items: history.slice(-limit).reverse() };
    },
    presence,
  };
  return channel;
}

function toAblyMessage(event: { kind: 'broadcast' } & BroadcastEvent): AblyMessage {
  return {
    name: event.event,
    data: event.payload,
    id: event.id,
    timestamp: event.timestamp,
  };
}

function dispatchAblyPresence(
  handlers: Map<'enter' | 'leave' | 'update', Array<(msg: AblyPresenceMessage) => void>>,
  event: { kind: 'presence' } & PresenceEvent,
): void {
  const actionMap: Record<PresenceEvent['type'], 'enter' | 'leave' | 'update' | null> = {
    join: 'enter',
    leave: 'leave',
    sync: 'update',
  };
  const action = actionMap[event.type];
  if (!action) return;
  const arr = handlers.get(action);
  if (!arr || arr.length === 0) return;
  for (const member of event.members) {
    const msg: AblyPresenceMessage = {
      action,
      clientId: member.userId,
      data: member.payload,
      timestamp: event.timestamp,
    };
    for (const h of arr) h(msg);
  }
}
