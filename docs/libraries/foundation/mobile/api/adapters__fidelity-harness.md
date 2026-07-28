---
title: "@kiwa-lab/mobile adapters__fidelity-harness の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters&#95;&#95;fidelity-harness</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>runFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L18) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export declare function runFidelityCheck(axes: MobileAxis[], targets?: MobileTarget[]): Promise<FidelityDiff[]>;
```

#### <code v-pre>summarizeFidelity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L46) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export declare function summarizeFidelity(diffs: FidelityDiff[]): {
    total: number;
    matched: number;
    mismatched: number;
    perAxis: Array<{
        axis: MobileAxis;
        matched: number;
        total: number;
    }>;
};
```

### 型

#### <code v-pre>FidelityDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/fidelity-harness.ts#L9) <code v-pre>packages/mobile/src/adapters/fidelity-harness.ts</code>

```ts
export interface FidelityDiff {
    axis: MobileAxis;
    target: MobileTarget;
    neutralEventsMatch: boolean;
    completedMatch: boolean;
    mockNeutralEvents: string[];
    realNeutralEvents: string[];
}
```
