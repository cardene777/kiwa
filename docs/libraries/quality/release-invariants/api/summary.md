---
title: "@kiwa-lab/release-invariants summary の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/release-invariants</code> <code v-pre>summary</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/summary.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildReleaseInvariantsSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/summary.ts#L21) <code v-pre>packages/release-invariants/src/summary.ts</code>

Build the 3-invariant summary in one shot. `ok` is the AND of every invariant — a caller (usually a release-smoke suite) can short-circuit on this single boolean.

```ts
export declare function buildReleaseInvariantsSummary(input: BuildReleaseInvariantsSummaryInput): ReleaseInvariantsSummary;
```

### 型

#### <code v-pre>BuildReleaseInvariantsSummaryInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/release-invariants/src/summary.ts#L10) <code v-pre>packages/release-invariants/src/summary.ts</code>

```ts
export interface BuildReleaseInvariantsSummaryInput {
    releaseScript: string;
    mutationGateScript: string;
    publishable: PublishablePackage[];
}
```
