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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/state/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>composeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L10) <code v-pre>packages/state/src/extensions.ts</code>

middleware chain — dispatch を wrap して logger / crash reporter / persistence を注入

```ts
export declare function composeMiddleware<S>(...middlewares: StateMiddleware<S>[]): StateMiddleware<S>;
```

#### <code v-pre>createMemoryPersistence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L73) <code v-pre>packages/state/src/extensions.ts</code>

in-memory persistence adapter (localStorage / AsyncStorage 相当)

```ts
export declare function createMemoryPersistence(): PersistenceAdapter;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L129) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createPersistedStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L89) <code v-pre>packages/state/src/extensions.ts</code>

persist store to adapter with serialization

```ts
export declare function createPersistedStore<S>(key: string, adapter: PersistenceAdapter): PersistedStore<S>;
```

#### <code v-pre>createStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L29) <code v-pre>packages/state/src/client.ts</code>

```ts
export declare function createStore<S extends object>(options: StateStoreOptions<S>): StateStore<S>;
```

#### <code v-pre>createUndoRedoStack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L34) <code v-pre>packages/state/src/extensions.ts</code>

undo/redo stack — history persistence + timeline navigation

```ts
export declare function createUndoRedoStack<S>(initial?: S, maxSize?: number): UndoRedoStack<S>;
```

#### <code v-pre>dispatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L19) <code v-pre>packages/state/src/dispatch.ts</code>

provider 別 dispatch。 Redux reducer / Zustand setState / Jotai atom write / Valtio proxy mutation / MobX action の 5 経路を統一 interface で叩く。

```ts
export declare function dispatch<S extends object>(store: StateStore<S>, action: Action): DispatchResult<S>;
```

#### <code v-pre>mockAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/mockAction.ts#L12) <code v-pre>packages/state/src/mockAction.ts</code>

action creator mock。 Redux Toolkit createAction 相当、 type 判定 helper (match) を含む。

```ts
export declare function mockAction<P = unknown>(name: string): MockActionCreator<P>;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L105) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>selectState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/selector.ts#L9) <code v-pre>packages/state/src/selector.ts</code>

store から state slice を抽出。 Zustand selector / Redux useSelector / Jotai atom read / Valtio snapshot read / MobX computed 相当。

```ts
export declare function selectState<S extends object, R>(store: StateStore<S>, selector: Selector<S, R>): R;
```

#### <code v-pre>subscribe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L16) <code v-pre>packages/state/src/subscribe.ts</code>

store の state 変更に listener を登録。 unsubscribe 関数と callCount helper を返却。 Redux subscribe / Zustand subscribe / Jotai atom subscribe / Valtio subscribe / MobX autorun 相当。

```ts
export declare function subscribe<S extends object>(store: StateStore<S>, listener: StateListener<S>): Subscription<S>;
```

### 型

#### <code v-pre>Action</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L3) <code v-pre>packages/state/src/dispatch.ts</code>

```ts
export interface Action {
    type: string;
    payload?: unknown;
}
```

#### <code v-pre>DispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/dispatch.ts#L8) <code v-pre>packages/state/src/dispatch.ts</code>

```ts
export interface DispatchResult<S extends object> {
    action: Action;
    prevState: S;
    nextState: S;
    version: number;
}
```

#### <code v-pre>MockActionCreator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/mockAction.ts#L3) <code v-pre>packages/state/src/mockAction.ts</code>

```ts
export interface MockActionCreator<P = unknown> {
    type: string;
    (payload?: P): Action;
    match: (action: Action) => boolean;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L123) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
    }>;
    clear: () => void;
}
```

#### <code v-pre>PersistedStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L82) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface PersistedStore<S> {
    save: (state: S) => Promise<void>;
    restore: () => Promise<S | undefined>;
    clear: () => Promise<void>;
}
```

#### <code v-pre>PersistenceAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L66) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface PersistenceAdapter {
    save: (key: string, value: string) => Promise<void>;
    load: (key: string) => Promise<string | null>;
    remove: (key: string) => Promise<void>;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L102) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L103) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>Selector</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/selector.ts#L3) <code v-pre>packages/state/src/selector.ts</code>

```ts
export type Selector<S extends object, R> = (state: S) => R;
```

#### <code v-pre>StateListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L4) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export type StateListener<S extends object> = (state: S) => void;
```

#### <code v-pre>StateMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L7) <code v-pre>packages/state/src/extensions.ts</code>

v2.1 extensions — middleware chain, undo/redo, persistence, plus retry/batch/observability/timeout generics. Zustand v5 / Redux Toolkit v2 追随。

```ts
export type StateMiddleware<S> = (state: S, action: {
    type: string;
    payload?: unknown;
}, next: () => S) => S;
```

#### <code v-pre>StateProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L3) <code v-pre>packages/state/src/client.ts</code>

```ts
export type StateProvider = 'zustand' | 'redux' | 'jotai' | 'valtio' | 'mobx';
```

#### <code v-pre>StateSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L11) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateSnapshot<S extends object> {
    provider: StateProvider;
    state: S;
    version: number;
}
```

#### <code v-pre>StateStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L17) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateStore<S extends object> {
    provider: StateProvider;
    getState: () => S;
    setState: (updater: Partial<S> | ((prev: S) => Partial<S>)) => void;
    getSnapshot: () => StateSnapshot<S>;
    _subscribers: Set<StateListener<S>>;
    _reducer?: (state: S, action: {
        type: string;
        payload?: unknown;
    }) => S;
    _addSubscriber: (listener: StateListener<S>) => Unsubscribe;
    _notify: () => void;
    _incrementVersion: () => void;
}
```

#### <code v-pre>StateStoreOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/client.ts#L5) <code v-pre>packages/state/src/client.ts</code>

```ts
export interface StateStoreOptions<S extends object> {
    provider?: StateProvider;
    initialState: S;
    reducer?: (state: S, action: {
        type: string;
        payload?: unknown;
    }) => S;
}
```

#### <code v-pre>Subscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L6) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export interface Subscription<S extends object> {
    listener: StateListener<S>;
    unsubscribe: Unsubscribe;
    callCount: () => number;
}
```

#### <code v-pre>UndoRedoStack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L23) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export interface UndoRedoStack<S> {
    push: (state: S) => void;
    undo: () => S | undefined;
    redo: () => S | undefined;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clear: () => void;
    size: () => {
        past: number;
        future: number;
    };
}
```

#### <code v-pre>Unsubscribe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/subscribe.ts#L3) <code v-pre>packages/state/src/subscribe.ts</code>

```ts
export type Unsubscribe = () => void;
```
<!-- kiwa-public-api:end -->
