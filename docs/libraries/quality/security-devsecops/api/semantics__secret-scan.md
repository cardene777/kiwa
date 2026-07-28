---
title: "@kiwa-lab/security-devsecops semantics__secret-scan の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics&#95;&#95;secret-scan</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>allowlistSecret</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L98) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function allowlistSecret(session: SecretScanSession, input: {
    ruleId: string;
    reason: string;
}): AxisStep<SecretScanState>;
```

#### <code v-pre>completeSecretScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L117) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function completeSecretScan(session: SecretScanSession): AxisStep<SecretScanState>;
```

#### <code v-pre>flagSecretEntropy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L70) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function flagSecretEntropy(session: SecretScanSession, input: {
    filePath: string;
    line: number;
    entropyScore: number;
    redactedValue: string;
}): AxisStep<SecretScanState>;
```

#### <code v-pre>matchSecretPattern</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L48) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function matchSecretPattern(session: SecretScanSession, match: Omit<SecretMatch, 'matchType'>): AxisStep<SecretScanState>;
```

#### <code v-pre>startSecretScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L28) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function startSecretScan(input: {
    scanId: string;
    target: string;
}): SecretScanSession;
```

### 型

#### <code v-pre>SecretMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export interface SecretMatch {
    ruleId: string;
    matchType: 'pattern' | 'entropy';
    filePath: string;
    line: number;
    redactedValue: string;
    severity: Severity;
}
```

#### <code v-pre>SecretScanSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L18) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export interface SecretScanSession {
    scanId: string;
    provider: 'gitleaks';
    target: string;
    matches: SecretMatch[];
    allowlisted: Set<string>;
    state: SecretScanState;
    history: AxisStep<SecretScanState>[];
}
```

#### <code v-pre>SecretScanState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

Secret scan axis — Gitleaks-style secret pattern matching + entropy analysis + allowlist support。

```ts
export type SecretScanState = 'idle' | 'scanning' | 'secrets-found' | 'completed';
```
