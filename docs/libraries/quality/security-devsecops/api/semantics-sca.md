---
title: "@kiwa-lab/security-devsecops semantics-sca の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics-sca</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>analyzeScaDependency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L55) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function analyzeScaDependency(session: ScaSession, input: {
    count: number;
}): AxisStep<ScaState>;
```

#### <code v-pre>completeScaScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L106) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function completeScaScan(session: ScaSession): AxisStep<ScaState>;
```

#### <code v-pre>detectScaVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L70) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function detectScaVuln(session: ScaSession, vuln: ScaVuln): AxisStep<ScaState>;
```

#### <code v-pre>flagScaLicense</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L89) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function flagScaLicense(session: ScaSession, flag: ScaLicenseFlag): AxisStep<ScaState>;
```

#### <code v-pre>startScaScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L34) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function startScaScan(input: {
    scanId: string;
    target: string;
}): ScaSession;
```

### 型

#### <code v-pre>ScaLicenseFlag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L17) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export interface ScaLicenseFlag {
    package: string;
    license: string;
    reason: 'copyleft' | 'unknown' | 'restricted';
}
```

#### <code v-pre>ScaSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L23) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export interface ScaSession {
    scanId: string;
    provider: 'trivy';
    target: string;
    vulns: ScaVuln[];
    licenseFlags: ScaLicenseFlag[];
    dependencyCount: number;
    state: ScaState;
    history: AxisStep<ScaState>[];
}
```

#### <code v-pre>ScaState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

SCA (Software Composition Analysis) axis — Trivy-style dependency scan + CVE lookup + license flagging。

```ts
export type ScaState = 'idle' | 'analyzing' | 'vulns-detected' | 'completed';
```

#### <code v-pre>ScaVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export interface ScaVuln {
    cveId: string;
    package: string;
    version: string;
    severity: Severity;
    fixedVersion?: string;
}
```
