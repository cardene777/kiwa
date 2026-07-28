---
title: "@kiwa-lab/ruby generic の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ruby</code> <code v-pre>generic</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/generic.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatchGenericRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/generic.ts#L13) <code v-pre>packages/ruby/src/generic.ts</code>

Sinatra / Roda / Hanami の統一 request dispatch。 routes を lookup し、 matched なら handler 実行、 unmatched なら 404 相当 default response を返す。

```ts
export declare function dispatchGenericRequest(env: RubyAppEnv, req: RubyRequest): Promise<GenericDispatchResult>;
```

### 型

#### <code v-pre>GenericDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/generic.ts#L3) <code v-pre>packages/ruby/src/generic.ts</code>

```ts
export interface GenericDispatchResult {
    response: RubyResponse;
    matched: boolean;
    framework: RubyAppEnv['framework'];
}
```
