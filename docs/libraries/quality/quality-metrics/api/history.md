---
title: "@kiwa-lab/quality-metrics history の API 契約"
---

# <code v-pre>@kiwa-lab/quality-metrics</code> <code v-pre>history</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L70) <code v-pre>packages/quality-metrics/src/history.ts</code>

Capture a point-in-time snapshot. Caller passes ISO timestamp + optional label. v0.5 = additive (既存 report 構造は変更しない)。

```ts
export declare function captureSnapshot(input: {
    report: QualityReport;
    capturedAt: string;
    label?: string;
}): MetricSnapshot;
```

#### <code v-pre>compareToBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L132) <code v-pre>packages/quality-metrics/src/history.ts</code>

Compare current snapshot to baseline. Per-axis delta + delta%. 両方 snapshot に共通する axis のみ compare、 片方 のみの axis は skip。

```ts
export declare function compareToBaseline(input: {
    current: MetricSnapshot;
    baseline: MetricSnapshot;
}): BaselineComparison;
```

#### <code v-pre>detectDrift</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L180) <code v-pre>packages/quality-metrics/src/history.ts</code>

Detect drift from a BaselineComparison. threshold = drift 判定 の 絶対値 delta%、 default 5.0 (5% 以上変動で drift 判定)。 category = axis 別 regression / improvement / stable 集計、 全体 category は regression &gt; 0 なら 'regression'、 improvement &gt; 0 && regression == 0 なら 'improvement'、 他は 'stable'。

```ts
export declare function detectDrift(input: {
    comparison: BaselineComparison;
    thresholdPct?: number;
}): DriftDetection;
```

#### <code v-pre>generateTrendReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L213) <code v-pre>packages/quality-metrics/src/history.ts</code>

Multi-snapshot trend report. snapshots は timeline 昇順で渡す前提。 各 axis の first / last / delta / trend を集計。

```ts
export declare function generateTrendReport(snapshots: MetricSnapshot[]): TrendReport;
```

### 型

#### <code v-pre>AxisDelta</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L25) <code v-pre>packages/quality-metrics/src/history.ts</code>

Per-axis delta between current and baseline.

```ts
export interface AxisDelta {
    axis: string;
    currentValue: number;
    baselineValue: number;
    delta: number;
    deltaPct: number;
}
```

#### <code v-pre>BaselineComparison</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L34) <code v-pre>packages/quality-metrics/src/history.ts</code>

Comparison between current snapshot and baseline snapshot.

```ts
export interface BaselineComparison {
    currentLabel: string | null;
    baselineLabel: string | null;
    axisDeltas: AxisDelta[];
}
```

#### <code v-pre>DriftCategory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L41) <code v-pre>packages/quality-metrics/src/history.ts</code>

Drift detection verdict category.

```ts
export type DriftCategory = 'regression' | 'improvement' | 'stable';
```

#### <code v-pre>DriftDetection</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L44) <code v-pre>packages/quality-metrics/src/history.ts</code>

Drift detection result for a single comparison.

```ts
export interface DriftDetection {
    category: DriftCategory;
    regressions: AxisDelta[];
    improvements: AxisDelta[];
    stable: AxisDelta[];
    threshold: number;
}
```

#### <code v-pre>MetricSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L15) <code v-pre>packages/quality-metrics/src/history.ts</code>

Time-point snapshot of QualityReport with fixed timestamp label.

```ts
export interface MetricSnapshot {
    /** ISO 8601 timestamp for the snapshot (caller-provided). */
    capturedAt: string;
    /** Optional label (e.g., "release-v1.65", "main-2026-07-08"). */
    label: string | null;
    /** Full quality report at capture time. */
    report: QualityReport;
}
```

#### <code v-pre>TrendReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/history.ts#L53) <code v-pre>packages/quality-metrics/src/history.ts</code>

Trend statistics across multiple snapshots.

```ts
export interface TrendReport {
    snapshotCount: number;
    firstLabel: string | null;
    lastLabel: string | null;
    axisSummary: {
        axis: string;
        first: number;
        last: number;
        delta: number;
        trend: 'up' | 'down' | 'flat';
    }[];
}
```
