---
title: "@kiwa-lab/desktop adapters__fidelity-harness の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;fidelity-harness</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>runFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L89) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export declare function runFidelityCheck(input: {
    scanIdPrefix?: string;
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
}): Promise<FidelityDiff[]>;
```

#### <code v-pre>runFidelityCheckWithProbe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L186) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export declare function runFidelityCheckWithProbe(input: {
    scanIdPrefix?: string;
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
}): Promise<FidelityCheckWithProbeResult>;
```

#### <code v-pre>summarizeFidelity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L130) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export declare function summarizeFidelity(diffs: FidelityDiff[]): FidelitySummary;
```

#### <code v-pre>summarizeFidelityBehaviorDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L226) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export declare function summarizeFidelityBehaviorDiff(diffs: FidelityDiff[]): FidelityBehaviorSummary;
```

### 型

#### <code v-pre>FidelityBehaviorSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L156) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

v0.7 behavior diff summary — shape 契約 preserving (matched=true) を保ったまま、 mock/real で異なる behavior (metadata + duration) を per-axis で集計。 v1.62+ real 実装後の behavior drift を early warning 検知する経路。

```ts
export interface FidelityBehaviorSummary {
    total: number;
    axesWithBehaviorDiff: DesktopAxis[];
    totalMetadataDiffs: number;
    perAxis: Record<DesktopAxis, {
        metadataDiffCount: number;
        maxDurationDiffMs: number;
        hasBehaviorDiff: boolean;
    }>;
}
```

#### <code v-pre>FidelityCheckWithProbeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L181) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export interface FidelityCheckWithProbeResult {
    diffs: FidelityDiff[];
    skippedPairs: SkippedPair[];
}
```

#### <code v-pre>FidelityDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L14) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export interface FidelityDiff {
    axis: DesktopAxis;
    target: DesktopTarget;
    mockEvents: NeutralEventName[];
    realEvents: NeutralEventName[];
    matched: boolean;
    mockCompleted: boolean;
    realCompleted: boolean;
    /** v0.7: mock/real の metadata 差異検知 (step 別) */
    metadataDiffs: MetadataDiff[];
    /** v0.7: mock/real の duration 差異 (絶対値 ms) */
    durationDiffMs: number;
}
```

#### <code v-pre>FidelitySummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L122) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export interface FidelitySummary {
    total: number;
    matched: number;
    unmatched: number;
    matchedRatio: number;
    perAxis: Record<DesktopAxis, {
        matched: number;
        total: number;
    }>;
}
```

#### <code v-pre>MetadataDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L28) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

```ts
export interface MetadataDiff {
    stepIndex: number;
    neutralEvent: NeutralEventName;
    key: string;
    mockValue: string | number | boolean | undefined;
    realValue: string | number | boolean | undefined;
}
```

#### <code v-pre>SkippedPair</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/fidelity-harness.ts#L175) <code v-pre>packages/desktop/src/adapters/fidelity-harness.ts</code>

v0.8 = probe integration 経路の fidelity check。 shouldSkipAxis で skip 判定された pair は skippedPairs に記録、 diffs から除外。 shape 契約 preserving 絶対維持 = skip 経路は skippedPairs 経由で追跡可能。

```ts
export interface SkippedPair {
    axis: DesktopAxis;
    target: DesktopTarget;
    reason: string;
}
```
