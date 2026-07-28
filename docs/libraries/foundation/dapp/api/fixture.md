---
title: "@kiwa-lab/dapp fixture の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>fixture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createRpcHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L472) <code v-pre>packages/dapp/src/fixture.ts</code>

```ts
export declare function createRpcHandler(ctx: RpcContext, tracker: InternalFixtures['_rpcTracker']): (request: {
    method: string;
    params?: unknown[];
}) => Promise<unknown>;
```

#### <code v-pre>dappE2eTest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L82) <code v-pre>packages/dapp/src/fixture.ts</code>

```ts
export declare const dappE2eTest: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & DappE2eOptions & DappE2eFixtures & InternalFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
```

#### <code v-pre>verifySignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L688) <code v-pre>packages/dapp/src/fixture.ts</code>

```ts
export declare function verifySignature(address: Hex, signature: Hex, message: string | {
    raw: Hex;
}): Promise<boolean>;
```

#### <code v-pre>waitForPendingRpcs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/fixture.ts#L331) <code v-pre>packages/dapp/src/fixture.ts</code>

```ts
export declare function waitForPendingRpcs(page: Page, pendingRpcs: Map<number, PendingRpcEntry>, timeoutMs?: number): Promise<void>;
```


