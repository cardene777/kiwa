# @kiwa-lab/websocket リファレンス

in-process WebSocket server、client、message、binary frame、reconnect、roomの公開APIです。

## server と client

`createWSServer({ provider, now, idSeed })` は server を作ります。providerの既定値は `ws` で、id prefixだけがproviderごとに変わります。`now` はsent recordの`sentAt`を固定するtestで使います。

`connectClient(server, { id, now })` はclientを直ちにserverへacceptします。id未指定ならserverがprovider prefix付きのidを生成します。

| API | 内容 |
| --- | --- |
| `server.clients()` | 現在のclients listのcopy |
| `server.disconnect(id)` | listから外し、clientをclosedにする |
| `server.broadcast(payload)` | clients listの全clientへ配送しsent recordを残す |
| `server.listSent()` | sent recordのcopy |
| `server.clear()` | sent recordとclients listを空にする。client自身はclosedにしない |
| `server.on(event, handler)` | 同じeventのhandlerを上書きする |
| `client.send(payload)` | serverのonMessageへ通知し、client送信recordを残す |
| `client.close(code, reason)` | clientをclosedにしclose handlerを呼ぶ。serverからは外さない |

`onConnect`、`onDisconnect`、`onMessage`は一eventにつき一handlerです。複数のhandlerを登録するevent emitterではありません。

## message

`WSPayload` は string、Uint8Array、または `{ type, data }` objectです。

`sendMessage` はserverからtarget clientへ配送するか、clientからserverのonMessageへ送ります。server targetにnullを渡すとserver.broadcastを呼びます。`broadcastMessage(server, payload, filter)` はfilterなしならserver.broadcast、filterありなら一致clientにだけ配送します。

## binary frame

`encodeBinaryFrame(opcode, payload)` はFINを立てたunmasked frameを作ります。`reserved` opcodeはbinaryとしてencodeします。

`captureBinaryFrame(frame)` はFIN、opcode、mask、payload length、payloadを返します。frameが2byte未満ならthrowします。extended length 127は最大32bit相当だけを読む簡易実装です。

## reconnect と heartbeat

`computeReconnectDelay(attempt, policy, rng)` は指数backoffを返します。jitter有効時はbaseの50%から100%に乱数を掛けます。

`createHeartbeatState(now)` はmutableなstateと`ping`、`pong`、`check`を返します。outstanding pingの経過がthresholdを超えたcheckだけがmissed countを増やし、countがmaxMissed以上ならhealthyをfalseにします。

## room

`createRoomRegistry(now)` はroomごとのmember mapを管理します。`join`は同じclient idのentryを置き換え、`leave`で最後のmemberが抜けるとroomを削除します。presence metadataは現在join APIから指定できないため、`presenceOf`で返るmetadataはundefinedです。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>frame too short</code> | [packages/websocket/src/binary.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L25) |
| <code v-pre>client $&#123;id&#125; is closed</code> | [packages/websocket/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L39) |
| <code v-pre>client $&#123;id&#125; not attached to server</code> | [packages/websocket/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L40) |
| <code v-pre>client not found: $&#123;clientId&#125;</code> | [packages/websocket/src/message.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L25) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [binary.ts](./api/binary) | 2 | 2 |
| [client.ts](./api/client) | 1 | 4 |
| [message.ts](./api/message) | 2 | 2 |
| [reconnect.ts](./api/reconnect) | 2 | 3 |
| [room.ts](./api/room) | 1 | 2 |
| [server.ts](./api/server) | 1 | 5 |

<!-- kiwa-public-api:end -->
