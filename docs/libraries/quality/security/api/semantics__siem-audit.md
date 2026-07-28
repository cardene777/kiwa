---
title: "@kiwa-lab/security semantics__siem-audit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;siem-audit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyRetention</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L122) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function applyRetention(session: SiemAuditSession, policy: RetentionPolicy): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>correlate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L143) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function correlate(session: SiemAuditSession, rule: CorrelationRule): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>sealEvents</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L101) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function sealEvents(session: SiemAuditSession, input: {
    previousHash: string;
}): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>startSiemAuditSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L58) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function startSiemAuditSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SiemAuditSession;
```

#### <code v-pre>structureEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L75) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function structureEvent(session: SiemAuditSession, raw: SiemEvent): {
    step: AxisAdvStep<SiemAuditState>;
    event: StructuredEvent;
};
```

### 型

#### <code v-pre>CorrelationRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L52) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface CorrelationRule {
    ruleId: string;
    requiredEventIds: string[];
    windowMs: number;
}
```

#### <code v-pre>RetentionPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L45) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface RetentionPolicy {
    hotDays: number;
    warmDays: number;
    coldDays: number;
    legalHold: boolean;
}
```

#### <code v-pre>SiemAuditSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L36) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface SiemAuditSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: SiemAuditState;
    history: AxisAdvStep<SiemAuditState>[];
    structuredEvents: StructuredEvent[];
    sealHashChain: string[];
}
```

#### <code v-pre>SiemAuditState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L16) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

SIEM / audit log axis — structured logging + tamper-evident sealing + retention policy + correlation rule state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では Splunk / Elastic SIEM に HEC endpoint 経由で event を送信する。

```ts
export type SiemAuditState = 'idle' | 'structured' | 'sealed' | 'retention-tagged' | 'correlated';
```

#### <code v-pre>SiemEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L23) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface SiemEvent {
    actor: string;
    action: string;
    target: string;
    timestamp: number;
    result: 'success' | 'failure';
}
```

#### <code v-pre>StructuredEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L31) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface StructuredEvent extends SiemEvent {
    eventId: string;
    cimSchemaVersion: string;
}
```
