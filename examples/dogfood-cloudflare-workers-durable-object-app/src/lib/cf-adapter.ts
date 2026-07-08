/**
 * Provider-neutral Cloudflare Workers Durable Object + WebSocket edge +
 * storage transactional + alarm adapter contract for the
 * dogfood-cloudflare-workers-durable-object-app.
 *
 * The dogfood app talks to Cloudflare Workers only through this interface.
 * Two implementations exist —
 *
 * - {@link makeMockAdapter} — backed by `@kiwa/edge` v0.2 8 axis
 *   semantics helpers (`createDurableObject` / `requestDurableObject` /
 *   `fireAlarm` / `writeStorage` / `requestWebSocketUpgrade` /
 *   `acceptWebSocket` / `sendMessage` / `closeWebSocket`). Always runs.
 * - {@link makeRealAdapter} — targets a real Cloudflare Workers runtime
 *   via `miniflare` (or a `wrangler dev` subprocess). Requires
 *   `KIWA_MODE=real` + `WRANGLER_KEY=1` to opt in; otherwise every method
 *   records `KIWA_CF_DURABLE_OBJECT_ENV_MISSING` and refuses to run.
 *
 * Both satisfy the same 8-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the fidelity harness.
 *
 * The 8 ops correspond to the 8 axis routing pattern inherited from
 * v1.24-1 (`@kiwa/edge` v0.2 semantics): durable-object (4 events) +
 * websocket-edge (4 events) = 8 op surface.
 *
 * Chat room use case — clients JOIN a room (Durable Object created), SEND
 * messages (broadcast via WebSocket to other members), the DO's storage
 * persists the transcript, and an alarm fires 24 h later to PURGE the
 * transcript. Hibernation is exercised by requesting the DO after an
 * alarm-fire simulates eviction — a real Cloudflare runtime would evict
 * an idle DO and rehydrate it via `getWebSockets()`; the mock reproduces
 * this by dropping the in-memory state and rebuilding it from storage.
 */

/** Chat room join snapshot — durable object id + occupant count + storage seed. */
export interface ChatRoomJoinSnapshot {
  readonly roomId: string;
  readonly memberId: string;
  readonly occupantCount: number;
  readonly storageKeys: readonly string[];
}

/** Chat room broadcast snapshot — sent message + receivers acknowledged. */
export interface ChatRoomBroadcastSnapshot {
  readonly roomId: string;
  readonly senderId: string;
  readonly message: string;
  readonly deliveredTo: readonly string[];
}

/** Storage transaction snapshot — key writes + final read + rollback flag. */
export interface StorageTransactionSnapshot {
  readonly writes: Record<string, string>;
  readonly finalRead: Record<string, string | null>;
  readonly rolledBack: boolean;
}

/** WebSocket hibernation snapshot — pre / post idle state + restored membership. */
export interface WebSocketHibernationSnapshot {
  readonly roomId: string;
  readonly memberId: string;
  readonly hibernatedAt: number;
  readonly restoredMembers: readonly string[];
  readonly messagesReplayed: number;
}

/** Alarm purge snapshot — scheduled epoch + fired epoch + keys purged. */
export interface AlarmPurgeSnapshot {
  readonly roomId: string;
  readonly scheduledAt: number;
  readonly firedAt: number;
  readonly keysPurged: readonly string[];
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/** WebSocket upgrade / message / close observations. */
export interface WebSocketUpgradeSnapshot {
  readonly roomId: string;
  readonly memberId: string;
  readonly upgraded: boolean;
  readonly accepted: boolean;
}

export interface WebSocketMessageSnapshot {
  readonly roomId: string;
  readonly memberId: string;
  readonly messages: readonly string[];
}

export interface WebSocketCloseSnapshot {
  readonly roomId: string;
  readonly memberId: string;
  readonly closeCode: number;
}

/**
 * Provider-neutral Cloudflare Workers + Durable Object driver. 8 ops
 * spread across the 2 axis (durable-object 4 + websocket-edge 4):
 *
 * durable-object axis:
 *  1. `driveRoomJoin`         — createDurableObject + requestDurableObject
 *  2. `driveRoomBroadcast`    — requestDurableObject + writeStorage
 *  3. `driveStorageTx`        — writeStorage (transactional put + rollback observe)
 *  4. `driveAlarmPurge`       — fireAlarm (24h retention purge)
 *
 * websocket-edge axis:
 *  5. `driveWsUpgrade`        — requestWebSocketUpgrade + acceptWebSocket
 *  6. `driveWsSend`           — sendMessage
 *  7. `driveWsClose`          — closeWebSocket
 *  8. `driveWsHibernation`    — idle eviction → wake-up restore (DO axis
 *     `requestDurableObject` after an alarm-fire simulates eviction)
 */
export interface CloudflareDurableObjectAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveRoomJoin(input: {
    roomId: string;
    memberId: string;
  }): Promise<ChatRoomJoinSnapshot>;

  driveRoomBroadcast(input: {
    roomId: string;
    senderId: string;
    message: string;
    receivers: readonly string[];
  }): Promise<ChatRoomBroadcastSnapshot>;

  driveStorageTx(input: {
    roomId: string;
    writes: readonly { key: string; value: string }[];
    rollback: boolean;
  }): Promise<StorageTransactionSnapshot>;

  driveAlarmPurge(input: {
    roomId: string;
    scheduledAt: number;
    now: number;
  }): Promise<AlarmPurgeSnapshot>;

  driveWsUpgrade(input: {
    roomId: string;
    memberId: string;
  }): Promise<WebSocketUpgradeSnapshot>;

  driveWsSend(input: {
    roomId: string;
    memberId: string;
    messages: readonly string[];
  }): Promise<WebSocketMessageSnapshot>;

  driveWsClose(input: {
    roomId: string;
    memberId: string;
    code: number;
  }): Promise<WebSocketCloseSnapshot>;

  driveWsHibernation(input: {
    roomId: string;
    memberId: string;
    idleForMs: number;
  }): Promise<WebSocketHibernationSnapshot>;

  metrics(): {
    latencySamplesMs: number[];
    roomJoinCount: number;
    roomBroadcastCount: number;
    storageTxCount: number;
    alarmPurgeCount: number;
    wsUpgradeCount: number;
    wsSendCount: number;
    wsCloseCount: number;
    wsHibernationCount: number;
  };

  reset(): Promise<void>;
}
