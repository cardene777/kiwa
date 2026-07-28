---
title: "@kiwa-lab/security threat-model の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>threat-model</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>detectBoundaryCrossings</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L164) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function detectBoundaryCrossings(zones: TrustZone[], flows: DataFlow[], membership: Map<string, string>): BoundaryCrossing[];
```

#### <code v-pre>pastaCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L68) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function pastaCoverage(findings: PastaFinding[]): {
    overallCompleteness: number;
    perStage: Record<PastaStage, number>;
    gaps: PastaStage[];
};
```

#### <code v-pre>scoreDread</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L116) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function scoreDread(input: DreadInput): DreadResult;
```

#### <code v-pre>scoreStride</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L29) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function scoreStride(threats: StrideThreat[]): {
    total: number;
    byCategory: Record<StrideCategory, number>;
    highest: StrideThreat | null;
};
```

#### <code v-pre>toThreatModelEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L201) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function toThreatModelEvent(input: {
    provider: 'coraza' | 'helmet';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

### 型

#### <code v-pre>BoundaryCrossing</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L156) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface BoundaryCrossing {
    flow: DataFlow;
    fromZone: TrustZone;
    toZone: TrustZone;
    requiredMitigations: string[];
    missingMitigations: string[];
}
```

#### <code v-pre>DataFlow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L148) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface DataFlow {
    id: string;
    from: string;
    to: string;
    data: string;
    mitigations: string[];
}
```

#### <code v-pre>DreadInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L102) <code v-pre>packages/security/src/threat-model.ts</code>

DREAD scoring — each factor 1-10、 total = sum、 threshold = 30 (mitigation must-do)。 一般的な 5 factor 平均 6 以上 = critical。

```ts
export interface DreadInput {
    damage: number;
    reproducibility: number;
    exploitability: number;
    affectedUsers: number;
    discoverability: number;
}
```

#### <code v-pre>DreadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L110) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface DreadResult {
    total: number;
    average: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
```

#### <code v-pre>PastaFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L61) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface PastaFinding {
    stage: PastaStage;
    summary: string;
    /** stage 単位 completeness 0-1 (test coverage proxy)。 */
    completeness: number;
}
```

#### <code v-pre>PastaStage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L52) <code v-pre>packages/security/src/threat-model.ts</code>

PASTA stage identifiers — 7 stage は Tony UcedaVélez / Marco Morana 定義に沿う。

```ts
export type PastaStage = 'define-objectives' | 'define-technical-scope' | 'application-decomposition' | 'threat-analysis' | 'vulnerability-analysis' | 'attack-modeling' | 'risk-analysis';
```

#### <code v-pre>StrideCategory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L13) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export type StrideCategory = 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';
```

#### <code v-pre>StrideThreat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L21) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface StrideThreat {
    id: string;
    category: StrideCategory;
    description: string;
    /** 1-5 severity。 */
    severity: 1 | 2 | 3 | 4 | 5;
}
```

#### <code v-pre>TrustZone</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L141) <code v-pre>packages/security/src/threat-model.ts</code>

Trust boundary — DFD-style zone crossing modeler。 subject と resource が異なる trust zone を跨ぐ dataflow は mitigation (authn / authz / encryption) を必ず要求する。

```ts
export interface TrustZone {
    id: string;
    label: string;
    /** 0=untrusted / 1=partially / 2=trusted。 */
    level: 0 | 1 | 2;
}
```
