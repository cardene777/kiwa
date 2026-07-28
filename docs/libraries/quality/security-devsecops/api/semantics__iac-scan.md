---
title: "@kiwa-lab/security-devsecops semantics__iac-scan の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics&#95;&#95;iac-scan</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>analyzeIacResource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L56) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function analyzeIacResource(session: IacScanSession, input: {
    count: number;
}): AxisStep<IacScanState>;
```

#### <code v-pre>checkIacCompliance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function checkIacCompliance(session: IacScanSession, check: IacComplianceCheck): AxisStep<IacScanState>;
```

#### <code v-pre>completeIacScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L112) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function completeIacScan(session: IacScanSession): AxisStep<IacScanState>;
```

#### <code v-pre>detectIacMisconfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L71) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function detectIacMisconfig(session: IacScanSession, misconfig: IacMisconfig): AxisStep<IacScanState>;
```

#### <code v-pre>startIacScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L35) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function startIacScan(input: {
    scanId: string;
    target: string;
}): IacScanSession;
```

### 型

#### <code v-pre>IacComplianceCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L18) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export interface IacComplianceCheck {
    framework: 'soc2' | 'cis-benchmark' | 'pci-dss' | 'hipaa';
    controlId: string;
    passed: boolean;
}
```

#### <code v-pre>IacMisconfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export interface IacMisconfig {
    ruleId: string;
    resourceType: string;
    resourceName: string;
    filePath: string;
    severity: Severity;
    message: string;
}
```

#### <code v-pre>IacScanSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L24) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export interface IacScanSession {
    scanId: string;
    provider: 'tfsec';
    target: string;
    misconfigs: IacMisconfig[];
    compliance: IacComplianceCheck[];
    resourceCount: number;
    state: IacScanState;
    history: AxisStep<IacScanState>[];
}
```

#### <code v-pre>IacScanState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

IaC scan axis — tfsec-style Terraform / CloudFormation misconfiguration detection + compliance policy check (SOC 2 / CIS Benchmark)。

```ts
export type IacScanState = 'idle' | 'analyzing' | 'misconfig-found' | 'completed';
```
