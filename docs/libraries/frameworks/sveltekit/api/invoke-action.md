---
title: "@kiwa-lab/sveltekit invoke-action の API 契約"
---

# <code v-pre>@kiwa-lab/sveltekit</code> <code v-pre>invoke-action</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>fail</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L104) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export declare function fail(status: number, data: unknown): SvelteKitFailSignal;
```

#### <code v-pre>invokeAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L59) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export declare function invokeAction<TResult = unknown>(opts: InvokeActionOptions<TResult>): Promise<InvokeActionResult<TResult>>;
```

#### <code v-pre>SK&#95;FAIL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L12) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export declare const SK_FAIL_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>ActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L31) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export type ActionFunction<TResult = unknown> = (event: SimulatedActionEvent) => Promise<TResult> | TResult;
```

#### <code v-pre>InvokeActionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L33) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export interface InvokeActionOptions<TResult = unknown> {
    readonly action: ActionFunction<TResult>;
    readonly url: string;
    readonly formData?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly locals?: Record<string, unknown>;
    readonly method?: string;
}
```

#### <code v-pre>InvokeActionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L42) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export interface InvokeActionResult<TResult = unknown> {
    readonly result: TResult | undefined;
    readonly fail: SvelteKitFailSignal | null;
    readonly redirect: SvelteKitRedirectSignal | null;
    readonly error: unknown;
    readonly env: {
        readonly cookies: Map<string, string>;
    };
}
```

#### <code v-pre>SimulatedActionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L20) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export interface SimulatedActionEvent {
    readonly request: Request;
    readonly cookies: {
        get(name: string): string | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string): void;
    };
    readonly locals: Record<string, unknown>;
    readonly url: URL;
}
```

#### <code v-pre>SvelteKitFailSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/invoke-action.ts#L14) <code v-pre>packages/sveltekit/src/invoke-action.ts</code>

```ts
export interface SvelteKitFailSignal {
    readonly [SK_FAIL_SYMBOL]: true;
    readonly status: number;
    readonly data: unknown;
}
```
