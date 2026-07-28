---
title: "@kiwa-lab/lean table の API 契約"
---

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>table</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/table.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>Table</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/table.ts#L15) <code v-pre>packages/lean/src/table.ts</code>

`null` marks a rejected cell; a string is the target state.

```ts
export type Table = ReadonlyMap<string, string | null>;
```
