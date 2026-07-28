---
title: "@kiwa-lab/nuxt invoke-nitro-plugin の API 契約"
---

# <code v-pre>@kiwa-lab/nuxt</code> <code v-pre>invoke-nitro-plugin</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeNitroPlugin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L65) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

Invoke a Nitro plugin setup in isolation and return the hooks it registered + a `callHook` driver to fire them with synthetic payloads.

```ts
export declare function invokeNitroPlugin(opts: InvokeNitroPluginOptions): Promise<InvokeNitroPluginResult>;
```

### 型

#### <code v-pre>InvokeNitroPluginOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L39) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface InvokeNitroPluginOptions {
    readonly plugin: NitroPlugin;
    /**
     * Optional local fetch hook to expose on the simulated NitroApp. Useful when
     * the plugin under test reaches `nitroApp.localFetch(req)`.
     */
    readonly localFetch?: (request: Request) => Promise<Response>;
}
```

#### <code v-pre>InvokeNitroPluginResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L54) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface InvokeNitroPluginResult {
    readonly registered: RegisteredHook[];
    readonly callHook: <TPayload = unknown>(name: NitroHookName, payload: TPayload) => Promise<void>;
    readonly callHookErrors: Array<{
        readonly name: NitroHookName;
        readonly error: unknown;
    }>;
    readonly error: unknown;
}
```

#### <code v-pre>NitroHookHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L24) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroHookHandler<TPayload = unknown> = (payload: TPayload) => Promise<void> | void;
```

#### <code v-pre>NitroHookName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L15) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroHookName = 'request' | 'beforeResponse' | 'afterResponse' | 'error' | 'render:html' | 'render:response' | 'close';
```

#### <code v-pre>NitroPlugin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L37) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export type NitroPlugin = (nitroApp: SimulatedNitroApp) => Promise<void> | void;
```

#### <code v-pre>RegisteredHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L48) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface RegisteredHook {
    readonly name: NitroHookName;
    readonly handler: NitroHookHandler;
    readonly once: boolean;
}
```

#### <code v-pre>SimulatedNitroApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/invoke-nitro-plugin.ts#L26) <code v-pre>packages/nuxt/src/invoke-nitro-plugin.ts</code>

```ts
export interface SimulatedNitroApp {
    readonly hooks: {
        hook<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
        callHook<TPayload = unknown>(name: NitroHookName, payload: TPayload): Promise<void>;
        hookOnce<TPayload = unknown>(name: NitroHookName, handler: NitroHookHandler<TPayload>): void;
        removeHook(name: NitroHookName, handler: NitroHookHandler): void;
    };
    readonly localFetch?: (request: Request) => Promise<Response>;
    readonly h3App: unknown;
}
```
