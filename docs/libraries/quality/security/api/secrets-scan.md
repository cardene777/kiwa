---
title: "@kiwa-lab/security secrets-scan の API 契約"
---

# <code v-pre>@kiwa-lab/security</code> <code v-pre>secrets-scan</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>DEFAULT&#95;SIGNATURES</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L35) <code v-pre>packages/security/src/secrets-scan.ts</code>

TruffleHog + Gitleaks 由来の代表 signature を SSOT 化。 実 signature 全網羅は upstream に譲り、 kiwa fixture test で よく参照される 8 kind に絞る。

```ts
export declare const DEFAULT_SIGNATURES: SecretSignature[];
```

#### <code v-pre>isRotationOverdue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L156) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function isRotationOverdue(tracker: RotationTracker, nowMs?: number): boolean;
```

#### <code v-pre>markRotated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L163) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function markRotated(tracker: RotationTracker, atMs?: number): RotationTracker;
```

#### <code v-pre>scanSecrets</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L111) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function scanSecrets(source: string, signatures?: SecretSignature[]): SecretFinding[];
```

#### <code v-pre>shannonEntropy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L96) <code v-pre>packages/security/src/secrets-scan.ts</code>

Shannon entropy of a string over its own byte histogram. Values &gt;= 3.5 are typical for random secrets over base64/hex alphabets; anything closer to natural language sits well below.

```ts
export declare function shannonEntropy(input: string): number;
```

#### <code v-pre>toSecretsEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L167) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function toSecretsEvent(input: {
    provider: 'helmet' | 'coraza';
    finding: SecretFinding;
    timestamp: number;
}): SecurityEvent;
```

### 型

#### <code v-pre>RotationPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L142) <code v-pre>packages/security/src/secrets-scan.ts</code>

Rotation policy — secret 発見時の rotation SLA + tracking。

```ts
export interface RotationPolicy {
    /** 発見から X 日以内に rotation 必須。 */
    rotateWithinDays: number;
    /** 対象 kind (未指定 = 全 kind)。 */
    appliesTo?: SecretKind[];
}
```

#### <code v-pre>RotationTracker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L149) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export interface RotationTracker {
    finding: SecretFinding;
    discoveredAtMs: number;
    rotatedAtMs: number | null;
    policy: RotationPolicy;
}
```

#### <code v-pre>SecretFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L82) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export interface SecretFinding {
    kind: SecretKind;
    matched: string;
    line: number;
    column: number;
    entropy: number;
    ruleDescription: string;
}
```

#### <code v-pre>SecretKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L13) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export type SecretKind = 'aws-access-key' | 'aws-secret-key' | 'github-token' | 'slack-token' | 'openai-key' | 'stripe-key' | 'generic-jwt' | 'generic-private-key';
```

#### <code v-pre>SecretSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L23) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export interface SecretSignature {
    kind: SecretKind;
    pattern: RegExp;
    minEntropy?: number;
    description: string;
}
```
