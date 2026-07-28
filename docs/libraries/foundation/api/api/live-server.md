---
title: "@kiwa-lab/api live-server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/api</code> <code v-pre>live-server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/api/src/live-server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startLiveServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/live-server.ts#L64) <code v-pre>packages/api/src/live-server.ts</code>

```ts
export declare function startLiveServer(source: ApiHandlerSource | NodeRequestHandler): Promise<LiveServerHandle>;
```

### 型

#### <code v-pre>LiveServerHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/live-server.ts#L58) <code v-pre>packages/api/src/live-server.ts</code>

```ts
export interface LiveServerHandle {
    baseUrl: string;
    port: number;
    close: () => Promise<void>;
}
```
