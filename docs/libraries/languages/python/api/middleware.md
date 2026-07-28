---
title: "@kiwa-lab/python middleware の API 契約"
---

# <code v-pre>@kiwa-lab/python</code> <code v-pre>middleware</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/python/src/middleware.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureMiddlewareCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/middleware.ts#L13) <code v-pre>packages/python/src/middleware.ts</code>

dispatch 経由で invoke された middleware の呼出履歴を返す。 middleware chain の順序 / 呼出回数 / 対象 path を assertion するための API。

```ts
export declare function captureMiddlewareCall(env: PythonAppEnv): MiddlewareCall[];
```

### 型

#### <code v-pre>MiddlewareCall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/middleware.ts#L3) <code v-pre>packages/python/src/middleware.ts</code>

```ts
export interface MiddlewareCall {
    name: string;
    path: string;
    at: number;
}
```
