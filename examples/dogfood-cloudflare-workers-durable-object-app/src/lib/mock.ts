/**
 * Mock adapter — drives the chat-room Durable Object registry + WebSocket
 * registry directly using `@kiwa-test/edge` v0.2 8 axis semantics helpers.
 * Always runs; no environment gate.
 *
 * Emits axis events on both durable-object (created / requested /
 * alarm-fired / storage-written) and websocket-edge (upgrade-requested /
 * accepted / message / closed) so the fidelity harness measures both axes
 * on the mock side. When paired with a real adapter (miniflare-backed),
 * every emit has a counterpart the harness can diff.
 *
 * Every op appends 1 latency sample + 1 trace event so the fidelity
 * report never reads as 0-sample.
 */

import { ChatRoomRegistry } from '../workers/chat-room.js';
import { WebSocketRegistry, buildBroadcastFrame } from '../workers/index.js';
import { runPurgeAlarm } from '../alarm/purge.js';
import type {
  AlarmPurgeSnapshot,
  ChatRoomBroadcastSnapshot,
  ChatRoomJoinSnapshot,
  CloudflareDurableObjectAdapter,
  StorageTransactionSnapshot,
  TraceEvent,
  WebSocketCloseSnapshot,
  WebSocketHibernationSnapshot,
  WebSocketMessageSnapshot,
  WebSocketUpgradeSnapshot,
} from './cf-adapter.js';

export function makeMockAdapter(): CloudflareDurableObjectAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    roomJoinCount: 0,
    roomBroadcastCount: 0,
    storageTxCount: 0,
    alarmPurgeCount: 0,
    wsUpgradeCount: 0,
    wsSendCount: 0,
    wsCloseCount: 0,
    wsHibernationCount: 0,
  };

  // Registries are lazily rebuilt after `reset()` so each test gets a
  // fresh state without leaking DO instances across cases.
  let state: {
    registry: ChatRoomRegistry;
    wsRegistry: WebSocketRegistry;
  } | null = null;

  function ensure(): { registry: ChatRoomRegistry; wsRegistry: WebSocketRegistry } {
    if (state) return state;
    state = {
      registry: new ChatRoomRegistry(),
      wsRegistry: new WebSocketRegistry(),
    };
    return state;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'CF_DO_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveRoomJoin(input): Promise<ChatRoomJoinSnapshot> {
      return timed('driveRoomJoin', () => {
        metricsAgg.roomJoinCount += 1;
        const { registry } = ensure();
        const room = registry.ensureRoom(input.roomId);
        // Model the join as a DO fetch — emits `durable-object.requested`
        // on the axis session so hooks that read neutral events see the
        // join hit the DO, not just a bare `created` on the first call.
        registry.route(room, `/room/${input.roomId}/join`);
        const occupantCount = registry.addMember(room, input.memberId);
        const snapshot: ChatRoomJoinSnapshot = {
          roomId: input.roomId,
          memberId: input.memberId,
          occupantCount,
          storageKeys: Array.from(room.session.storageKeys.keys()),
        };
        record('driveRoomJoin', true, {
          detail: {
            roomId: input.roomId,
            memberId: input.memberId,
            occupantCount,
          },
        });
        return snapshot;
      });
    },

    async driveRoomBroadcast(input): Promise<ChatRoomBroadcastSnapshot> {
      return timed('driveRoomBroadcast', () => {
        metricsAgg.roomBroadcastCount += 1;
        const { registry, wsRegistry } = ensure();
        const room = registry.ensureRoom(input.roomId);
        // Model the broadcast as a DO fetch — the sender's frame goes to
        // the DO which then persists + fans out. Emits
        // `durable-object.requested` before `storage-written`.
        registry.route(room, `/room/${input.roomId}/send`);
        const message = { senderId: input.senderId, body: input.message, at: Date.now() };
        registry.appendMessage(room, message);
        const deliveredTo: string[] = [];
        for (const receiver of input.receivers) {
          const session = wsRegistry.get(input.roomId, receiver);
          if (session?.state === 'open') {
            wsRegistry.send(
              input.roomId,
              receiver,
              buildBroadcastFrame({
                senderId: input.senderId,
                message,
                receiverId: input.roomId,
              }),
            );
            deliveredTo.push(receiver);
          }
        }
        const snapshot: ChatRoomBroadcastSnapshot = {
          roomId: input.roomId,
          senderId: input.senderId,
          message: input.message,
          deliveredTo,
        };
        record('driveRoomBroadcast', true, {
          detail: {
            roomId: input.roomId,
            senderId: input.senderId,
            deliveredCount: deliveredTo.length,
          },
        });
        return snapshot;
      });
    },

    async driveStorageTx(input): Promise<StorageTransactionSnapshot> {
      return timed('driveStorageTx', () => {
        metricsAgg.storageTxCount += 1;
        const { registry } = ensure();
        const room = registry.ensureRoom(input.roomId);
        // Snapshot the storage before the transaction — used to roll back
        // when input.rollback === true.
        const preTx = new Map(room.session.storageKeys);
        const writes: Record<string, string> = {};
        for (const w of input.writes) {
          registry.persist(room, w.key, w.value);
          writes[w.key] = w.value;
        }
        let rolledBack = false;
        if (input.rollback) {
          // Roll back — restore the pre-transaction storage snapshot. Real
          // Cloudflare DOs expose `storage.transaction()` which auto-rolls
          // back on throw; the mock does the same by restoring the map.
          room.session.storageKeys.clear();
          for (const [k, v] of preTx) {
            room.session.storageKeys.set(k, v);
          }
          rolledBack = true;
        }
        const finalRead: Record<string, string | null> = {};
        for (const w of input.writes) {
          finalRead[w.key] = room.session.storageKeys.get(w.key) ?? null;
        }
        const snapshot: StorageTransactionSnapshot = {
          writes,
          finalRead,
          rolledBack,
        };
        record('driveStorageTx', true, {
          detail: {
            roomId: input.roomId,
            writeCount: input.writes.length,
            rolledBack,
          },
        });
        return snapshot;
      });
    },

    async driveAlarmPurge(input): Promise<AlarmPurgeSnapshot> {
      return timed('driveAlarmPurge', () => {
        metricsAgg.alarmPurgeCount += 1;
        const { registry } = ensure();
        const room = registry.ensureRoom(input.roomId);
        // Ensure there is a transcript so the alarm has something to purge —
        // callers that pre-populate transcript can skip this.
        registry.scheduleAlarm(room, input.scheduledAt);
        const keysBefore = Array.from(room.session.storageKeys.keys());
        const outcome = runPurgeAlarm({ registry, state: room, now: input.now });
        const keysAfter = Array.from(room.session.storageKeys.keys());
        const keysPurged = keysBefore.filter((k) => !keysAfter.includes(k));
        const snapshot: AlarmPurgeSnapshot = {
          roomId: input.roomId,
          scheduledAt: input.scheduledAt,
          firedAt: outcome.fired ? input.now : 0,
          keysPurged,
        };
        // Record as ok=true regardless of `fired` — a not-yet-due alarm is
        // a valid outcome, not an adapter failure. The `fired` flag is
        // surfaced via detail so trace-based accounting stays honest.
        record('driveAlarmPurge', true, {
          detail: {
            roomId: input.roomId,
            fired: outcome.fired,
            purgedCount: outcome.purgedCount,
            nextAlarmAt: outcome.nextAlarmAt,
          },
        });
        return snapshot;
      });
    },

    async driveWsUpgrade(input): Promise<WebSocketUpgradeSnapshot> {
      return timed('driveWsUpgrade', () => {
        metricsAgg.wsUpgradeCount += 1;
        const { wsRegistry } = ensure();
        wsRegistry.requestUpgrade(input.roomId, input.memberId);
        wsRegistry.accept(input.roomId, input.memberId);
        const snapshot: WebSocketUpgradeSnapshot = {
          roomId: input.roomId,
          memberId: input.memberId,
          upgraded: true,
          accepted: true,
        };
        record('driveWsUpgrade', true, {
          detail: { roomId: input.roomId, memberId: input.memberId },
        });
        return snapshot;
      });
    },

    async driveWsSend(input): Promise<WebSocketMessageSnapshot> {
      return timed('driveWsSend', () => {
        metricsAgg.wsSendCount += 1;
        const { wsRegistry } = ensure();
        for (const m of input.messages) {
          wsRegistry.send(input.roomId, input.memberId, m);
        }
        const snapshot: WebSocketMessageSnapshot = {
          roomId: input.roomId,
          memberId: input.memberId,
          messages: [...input.messages],
        };
        record('driveWsSend', true, {
          detail: {
            roomId: input.roomId,
            memberId: input.memberId,
            messageCount: input.messages.length,
          },
        });
        return snapshot;
      });
    },

    async driveWsClose(input): Promise<WebSocketCloseSnapshot> {
      return timed('driveWsClose', () => {
        metricsAgg.wsCloseCount += 1;
        const { wsRegistry } = ensure();
        wsRegistry.close(input.roomId, input.memberId, input.code);
        const snapshot: WebSocketCloseSnapshot = {
          roomId: input.roomId,
          memberId: input.memberId,
          closeCode: input.code,
        };
        record('driveWsClose', true, {
          detail: {
            roomId: input.roomId,
            memberId: input.memberId,
            code: input.code,
          },
        });
        return snapshot;
      });
    },

    async driveWsHibernation(input): Promise<WebSocketHibernationSnapshot> {
      return timed('driveWsHibernation', () => {
        metricsAgg.wsHibernationCount += 1;
        const { registry, wsRegistry } = ensure();
        const room = registry.ensureRoom(input.roomId);
        // Snapshot current members + messages, then hibernate (drops the
        // in-memory members set + emits a wake-up `requested` step).
        const restoredMembers = Array.from(room.members);
        const messagesReplayed = room.transcript.length;
        // Close every live WS session in the room — real Cloudflare
        // hibernation evicts the entire DO instance, dropping all
        // WebSocket handles with abnormal 1006 close. Snapshot the live
        // members before hibernate() clears the set, then close each.
        const liveWs = wsRegistry.liveMembers(input.roomId);
        const { storageKeys } = registry.hibernate(room);
        for (const wsMember of liveWs) {
          wsRegistry.close(input.roomId, wsMember, 1006);
        }
        // Re-add the caller's member — a real hibernation wake-up rehydrates
        // WebSocket connections via `getWebSockets()` and re-attaches them
        // to the DO. The mock reproduces this by re-adding the requested
        // member so the caller can prove the session survived eviction.
        registry.addMember(room, input.memberId);
        const snapshot: WebSocketHibernationSnapshot = {
          roomId: input.roomId,
          memberId: input.memberId,
          hibernatedAt: input.idleForMs,
          restoredMembers,
          messagesReplayed,
        };
        record('driveWsHibernation', true, {
          detail: {
            roomId: input.roomId,
            memberId: input.memberId,
            keysSurvived: storageKeys.length,
            messagesReplayed,
            wsClosedCount: liveWs.length,
          },
        });
        return snapshot;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        roomJoinCount: metricsAgg.roomJoinCount,
        roomBroadcastCount: metricsAgg.roomBroadcastCount,
        storageTxCount: metricsAgg.storageTxCount,
        alarmPurgeCount: metricsAgg.alarmPurgeCount,
        wsUpgradeCount: metricsAgg.wsUpgradeCount,
        wsSendCount: metricsAgg.wsSendCount,
        wsCloseCount: metricsAgg.wsCloseCount,
        wsHibernationCount: metricsAgg.wsHibernationCount,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.roomJoinCount = 0;
      metricsAgg.roomBroadcastCount = 0;
      metricsAgg.storageTxCount = 0;
      metricsAgg.alarmPurgeCount = 0;
      metricsAgg.wsUpgradeCount = 0;
      metricsAgg.wsSendCount = 0;
      metricsAgg.wsCloseCount = 0;
      metricsAgg.wsHibernationCount = 0;
      if (state) {
        state.registry.clear();
        state.wsRegistry.clear();
      }
      state = null;
    },
  };
}
