---
title: "@kiwa-lab/state extensions の API 契約"
---

# <code v-pre>@kiwa-lab/state</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

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

#### <code v-pre>createUndoRedoStack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L34) <code v-pre>packages/state/src/extensions.ts</code>

undo/redo stack — history persistence + timeline navigation

```ts
export declare function createUndoRedoStack<S>(initial?: S, maxSize?: number): UndoRedoStack<S>;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L105) <code v-pre>packages/state/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

### 型

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

#### <code v-pre>StateMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/state/src/extensions.ts#L7) <code v-pre>packages/state/src/extensions.ts</code>

v2.1 extensions — middleware chain, undo/redo, persistence, plus retry/batch/observability/timeout generics. Zustand v5 / Redux Toolkit v2 追随。

```ts
export type StateMiddleware<S> = (state: S, action: {
    type: string;
    payload?: unknown;
}, next: () => S) => S;
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
