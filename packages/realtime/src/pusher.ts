import { RealtimeEngine } from './engine.js';
import type {
  BroadcastEvent,
  PresenceEvent,
  RealtimeEventHandler,
  RealtimeMock,
  RealtimeMockConfig,
  SubscriptionHandle,
} from './types.js';

/**
 * Pusher mock。
 *
 * SDK 呼出形式 (real `pusher-js`) は以下 ...
 *
 * ```ts
 * const pusher = new Pusher(APP_KEY, { cluster: 'us2' });
 * const channel = pusher.subscribeChannel('my-channel');
 * channel.bind('my-event', (data) => {...});
 * const presence = pusher.subscribeChannel('presence-my-channel');
 * presence.bind('pusher:subscription_succeeded', (members) => {...});
 * presence.bind('pusher:member_added', (member) => {...});
 * presence.bind('pusher:member_removed', (member) => {...});
 * ```
 *
 * 本 mock は上記 shape を提供、 real Pusher の `subscribe` メソッドは
 * mock 側で `subscribeChannel` に rename している (base `RealtimeMock` の
 * async `subscribe` と衝突するため)。 presence channel は `presence-`
 * 接頭辞で判定、 通常 channel との内部処理は共通 (engine 側)。
 */

export interface PusherMember {
  id: string;
  info: Record<string, unknown>;
}

export interface PusherMembers {
  count: number;
  each(callback: (member: PusherMember) => void): void;
  get(id: string): PusherMember | null;
  me: PusherMember | null;
}

export interface PusherChannel {
  readonly name: string;
  bind(event: string, handler: (data: unknown, metadata?: unknown) => void): PusherChannel;
  unbind(event?: string): PusherChannel;
  trigger(event: string, data: unknown): boolean;
  members?: PusherMembers;
}

export interface PusherMock extends RealtimeMock {
  readonly provider: 'pusher';
  /** Pusher 固有 — channel 購読 (real `pusher.subscribe` 相当、 sync 返却)。 */
  subscribeChannel(channelName: string): PusherChannel;
  unsubscribeChannel(channelName: string): void;
  /** Pusher 固有 — user auth 識別子。 */
  config: { userId: string };
}

export function createPusherMock(config: RealtimeMockConfig & { userId?: string } = {}): PusherMock {
  const engine = new RealtimeEngine({ provider: 'pusher', ...config });
  const openChannels = new Map<string, PusherChannel>();
  const userId = config.userId ?? `user_${Math.random().toString(36).slice(2, 8)}`;

  const client: PusherMock = {
    provider: 'pusher',
    config: { userId },
    subscribeChannel(channelName: string): PusherChannel {
      const existing = openChannels.get(channelName);
      if (existing) return existing;
      const isPresence = channelName.startsWith('presence-');
      const ch = buildPusherChannel(engine, channelName, isPresence, userId);
      openChannels.set(channelName, ch);
      return ch;
    },
    unsubscribeChannel(channelName: string) {
      openChannels.delete(channelName);
    },
    // RealtimeMock base interface — engine 直参照
    subscribe(channel: string, handler: RealtimeEventHandler): Promise<SubscriptionHandle> {
      return engine.subscribe(channel, handler);
    },
    publish: (channel, event, payload) => engine.publish(channel, event, payload),
    trackPresence: (channel, uid, payload) => engine.trackPresence(channel, uid, payload),
    untrackPresence: (channel, uid) => engine.untrackPresence(channel, uid),
    getConnectionState: () => engine.getConnectionState(),
    disconnect: async () => {
      await engine.disconnect();
      openChannels.clear();
    },
    reconnect: () => engine.reconnect(),
    getMetrics: () => engine.getMetrics(),
    reset: () => {
      engine.reset();
      openChannels.clear();
    },
  };
  return client;
}

interface PusherChannelInternal {
  handlers: Map<string, Array<(data: unknown, metadata?: unknown) => void>>;
  members: Map<string, PusherMember>;
  isPresence: boolean;
  userId: string;
}

function buildPusherChannel(
  engine: RealtimeEngine,
  name: string,
  isPresence: boolean,
  userId: string,
): PusherChannel {
  const state: PusherChannelInternal = {
    handlers: new Map(),
    members: new Map(),
    isPresence,
    userId,
  };
  let subHandle: { unsubscribe(): Promise<void> } | null = null;

  const initSubscription = async (): Promise<void> => {
    if (subHandle) return;
    subHandle = await engine.subscribe(name, (event) => {
      if (event.kind === 'broadcast') {
        dispatchPusherBroadcast(state, event);
      } else if (event.kind === 'presence' && isPresence) {
        dispatchPusherPresence(state, event);
      } else if (event.kind === 'connection') {
        const arr = state.handlers.get('pusher:connection_state_change') ?? [];
        for (const h of arr) h({ current: event.state });
      }
    });
    if (isPresence) {
      const arr = state.handlers.get('pusher:subscription_succeeded') ?? [];
      const membersView: PusherMembers = {
        count: state.members.size,
        each: (cb) => {
          for (const [, m] of state.members) cb(m);
        },
        get: (id) => state.members.get(id) ?? null,
        me: state.members.get(userId) ?? null,
      };
      for (const h of arr) h(membersView);
    } else {
      const arr = state.handlers.get('pusher:subscription_succeeded') ?? [];
      for (const h of arr) h(undefined);
    }
  };

  const base: PusherChannel = {
    name,
    bind(event: string, handler) {
      const arr = state.handlers.get(event) ?? [];
      arr.push(handler);
      state.handlers.set(event, arr);
      void initSubscription();
      return base;
    },
    unbind(event?: string) {
      if (event) {
        state.handlers.delete(event);
      } else {
        state.handlers.clear();
      }
      return base;
    },
    trigger(event: string, data: unknown): boolean {
      void engine.publish(name, event, data);
      return true;
    },
  };

  if (isPresence) {
    Object.defineProperty(base, 'members', {
      get(): PusherMembers {
        return {
          count: state.members.size,
          each: (cb) => {
            for (const [, m] of state.members) cb(m);
          },
          get: (id) => state.members.get(id) ?? null,
          me: state.members.get(userId) ?? null,
        };
      },
      enumerable: true,
    });
  }
  return base;
}

function dispatchPusherBroadcast(
  state: PusherChannelInternal,
  event: { kind: 'broadcast' } & BroadcastEvent,
): void {
  const arr = state.handlers.get(event.event);
  if (!arr || arr.length === 0) return;
  for (const h of arr) h(event.payload, { id: event.id, timestamp: event.timestamp });
}

function dispatchPusherPresence(
  state: PusherChannelInternal,
  event: { kind: 'presence' } & PresenceEvent,
): void {
  const eventNameMap: Record<PresenceEvent['type'], string> = {
    join: 'pusher:member_added',
    leave: 'pusher:member_removed',
    sync: 'pusher:subscription_succeeded',
  };
  const pusherEvent = eventNameMap[event.type];
  for (const member of event.members) {
    const pusherMember: PusherMember = {
      id: member.userId,
      info: member.payload,
    };
    if (event.type === 'join' || event.type === 'sync') {
      state.members.set(member.userId, pusherMember);
    } else if (event.type === 'leave') {
      state.members.delete(member.userId);
    }
    const arr = state.handlers.get(pusherEvent) ?? [];
    for (const h of arr) h(pusherMember);
  }
}
