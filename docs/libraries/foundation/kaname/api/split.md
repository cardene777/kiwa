---
title: "@kiwa-lab/kaname split の API 契約"
---

# <code v-pre>@kiwa-lab/kaname</code> <code v-pre>split</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/split.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>splitSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/split.ts#L52) <code v-pre>packages/kaname/src/split.ts</code>

Split a SpecDoc into two paired markdown files: - `specFormal.md` → items with `layer === 'formal'` - `specRuntime.md` → items with `layer === 'runtime'` or `'human'` The intent is that a caller writes each acceptance criterion once, tags it with the layer that will verify it, and gets two files back that never disagree with each other. If the caller wants the same idea verified in two places, they must write two separate items (with distinct verifyBy targets), so the "written but never verified" silent gap is impossible.

```ts
export declare function splitSpec(doc: SpecDoc): SplitResult;
```


