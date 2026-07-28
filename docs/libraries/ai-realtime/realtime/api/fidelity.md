---
title: "@kiwa-lab/realtime fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createMockCollector</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L150) <code v-pre>packages/realtime/src/fidelity.ts</code>

便利 helper — RealtimeMock を CollectedEvent stream に変換する minimum driver。 scenario 実装は user 側だが、 event collector は本 helper 経由で共通化できる。

```ts
export declare function createMockCollector(mock: RealtimeMock, expectedEvents: number): {
    driver: RealtimeDriver;
    collected: CollectedEvent[];
};
```

#### <code v-pre>runRealtimeFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L74) <code v-pre>packages/realtime/src/fidelity.ts</code>

```ts
export declare function runRealtimeFidelityCheck(input: RealtimeFidelityInput): Promise<RealtimeFidelityReport>;
```

#### <code v-pre>sequenceSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L126) <code v-pre>packages/realtime/src/fidelity.ts</code>

順序考慮 sequence similarity — LCS 系ではなく position-aware Jaccard で 計算する。 完全一致 = 1、 順序ずれ = 中間値、 完全不一致 = 0。

```ts
export declare function sequenceSimilarity<T>(a: T[], b: T[]): number;
```

### 型

#### <code v-pre>CollectedEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L26) <code v-pre>packages/realtime/src/fidelity.ts</code>

driver から返される event の統一形式。 provider 別詳細は payload に格納。

```ts
export interface CollectedEvent {
    kind: RealtimeAnyEvent['kind'];
    channel?: string;
    event?: string;
    payload?: unknown;
    order: number;
    /** 集計開始からの相対 ms (ordering 検証用)。 */
    relativeTimeMs: number;
}
```

#### <code v-pre>RealtimeDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L19) <code v-pre>packages/realtime/src/fidelity.ts</code>

単一 scenario の driver — real 側 driver / mock 側 driver 両方に同じ shape で実装。

```ts
export interface RealtimeDriver {
    /** 期待する event 数だけ collect する。 timeout で強制終了。 */
    runScenario(scenarioId: string): Promise<CollectedEvent[]>;
    reset(): void;
}
```

#### <code v-pre>RealtimeFidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L36) <code v-pre>packages/realtime/src/fidelity.ts</code>

```ts
export interface RealtimeFidelityInput {
    realDriver: RealtimeDriver;
    mockDriver: RealtimeDriver;
    /** 実行する scenario 名リスト。 */
    scenarios: string[];
    /** 1 scenario あたりの timeout (ms、 default 3000)。 */
    perScenarioTimeoutMs?: number;
}
```

#### <code v-pre>RealtimeFidelityRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L45) <code v-pre>packages/realtime/src/fidelity.ts</code>

```ts
export interface RealtimeFidelityRecord {
    scenarioId: string;
    real: CollectedEvent[];
    mock: CollectedEvent[];
    /** event 数の差 (real - mock)。 */
    eventCountDiff: number;
    /** kind 列の順序一致率 0-1。 */
    kindOrderMatch: number;
    /** payload / event 名の一致率 0-1。 */
    payloadMatch: number;
    /** 総合 accuracy score 0-1 (順序 * payload の平均)。 */
    accuracyScore: number;
    /** 集計開始からの合計時間差 (ms)。 */
    totalDurationDiffMs: number;
}
```

#### <code v-pre>RealtimeFidelityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts#L61) <code v-pre>packages/realtime/src/fidelity.ts</code>

```ts
export interface RealtimeFidelityReport {
    records: RealtimeFidelityRecord[];
    summary: {
        scenarios: number;
        avgAccuracyScore: number;
        avgEventCountDiff: number;
        avgKindOrderMatch: number;
        avgPayloadMatch: number;
        avgTotalDurationDiffMs: number;
        accuracyMethod: 'sequence-jaccard';
    };
}
```
