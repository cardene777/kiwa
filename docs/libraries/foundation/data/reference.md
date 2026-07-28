# @kiwa-lab/data リファレンス

in-memory queue、fake clock、delivery assertionの公開APIです。

## setupQueueEnv

`setupQueueEnv({ mode, maxReceiveCount, seed })` は `{ mode, client, stop }` を返します。modeは `mock` または `live` が必須で、いずれも同じin-memory queueです。未知のmodeはrejectします。

| option | 既定 | 内容 |
| --- | --- | --- |
| `maxReceiveCount` | 5 | ackされないentryをDLQへ移すreceive count |
| `seed` | なし | setup時にsendするbodyの配列 |

`QueueClient` の `send` はstring idを返し、`receive` はqueue先頭を取り出してreceive countを増やします。`consume` はunsubscribe functionを返します。`size` はqueue length、`dlqSize` はDLQ length、`drainDlq` はDLQ内容を返して空にします。

consumerのackはentryを完了にします。nackまたはackなしは再queueされ、上限到達でDLQへ移ります。dedup keyはqueue内にある間だけ重複sendを防ぎ、ackまたはDLQ移動で解放されます。

## fake clock

`createFakeClock({ startMs })` は `nowMs`、`advanceMs`、`schedule`、`unschedule`、`pendingEntries` を返します。scheduleはinterval taskにstring idを付け、advanceはtarget時刻までの発火を順にawaitします。

`pendingEntries()` はentries arrayのcopyを返しますが、entry object自体は同じobjectです。戻り値のentryを変更しないでください。

## assertion helper

`expectIdempotent(client, body, { dedupKey }, expect)` は同じkeyの二回sendがsizeを一つだけ増やすことを確認します。`expectAtLeastOnce(client, body, minTimes, expect)` はnack後にminTimes回以上呼ばれたことを確認してinvocation countを返します。どちらも最後にVitestの `expect` を渡します。

## 制約

このadapterはvisibility timeout、delayed delivery、parallel consumer、external providerのdelivery guaranteeを実装しません。`mode: "live"` もnetwork接続を作りません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>createFakeClock.schedule: intervalMs must be &gt; 0, got $&#123;intervalMs&#125;</code> | [packages/data/src/fake-clock.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L17) |
| <code v-pre>createFakeClock.advanceMs: ms must be &gt;= 0, got $&#123;ms&#125;</code> | [packages/data/src/fake-clock.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/fake-clock.ts#L30) |
| <code v-pre>setupQueueEnv: mode must be "mock" or "live", got $&#123;String(opts.mode)&#125;</code> | [packages/data/src/queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/data/src/queue.ts#L133) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/data/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [expectations.ts](./api/expectations) | 2 | 1 |
| [fake-clock.ts](./api/fake-clock) | 1 | 1 |
| [queue.ts](./api/queue) | 1 | 0 |
| [types.ts](./api/types) | 0 | 8 |

<!-- kiwa-public-api:end -->
