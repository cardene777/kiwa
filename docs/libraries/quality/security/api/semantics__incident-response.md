---
title: "@kiwa-lab/security semantics__incident-response の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;incident-response</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>captureForensics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L152) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function captureForensics(session: IncidentSession, input: ForensicsInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>classifySeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L103) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function classifySeverity(session: IncidentSession, input: SeverityInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>escalate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L130) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function escalate(session: IncidentSession, input: EscalationInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>recordPostMortem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L174) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function recordPostMortem(session: IncidentSession, input: PostMortemInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>startIncidentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L66) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function startIncidentSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): IncidentSession;
```

#### <code v-pre>triggerPlaybook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L84) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function triggerPlaybook(session: IncidentSession, input: PlaybookInput): AxisAdvStep<IncidentState>;
```

### 型

#### <code v-pre>EscalationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L48) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface EscalationInput {
    channels: string[];
    onCallPrimary: string;
    onCallSecondary: string | null;
}
```

#### <code v-pre>ForensicsInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L54) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface ForensicsInput {
    memoryDumpMb: number;
    networkPcapMb: number;
    diskImageGb: number;
}
```

#### <code v-pre>IncidentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L26) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface IncidentSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: IncidentState;
    history: AxisAdvStep<IncidentState>[];
    playbookId: string | null;
    severity: IncidentSeverity | null;
    forensicsArtifacts: string[];
}
```

#### <code v-pre>IncidentSeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L16) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

Incident response axis — playbook trigger + severity classification + escalation + forensics capture + post-mortem recording state machine。 Deterministic mock で 5 signal 系統を提供。 real driver 経路では PagerDuty / Splunk Phantom SOAR platform への escalation を発火する。

```ts
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
```

#### <code v-pre>IncidentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L18) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export type IncidentState = 'idle' | 'playbook-triggered' | 'severity-classified' | 'escalated' | 'forensics-captured' | 'post-mortem-recorded';
```

#### <code v-pre>PlaybookInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L36) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface PlaybookInput {
    playbookId: string;
    detectionSource: string;
    initialAlert: string;
}
```

#### <code v-pre>PostMortemInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L60) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface PostMortemInput {
    rootCause: string;
    contributingFactors: string[];
    actionItems: string[];
}
```

#### <code v-pre>SeverityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L42) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface SeverityInput {
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
}
```
