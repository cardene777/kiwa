---
title: "@kiwa-lab/realtime engine の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>engine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/engine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>RealtimeEngine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/engine.ts#L53) <code v-pre>packages/realtime/src/engine.ts</code>

```ts
export declare class RealtimeEngine {
    readonly config: ResolvedConfig;
    constructor(config?: RealtimeMockConfig);
    getConnectionState(): ConnectionState;
    ensureConnected(): Promise<void>;
    disconnect(): Promise<void>;
    reconnect(): Promise<void>;
    subscribe(channel: string, handler: RealtimeEventHandler): Promise<SubscriptionHandle>;
    publish(channel: string, event: string, payload: unknown): Promise<void>;
    trackPresence(channel: string, userId: string, payload?: Record<string, unknown>): Promise<void>;
    untrackPresence(channel: string, userId: string): Promise<void>;
    /** postgres_changes event を手動で emit (test / scenario 用)。 */
    emitPostgresChange(channel: string, ev: Omit<PostgresChangeEvent, 'timestamp' | 'channel'>): void;
    getMetrics(): ReturnType<RealtimeMock['getMetrics']>;
    reset(): void;
}
```


