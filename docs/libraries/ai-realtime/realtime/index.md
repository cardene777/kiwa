# Realtime

`@kiwa-lab/realtime` は、Supabase Realtime、Ably、Pusher、Socket.IO を使うアプリケーションのイベント処理を、プロセス内で test するための adapter 群です。チャット、共同編集、通知のような画面では、接続できたことだけでは不十分です。どの channel または room に、どの event が、どの順番で届いたかを確認しないと、別の利用者へ誤配信する問題や event filter の取り違えを見逃します。

<img src="/images/kiwa-docs/ai-realtime/realtime-overview.webp" alt="channel と room の購読後に scenario の event が届く流れ" width="1672" height="941" loading="lazy" decoding="async">

この package は外部 socket を開きません。scenario と publish 操作から in-memory engine に event を入れ、各 provider の client 形状で handler まで届けます。したがって、アプリケーション側の購読、room 参加、event filter、payload の扱いを高速に固定できます。一方、実ネットワーク、provider authentication、server 側の presence 整合性、acknowledgement、server restart は対象外です。

## 選ぶ adapter

| 利用中のサービス | 作る mock | test で確認する状態 |
| --- | --- | --- |
| Supabase Realtime | `createSupabaseRealtimeMock` | channel、broadcast、presence、Postgres change filter |
| Ably | `createAblyMock` | channel、message name、presence、history |
| Pusher | `createPusherMock` | channel、event binding、presence membership |
| Socket.IO | `createSocketioMock` | namespace、socket、room、server push |

アプリケーションが実際に使う adapter を一つ選びます。同じ in-memory engine を使っていても、Supabase の event filter、Ably の message name、Pusher の binding、Socket.IO の room は交換できません。認可や購読解除を test するなら、利用中の SDK と同じ操作面で assertion してください。

## event を test する範囲

scenario は、購読後に届く event 列を固定します。たとえば「room-1 に参加した利用者へ chat broadcast が届く」「INSERT だけを Postgres change handler が受け取る」といった画面の契約を test にできます。直接 publish する場合は、同じ channel または room の handler だけが値を受けることを確認します。

`artificialLatencyMs` と scenario の `delay` は timer を使いますが、実 provider の遅延を測る値ではありません。test では任意の sleep を置かず、Vitest の fake timer を進めます。reconnect は設定した backoff の最初の待機だけを扱う簡易モデルです。delivery guarantee や network failure を証明するものではありません。

## 読み進める

[はじめる](./quickstart) では Supabase の broadcast を購読して、保存した test file を実行します。[使い方](./how-to) では四つの provider の event delivery を一つの recipe として確認します。設定、公開 API、fidelity report を調べるときは [リファレンス](./reference) を参照してください。永続イベントの broker は [Streaming](/libraries/ai-realtime/streaming/)、実行履歴は [Observability](/libraries/ai-realtime/observability/) を使います。
