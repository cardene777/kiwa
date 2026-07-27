# @kiwa-lab/websocket

`@kiwa-lab/websocket` は、WebSocket の client、server、message、room、frame を process 内で検証する harness です。ws、uWebSockets、Socket.IO、Colyseus の provider 名を保持しますが、実 socket、network 遅延、provider 固有 protocol は起動しません。

![WebSocketの個別送信とbroadcastが各clientのinboxへ届く流れ](/images/kiwa-docs/services/websocket-overview.png)

## 配送先と接続状態を分けて確認する

server は接続 client と broadcast record を持ちます。server からの broadcast は現在の client list へ配送され、client からの `send` は server の `onMessage` handler を呼びますが、他の client には自動配送されません。room registry は server と独立しているため、disconnect 後に member を残すかをアプリケーションで決める必要があります。

`client.close()` は client を closed にしても server の list から外しません。`server.disconnect(id)` は list から外し、close handler を呼びます。この違いを test すると、切断 UI と cleanup の責任を混同せずに扱えます。

## 実 transport と分ける範囲

binary frame、reconnect backoff、heartbeat は簡易的な state として確認できます。WebSocket handshake、TLS、fragmentation、backpressure、browser reconnect、Socket.IO acknowledgement は対象外です。実 runtime と browser を使う integration test を追加してください。

## 読み進める

[Quickstart](./quickstart) で broadcast と client message を確認します。[使い方](./how-to) で private message、room、disconnect、frame を扱います。API の詳細は [リファレンス](./reference) にあります。
