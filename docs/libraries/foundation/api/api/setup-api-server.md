---
title: "@kiwa-lab/api setup-api-server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/api</code> <code v-pre>setup-api-server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupApiServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L15) <code v-pre>packages/api/src/setup-api-server.ts</code>

```ts
export declare function setupApiServer<TMode extends TestMode>(opts: SetupApiServerOptions<TMode>): Promise<ApiTestEnv>;
```


