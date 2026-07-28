---
title: "@kiwa-lab/kaname classify の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/kaname</code> <code v-pre>classify</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/classify.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>classify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/classify.ts#L16) <code v-pre>packages/kaname/src/classify.ts</code>

Statically classify a SpecDoc and surface layer-model violations. Rules enforced: 1. every item must have a non-empty statement 2. every item must have a non-empty verifyBy target 3. every item must declare a known layer (formal / runtime / human) 4. every item id is unique within the doc 5. no formal item may reuse a verifyBy target that a runtime item also names (this catches the "specified twice, verified nowhere" pattern where the author put the same acceptance criterion in both layers hoping one side would catch it — always ends in a silent gap).

```ts
export declare function classify(doc: SpecDoc): ClassifyReport;
```


