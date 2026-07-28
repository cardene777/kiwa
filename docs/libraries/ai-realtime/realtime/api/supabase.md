---
title: "@kiwa-lab/realtime supabase の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>supabase</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSupabaseRealtimeMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L94) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export declare function createSupabaseRealtimeMock(config?: RealtimeMockConfig): SupabaseMock;
```

### 型

#### <code v-pre>SupabaseBroadcastFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L33) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabaseBroadcastFilter {
    event: string;
}
```

#### <code v-pre>SupabaseBroadcastPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L49) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabaseBroadcastPayload<T = unknown> {
    type: 'broadcast';
    event: string;
    payload: T;
}
```

#### <code v-pre>SupabaseChannel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L64) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabaseChannel {
    readonly topic: string;
    on(type: 'presence', filter: SupabasePresenceFilter, handler: (payload: SupabasePresencePayload) => void): SupabaseChannel;
    on(type: 'broadcast', filter: SupabaseBroadcastFilter, handler: (payload: SupabaseBroadcastPayload) => void): SupabaseChannel;
    on(type: 'postgres_changes', filter: SupabasePostgresChangesFilter, handler: (payload: SupabasePostgresChangesPayload) => void): SupabaseChannel;
    subscribe(cb?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED') => void): Promise<SupabaseChannel>;
    unsubscribe(): Promise<'ok' | 'timed out' | 'error'>;
    track(payload: Record<string, unknown> & {
        userId: string;
    }): Promise<'ok' | 'error'>;
    untrack(): Promise<'ok' | 'error'>;
    send(msg: {
        type: 'broadcast';
        event: string;
        payload: unknown;
    }): Promise<'ok' | 'error'>;
}
```

#### <code v-pre>SupabaseListenerType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L27) <code v-pre>packages/realtime/src/supabase.ts</code>

Supabase Realtime mock。 SDK 呼出形式 (real `@supabase/supabase-js`) は以下 ... ```ts const channel = supabase.channel('room:1') .on('presence', { event: 'sync' }, () =&gt; {...}) .on('broadcast', { event: 'chat' }, (payload) =&gt; {...}) .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) =&gt; {...}) .subscribe(); ``` 本 mock は上記に近い interface を提供、 内部で {@link RealtimeEngine} を呼出す。 real Supabase SDK は import せず、 shape のみ互換。

```ts
export type SupabaseListenerType = 'presence' | 'broadcast' | 'postgres_changes' | 'system';
```

#### <code v-pre>SupabaseMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L88) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabaseMock extends RealtimeMock {
    readonly provider: 'supabase';
    channel(topic: string): SupabaseChannel;
    removeAllChannels(): Promise<void>;
}
```

#### <code v-pre>SupabasePostgresChangesFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L37) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabasePostgresChangesFilter {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
}
```

#### <code v-pre>SupabasePostgresChangesPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L55) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabasePostgresChangesPayload<TRow = Record<string, unknown>> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    schema: string;
    table: string;
    old: TRow | null;
    new: TRow | null;
    commit_timestamp: string;
}
```

#### <code v-pre>SupabasePresenceFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L29) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabasePresenceFilter {
    event: 'sync' | 'join' | 'leave';
}
```

#### <code v-pre>SupabasePresencePayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L43) <code v-pre>packages/realtime/src/supabase.ts</code>

```ts
export interface SupabasePresencePayload {
    event: 'sync' | 'join' | 'leave';
    newPresences?: Array<{
        userId: string;
        [k: string]: unknown;
    }>;
    leftPresences?: Array<{
        userId: string;
        [k: string]: unknown;
    }>;
}
```
