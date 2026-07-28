# @kiwa-lab/state リファレンス

in-memory state store、action、subscription、extensionの公開APIです。

## store とdispatch

`createStore({ provider, initialState, reducer })` はstateのshallow copyとversion 0を持つstoreを作ります。providerの既定は `zustand` です。`setState` はpartial objectまたはupdaterの戻り値をshallow mergeし、必ずversionを一つ増やしてsubscriberへ同期通知します。

`dispatch(store, action)` は `{ action, prevState, nextState, version }` を返します。reducerがあればreducerを呼び、なければobject payloadをshallow mergeします。primitive payloadではstateを変えずにversionと通知だけを進めます。

## subscription とselector

`subscribe(store, listener)` は `{ listener, unsubscribe, callCount }` を返します。listenerは更新時だけ呼ばれます。unsubscribeはidempotentです。

`selectState(store, selector)` はselectorの戻り値を返すだけです。memoization、equality comparison、再計算抑制は行いません。

`mockAction(name)` はtype string、action creator、`match(action)`を持ちます。

## middleware とhistory

`composeMiddleware(...middlewares)` は順番にnextを呼ぶchainを作ります。同一middlewareがnextを二回呼ぶとthrowします。store dispatchへ自動適用されないため、返ったmiddlewareをapplicationのreducer経路で明示的に呼びます。

`createUndoRedoStack(initial, maxSize)` はcurrent、past、futureを管理します。maxSizeの既定は100です。undoまたはredoできない場合はundefinedを返します。

## persistence とretry

`createMemoryPersistence` はasync `save`、`load`、`remove` を持つadapterです。`createPersistedStore` はJSONでserializeします。restoreでinvalid JSONはundefinedです。

`retryWithBackoff(fn, { maxAttempts, initialDelayMs, backoffFactor })` は成功ならvalue、最終失敗ならerrorを含む `RetryResult` を返します。maxAttemptsが0以下ならfnを呼ばず `{ ok: false, attempts: 0, error: undefined }` を返します。

## observability

`createObservabilityHook` は `{ emit, events, clear }` を返します。eventは `{ kind, data }` です。`events()` はarray copy、`clear()` は蓄積を空にします。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>next() called multiple times</code> | [packages/state/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L14) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/state/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 4 |
| [dispatch.ts](./api/dispatch) | 1 | 2 |
| [extensions.ts](./api/extensions) | 6 | 7 |
| [mockAction.ts](./api/mockAction) | 1 | 1 |
| [selector.ts](./api/selector) | 1 | 1 |
| [subscribe.ts](./api/subscribe) | 1 | 3 |

<!-- kiwa-public-api:end -->
