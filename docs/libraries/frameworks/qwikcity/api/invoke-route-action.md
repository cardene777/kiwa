---
title: "@kiwa-lab/qwikcity invoke-route-action の API 契約"
---

# <code v-pre>@kiwa-lab/qwikcity</code> <code v-pre>invoke-route-action</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeRouteAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L67) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare function invokeRouteAction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown>(opts: InvokeRouteActionOptions<TFormValues, TResult>): Promise<InvokeRouteActionResult<TResult>>;
```

#### <code v-pre>QWIK&#95;FAIL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L9) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare const QWIK_FAIL_SYMBOL: unique symbol;
```

#### <code v-pre>QWIK&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L10) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export declare const QWIK_REDIRECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>InvokeRouteActionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L41) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface InvokeRouteActionOptions<TFormValues extends Record<string, unknown>, TResult> {
    readonly action: RouteActionFunction<TFormValues, TResult>;
    readonly formValues: TFormValues;
    readonly url?: string;
    readonly cookies?: Record<string, string>;
    readonly headers?: Record<string, string>;
}
```

#### <code v-pre>InvokeRouteActionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L49) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface InvokeRouteActionResult<TResult> {
    readonly result: TResult | undefined;
    readonly fail: QwikFailSignal | null;
    readonly redirect: QwikRedirectSignal | null;
    readonly error: unknown;
    readonly env: {
        readonly cookies: Map<string, string>;
        readonly requestHeaders: Map<string, string>;
    };
}
```

#### <code v-pre>QwikFailSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L12) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface QwikFailSignal {
    readonly [QWIK_FAIL_SYMBOL]: true;
    readonly status: number;
    readonly data: unknown;
}
```

#### <code v-pre>QwikRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L18) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface QwikRedirectSignal {
    readonly [QWIK_REDIRECT_SYMBOL]: true;
    readonly status: number;
    readonly location: string;
}
```

#### <code v-pre>RouteActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L36) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export type RouteActionFunction<TFormValues extends Record<string, unknown> = Record<string, unknown>, TResult = unknown> = (formValues: TFormValues, event: SimulatedActionEvent) => Promise<TResult | QwikFailSignal> | TResult | QwikFailSignal;
```

#### <code v-pre>SimulatedActionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/invoke-route-action.ts#L24) <code v-pre>packages/qwikcity/src/invoke-route-action.ts</code>

```ts
export interface SimulatedActionEvent {
    readonly url: URL;
    readonly cookie: {
        get(name: string): {
            value: string;
        } | null;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string, options?: Record<string, unknown>): void;
    };
    readonly headers: ReadonlyMap<string, string>;
    fail<T>(status: number, data: T): QwikFailSignal;
    redirect(status: number, location: string): never;
}
```
