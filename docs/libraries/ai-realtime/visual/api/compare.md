---
title: "@kiwa-lab/visual compare の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/visual</code> <code v-pre>compare</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>comparePngBuffers</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L41) <code v-pre>packages/visual/src/compare.ts</code>

```ts
export declare function comparePngBuffers(baseline: Buffer, actual: Buffer, opts?: CompareOptions): Promise<CompareResult>;
```

#### <code v-pre>expectNoVisualDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/compare.ts#L76) <code v-pre>packages/visual/src/compare.ts</code>

```ts
export declare function expectNoVisualDiff(result: CompareResult, expect: {
    (actual: unknown): {
        toBe: (expected: unknown) => void;
    };
}): void;
```


