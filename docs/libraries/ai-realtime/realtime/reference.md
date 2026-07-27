# Realtime リファレンス

このページでは、どの mock を作るか、設定がどの状態に影響するか、fidelity report をどこまで信頼できるかを確認します。実装を始めるときは [はじめる](./quickstart)、provider の event contract を test にする場合は [使い方](./how-to) を先に読んでください。以下の API は実 provider の client を置き換える test adapter であり、network client ではありません。

## プロバイダーモック

| API | 説明 |
| --- | --- |
| `createSupabaseRealtimeMock(config)` | channel、presence、broadcast、postgres changes を再現します |
| `createAblyMock(config)` | channel、presence、publish、history を再現します |
| `createPusherMock(config)` | channel と presence channel のイベントを再現します |
| `createSocketioMock(config)` | namespace、socket、room のイベントを再現します |
| `RealtimeEngine` | 各モックが共有するイベント配信 engine です |

`RealtimeMockConfig` には `scenarios`、`artificialLatencyMs`、再接続 policy、backpressure の上限を指定できます。scenario は topic ごとの event 列です。最初の subscriber が登録された時点で schedule されるため、scenario を使う test は handler の登録と subscribe を完了してから timer を進めます。

`getMetrics()` は subscribe、publish、deliver、drop、reconnect の回数と latency sample の copy を返します。latency は mock 内で設定した timer の待機時間であり、provider の実測 latency や利用者のネットワーク品質を表しません。backpressure の設定を変える test では、drop 数と画面が選ぶ再取得または警告の分岐を確認します。

presence は engine 内の channel state に保持され、track 時に join と sync、untrack 時に leave を配信します。adapter ごとの SDK API は簡略化されています。たとえば Ably の presence `get` は実 member 一覧を返しません。実 presence の同時更新や provider ごとの整合性は staging で確認してください。

## fidelity と品質レポート

| API | 説明 |
| --- | --- |
| `runRealtimeFidelityCheck(input)` | real driver と mock driver のイベント列を比較します |
| `createMockCollector(mock, expectedEvents)` | mock のイベントを収集する driver を作ります |
| `buildRealtimeReport(input)` | fidelity 結果を品質レポートへ変換します |
| `resolveRealtimeDriverByProvider(provider, real, mock)` | 環境変数に応じて real または mock driver を選びます |
| `REAL_DRIVER_REQUIRED_KEYS` | provider ごとに必要な環境変数です |

fidelity check は、同じ scenario に対する real driver と mock driver の event 列を比較します。結果が高いことは、比較した入力で event sequence が近いことを示すだけです。実 credential、region、network outage、rate limit を通ることは示しません。`resolveRealtimeDriverByProvider` が real driver を選ぶ条件と必要な環境変数を CI で明示し、credential がない環境では mock として test することを選択してください。

## 高度な通信モデル

WebRTC、WebTransport、HTTP 3、QUIC、Media over QUIC、WebCodecs、音声 streaming の semantic mock も export しています。これらは四つの provider adapter とは別に、定義した event と state を test するためのものです。`SEMANTICS_GRID` と `measureSemanticsGrid` は axis ごとの fidelity を集計し、`startSession`、`dispatchEvent`、`summarizeSession` は session state を扱います。protocol 実装、media の encode や decode、実際の帯域や音声品質を再現する API ではありません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| '0-RTT is not enabled for this connection' | [packages/realtime/src/semantics/quic-multiplex.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L154) |
| `data channel not open (state=${state})` | [packages/realtime/src/semantics/webrtc-data-channel.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L122) |
| `bi stream not open (state=${state})` | [packages/realtime/src/semantics/webtransport-bi.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L102) |
| `uni stream not open (state=${state})` | [packages/realtime/src/semantics/webtransport-uni.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L95) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `buildRealtimeReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts#L62) `packages/realtime/src/report.ts`

実測 fidelity + coverage + test count + mutation + perf を `QualityReport` に統合する。 Realtime 4 軸は fidelity + mockMetrics から 自動集計。

```ts
export declare function buildRealtimeReport(input: BuildRealtimeReportInput): QualityReport;
```

#### `createAblyMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L81) `packages/realtime/src/ably.ts`

```ts
export declare function createAblyMock(config?: RealtimeMockConfig & {
    clientId?: string;
}): AblyMock;
```

#### `createHttp3PushMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L54) `packages/realtime/src/semantics/http3-push.ts`

```ts
export declare function createHttp3PushMock(config?: SemanticsMockConfig): Http3PushMock;
```

#### `createMockCollector`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L150) `packages/realtime/src/fidelity.ts`

便利 helper — RealtimeMock を CollectedEvent stream に変換する minimum driver。 scenario 実装は user 側だが、 event collector は本 helper 経由で共通化できる。

```ts
export declare function createMockCollector(mock: RealtimeMock, expectedEvents: number): {
    driver: RealtimeDriver;
    collected: CollectedEvent[];
};
```

#### `createMoqDatagramMediaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L32) `packages/realtime/src/semantics/moq-datagram-media.ts`

```ts
export declare function createMoqDatagramMediaMock(config?: SemanticsMockConfig): MoqDatagramMediaMock;
```

#### `createMoqFetchMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L39) `packages/realtime/src/semantics/moq-fetch.ts`

```ts
export declare function createMoqFetchMock(config?: SemanticsMockConfig): MoqFetchMock;
```

#### `createPusherMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L61) `packages/realtime/src/pusher.ts`

```ts
export declare function createPusherMock(config?: RealtimeMockConfig & {
    userId?: string;
}): PusherMock;
```

#### `createQuicMultiplexMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L61) `packages/realtime/src/semantics/quic-multiplex.ts`

```ts
export declare function createQuicMultiplexMock(config?: SemanticsMockConfig & {
    enable0RTT?: boolean;
}): QuicMultiplexMock;
```

#### `createRealtimeAiInferenceMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L37) `packages/realtime/src/semantics/realtime-ai-inference.ts`

```ts
export declare function createRealtimeAiInferenceMock(config?: SemanticsMockConfig): RealtimeAiInferenceMock;
```

#### `createSimulcastSvcMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L32) `packages/realtime/src/semantics/simulcast-svc.ts`

```ts
export declare function createSimulcastSvcMock(config?: SemanticsMockConfig): SimulcastSvcMock;
```

#### `createSocketioMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L54) `packages/realtime/src/socketio.ts`

```ts
export declare function createSocketioMock(config?: RealtimeMockConfig): SocketIoMock;
```

#### `createSupabaseRealtimeMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L94) `packages/realtime/src/supabase.ts`

```ts
export declare function createSupabaseRealtimeMock(config?: RealtimeMockConfig): SupabaseMock;
```

#### `createVoiceStreamingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L37) `packages/realtime/src/semantics/voice-streaming.ts`

```ts
export declare function createVoiceStreamingMock(config?: SemanticsMockConfig): VoiceStreamingMock;
```

#### `createWebCodecsDecoderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L29) `packages/realtime/src/semantics/webcodecs-decoder.ts`

```ts
export declare function createWebCodecsDecoderMock(config?: SemanticsMockConfig): WebCodecsDecoderMock;
```

#### `createWebCodecsEncoderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L39) `packages/realtime/src/semantics/webcodecs-encoder.ts`

```ts
export declare function createWebCodecsEncoderMock(config?: SemanticsMockConfig): WebCodecsEncoderMock;
```

#### `createWebRtcDataChannelMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L57) `packages/realtime/src/semantics/webrtc-data-channel.ts`

```ts
export declare function createWebRtcDataChannelMock(config?: SemanticsMockConfig): WebRtcDataChannelMock;
```

#### `createWebRtcIceMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L57) `packages/realtime/src/semantics/webrtc-ice.ts`

```ts
export declare function createWebRtcIceMock(config?: SemanticsMockConfig): WebRtcIceMock;
```

#### `createWebRtcSignalingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L65) `packages/realtime/src/semantics/webrtc-signaling.ts`

```ts
export declare function createWebRtcSignalingMock(config?: SemanticsMockConfig): WebRtcSignalingMock;
```

#### `createWebRtcTrackMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L69) `packages/realtime/src/semantics/webrtc-track.ts`

```ts
export declare function createWebRtcTrackMock(config?: SemanticsMockConfig): WebRtcTrackMock;
```

#### `createWebTransportBiMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L49) `packages/realtime/src/semantics/webtransport-bi.ts`

```ts
export declare function createWebTransportBiMock(config?: SemanticsMockConfig): WebTransportBiMock;
```

#### `createWebTransportUniMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L49) `packages/realtime/src/semantics/webtransport-uni.ts`

```ts
export declare function createWebTransportUniMock(config?: SemanticsMockConfig): WebTransportUniMock;
```

#### `createWhisperStreamingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L32) `packages/realtime/src/semantics/whisper-streaming.ts`

```ts
export declare function createWhisperStreamingMock(config?: SemanticsMockConfig): WhisperStreamingMock;
```

#### `dispatchEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L62) `packages/realtime/src/semantics/session-orchestrator.ts`

event driven state 遷移 SSOT。 5 state × 8 event = 40 セル。 payment 同様 soft-reject + invalid log (realtime 経路 も webhook 相当 の event 重複配信 が normal、 throw だと consumer が例外処理コード膨張)。

```ts
export declare function dispatchEvent(input: {
    session: RealtimeSession;
    event: RealtimeEvent;
    timestamp: string;
}): RealtimeSession;
```

#### `initialSemanticsMetrics`

公開 entry point から解決しています。

`initialMetrics` を `initialSemanticsMetrics` として公開しています。

helper — default metrics。

```ts
export {
  createHttp3PushMock,
  createQuicMultiplexMock,
  createWebRtcDataChannelMock,
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  createWebTransportBiMock,
  createWebTransportUniMock,
  initialMetrics as initialSemanticsMetrics,
  type BiStreamHandle,
  type BiStreamOptions,
  type DataChannelHandle,
  type DataChannelOptions,
  type HpackEntry,
  type Http3PushMock,
  type IceCandidate,
  type IceConnectionState,
  type IceGatheringState,
  type IceStats,
  type MediaTrack,
  type PushPriority,
  type PushPromise,
  type QuicMultiplexMock,
  type QuicStreamHandle,
  type QuicStreamOptions,
  type SemanticsAxis,
  type SemanticsEvent,
  type SemanticsEventKind,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
  type SemanticsProtocol,
  type SignalingSdp,
  type SimulcastLayer,
  type TrackKind,
  type UniStreamHandle,
  type WebRtcDataChannelMock,
  type WebRtcIceMock,
  type WebRtcMediaStream,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
  type WebTransportBiMock,
  type WebTransportUniMock,
} from './semantics/index.js';
```

#### `measureSemanticsAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L83) `packages/realtime/src/semantics-fidelity.ts`

単一 axis の fidelity 計測。 mock を初期化 → scenario を実行 → event 列を 収集 → metrics + events を返す。

```ts
export declare function measureSemanticsAxis(input: SemanticsFidelityInput): Promise<SemanticsFidelityRow>;
```

#### `measureSemanticsGrid`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L123) `packages/realtime/src/semantics-fidelity.ts`

```ts
export declare function measureSemanticsGrid(input: SemanticsGridScenarios): Promise<SemanticsFidelityRow[]>;
```

#### `REAL_DRIVER_REQUIRED_KEYS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L54) `packages/realtime/src/real-driver.ts`

provider 別 default 必須 env key (SSOT)。

```ts
export declare const REAL_DRIVER_REQUIRED_KEYS: Record<RealtimeProviderName, string[]>;
```

#### `RealtimeEngine`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/engine.ts#L53) `packages/realtime/src/engine.ts`

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

#### `resolveRealtimeDriver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L61) `packages/realtime/src/real-driver.ts`

```ts
export declare function resolveRealtimeDriver<TDriver>(input: RealDriverGateInput<TDriver>): RealDriverGateResult<TDriver>;
```

#### `resolveRealtimeDriverByProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L105) `packages/realtime/src/real-driver.ts`

shorthand — provider 名から必須 key を lookup して gate 判定する。 使い分けは自由だが、 4 provider の default key set (SSOT `REAL_DRIVER_REQUIRED_KEYS`) を尊重する場合はこちらを使う。

```ts
export declare function resolveRealtimeDriverByProvider<TDriver>(provider: RealtimeProviderName, createReal: (env: Record<string, string>) => TDriver, createMock: () => TDriver, envSource?: Record<string, string | undefined>): RealDriverGateResult<TDriver>;
```

#### `runRealtimeFidelityCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L74) `packages/realtime/src/fidelity.ts`

```ts
export declare function runRealtimeFidelityCheck(input: RealtimeFidelityInput): Promise<RealtimeFidelityReport>;
```

#### `SEMANTICS_GRID`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L28) `packages/realtime/src/semantics-fidelity.ts`

3 protocol × 8 axis = 24 row grid の SSOT 定義。

```ts
export declare const SEMANTICS_GRID: SemanticsGridRow[];
```

#### `sequenceSimilarity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L126) `packages/realtime/src/fidelity.ts`

順序考慮 sequence similarity — LCS 系ではなく position-aware Jaccard で 計算する。 完全一致 = 1、 順序ずれ = 中間値、 完全不一致 = 0。

```ts
export declare function sequenceSimilarity<T>(a: T[], b: T[]): number;
```

#### `startSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L45) `packages/realtime/src/semantics/session-orchestrator.ts`

```ts
export declare function startSession(input: {
    timestamp: string;
}): RealtimeSession;
```

#### `summarizeSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L168) `packages/realtime/src/semantics/session-orchestrator.ts`

```ts
export declare function summarizeSession(session: RealtimeSession): RealtimeSessionSummary;
```

### 型

#### `AblyChannel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L42) `packages/realtime/src/ably.ts`

```ts
export interface AblyChannel {
    readonly name: string;
    attach(): Promise<void>;
    detach(): Promise<void>;
    subscribe(event: string, handler: (msg: AblyMessage) => void): Promise<void>;
    subscribe(handler: (msg: AblyMessage) => void): Promise<void>;
    unsubscribe(): void;
    publish(event: string, data: unknown): Promise<void>;
    history(options?: {
        limit?: number;
    }): Promise<{
        items: AblyMessage[];
    }>;
    presence: AblyPresence;
}
```

#### `AblyChannels`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L64) `packages/realtime/src/ably.ts`

```ts
export interface AblyChannels {
    get(name: string): AblyChannel;
    release(name: string): void;
}
```

#### `AblyMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L27) `packages/realtime/src/ably.ts`

Ably mock。 SDK 呼出形式 (real `ably`) は以下 ... ```ts const client = new Ably.Realtime(...); const channel = client.channels.get('room-1'); channel.subscribe('chat', (msg) =&gt; {...}); await channel.presence.subscribe('enter', (msg) =&gt; {...}); await channel.presence.enter({ name: 'user' }); const messages = await channel.history({ untilAttach: true }); ``` 本 mock は上記 shape の薄い wrapper。 history rewind (`untilAttach`) は 直近 broadcast event を N 件保持して返却する簡易実装。

```ts
export interface AblyMessage<T = unknown> {
    name: string;
    data: T;
    id: string;
    timestamp: number;
    clientId?: string;
}
```

#### `AblyMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L69) `packages/realtime/src/ably.ts`

```ts
export interface AblyMock extends RealtimeMock {
    readonly provider: 'ably';
    channels: AblyChannels;
    connection: {
        state: string;
        on(state: string, handler: () => void): void;
        close(): Promise<void>;
    };
    /** clientId (Ably 固有、 presence の identify 用)。 */
    auth: {
        clientId: string;
    };
}
```

#### `AblyPresence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L54) `packages/realtime/src/ably.ts`

```ts
export interface AblyPresence {
    subscribe(action: 'enter' | 'leave' | 'update', handler: (msg: AblyPresenceMessage) => void): Promise<void>;
    enter(data?: Record<string, unknown>): Promise<void>;
    leave(): Promise<void>;
    get(): Promise<AblyPresenceMessage[]>;
}
```

#### `AblyPresenceMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L35) `packages/realtime/src/ably.ts`

```ts
export interface AblyPresenceMessage {
    action: 'enter' | 'leave' | 'update' | 'present';
    clientId: string;
    data: Record<string, unknown>;
    timestamp: number;
}
```

#### `AiInferenceRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L15) `packages/realtime/src/semantics/realtime-ai-inference.ts`

Realtime AI inference axis — per-frame prediction + latency budget enforcement + drop on budget exceed。 real-time AR / VR / robot control 用の budget-aware inference pipeline pattern (target &lt; 33ms for 30fps)。

```ts
export interface AiInferenceRequest {
    requestId: string;
    frameNumber: number;
    modelName: string;
    budgetMs: number;
}
```

#### `AiInferenceResponse`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L22) `packages/realtime/src/semantics/realtime-ai-inference.ts`

```ts
export interface AiInferenceResponse {
    requestId: string;
    latencyMs: number;
    outputBytes: number;
}
```

#### `BiStreamHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L34) `packages/realtime/src/semantics/webtransport-bi.ts`

```ts
export interface BiStreamHandle {
    readonly id: string;
    readonly state: 'open' | 'closed';
    readonly windowRemaining: number;
    write(data: Uint8Array): Promise<void>;
    read(): Promise<Uint8Array | null>;
    close(): Promise<void>;
}
```

#### `BiStreamOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L29) `packages/realtime/src/semantics/webtransport-bi.ts`

WebTransport bi-directional axis — bi stream + flow control + backpressure + close を mock 化する。 実 WebTransport 呼出形式 (`WebTransport.createBidirectionalStream`) は以下 ... ```ts const stream = await transport.createBidirectionalStream(); const writer = stream.writable.getWriter(); await writer.ready; // backpressure — ready 待機 await writer.write(new Uint8Array(1024)); // reader 側 const reader = stream.readable.getReader(); const { value, done } = await reader.read(); ``` 本 mock は上記 4 event (bi-stream-open / write / close / backpressure) と flow control (window size ベース backpressure) を再現する。

```ts
export interface BiStreamOptions {
    /** flow control window size (byte、 default 16384)。 */
    windowSize?: number;
}
```

#### `BroadcastEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L66) `packages/realtime/src/types.ts`

Broadcast event — channel 内の任意 event 名 payload 配信。 provider 全てで ordering は per-channel FIFO を保証する (Ably history rewind は除く、 see `historyRewind` in ChannelOptions)。

```ts
export interface BroadcastEvent<TPayload = unknown> {
    channel: string;
    event: string;
    payload: TPayload;
    /** server 割当 ID (Ably message ID / Pusher socket_id 等の抽象)。 */
    id: string;
    timestamp: number;
}
```

#### `BuildRealtimeReportInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts#L31) `packages/realtime/src/report.ts`

`@kiwa-lab/realtime` 実測値を `@kiwa-lab/quality-metrics` `QualityReport` に集約する adapter。 dogfood app が realtime fidelity harness を回した後、 本 adapter で `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。 Realtime は cost / token が LLM ほど直接的でないため、 - cost = mock 側の subscribe + publish 総回数 × 単価 (通信費近似) - latency = subscribe + publish latency サンプル - token = event payload の byte 数を token 相当として扱う - accuracy = fidelity harness の kind/payload 一致率 の 4 軸に mapping する。

```ts
export interface BuildRealtimeReportInput {
    provider: string;
    version: string;
    /** fidelity harness の結果 (real vs mock scenario 一致率) */
    fidelity: RealtimeFidelityReport;
    /** mock 実測 metrics (cost / latency 集計用)。 */
    mockMetrics: ReturnType<RealtimeMock['getMetrics']>;
    /** mock 側 API 表面 cover 数。 default `{ mock: 4, real: 4 }` (4 provider)。 */
    surfaceCoverage?: {
        mockCoveredMethods: number;
        realTotalMethods: number;
    };
    /** vitest 由来の test count breakdown。 */
    testCount?: {
        behavior: number;
        integration: number;
        e2e: number;
    };
    /** v8 coverage summary。 */
    coverageV8Summary?: {
        lines: {
            pct: number;
        };
        branches: {
            pct: number;
        };
        functions: {
            pct: number;
        };
    };
    /** stryker / mutation テスト結果。 */
    mutation?: {
        mutations: number;
        killed: number;
    };
    /** perf sample (ms、 別軸 p95 用)。 */
    perfSamplesMs?: number[];
    /** 1 event あたりの想定通信費 (USD、 default $0.00001 = $10/million events)。 */
    costPerEventUsd?: number;
    notes?: string;
}
```

#### `CollectedEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L26) `packages/realtime/src/fidelity.ts`

driver から返される event の統一形式。 provider 別詳細は payload に格納。

```ts
export interface CollectedEvent {
    kind: RealtimeAnyEvent['kind'];
    channel?: string;
    event?: string;
    payload?: unknown;
    order: number;
    /** 集計開始からの相対 ms (ordering 検証用)。 */
    relativeTimeMs: number;
}
```

#### `ConnectionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L18) `packages/realtime/src/types.ts`

接続状態の 5 state machine。 disconnected → connecting → connected → reconnecting → disconnected を 4 provider 全てで模倣する。

```ts
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closed';
```

#### `DataChannelHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L42) `packages/realtime/src/semantics/webrtc-data-channel.ts`

```ts
export interface DataChannelHandle {
    readonly id: string;
    readonly label: string;
    readonly options: Required<DataChannelOptions>;
    readonly readyState: 'connecting' | 'open' | 'closing' | 'closed';
    send(data: string | ArrayBuffer): Promise<void>;
    close(): Promise<void>;
}
```

#### `DataChannelOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L31) `packages/realtime/src/semantics/webrtc-data-channel.ts`

WebRTC data channel axis — ordered / unordered + reliable / unreliable + maxRetransmits + binaryType (arraybuffer / blob) を mock 化する。 実 WebRTC 呼出形式 (`RTCPeerConnection.createDataChannel`) は以下 ... ```ts const dc = pc.createDataChannel('chat', { ordered: true, maxRetransmits: 3, maxPacketLifeTime: null, }); dc.binaryType = 'arraybuffer'; dc.onopen = () =&gt; dc.send('hello'); dc.onmessage = (ev) =&gt; console.log(ev.data); dc.onclose = () =&gt; cleanup(); ``` 本 mock は上記 4 lifecycle event (open / message / close / error) と ordered / maxRetransmits 挙動を deterministic に再現する。

```ts
export interface DataChannelOptions {
    /** default true — 順序保証。 */
    ordered?: boolean;
    /** unordered 時の最大 retransmit 回数 (default 0)。 */
    maxRetransmits?: number;
    /** binary type — arraybuffer / blob (default arraybuffer)。 */
    binaryType?: 'arraybuffer' | 'blob';
    /** label (mock は識別子のみ、 SDK では channel 名として使う)。 */
    label?: string;
}
```

#### `DecoderConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L15) `packages/realtime/src/semantics/webcodecs-decoder.ts`

WebCodecs decoder axis — VideoDecoder / AudioDecoder + frame buffer + reorder + drop policy. B-frame や out-of-order 到着に対応する reorder buffer + latency budget 超過時の drop path を含む。

```ts
export interface DecoderConfig {
    codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
    description?: string;
}
```

#### `EncodedFrame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L23) `packages/realtime/src/semantics/webcodecs-encoder.ts`

```ts
export interface EncodedFrame {
    encoderId: string;
    frameNumber: number;
    type: 'key' | 'delta';
    byteLength: number;
}
```

#### `EncoderConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L15) `packages/realtime/src/semantics/webcodecs-encoder.ts`

WebCodecs encoder axis — VideoEncoder / AudioEncoder direct API + hardware acceleration hints. Chrome / Safari / Firefox の WebCodecs 実装は codec config → frame encode → keyframe force → hardware fallback path を持つ。

```ts
export interface EncoderConfig {
    codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
    width: number;
    height: number;
    bitrate: number;
    hardwareAcceleration: 'prefer-hardware' | 'prefer-software' | 'no-preference';
}
```

#### `HpackEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L41) `packages/realtime/src/semantics/quic-multiplex.ts`

```ts
export interface HpackEntry {
    name: string;
    value: string;
    /** 挿入順 (dynamic table index)。 */
    index: number;
}
```

#### `Http3PushMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L47) `packages/realtime/src/semantics/http3-push.ts`

```ts
export interface Http3PushMock extends SemanticsMock {
    readonly protocol: 'http3-quic';
    readonly axis: 'http3-push';
    /** server push を promise、 client 側に push_promise event を送出。 */
    pushStream(path: string, priority?: Partial<PushPriority>): Promise<PushPromise>;
}
```

#### `IceCandidate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L42) `packages/realtime/src/semantics/webrtc-signaling.ts`

ICE candidate 1 件 (mock は host / srflx / relay を type 別に配布)。

```ts
export interface IceCandidate {
    type: 'host' | 'srflx' | 'prflx' | 'relay';
    /** candidate protocol (udp / tcp、 mock は udp default)。 */
    protocol: 'udp' | 'tcp';
    /** priority (RFC 5245 準拠の値域、 0 〜 2^32-1)。 */
    priority: number;
    /** candidate string の識別子 (RTCIceCandidate.candidate 相当)。 */
    candidate: string;
}
```

#### `IceConnectionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L29) `packages/realtime/src/semantics/webrtc-ice.ts`

```ts
export type IceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected';
```

#### `IceGatheringState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L28) `packages/realtime/src/semantics/webrtc-ice.ts`

WebRTC ICE axis — candidate gathering + connectivity check + TURN relay + trickle ICE を mock 化する。 実 WebRTC 呼出形式 (`RTCPeerConnection.onicecandidate` + `iceGatheringState` + `iceConnectionState`) は以下 ... ```ts pc.oniceconnectionstatechange = () =&gt; { console.log(pc.iceConnectionState); // 'checking' → 'connected' → 'completed' }; pc.onicecandidate = (ev) =&gt; { if (ev.candidate) sendToRemote(ev.candidate); }; // trickle ICE — candidate は gathering 中に順次送出、 gathering 終了まで待たない ``` 本 mock は上記 4 event (gathering / checking / connected / relay-used) と trickle ICE (candidate を順次 emit)、 TURN relay 経路情報を再現する。

```ts
export type IceGatheringState = 'new' | 'gathering' | 'complete';
```

#### `IceStats`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L31) `packages/realtime/src/semantics/webrtc-ice.ts`

```ts
export interface IceStats {
    candidatesGathered: number;
    candidatesRemote: number;
    activeCandidatePairs: number;
    /** relay 経路経由 (TURN) が使われた回数。 */
    relayUsedCount: number;
    gatheringDurationMs: number;
}
```

#### `MediaTrack`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L34) `packages/realtime/src/semantics/webrtc-track.ts`

```ts
export interface MediaTrack {
    readonly id: string;
    readonly kind: TrackKind;
    readonly label: string;
    enabled: boolean;
    /** simulcast layer 定義 (video のみ、 audio は空)。 */
    readonly simulcastLayers: SimulcastLayer[];
}
```

#### `MoqAnnouncement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L17) `packages/realtime/src/semantics/moq-fetch.ts`

Media over QUIC / MOQT axis — track announce + subscribe + object delivery. MOQT (draft-ietf-moq-transport) は QUIC 上の pub/sub media transport で、 publisher が track を announce → subscriber が subscribe → object を 送受信する pattern。 本 mock は 4 event (announce / subscribe / object-sent / object-received) を deterministic seed で emit。

```ts
export interface MoqAnnouncement {
    trackName: string;
    namespace: string;
    authInfo: string;
}
```

#### `MoqDatagram`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L16) `packages/realtime/src/semantics/moq-datagram-media.ts`

MoQ datagram media axis — partial reliability + priority + FEC recovery. MOQT の datagram delivery mode は QUIC datagram frame を使い、 packet drop を許容する pattern。 Forward Error Correction (FEC) で失われた datagram を再構成する path も含む。

```ts
export interface MoqDatagram {
    trackName: string;
    sequenceNumber: number;
    payloadBytes: number;
    priority: number;
}
```

#### `MoqDatagramMediaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L23) `packages/realtime/src/semantics/moq-datagram-media.ts`

```ts
export interface MoqDatagramMediaMock extends SemanticsMock {
    readonly protocol: 'moqt';
    readonly axis: 'moq-datagram-media';
    sendDatagram(input: MoqDatagram): Promise<void>;
    dropDatagram(input: {
        trackName: string;
        sequenceNumber: number;
    }): Promise<void>;
    setPriority(input: {
        trackName: string;
        priority: number;
    }): Promise<void>;
    recoverFec(input: {
        trackName: string;
        recoveredCount: number;
    }): Promise<void>;
}
```

#### `MoqFetchMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L30) `packages/realtime/src/semantics/moq-fetch.ts`

```ts
export interface MoqFetchMock extends SemanticsMock {
    readonly protocol: 'moqt';
    readonly axis: 'moq-fetch';
    announceTrack(input: MoqAnnouncement): Promise<void>;
    subscribeTrack(input: {
        trackName: string;
        namespace: string;
    }): Promise<void>;
    sendObject(input: MoqObject): Promise<void>;
    receiveObject(input: MoqObject): Promise<void>;
}
```

#### `MoqObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L23) `packages/realtime/src/semantics/moq-fetch.ts`

```ts
export interface MoqObject {
    trackName: string;
    groupId: number;
    objectId: number;
    payloadBytes: number;
}
```

#### `PostgresChangeEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L82) `packages/realtime/src/types.ts`

```ts
export interface PostgresChangeEvent<TRow = Record<string, unknown>> {
    channel: string;
    eventType: PostgresChangeType;
    schema: string;
    table: string;
    /** UPDATE / DELETE 時の旧 row (INSERT 時は null)。 */
    oldRecord: TRow | null;
    /** INSERT / UPDATE 時の新 row (DELETE 時は null)。 */
    newRecord: TRow | null;
    timestamp: number;
}
```

#### `PostgresChangeType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L80) `packages/realtime/src/types.ts`

Postgres changes event — Supabase Realtime 固有の semantics だが、 DB CDC を realtime 通知する共通 pattern として 4 provider mock で扱える (Ably / Pusher / Socket.io は broadcast の特殊形として emit)。

```ts
export type PostgresChangeType = 'INSERT' | 'UPDATE' | 'DELETE';
```

#### `PresenceEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L53) `packages/realtime/src/types.ts`

Presence event 1 件 (join / leave / sync)。

```ts
export interface PresenceEvent {
    type: PresenceEventType;
    channel: string;
    /** sync 時は全 member、 join/leave は該当 user のみ。 */
    members: PresenceMember[];
    timestamp: number;
}
```

#### `PresenceEventType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L41) `packages/realtime/src/types.ts`

Presence event の種類。 実 provider (Supabase / Ably / Pusher) 全てで sync / join / leave の 3 event 相当が存在する。

```ts
export type PresenceEventType = 'sync' | 'join' | 'leave';
```

#### `PresenceMember`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L44) `packages/realtime/src/types.ts`

1 user 分の presence metadata。 provider 別 field は `payload` に格納。

```ts
export interface PresenceMember {
    userId: string;
    /** provider 別の任意 metadata (Supabase `presence_ref` / Ably `clientId` 等)。 */
    payload: Record<string, unknown>;
    /** presence が最後に更新された server timestamp (ms)。 */
    updatedAt: number;
}
```

#### `PusherChannel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L44) `packages/realtime/src/pusher.ts`

```ts
export interface PusherChannel {
    readonly name: string;
    bind(event: string, handler: (data: unknown, metadata?: unknown) => void): PusherChannel;
    unbind(event?: string): PusherChannel;
    trigger(event: string, data: unknown): boolean;
    members?: PusherMembers;
}
```

#### `PusherMember`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L32) `packages/realtime/src/pusher.ts`

Pusher mock。 SDK 呼出形式 (real `pusher-js`) は以下 ... ```ts const pusher = new Pusher(APP_KEY, { cluster: 'us2' }); const channel = pusher.subscribeChannel('my-channel'); channel.bind('my-event', (data) =&gt; {...}); const presence = pusher.subscribeChannel('presence-my-channel'); presence.bind('pusher:subscription_succeeded', (members) =&gt; {...}); presence.bind('pusher:member_added', (member) =&gt; {...}); presence.bind('pusher:member_removed', (member) =&gt; {...}); ``` 本 mock は上記 shape を提供、 real Pusher の `subscribe` メソッドは mock 側で `subscribeChannel` に rename している (base `RealtimeMock` の async `subscribe` と衝突するため)。 presence channel は `presence-` 接頭辞で判定、 通常 channel との内部処理は共通 (engine 側)。

```ts
export interface PusherMember {
    id: string;
    info: Record<string, unknown>;
}
```

#### `PusherMembers`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L37) `packages/realtime/src/pusher.ts`

```ts
export interface PusherMembers {
    count: number;
    each(callback: (member: PusherMember) => void): void;
    get(id: string): PusherMember | null;
    me: PusherMember | null;
}
```

#### `PusherMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L52) `packages/realtime/src/pusher.ts`

```ts
export interface PusherMock extends RealtimeMock {
    readonly provider: 'pusher';
    /** Pusher 固有 — channel 購読 (real `pusher.subscribe` 相当、 sync 返却)。 */
    subscribeChannel(channelName: string): PusherChannel;
    unsubscribeChannel(channelName: string): void;
    /** Pusher 固有 — user auth 識別子。 */
    config: {
        userId: string;
    };
}
```

#### `PushPriority`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L30) `packages/realtime/src/semantics/http3-push.ts`

HTTP/3 priority signal (RFC 9218 準拠)。

```ts
export interface PushPriority {
    /** 0 (最高) 〜 7 (最低)、 default 3。 */
    urgency: number;
    /** progressive delivery 可否 (default false)。 */
    incremental: boolean;
}
```

#### `PushPromise`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L37) `packages/realtime/src/semantics/http3-push.ts`

```ts
export interface PushPromise {
    readonly id: string;
    readonly path: string;
    readonly priority: PushPriority;
    readonly state: 'promised' | 'headers-sent' | 'body-sent' | 'cancelled';
    sendHeaders(headers: Record<string, string>): Promise<void>;
    sendBody(body: string | Uint8Array): Promise<void>;
    cancel(errorCode: number): Promise<void>;
}
```

#### `QuicMultiplexMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L48) `packages/realtime/src/semantics/quic-multiplex.ts`

```ts
export interface QuicMultiplexMock extends SemanticsMock {
    readonly protocol: 'http3-quic';
    readonly axis: 'quic-multiplex';
    readonly zeroRttEnabled: boolean;
    readonly hpackTableSize: number;
    openStream(options?: QuicStreamOptions): Promise<QuicStreamHandle>;
    insertHpackHeader(name: string, value: string): Promise<HpackEntry>;
    /** 0-RTT で resume (以前の session ticket があると想定)。 */
    resumeWithZeroRtt(): Promise<void>;
    /** 現在 open な stream を priority 順に返す (低い値 = 高優先)。 */
    getActiveStreams(): QuicStreamHandle[];
}
```

#### `QuicStreamHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L34) `packages/realtime/src/semantics/quic-multiplex.ts`

```ts
export interface QuicStreamHandle {
    readonly id: string;
    readonly priority: number;
    readonly state: 'open' | 'closed';
    close(): Promise<void>;
}
```

#### `QuicStreamOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L29) `packages/realtime/src/semantics/quic-multiplex.ts`

QUIC multiplex axis — stream multiplex + stream priority + HPACK dynamic table + 0-RTT を mock 化する。 実 QUIC (HTTP/3 下層) 呼出形式 (aioquic / quiche / ngtcp2 相当) は以下 ... ```ts // client 側 (aioquic 相当の JS 表現) const conn = new QuicConnection({ enable0RTT: true }); await conn.handshake(); const stream1 = conn.openStream({ priority: 3 }); const stream2 = conn.openStream({ priority: 5 }); // HPACK dynamic table 更新 conn.hpack.insertHeader('content-type', 'application/json'); ``` 本 mock は上記 4 event (stream-open / stream-close / hpack-insert / zero-rtt-used) と stream priority (低い数字が高優先) を再現する。

```ts
export interface QuicStreamOptions {
    /** priority (0=最高、 255=最低、 default 128)。 */
    priority?: number;
}
```

#### `RealDriverGateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L31) `packages/realtime/src/real-driver.ts`

```ts
export interface RealDriverGateInput<TDriver> {
    provider: RealtimeProviderName;
    /** real driver に必要な env variable key 一覧 (全 set で real 起動)。 */
    requiredKeys: string[];
    /** real driver factory — 全 env が揃った時のみ呼ばれる。 */
    createReal: (env: Record<string, string>) => TDriver;
    /** mock driver factory — env 不揃い時の fallback。 */
    createMock: () => TDriver;
    /** env source (default `process.env`)。 test で override 可能。 */
    envSource?: Record<string, string | undefined>;
}
```

#### `RealDriverGateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L43) `packages/realtime/src/real-driver.ts`

```ts
export interface RealDriverGateResult<TDriver> {
    driver: TDriver;
    /** 実際に real 経路を選んだか。 mock fallback 時 false。 */
    isReal: boolean;
    /** real 選択の判定理由 — log 出力 / provenance に使う。 */
    reason: string;
    /** 不足した env key (isReal=false の時のみ non-empty)。 */
    missingKeys: string[];
}
```

#### `RealtimeAiInferenceMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/realtime-ai-inference.ts#L28) `packages/realtime/src/semantics/realtime-ai-inference.ts`

```ts
export interface RealtimeAiInferenceMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'realtime-ai-inference';
    sendRequest(input: AiInferenceRequest): Promise<void>;
    receiveResponse(input: AiInferenceResponse): Promise<void>;
    reportBudget(input: {
        requestId: string;
        budgetMs: number;
        consumedMs: number;
    }): Promise<void>;
    dropRequest(input: {
        requestId: string;
        reason: string;
    }): Promise<void>;
}
```

#### `RealtimeAnyEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L209) `packages/realtime/src/types.ts`

subscribe の union event 型 (adapter 側で filter する)。

```ts
export type RealtimeAnyEvent = ({
    kind: 'presence';
} & PresenceEvent) | ({
    kind: 'broadcast';
} & BroadcastEvent) | ({
    kind: 'postgres_changes';
} & PostgresChangeEvent) | {
    kind: 'connection';
    state: ConnectionState;
    timestamp: number;
};
```

#### `RealtimeDriver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L19) `packages/realtime/src/fidelity.ts`

単一 scenario の driver — real 側 driver / mock 側 driver 両方に同じ shape で実装。

```ts
export interface RealtimeDriver {
    /** 期待する event 数だけ collect する。 timeout で強制終了。 */
    runScenario(scenarioId: string): Promise<CollectedEvent[]>;
    reset(): void;
}
```

#### `RealtimeEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L25) `packages/realtime/src/semantics/session-orchestrator.ts`

```ts
export type RealtimeEvent = 'connect-succeeded' | 'connect-failed' | 'subscribe-succeeded' | 'heartbeat-lost' | 'heartbeat-recovered' | 'reconnect-succeeded' | 'reconnect-exhausted' | 'user-disconnect';
```

#### `RealtimeEventHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L206) `packages/realtime/src/types.ts`

subscribe に渡す handler。 5 event 種を全て受け取れる union。

```ts
export type RealtimeEventHandler = (event: RealtimeAnyEvent) => void;
```

#### `RealtimeFidelityInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L36) `packages/realtime/src/fidelity.ts`

```ts
export interface RealtimeFidelityInput {
    realDriver: RealtimeDriver;
    mockDriver: RealtimeDriver;
    /** 実行する scenario 名リスト。 */
    scenarios: string[];
    /** 1 scenario あたりの timeout (ms、 default 3000)。 */
    perScenarioTimeoutMs?: number;
}
```

#### `RealtimeFidelityRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L45) `packages/realtime/src/fidelity.ts`

```ts
export interface RealtimeFidelityRecord {
    scenarioId: string;
    real: CollectedEvent[];
    mock: CollectedEvent[];
    /** event 数の差 (real - mock)。 */
    eventCountDiff: number;
    /** kind 列の順序一致率 0-1。 */
    kindOrderMatch: number;
    /** payload / event 名の一致率 0-1。 */
    payloadMatch: number;
    /** 総合 accuracy score 0-1 (順序 * payload の平均)。 */
    accuracyScore: number;
    /** 集計開始からの合計時間差 (ms)。 */
    totalDurationDiffMs: number;
}
```

#### `RealtimeFidelityReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L61) `packages/realtime/src/fidelity.ts`

```ts
export interface RealtimeFidelityReport {
    records: RealtimeFidelityRecord[];
    summary: {
        scenarios: number;
        avgAccuracyScore: number;
        avgEventCountDiff: number;
        avgKindOrderMatch: number;
        avgPayloadMatch: number;
        avgTotalDurationDiffMs: number;
        accuracyMethod: 'sequence-jaccard';
    };
}
```

#### `RealtimeMetrics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L222) `packages/realtime/src/types.ts`

mock が公開する累積 metric。 fidelity harness が集計に使う。

```ts
export interface RealtimeMetrics {
    /** subscribe 回数。 */
    subscribeCount: number;
    /** publish 回数。 */
    publishCount: number;
    /** 実際に配信された event 総数 (drop 前)。 */
    eventsDelivered: number;
    /** backpressure で drop された event 数。 */
    eventsDropped: number;
    /** reconnect 発生回数 (auto + manual)。 */
    reconnectCount: number;
    /** subscribe → 初 event までの latency サンプル (ms)。 */
    subscribeLatencyMs: number[];
    /** publish → subscriber 受信までの latency サンプル (ms)。 */
    publishLatencyMs: number[];
}
```

#### `RealtimeMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L170) `packages/realtime/src/types.ts`

kiwa realtime mock を全 SDK adapter が満たすべき最小 interface。 SDK 固有の API (`supabase.channel().on()` / `ably.channels.get().subscribe()` / `pusher.subscribe()` / `io.of().on()`) は adapter 別に定義、 本 interface は 4 provider 共通の低レベル操作 (subscribe / publish / presence / disconnect) を集約する。

```ts
export interface RealtimeMock {
    /** provider 名 (`supabase` / `ably` / `pusher` / `socketio`)。 */
    readonly provider: string;
    /**
     * channel 購読 — subscribe 後 scenario event が順次 handler に流れる。
     * unsubscribe は返り値 handle の `.unsubscribe()` で行う。
     */
    subscribe(channel: string, handler: RealtimeEventHandler): Promise<SubscriptionHandle>;
    /** broadcast event を channel に publish (server 経由の擬似 emit)。 */
    publish(channel: string, event: string, payload: unknown): Promise<void>;
    /** presence state を track (join)。 unsubscribe or leave で自動 leave。 */
    trackPresence(channel: string, userId: string, payload?: Record<string, unknown>): Promise<void>;
    /** presence untrack (leave)。 */
    untrackPresence(channel: string, userId: string): Promise<void>;
    /** 現時点の connection state。 */
    getConnectionState(): ConnectionState;
    /** 手動 disconnect (test 用)。 */
    disconnect(): Promise<void>;
    /** 手動 reconnect (test 用)。 */
    reconnect(): Promise<void>;
    /** 累積 metric (fidelity 計測用)。 */
    getMetrics(): RealtimeMetrics;
    /** metric + subscription state を初期化。 */
    reset(): void;
}
```

#### `RealtimeMockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L128) `packages/realtime/src/types.ts`

Mock 設定 — 4 provider adapter で共通に使う。 `scenarios` は channel 名 → 発火 event 列で index、 event は subscribe 後の 順序で emit される。 reconnect 挙動は `reconnect` で override。

```ts
export interface RealtimeMockConfig {
    /** artificial latency (ms、 default 5)。 subscribe / publish 遅延。 */
    artificialLatencyMs?: number;
    /** provider 識別子 (report 用、 default 'mock-realtime')。 */
    provider?: string;
    /** reconnect policy (default {maxAttempts: 5, initialBackoffMs: 100})。 */
    reconnect?: ReconnectPolicy;
    /**
     * channel 別の scenario (subscribe 後に順次 emit される event 列)。
     * key = channel 名。 value = event 列 (順序保持)。
     */
    scenarios?: Record<string, ScenarioEvent[]>;
    /**
     * pending event backpressure — queue 満杯 event drop 数の閾値。
     * default = Infinity (drop なし)、 Socket.io 実装で意味を持つ。
     */
    backpressureLimit?: number;
}
```

#### `RealtimeProviderName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/real-driver.ts#L29) `packages/realtime/src/real-driver.ts`

Real driver env-gate — v0.2 (GH #971) で追加。 v1.13 の 4 provider (Supabase / Ably / Pusher / Socket.io) mock は default で完全に mock 化されており、 test 実行時に外部 network を叩かない。 一方、 dogfood app や real-vs-mock fidelity 計測では、 real provider に対して同じ scenario を回して差分を取りたい局面がある。 本 helper は「real driver を返すべきか」 を env variable で決定する gate。 `KIWA_MODE=real` かつ provider 別の必須 key set (env variable) が全て 揃った時にのみ real driver を作成する。 それ以外の場合は mock driver を 返す (fallback、 常に安全)。 呼出例 (real Supabase client を得たい場合) ... ```ts const driver = resolveRealtimeDriver({ provider: 'supabase', requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'], createReal: (env) =&gt; createRealSupabaseDriver(env), createMock: () =&gt; createMockSupabaseDriver(), }); ``` real driver 実装は kiwa の SSOT には含まれない (外部 SDK 依存を避けるため)、 user (dogfood app 側) が real driver factory を渡す責務を持つ。

```ts
export type RealtimeProviderName = 'supabase' | 'ably' | 'pusher' | 'socketio';
```

#### `RealtimeSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L35) `packages/realtime/src/semantics/session-orchestrator.ts`

```ts
export interface RealtimeSession {
    state: RealtimeSessionState;
    connectAttempts: number;
    reconnectRounds: number;
    heartbeatFailures: number;
    broadcastsReceived: number;
    lastEventAt: string;
    events: string[];
}
```

#### `RealtimeSessionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L18) `packages/realtime/src/semantics/session-orchestrator.ts`

v2.1 realtime session-orchestrator = presence + broadcast + subscription + heartbeat + reconnect の 5 axis を 継続合成 する 上位 layer。 Realtime pair v0.1 → v2.1 = 5 段深化到達、 **depth-5 pattern 5 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime = 5 pair 到達で pattern 「rule」 化 → **systematic law** 昇格 candidate)。 auth v0.7 + payment v2.1 の 上位層 pattern を Realtime pair に転用、 systematic pattern 47 度目適用 (continuous state machine variant Realtime 転用)。 4 provider (Supabase / Ably / Pusher / Socket.io) 抽象 の 上位、 provider 独立 な pure state machine、 5 state SSOT + 8 event SSOT + 40 セル 遷移表。 shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.2) 変更 0、 新規 file 追加 のみ、 backward compat 絶対維持。

```ts
export type RealtimeSessionState = 'connecting' | 'subscribed' | 'reconnecting' | 'degraded' | 'closed';
```

#### `RealtimeSessionSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L157) `packages/realtime/src/semantics/session-orchestrator.ts`

```ts
export interface RealtimeSessionSummary {
    currentState: RealtimeSessionState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    broadcastsReceived: number;
    reconnectRounds: number;
    heartbeatFailures: number;
}
```

#### `ReconnectPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L109) `packages/realtime/src/types.ts`

Reconnect policy — provider 全てで指数 backoff + jitter が実装されている。 mock は artificial delay で挙動を模倣。

```ts
export interface ReconnectPolicy {
    /** 最大再接続試行回数 (default 5)。 */
    maxAttempts?: number;
    /** 初期 backoff delay (ms、 default 100)。 */
    initialBackoffMs?: number;
    /** 最大 backoff delay (ms、 default 5000)。 */
    maxBackoffMs?: number;
    /** backoff 倍率 (default 2)。 */
    backoffMultiplier?: number;
    /** 0-1 の jitter 割合 (default 0.1)。 */
    jitter?: number;
}
```

#### `Room`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L99) `packages/realtime/src/types.ts`

Room semantics — Socket.io namespace + room の 2 階層構造、 Ably では channel、 Supabase では channel、 Pusher では channel-name 相当。 mock ではすべて `{ namespace?: string; room: string }` に正規化。

```ts
export interface Room {
    /** Socket.io 固有 (default 未指定 = `/`)。 */
    namespace?: string;
    room: string;
}
```

#### `ScenarioEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L151) `packages/realtime/src/types.ts`

1 scenario event — subscribe 後の n 番目に発火する event。 `delay` が指定されると、 直前 event から `delay` ms 後に emit される。

```ts
export type ScenarioEvent = ({
    kind: 'presence';
} & Omit<PresenceEvent, 'channel' | 'timestamp'> & {
    delay?: number;
}) | ({
    kind: 'broadcast';
} & Omit<BroadcastEvent, 'channel' | 'timestamp' | 'id'> & {
    delay?: number;
    id?: string;
}) | ({
    kind: 'postgres_changes';
} & Omit<PostgresChangeEvent, 'channel' | 'timestamp'> & {
    delay?: number;
}) | {
    kind: 'disconnect';
    delay?: number;
} | {
    kind: 'reconnect';
    delay?: number;
};
```

#### `SemanticsAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L25) `packages/realtime/src/semantics/types.ts`

axis tag — 8 base axis + 8 advanced III axis の identifier。

```ts
export type SemanticsAxis = 'webrtc-signaling' | 'webrtc-data-channel' | 'webrtc-track' | 'webrtc-ice' | 'webtransport-uni' | 'webtransport-bi' | 'http3-push' | 'quic-multiplex' | 'moq-fetch' | 'moq-datagram-media' | 'webcodecs-encoder' | 'webcodecs-decoder' | 'simulcast-svc' | 'voice-streaming' | 'whisper-streaming' | 'realtime-ai-inference';
```

#### `SemanticsEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L128) `packages/realtime/src/semantics/types.ts`

共通 event shape — payload は event kind 別に stringly typed。

```ts
export interface SemanticsEvent<TPayload = unknown> {
    kind: SemanticsEventKind;
    /** stream id / channel id / peer id 等 (axis 固有)。 */
    streamId?: string;
    payload?: TPayload;
    /** collect 開始からの相対 ms。 */
    relativeTimeMs: number;
    /** 順番 (0 origin)。 */
    order: number;
}
```

#### `SemanticsEventKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L45) `packages/realtime/src/semantics/types.ts`

共通 transport event kind (8 axis 横断)。

```ts
export type SemanticsEventKind = 'offer' | 'answer' | 'ice-candidate' | 'renegotiation' | 'data-open' | 'data-message' | 'data-close' | 'track-add' | 'track-remove' | 'track-mute' | 'track-unmute' | 'ice-gathering' | 'ice-checking' | 'ice-connected' | 'ice-relay-used' | 'uni-stream-open' | 'uni-stream-write' | 'uni-stream-reset' | 'datagram-recv' | 'bi-stream-open' | 'bi-stream-write' | 'bi-stream-close' | 'bi-backpressure' | 'push-promise' | 'push-headers' | 'push-body' | 'push-cancelled' | 'stream-open' | 'stream-close' | 'hpack-insert' | 'zero-rtt-used' | 'moq-track-announce' | 'moq-track-subscribe' | 'moq-object-sent' | 'moq-object-received' | 'moq-datagram-sent' | 'moq-datagram-dropped' | 'moq-priority-set' | 'moq-fec-recovered' | 'encoder-config-set' | 'encoder-frame-encoded' | 'encoder-keyframe-forced' | 'encoder-hardware-used' | 'decoder-config-set' | 'decoder-frame-decoded' | 'decoder-frame-reordered' | 'decoder-frame-dropped' | 'simulcast-layer-added' | 'svc-layer-selected' | 'bitrate-adapted' | 'layer-dropped' | 'voice-session-open' | 'voice-audio-chunk-sent' | 'voice-response-chunk-received' | 'voice-turn-completed' | 'whisper-audio-chunk-sent' | 'whisper-partial-transcript' | 'whisper-final-transcript' | 'whisper-vad-triggered' | 'ai-inference-request' | 'ai-inference-response' | 'ai-inference-latency-budget' | 'ai-inference-dropped';
```

#### `SemanticsFidelityInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L58) `packages/realtime/src/semantics-fidelity.ts`

```ts
export interface SemanticsFidelityInput {
    mock: SemanticsMock;
    /** scenario 実行本体 — mock を操作して event を発火させる。 */
    scenario: () => Promise<void>;
    /** collect timeout (ms、 default 3000)。 */
    timeoutMs?: number;
}
```

#### `SemanticsFidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L66) `packages/realtime/src/semantics-fidelity.ts`

```ts
export interface SemanticsFidelityRow {
    protocol: SemanticsProtocol;
    axis: SemanticsAxis;
    applicable: boolean;
    eventsEmitted: number;
    streamsOpened: number;
    streamsClosed: number;
    streamsReset: number;
    backpressureCount: number;
    /** scenario 実行中に発生した event 列 (順序保持)。 */
    events: SemanticsEvent[];
}
```

#### `SemanticsGridRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L20) `packages/realtime/src/semantics-fidelity.ts`

```ts
export interface SemanticsGridRow {
    protocol: SemanticsProtocol;
    axis: SemanticsAxis;
    /** 該当 protocol × axis の組合せが有効か。 false なら計測不要。 */
    applicable: boolean;
}
```

#### `SemanticsGridScenarios`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L116) `packages/realtime/src/semantics-fidelity.ts`

grid 全 24 row 分の scenario を map に登録して一括計測。 applicable=false の row は placeholder row として返す (visual matrix の 24 row を保つため)。

```ts
export interface SemanticsGridScenarios {
    scenarios: Map<SemanticsAxis, {
        mock: SemanticsMock;
        scenario: () => Promise<void>;
    }>;
}
```

#### `SemanticsMetrics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L152) `packages/realtime/src/semantics/types.ts`

8 axis 共通の累積 metric。 axis 固有 metric は `custom` に格納。

```ts
export interface SemanticsMetrics {
    /** emit された event 総数。 */
    eventsEmitted: number;
    /** open された stream 数 (axis 固有、 signaling 系は 0 のまま)。 */
    streamsOpened: number;
    /** close された stream 数。 */
    streamsClosed: number;
    /** reset された stream 数 (WebTransport / QUIC 固有)。 */
    streamsReset: number;
    /** backpressure イベント発火数 (bi stream 固有)。 */
    backpressureCount: number;
    /** axis 固有の任意 metric。 */
    custom: Record<string, number>;
}
```

#### `SemanticsMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L140) `packages/realtime/src/semantics/types.ts`

各 axis mock が満たす最小 interface。

```ts
export interface SemanticsMock {
    readonly protocol: SemanticsProtocol;
    readonly axis: SemanticsAxis;
    /** subscribe 相当 — event stream の handler を登録。 */
    onEvent(handler: (event: SemanticsEvent) => void): () => void;
    /** 累積 metric。 */
    getMetrics(): SemanticsMetrics;
    /** state + metric を初期化。 */
    reset(): void;
}
```

#### `SemanticsMockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L168) `packages/realtime/src/semantics/types.ts`

共通 mock config — artificial latency / seed 等。

```ts
export interface SemanticsMockConfig {
    /** event 間の default delay (ms、 default 1)。 */
    artificialLatencyMs?: number;
    /** deterministic random seed (default 1)。 */
    seed?: number;
}
```

#### `SemanticsProtocol`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/types.ts#L15) `packages/realtime/src/semantics/types.ts`

protocol tag — fidelity harness で grid 分類に使う。

```ts
export type SemanticsProtocol = 'webrtc' | 'webtransport' | 'http3-quic' | 'moqt' | 'webcodecs' | 'ai-media';
```

#### `SignalingSdp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L31) `packages/realtime/src/semantics/webrtc-signaling.ts`

signaling 1 セッション分の SDP 情報 (mock 用の簡略化された JSON payload)。

```ts
export interface SignalingSdp {
    type: 'offer' | 'answer';
    /** SDP 本文 (mock は fingerprint hash + 属性列のみ、 完全な SDP 文字列ではない)。 */
    fingerprint: string;
    /** media section 数 (audio / video / data 3 section を default とする)。 */
    mediaSections: number;
    /** BUNDLE / RTCP-mux フラグ (mock では always true)。 */
    bundleEnabled: boolean;
}
```

#### `SimulcastLayer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L43) `packages/realtime/src/semantics/webrtc-track.ts`

```ts
export interface SimulcastLayer {
    rid: 'low' | 'med' | 'high';
    maxBitrate: number;
    scaleResolutionDownBy: number;
}
```

#### `SimulcastSvcLayer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L16) `packages/realtime/src/semantics/simulcast-svc.ts`

Simulcast + SVC axis — Simulcast (複数解像度 stream) + Scalable Video Coding (temporal / spatial / quality layer) + adaptive bitrate + layer drop policy。 WebRTC v1 / v2 と MoQ 両方で採用される layered delivery pattern。

```ts
export interface SimulcastSvcLayer {
    layerId: string;
    resolution: string;
    bitrateKbps: number;
    scalabilityMode: 'L1T1' | 'L1T2' | 'L1T3' | 'L2T1' | 'L2T3' | 'L3T3';
}
```

#### `SimulcastSvcMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/simulcast-svc.ts#L23) `packages/realtime/src/semantics/simulcast-svc.ts`

```ts
export interface SimulcastSvcMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'simulcast-svc';
    addSimulcastLayer(input: SimulcastSvcLayer): Promise<void>;
    selectSvcLayer(input: {
        layerId: string;
        temporalId: number;
        spatialId: number;
    }): Promise<void>;
    adaptBitrate(input: {
        layerId: string;
        targetKbps: number;
        reason: string;
    }): Promise<void>;
    dropLayer(input: {
        layerId: string;
        reason: string;
    }): Promise<void>;
}
```

#### `SocketIoMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L46) `packages/realtime/src/socketio.ts`

```ts
export interface SocketIoMock extends RealtimeMock {
    readonly provider: 'socketio';
    /** client socket (default namespace '/')。 */
    io(namespace?: string): SocketIoSocket;
    /** server side namespace (test で `.to(room).emit()` する用)。 */
    of(namespace: string): SocketIoNamespace;
}
```

#### `SocketIoNamespace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L39) `packages/realtime/src/socketio.ts`

```ts
export interface SocketIoNamespace {
    readonly name: string;
    to(room: string): SocketIoNamespace;
    emit(event: string, ...args: unknown[]): void;
    sockets: Map<string, SocketIoSocket>;
}
```

#### `SocketIoSocket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L24) `packages/realtime/src/socketio.ts`

Socket.io mock。 SDK 呼出形式 (real `socket.io-client`) は以下 ... ```ts const socket = io('http://localhost:3000/chat'); // namespace = '/chat' socket.on('connect', () =&gt; {...}); socket.emit('message', payload); socket.on('message', (data) =&gt; {...}); // server side: io.of('/chat').to('room-1').emit('message', ...) ``` 本 mock は namespace + room の 2 階層 pub/sub を engine channel に normalize、 `join(room)` / `leave(room)` / `emit(event, data)` / `on(event, handler)` を 提供する。 reconnect + pending event replay + backpressure sim も内蔵。 mock channel 名 = `&lt;namespace&gt;|&lt;room&gt;` (namespace 未指定は `/`)。

```ts
export interface SocketIoSocket {
    readonly id: string;
    readonly namespace: string;
    connected: boolean;
    on(event: string, handler: (...args: unknown[]) => void): SocketIoSocket;
    off(event: string, handler?: (...args: unknown[]) => void): SocketIoSocket;
    emit(event: string, ...args: unknown[]): SocketIoSocket;
    join(room: string): Promise<void>;
    leave(room: string): Promise<void>;
    disconnect(): SocketIoSocket;
    connect(): SocketIoSocket;
    /** 現在 join 中の room 集合。 */
    rooms(): Set<string>;
}
```

#### `SubscriptionHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L216) `packages/realtime/src/types.ts`

subscribe の返り値 handle。

```ts
export interface SubscriptionHandle {
    channel: string;
    unsubscribe(): Promise<void>;
}
```

#### `SupabaseBroadcastFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L33) `packages/realtime/src/supabase.ts`

```ts
export interface SupabaseBroadcastFilter {
    event: string;
}
```

#### `SupabaseBroadcastPayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L49) `packages/realtime/src/supabase.ts`

```ts
export interface SupabaseBroadcastPayload<T = unknown> {
    type: 'broadcast';
    event: string;
    payload: T;
}
```

#### `SupabaseChannel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L64) `packages/realtime/src/supabase.ts`

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

#### `SupabaseListenerType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L27) `packages/realtime/src/supabase.ts`

Supabase Realtime mock。 SDK 呼出形式 (real `@supabase/supabase-js`) は以下 ... ```ts const channel = supabase.channel('room:1') .on('presence', { event: 'sync' }, () =&gt; {...}) .on('broadcast', { event: 'chat' }, (payload) =&gt; {...}) .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) =&gt; {...}) .subscribe(); ``` 本 mock は上記に近い interface を提供、 内部で {@link RealtimeEngine} を呼出す。 real Supabase SDK は import せず、 shape のみ互換。

```ts
export type SupabaseListenerType = 'presence' | 'broadcast' | 'postgres_changes' | 'system';
```

#### `SupabaseMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L88) `packages/realtime/src/supabase.ts`

```ts
export interface SupabaseMock extends RealtimeMock {
    readonly provider: 'supabase';
    channel(topic: string): SupabaseChannel;
    removeAllChannels(): Promise<void>;
}
```

#### `SupabasePostgresChangesFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L37) `packages/realtime/src/supabase.ts`

```ts
export interface SupabasePostgresChangesFilter {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
}
```

#### `SupabasePostgresChangesPayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L55) `packages/realtime/src/supabase.ts`

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

#### `SupabasePresenceFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L29) `packages/realtime/src/supabase.ts`

```ts
export interface SupabasePresenceFilter {
    event: 'sync' | 'join' | 'leave';
}
```

#### `SupabasePresencePayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts#L43) `packages/realtime/src/supabase.ts`

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

#### `TrackKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L32) `packages/realtime/src/semantics/webrtc-track.ts`

WebRTC track axis — getUserMedia mock + MediaStream + track add/remove + simulcast layer を mock 化する。 実 WebRTC 呼出形式 (`getUserMedia` + `RTCPeerConnection.addTrack`) は以下 ... ```ts const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); for (const track of stream.getTracks()) { const sender = pc.addTrack(track, stream); sender.setParameters({ encodings: [ { rid: 'low', maxBitrate: 100000 }, { rid: 'med', maxBitrate: 300000 }, { rid: 'high', maxBitrate: 900000 }, ]}); } track.enabled = false; // mute ``` 本 mock は上記 4 event (track-add / track-remove / track-mute / track-unmute) と simulcast layer 情報を deterministic に再現する。

```ts
export type TrackKind = 'audio' | 'video';
```

#### `UniStreamHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L33) `packages/realtime/src/semantics/webtransport-uni.ts`

WebTransport uni-directional axis — uni stream + Datagram + reset stream を mock 化する。 実 WebTransport 呼出形式 (`WebTransport.createUnidirectionalStream` + `datagrams.writable`) は以下 ... ```ts const transport = new WebTransport('https://example.com/wt'); await transport.ready; // uni stream const stream = await transport.createUnidirectionalStream(); const writer = stream.getWriter(); await writer.write(new Uint8Array([1, 2, 3])); writer.close(); // datagram const dgramWriter = transport.datagrams.writable.getWriter(); await dgramWriter.write(new Uint8Array([9, 8, 7])); ``` 本 mock は上記 4 event (uni-stream-open / write / reset / datagram-recv) を 再現する。 stream reset は abort() 相当。

```ts
export interface UniStreamHandle {
    readonly id: string;
    readonly state: 'open' | 'reset' | 'closed';
    write(data: Uint8Array): Promise<void>;
    close(): Promise<void>;
    /** stream を強制 reset (WebTransport writer.abort() 相当)。 */
    reset(errorCode: number): Promise<void>;
}
```

#### `VoiceAudioChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L21) `packages/realtime/src/semantics/voice-streaming.ts`

```ts
export interface VoiceAudioChunk {
    sessionId: string;
    sequenceNumber: number;
    byteLength: number;
    durationMs: number;
}
```

#### `VoiceSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L15) `packages/realtime/src/semantics/voice-streaming.ts`

LLM voice streaming axis — OpenAI Realtime API + Anthropic voice + audio streaming chunk exchange + turn management. session open → audio chunk upload → response chunk stream → turn completed の 4-op flow を mock 化。

```ts
export interface VoiceSession {
    sessionId: string;
    model: string;
    voice: string;
}
```

#### `VoiceStreamingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/voice-streaming.ts#L28) `packages/realtime/src/semantics/voice-streaming.ts`

```ts
export interface VoiceStreamingMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'voice-streaming';
    openSession(input: VoiceSession): Promise<void>;
    sendAudioChunk(input: VoiceAudioChunk): Promise<void>;
    receiveResponseChunk(input: VoiceAudioChunk): Promise<void>;
    completeTurn(input: {
        sessionId: string;
        totalDurationMs: number;
    }): Promise<void>;
}
```

#### `WebCodecsDecoderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-decoder.ts#L20) `packages/realtime/src/semantics/webcodecs-decoder.ts`

```ts
export interface WebCodecsDecoderMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'webcodecs-decoder';
    configure(input: {
        decoderId: string;
        config: DecoderConfig;
    }): Promise<void>;
    decodeFrame(input: {
        decoderId: string;
        frameNumber: number;
        type: 'key' | 'delta';
    }): Promise<void>;
    reorderFrame(input: {
        decoderId: string;
        frameNumber: number;
        delayMs: number;
    }): Promise<void>;
    dropFrame(input: {
        decoderId: string;
        frameNumber: number;
        reason: string;
    }): Promise<void>;
}
```

#### `WebCodecsEncoderMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webcodecs-encoder.ts#L30) `packages/realtime/src/semantics/webcodecs-encoder.ts`

```ts
export interface WebCodecsEncoderMock extends SemanticsMock {
    readonly protocol: 'webcodecs';
    readonly axis: 'webcodecs-encoder';
    configure(input: {
        encoderId: string;
        config: EncoderConfig;
    }): Promise<void>;
    encodeFrame(input: {
        encoderId: string;
        frameNumber: number;
        byteLength: number;
    }): Promise<void>;
    forceKeyframe(input: {
        encoderId: string;
        frameNumber: number;
    }): Promise<void>;
    reportHardwareUsed(input: {
        encoderId: string;
        hardware: boolean;
    }): Promise<void>;
}
```

#### `WebRtcDataChannelMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L51) `packages/realtime/src/semantics/webrtc-data-channel.ts`

```ts
export interface WebRtcDataChannelMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-data-channel';
    createDataChannel(options?: DataChannelOptions): DataChannelHandle;
}
```

#### `WebRtcIceMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-ice.ts#L40) `packages/realtime/src/semantics/webrtc-ice.ts`

```ts
export interface WebRtcIceMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-ice';
    readonly gatheringState: IceGatheringState;
    readonly connectionState: IceConnectionState;
    /** ICE gathering 開始 — n 件の local candidate を trickle 送出。 */
    startGathering(localCount: number): Promise<void>;
    /** remote candidate を追加。 */
    addRemoteCandidate(candidateId: string): Promise<void>;
    /** connectivity check 開始。 */
    startConnectivityCheck(): Promise<void>;
    /** TURN relay 経路を強制 (host / srflx 失敗時の fallback 用)。 */
    forceRelay(): Promise<void>;
    /** 統計取得。 */
    getIceStats(): IceStats;
}
```

#### `WebRtcMediaStream`

公開 entry point から解決しています。

`MediaStream` を `WebRtcMediaStream` として公開しています。

```ts
export {
  createHttp3PushMock,
  createQuicMultiplexMock,
  createWebRtcDataChannelMock,
  createWebRtcIceMock,
  createWebRtcSignalingMock,
  createWebRtcTrackMock,
  createWebTransportBiMock,
  createWebTransportUniMock,
  initialMetrics as initialSemanticsMetrics,
  type BiStreamHandle,
  type BiStreamOptions,
  type DataChannelHandle,
  type DataChannelOptions,
  type HpackEntry,
  type Http3PushMock,
  type IceCandidate,
  type IceConnectionState,
  type IceGatheringState,
  type IceStats,
  type MediaTrack,
  type PushPriority,
  type PushPromise,
  type QuicMultiplexMock,
  type QuicStreamHandle,
  type QuicStreamOptions,
  type SemanticsAxis,
  type SemanticsEvent,
  type SemanticsEventKind,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
  type SemanticsProtocol,
  type SignalingSdp,
  type SimulcastLayer,
  type TrackKind,
  type UniStreamHandle,
  type WebRtcDataChannelMock,
  type WebRtcIceMock,
  type WebRtcMediaStream,
  type WebRtcSignalingMock,
  type WebRtcTrackMock,
  type WebTransportBiMock,
  type WebTransportUniMock,
} from './semantics/index.js';
```

#### `WebRtcSignalingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-signaling.ts#L52) `packages/realtime/src/semantics/webrtc-signaling.ts`

```ts
export interface WebRtcSignalingMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-signaling';
    /** 新規セッション開始 → offer 生成 + emit。 */
    createOffer(): Promise<SignalingSdp>;
    /** offer 受信 → answer 生成 + emit。 */
    createAnswer(offer: SignalingSdp): Promise<SignalingSdp>;
    /** ICE candidate を n 件 trickle 送出。 */
    emitIceCandidates(count: number): Promise<IceCandidate[]>;
    /** track 追加時の renegotiation 発火。 */
    renegotiate(): Promise<SignalingSdp>;
}
```

#### `WebRtcTrackMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-track.ts#L54) `packages/realtime/src/semantics/webrtc-track.ts`

```ts
export interface WebRtcTrackMock extends SemanticsMock {
    readonly protocol: 'webrtc';
    readonly axis: 'webrtc-track';
    /** getUserMedia 相当 — audio / video track を含む stream を生成。 */
    getUserMedia(constraints?: {
        audio?: boolean;
        video?: boolean;
    }): Promise<MediaStream>;
    /** track 追加 — sender 相当の handle を返す。 */
    addTrack(track: MediaTrack, stream: MediaStream): Promise<{
        trackId: string;
    }>;
    /** track 削除。 */
    removeTrack(trackId: string): Promise<void>;
    /** track mute (enabled=false 相当)。 */
    muteTrack(trackId: string): Promise<void>;
    /** track unmute。 */
    unmuteTrack(trackId: string): Promise<void>;
}
```

#### `WebTransportBiMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L43) `packages/realtime/src/semantics/webtransport-bi.ts`

```ts
export interface WebTransportBiMock extends SemanticsMock {
    readonly protocol: 'webtransport';
    readonly axis: 'webtransport-bi';
    createBiStream(options?: BiStreamOptions): Promise<BiStreamHandle>;
}
```

#### `WebTransportUniMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L42) `packages/realtime/src/semantics/webtransport-uni.ts`

```ts
export interface WebTransportUniMock extends SemanticsMock {
    readonly protocol: 'webtransport';
    readonly axis: 'webtransport-uni';
    createUniStream(): Promise<UniStreamHandle>;
    sendDatagram(data: Uint8Array): Promise<void>;
}
```

#### `WhisperStreamingMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L23) `packages/realtime/src/semantics/whisper-streaming.ts`

```ts
export interface WhisperStreamingMock extends SemanticsMock {
    readonly protocol: 'ai-media';
    readonly axis: 'whisper-streaming';
    sendAudioChunk(input: {
        streamId: string;
        byteLength: number;
        durationMs: number;
    }): Promise<void>;
    emitPartialTranscript(input: WhisperTranscript): Promise<void>;
    emitFinalTranscript(input: WhisperTranscript): Promise<void>;
    triggerVad(input: {
        streamId: string;
        type: 'start' | 'end';
        timestampMs: number;
    }): Promise<void>;
}
```

#### `WhisperTranscript`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/whisper-streaming.ts#L15) `packages/realtime/src/semantics/whisper-streaming.ts`

Whisper streaming ASR axis — Whisper streaming API (OpenAI + local WhisperCPP) + partial transcript + Voice Activity Detection (VAD) trigger。 partial transcript は音声区切りごと、 final transcript は VAD end で確定。

```ts
export interface WhisperTranscript {
    streamId: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence: number;
}
```
<!-- kiwa-public-api:end -->
