---
title: "@kiwa-lab/quality-metrics threshold-learning の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>threshold-learning</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>learnAdaptiveThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L132) <code v-pre>packages/quality-metrics/src/threshold-learning.ts</code>

v2.1 メイン API = 過去 N snapshot から axis 別 の adaptive threshold を 学習する。 snapshots は timeline 昇順で渡す、 内部で consecutive delta の 分布を計算、 axis 別 mean + stdev から k*stdev 幅 の 推奨 threshold を出力。

```ts
export declare function learnAdaptiveThreshold(input: {
    snapshots: MetricSnapshot[];
    stdevMultiplier?: number;
    minSampleCount?: number;
}): AdaptiveThresholdReport;
```

#### <code v-pre>pickThresholdForAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L180) <code v-pre>packages/quality-metrics/src/threshold-learning.ts</code>

axis 名 が AdaptiveThresholdReport の perAxis に存在すれば 個別 threshold、 存在しなければ aggregate fallback を返す SSOT helper。 evaluateReleaseGate の driftThresholdPct 決定経路 と consumer の per-axis fallback lookup を 統一する。 axis 名 未指定 (undefined) の場合 は aggregate を返す (全体 fallback 用途)。

```ts
export declare function pickThresholdForAxis(report: AdaptiveThresholdReport, axis?: string): number;
```

### 型

#### <code v-pre>AdaptiveThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L27) <code v-pre>packages/quality-metrics/src/threshold-learning.ts</code>

axis 別 の adaptive threshold 学習結果。 mean + stdev + sampleCount で 学習 の 統計的信頼性 を verify 可能、 recommendedThresholdPct が最終出力。

```ts
export interface AdaptiveThreshold {
    axis: string;
    sampleCount: number;
    meanDeltaPct: number;
    stdevDeltaPct: number;
    /** mean + k * stdev の絶対値、 k は input.stdevMultiplier (default 2)。 */
    recommendedThresholdPct: number;
}
```

#### <code v-pre>AdaptiveThresholdReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/threshold-learning.ts#L37) <code v-pre>packages/quality-metrics/src/threshold-learning.ts</code>

全 axis 分 の 学習結果集計。 axis 名 → AdaptiveThreshold の map と 平均値。

```ts
export interface AdaptiveThresholdReport {
    perAxis: Record<string, AdaptiveThreshold>;
    /** 全 axis 平均 recommendedThresholdPct、 fallback threshold として使う。 */
    aggregateThresholdPct: number;
    usedSnapshotCount: number;
}
```
