# @kiwa-lab/query リファレンス

## client と key

`createQueryClient(options)` は `provider`、`defaultStaleMs`、`now` を受け取ります。provider の既定値は `tanstack`、stale 時間の既定値は六十秒です。client は cache、listener、`clear()`、`snapshot()` を持ちます。

`QueryKey` は string または string と number の配列です。string はそのまま、配列は JSON 文字列へ正規化されます。`snapshot()` は現在の `QueryState` の配列を返します。テストでは `now` に自前の clock を渡すと、stale 境界を待機なしで検証できます。`clear()` は cache だけでなく登録済み listener も消すため、複数 case で client を共有する場合は case の終了時だけ呼びます。

## 取得と無効化

`fetchQuery(client, key, queryFn, options)` は cache-first で動きます。`staleMs` はこの呼び出しだけの stale 時間、`force` は cache 状態にかかわらず再取得する指定です。成功時は data、`fromCache`、`fetchCount`、`staleAgeMs` を返し、失敗時は error state を cache に残して例外を投げます。stale でない success state だけが cache hit の対象です。loading、error、存在しない key は、`force` を指定しなくても query function を実行します。

`invalidateQuery(client, key)` は対象 key を消し、登録された listener へ fetch count がゼロの idle state を通知します。結果の `existed` は削除前に cache があったかを示します。

## mutation と subscription

`mutate(client, mutationFn, args, options)` は mutation function の result と、無効化した正規化 key の配列を返します。option の `onSuccess` は成功 result、`onError` は Error を受け取ります。`invalidateKeys` は mutation が成功してから順に処理されます。mutation function が reject したとき、`onError` を呼んだ後に同じ Error を再送出し、指定 key は無効化しません。

`subscribeToQuery(client, key, listener)` は `Subscription` を返します。`key` は正規化後の key、`unsubscribe` は listener を解除します。listener がなくなると client はその key の listener set を削除します。

## 拡張 API

`createInfiniteQuery` は page、next cursor、`fetchNextPage`、`reset` を管理します。生成直後に page はありません。`fetchNextPage()` を呼ぶたびに現在の cursor で一 page を取得し、`nextCursor` がないか `maxPages` に達すると `hasNextPage` は false になります。`reset()` は取得済み page を消し、initial cursor に戻します。

`createOptimisticUpdate` は optimistic value の apply、commit、rollback を提供する独立した state holder です。query client の cache とは自動同期しないため、成功時の invalidation と失敗時の rollback は呼び出し側で組み合わせます。

`prefetchQueries` は string key ごとに fetcher を指定 concurrency で実行し、成功と失敗を集計します。この関数は query client を受け取らず、client cache に値を保存しません。`retryWithBackoff` は既定で三回試し、最後まで失敗しても throw ではなく `ok: false` と最後の error を返します。`withTimeout` は指定時間で Promise を reject しますが、開始済みの処理を cancel はしません。`createObservabilityHook` は任意 event の in-memory 記録だけを提供し、外部 telemetry へ送信しません。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/query/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 6 |
| [extensions.ts](./api/extensions) | 6 | 8 |
| [fetch.ts](./api/fetch) | 1 | 3 |
| [invalidate.ts](./api/invalidate) | 1 | 1 |
| [mutation.ts](./api/mutation) | 1 | 3 |
| [subscription.ts](./api/subscription) | 1 | 2 |

<!-- kiwa-public-api:end -->
