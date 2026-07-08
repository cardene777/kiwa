import {
  createSupabaseRealtimeMock,
  type SupabaseChannel,
  type SupabaseMock,
} from '@kiwa/realtime';
import type {
  ChatMessage,
  ChatRoomAdapter,
  PresenceSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa/realtime` Supabase Realtime mock so
 * the same app code exercises {@link SupabaseMock} without touching Supabase.
 *
 * The mock returns deterministic behaviour so fidelity tests can assert on
 * broadcast ordering, presence join / leave transitions and typing debounce
 * semantics. Because the mock never opens a socket, tests can also assert on
 * the exact number of network-visible events the app would generate, which
 * is what the real Supabase implementation charges for.
 */
export function makeMockAdapter(): ChatRoomAdapter {
  const client: SupabaseMock = createSupabaseRealtimeMock({
    artificialLatencyMs: 3,
    provider: 'supabase-mock',
  });
  const trace: TraceEvent[] = [];
  // channel topic -> tracked SupabaseChannel handle (so unsubscribe on reset).
  const openChannels = new Map<string, SupabaseChannel>();
  const membersByChannel = new Map<string, Map<string, number>>();
  let requestCount = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensurePresenceMap(channel: string): Map<string, number> {
    let map = membersByChannel.get(channel);
    if (!map) {
      map = new Map();
      membersByChannel.set(channel, map);
    }
    return map;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async joinRoom(input) {
      const start = Date.now();
      const channel = client.channel(input.channel);
      if (input.onMessage) {
        channel.on('broadcast', { event: 'chat' }, (payload) => {
          const raw = payload.payload as ChatMessage | undefined;
          if (raw) input.onMessage?.(raw);
        });
      }
      if (input.onPresence) {
        channel.on('presence', { event: 'sync' }, () => {
          const snapshot: PresenceSnapshot = {
            channel: input.channel,
            members: Array.from(ensurePresenceMap(input.channel).entries()).map(
              ([userId, joinedAt]) => ({ userId, joinedAt }),
            ),
          };
          input.onPresence?.(snapshot);
        });
        channel.on('presence', { event: 'join' }, (payload) => {
          const news = payload.newPresences ?? [];
          const map = ensurePresenceMap(input.channel);
          for (const m of news) {
            if (!map.has(m.userId as string)) map.set(m.userId as string, Date.now());
          }
        });
        channel.on('presence', { event: 'leave' }, (payload) => {
          const left = payload.leftPresences ?? [];
          const map = ensurePresenceMap(input.channel);
          for (const m of left) map.delete(m.userId as string);
        });
      }
      await channel.subscribe();
      await channel.track({ userId: input.userId, joinedAt: Date.now() });
      ensurePresenceMap(input.channel).set(input.userId, Date.now());
      openChannels.set(input.channel, channel);
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('joinRoom', true, { detail: { channel: input.channel } });
      return { channel: input.channel, subscribed: true, latencyMs };
    },

    async sendMessage(input) {
      const start = Date.now();
      const channel = openChannels.get(input.channel);
      if (!channel) {
        record('sendMessage', false, { errorKind: 'CHANNEL_NOT_JOINED' });
        return { channel: input.channel, event: 'chat', ok: false, latencyMs: 0 };
      }
      const msg: ChatMessage = {
        id: `msg_${Math.random().toString(36).slice(2, 10)}`,
        userId: input.userId,
        text: input.text,
        timestamp: Date.now(),
      };
      const res = await channel.send({ type: 'broadcast', event: 'chat', payload: msg });
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      const ok = res === 'ok';
      record('sendMessage', ok, { detail: { channel: input.channel, textLen: input.text.length } });
      return { channel: input.channel, event: 'chat', ok, latencyMs };
    },

    async getPresence(input) {
      const map = ensurePresenceMap(input.channel);
      record('getPresence', true, { detail: { count: map.size } });
      return {
        channel: input.channel,
        members: Array.from(map.entries()).map(([userId, joinedAt]) => ({
          userId,
          joinedAt,
        })),
      };
    },

    async sendTyping(input) {
      const start = Date.now();
      const channel = openChannels.get(input.channel);
      if (!channel) {
        record('sendTyping', false, { errorKind: 'CHANNEL_NOT_JOINED' });
        return { channel: input.channel, emittedCount: 0, suppressedCount: 0, latencyMs: 0 };
      }
      const debounceWindow = 500;
      let emitted = 0;
      let suppressed = 0;
      let lastEmitAt = -Infinity;
      let cursor = 0;
      for (const gap of input.keystrokeIntervalsMs) {
        cursor += gap;
        if (cursor - lastEmitAt >= debounceWindow) {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: input.userId, at: cursor },
          });
          emitted += 1;
          lastEmitAt = cursor;
        } else {
          suppressed += 1;
        }
      }
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('sendTyping', true, {
        detail: { emitted, suppressed, keystrokes: input.keystrokeIntervalsMs.length },
      });
      return { channel: input.channel, emittedCount: emitted, suppressedCount: suppressed, latencyMs };
    },

    metrics() {
      const m = client.getMetrics();
      return {
        subscribeCount: m.subscribeCount,
        publishCount: m.publishCount,
        eventsDelivered: m.eventsDelivered,
        eventsDropped: m.eventsDropped,
        subscribeLatencySamplesMs: [...m.subscribeLatencyMs],
        publishLatencySamplesMs: [...m.publishLatencyMs],
        requests: requestCount,
      };
    },

    async reset() {
      for (const [, ch] of openChannels) {
        await ch.unsubscribe();
      }
      openChannels.clear();
      membersByChannel.clear();
      client.reset();
      trace.length = 0;
      requestCount = 0;
    },
  };
}
