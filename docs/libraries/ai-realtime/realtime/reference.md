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
| <code v-pre>0-RTT is not enabled for this connection</code> | [packages/realtime/src/semantics/quic-multiplex.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/quic-multiplex.ts#L154) |
| <code v-pre>data channel not open (state=$&#123;state&#125;)</code> | [packages/realtime/src/semantics/webrtc-data-channel.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webrtc-data-channel.ts#L122) |
| <code v-pre>bi stream not open (state=$&#123;state&#125;)</code> | [packages/realtime/src/semantics/webtransport-bi.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-bi.ts#L102) |
| <code v-pre>uni stream not open (state=$&#123;state&#125;)</code> | [packages/realtime/src/semantics/webtransport-uni.ts](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/webtransport-uni.ts#L95) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [ably.ts](./api/ably) | 1 | 6 |
| [engine.ts](./api/engine) | 1 | 0 |
| [fidelity.ts](./api/fidelity) | 3 | 5 |
| [index.ts](./api/index) | 1 | 1 |
| [pusher.ts](./api/pusher) | 1 | 4 |
| [real-driver.ts](./api/real-driver) | 3 | 3 |
| [report.ts](./api/report) | 1 | 1 |
| [semantics-fidelity.ts](./api/semantics-fidelity) | 3 | 4 |
| [semantics/http3-push.ts](./api/semantics-http3-push) | 1 | 3 |
| [semantics/moq-datagram-media.ts](./api/semantics-moq-datagram-media) | 1 | 2 |
| [semantics/moq-fetch.ts](./api/semantics-moq-fetch) | 1 | 3 |
| [semantics/quic-multiplex.ts](./api/semantics-quic-multiplex) | 1 | 4 |
| [semantics/realtime-ai-inference.ts](./api/semantics-realtime-ai-inference) | 1 | 3 |
| [semantics/session-orchestrator.ts](./api/semantics-session-orchestrator) | 3 | 4 |
| [semantics/simulcast-svc.ts](./api/semantics-simulcast-svc) | 1 | 2 |
| [semantics/types.ts](./api/semantics-types) | 0 | 7 |
| [semantics/voice-streaming.ts](./api/semantics-voice-streaming) | 1 | 3 |
| [semantics/webcodecs-decoder.ts](./api/semantics-webcodecs-decoder) | 1 | 2 |
| [semantics/webcodecs-encoder.ts](./api/semantics-webcodecs-encoder) | 1 | 3 |
| [semantics/webrtc-data-channel.ts](./api/semantics-webrtc-data-channel) | 1 | 3 |
| [semantics/webrtc-ice.ts](./api/semantics-webrtc-ice) | 1 | 4 |
| [semantics/webrtc-signaling.ts](./api/semantics-webrtc-signaling) | 1 | 3 |
| [semantics/webrtc-track.ts](./api/semantics-webrtc-track) | 1 | 4 |
| [semantics/webtransport-bi.ts](./api/semantics-webtransport-bi) | 1 | 3 |
| [semantics/webtransport-uni.ts](./api/semantics-webtransport-uni) | 1 | 2 |
| [semantics/whisper-streaming.ts](./api/semantics-whisper-streaming) | 1 | 2 |
| [socketio.ts](./api/socketio) | 1 | 3 |
| [supabase.ts](./api/supabase) | 1 | 9 |
| [types.ts](./api/types) | 0 | 16 |

<!-- kiwa-public-api:end -->
