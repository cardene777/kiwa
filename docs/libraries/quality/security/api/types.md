---
title: "@kiwa-lab/security types の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>SecurityAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L19) <code v-pre>packages/security/src/types.ts</code>

8 axis の識別子。 SSOT なので追加変更は quality-metrics `SECURITY_AXES` と同期する必要がある。

```ts
export type SecurityAxis = 'csp' | 'rate-limit' | 'authorization' | 'waf' | 'threat-model' | 'secrets-scan' | 'sbom' | 'security-headers';
```

#### <code v-pre>SecurityDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L67) <code v-pre>packages/security/src/types.ts</code>

driver 共通契約 — real / mock 両方に同じ shape で実装される。 fidelity harness が同一 scenario を real と mock に投げて event 列を照合する。

```ts
export interface SecurityDriver {
    readonly provider: SecurityProvider;
    readonly axis: SecurityAxis;
    runScenario(scenarioId: string): Promise<SecurityEvent[]>;
    reset(): void;
}
```

#### <code v-pre>SecurityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L53) <code v-pre>packages/security/src/types.ts</code>

統一 mock 経路の共通 event — 4 provider adapter が emit する 全 event 列を fidelity harness で照合する。

```ts
export interface SecurityEvent<TPayload = unknown> {
    axis: SecurityAxis;
    provider: SecurityProvider;
    verdict: SecurityVerdict;
    reason: string;
    payload: TPayload;
    /** event 発火の相対 timestamp (ms、 collector 起点)。 */
    timestamp: number;
}
```

#### <code v-pre>SecurityProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L33) <code v-pre>packages/security/src/types.ts</code>

4 provider の識別子。 v0.1 でカバーする provider adapter は 4 種類固定 (fidelity harness の 32 grid 前提)。

```ts
export type SecurityProvider = 'helmet' | 'express-rate-limit' | 'casbin' | 'coraza';
```

#### <code v-pre>SecurityVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L47) <code v-pre>packages/security/src/types.ts</code>

8 axis 全部の判定 verdict の共通契約。

```ts
export type SecurityVerdict = 'allow' | 'deny' | 'warn';
```
