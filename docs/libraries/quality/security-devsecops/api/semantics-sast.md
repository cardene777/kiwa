---
title: "@kiwa-lab/security-devsecops semantics-sast の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics-sast</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeSastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function completeSastScan(session: SastSession): AxisStep<SastState>;
```

#### <code v-pre>detectSastFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L48) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function detectSastFinding(session: SastSession, finding: SastFinding): AxisStep<SastState>;
```

#### <code v-pre>startSastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L28) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function startSastScan(input: {
    scanId: string;
    target: string;
}): SastSession;
```

#### <code v-pre>suppressSastFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L73) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function suppressSastFinding(session: SastSession, input: {
    ruleId: string;
    reason: string;
}): AxisStep<SastState>;
```

### 型

#### <code v-pre>SastFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L10) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export interface SastFinding {
    ruleId: string;
    filePath: string;
    line: number;
    severity: Severity;
    message: string;
}
```

#### <code v-pre>SastSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L18) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export interface SastSession {
    scanId: string;
    provider: 'semgrep';
    target: string;
    findings: SastFinding[];
    suppressed: Set<string>;
    state: SastState;
    history: AxisStep<SastState>[];
}
```

#### <code v-pre>SastState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L8) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

SAST (Static Application Security Testing) axis — code scan → finding detection → severity classification → suppression / completion。 Semgrep-neutral pattern。

```ts
export type SastState = 'idle' | 'scanning' | 'findings-detected' | 'completed';
```
