---
title: "@kiwa-lab/security fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>reasonSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L112) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function reasonSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

#### <code v-pre>runSecurityFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L55) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function runSecurityFidelityCheck(input: SecurityFidelityInput): Promise<SecurityFidelityReport>;
```

#### <code v-pre>SECURITY&#95;FIDELITY&#95;GRID</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L164) <code v-pre>packages/security/src/fidelity.ts</code>

32 grid の全 combination を SSOT で列挙 — provider x axis の どの組合せが fidelity harness の一次対象か明示する。

```ts
export declare const SECURITY_FIDELITY_GRID: {
    provider: SecurityProvider;
    axis: SecurityAxis;
}[];
```

#### <code v-pre>verdictSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L102) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function verdictSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

### 型

#### <code v-pre>SecurityFidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L18) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export interface SecurityFidelityInput {
    provider: SecurityProvider;
    axis: SecurityAxis;
    realDriver: SecurityDriver;
    mockDriver: SecurityDriver;
    scenarios: string[];
    perScenarioTimeoutMs?: number;
}
```

#### <code v-pre>SecurityFidelityRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L27) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export interface SecurityFidelityRecord {
    scenarioId: string;
    provider: SecurityProvider;
    axis: SecurityAxis;
    real: SecurityEvent[];
    mock: SecurityEvent[];
    /** event 数の差 (real - mock)。 */
    eventCountDiff: number;
    /** verdict 一致率 0-1 (real と mock の verdict 列)。 */
    verdictMatch: number;
    /** reason 一致率 0-1 (loose match)。 */
    reasonMatch: number;
    /** 総合 accuracy score 0-1 (verdict * reason の平均)。 */
    accuracyScore: number;
}
```

#### <code v-pre>SecurityFidelityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L43) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export interface SecurityFidelityReport {
    records: SecurityFidelityRecord[];
    summary: {
        scenarios: number;
        avgAccuracyScore: number;
        avgEventCountDiff: number;
        avgVerdictMatch: number;
        avgReasonMatch: number;
        accuracyMethod: 'sequence-jaccard';
    };
}
```
