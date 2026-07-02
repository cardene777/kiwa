import { RealtimeEngine } from './engine.js';
import type {
  BroadcastEvent,
  PostgresChangeEvent,
  PresenceEvent,
  RealtimeMock,
  RealtimeMockConfig,
} from './types.js';

/**
 * Supabase Realtime mock。
 *
 * SDK 呼出形式 (real `@supabase/supabase-js`) は以下 ...
 *
 * ```ts
 * const channel = supabase.channel('room:1')
 *   .on('presence', { event: 'sync' }, () => {...})
 *   .on('broadcast', { event: 'chat' }, (payload) => {...})
 *   .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {...})
 *   .subscribe();
 * ```
 *
 * 本 mock は上記に近い interface を提供、 内部で {@link RealtimeEngine}
 * を呼出す。 real Supabase SDK は import せず、 shape のみ互換。
 */

export type SupabaseListenerType = 'presence' | 'broadcast' | 'postgres_changes' | 'system';

export interface SupabasePresenceFilter {
  event: 'sync' | 'join' | 'leave';
}

export interface SupabaseBroadcastFilter {
  event: string;
}

export interface SupabasePostgresChangesFilter {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table?: string;
}

export interface SupabasePresencePayload {
  event: 'sync' | 'join' | 'leave';
  newPresences?: Array<{ userId: string; [k: string]: unknown }>;
  leftPresences?: Array<{ userId: string; [k: string]: unknown }>;
}

export interface SupabaseBroadcastPayload<T = unknown> {
  type: 'broadcast';
  event: string;
  payload: T;
}

export interface SupabasePostgresChangesPayload<TRow = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  old: TRow | null;
  new: TRow | null;
  commit_timestamp: string;
}

export interface SupabaseChannel {
  readonly topic: string;
  on(
    type: 'presence',
    filter: SupabasePresenceFilter,
    handler: (payload: SupabasePresencePayload) => void,
  ): SupabaseChannel;
  on(
    type: 'broadcast',
    filter: SupabaseBroadcastFilter,
    handler: (payload: SupabaseBroadcastPayload) => void,
  ): SupabaseChannel;
  on(
    type: 'postgres_changes',
    filter: SupabasePostgresChangesFilter,
    handler: (payload: SupabasePostgresChangesPayload) => void,
  ): SupabaseChannel;
  subscribe(cb?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED') => void): Promise<SupabaseChannel>;
  unsubscribe(): Promise<'ok' | 'timed out' | 'error'>;
  track(payload: Record<string, unknown> & { userId: string }): Promise<'ok' | 'error'>;
  untrack(): Promise<'ok' | 'error'>;
  send(msg: { type: 'broadcast'; event: string; payload: unknown }): Promise<'ok' | 'error'>;
}

export interface SupabaseMock extends RealtimeMock {
  readonly provider: 'supabase';
  channel(topic: string): SupabaseChannel;
  removeAllChannels(): Promise<void>;
}

export function createSupabaseRealtimeMock(config: RealtimeMockConfig = {}): SupabaseMock {
  const engine = new RealtimeEngine({ provider: 'supabase', ...config });
  const openChannels = new Map<string, SupabaseChannel>();

  const client: SupabaseMock = {
    provider: 'supabase',
    channel(topic: string) {
      const existing = openChannels.get(topic);
      if (existing) return existing;
      const ch = buildSupabaseChannel(engine, topic);
      openChannels.set(topic, ch);
      return ch;
    },
    async removeAllChannels() {
      for (const [, ch] of openChannels) {
        await ch.unsubscribe();
      }
      openChannels.clear();
    },
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
    },
  };
  return client;
}

interface SupabaseHandlers {
  presence: Map<'sync' | 'join' | 'leave', Array<(p: SupabasePresencePayload) => void>>;
  broadcast: Map<string, Array<(p: SupabaseBroadcastPayload) => void>>;
  postgresChanges: Array<{
    filter: SupabasePostgresChangesFilter;
    handler: (p: SupabasePostgresChangesPayload) => void;
  }>;
}

function buildSupabaseChannel(engine: RealtimeEngine, topic: string): SupabaseChannel {
  const handlers: SupabaseHandlers = {
    presence: new Map(),
    broadcast: new Map(),
    postgresChanges: [],
  };
  let subHandle: { unsubscribe(): Promise<void> } | null = null;
  let trackedUserId: string | null = null;

  const channel: SupabaseChannel = {
    topic,
    on(type: SupabaseListenerType, filter: unknown, handler: unknown): SupabaseChannel {
      if (type === 'presence') {
        const f = filter as SupabasePresenceFilter;
        const arr = handlers.presence.get(f.event) ?? [];
        arr.push(handler as (p: SupabasePresencePayload) => void);
        handlers.presence.set(f.event, arr);
      } else if (type === 'broadcast') {
        const f = filter as SupabaseBroadcastFilter;
        const arr = handlers.broadcast.get(f.event) ?? [];
        arr.push(handler as (p: SupabaseBroadcastPayload) => void);
        handlers.broadcast.set(f.event, arr);
      } else if (type === 'postgres_changes') {
        handlers.postgresChanges.push({
          filter: filter as SupabasePostgresChangesFilter,
          handler: handler as (p: SupabasePostgresChangesPayload) => void,
        });
      }
      return channel;
    },
    async subscribe(cb) {
      subHandle = await engine.subscribe(topic, (event) => {
        if (event.kind === 'presence') {
          dispatchPresence(handlers, event);
        } else if (event.kind === 'broadcast') {
          dispatchBroadcast(handlers, event);
        } else if (event.kind === 'postgres_changes') {
          dispatchPostgresChange(handlers, event);
        }
      });
      if (cb) cb('SUBSCRIBED');
      return channel;
    },
    async unsubscribe() {
      if (subHandle) {
        await subHandle.unsubscribe();
        subHandle = null;
      }
      if (trackedUserId !== null) {
        await engine.untrackPresence(topic, trackedUserId);
        trackedUserId = null;
      }
      return 'ok';
    },
    async track(payload) {
      const { userId, ...rest } = payload;
      trackedUserId = userId;
      await engine.trackPresence(topic, userId, rest);
      return 'ok';
    },
    async untrack() {
      if (trackedUserId === null) return 'ok';
      const uid = trackedUserId;
      trackedUserId = null;
      await engine.untrackPresence(topic, uid);
      return 'ok';
    },
    async send(msg) {
      await engine.publish(topic, msg.event, msg.payload);
      return 'ok';
    },
  };
  return channel;
}

function dispatchPresence(handlers: SupabaseHandlers, event: { kind: 'presence' } & PresenceEvent): void {
  const arr = handlers.presence.get(event.type);
  if (!arr || arr.length === 0) return;
  const payload: SupabasePresencePayload = {
    event: event.type,
    ...(event.type === 'join'
      ? { newPresences: event.members.map((m) => ({ userId: m.userId, ...m.payload })) }
      : {}),
    ...(event.type === 'leave'
      ? { leftPresences: event.members.map((m) => ({ userId: m.userId, ...m.payload })) }
      : {}),
  };
  for (const h of arr) h(payload);
}

function dispatchBroadcast(handlers: SupabaseHandlers, event: { kind: 'broadcast' } & BroadcastEvent): void {
  const arr = handlers.broadcast.get(event.event);
  if (!arr || arr.length === 0) return;
  const payload: SupabaseBroadcastPayload = {
    type: 'broadcast',
    event: event.event,
    payload: event.payload,
  };
  for (const h of arr) h(payload);
}

function dispatchPostgresChange(
  handlers: SupabaseHandlers,
  event: { kind: 'postgres_changes' } & PostgresChangeEvent,
): void {
  for (const { filter, handler } of handlers.postgresChanges) {
    if (filter.event !== '*' && filter.event !== event.eventType) continue;
    if (filter.schema && filter.schema !== event.schema) continue;
    if (filter.table && filter.table !== event.table) continue;
    handler({
      eventType: event.eventType,
      schema: event.schema,
      table: event.table,
      old: event.oldRecord,
      new: event.newRecord,
      commit_timestamp: new Date(event.timestamp).toISOString(),
    });
  }
}
