---
title: "@kiwa-lab/dapp anvil の API 契約"
---

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>anvil</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>getFreePort</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L22) <code v-pre>packages/dapp/src/anvil.ts</code>

```ts
export declare function getFreePort(): Promise<number>;
```

#### <code v-pre>startAnvil</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L80) <code v-pre>packages/dapp/src/anvil.ts</code>

```ts
export declare function startAnvil(opts?: StartAnvilOptions): Promise<AnvilHandle>;
```

### 型

#### <code v-pre>AnvilHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L16) <code v-pre>packages/dapp/src/anvil.ts</code>

```ts
export interface AnvilHandle {
    port: number;
    pid: number;
    stop: () => Promise<void>;
}
```

#### <code v-pre>StartAnvilOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/anvil.ts#L67) <code v-pre>packages/dapp/src/anvil.ts</code>

```ts
export interface StartAnvilOptions {
    port?: number;
    chainId?: number;
    /** detach child so Node parent can exit while anvil keeps running (default: false) */
    detached?: boolean;
    /** kill existing anvil on the port before spawn (default: false) */
    killExistingOnPort?: boolean;
    /** path to pre-built state json to load at startup (anvil --load-state) */
    loadState?: string;
    /** path to write state json when anvil shuts down (anvil --dump-state) */
    dumpState?: string;
}
```
