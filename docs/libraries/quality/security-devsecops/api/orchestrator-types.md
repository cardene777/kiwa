---
title: "@kiwa-lab/security-devsecops orchestrator-types の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>orchestrator-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>AuditInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L21) <code v-pre>packages/security-devsecops/src/orchestrator/types.ts</code>

```ts
export interface AuditInvocation {
    preset: AuditPreset;
    target: string;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>AuditPreset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L15) <code v-pre>packages/security-devsecops/src/orchestrator/types.ts</code>

```ts
export type AuditPreset = 'audit-all' | 'supply-chain' | 'specialty' | 'threat-model';
```

#### <code v-pre>AuditReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L37) <code v-pre>packages/security-devsecops/src/orchestrator/types.ts</code>

```ts
export interface AuditReport {
    preset: AuditPreset;
    target: string;
    mode: AdapterMode;
    startedAt: number;
    finishedAt: number;
    results: AxisAuditResult[];
}
```

#### <code v-pre>AuditSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L46) <code v-pre>packages/security-devsecops/src/orchestrator/types.ts</code>

```ts
export interface AuditSummary {
    preset: AuditPreset;
    totalAxis: number;
    completedAxis: number;
    totalEvents: number;
    totalDurationMs: number;
    perAxis: Array<{
        axis: DevSecOpsAxis;
        completed: boolean;
        eventCount: number;
    }>;
    stridDreadTags?: Array<{
        axis: DevSecOpsAxis;
        tag: string;
        severity: Severity;
    }>;
}
```

#### <code v-pre>AxisAuditResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L28) <code v-pre>packages/security-devsecops/src/orchestrator/types.ts</code>

```ts
export interface AxisAuditResult {
    axis: DevSecOpsAxis;
    mode: AdapterMode;
    completed: boolean;
    eventCount: number;
    durationMs: number;
    history: AdapterResult<unknown>['history'];
}
```
