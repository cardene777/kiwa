---
title: "@kiwa-lab/security-devsecops semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/security-devsecops</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L63) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState> {
    neutralEvent: NeutralEventName;
    provider: ScanProvider;
    state: TState;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>DevSecOpsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L21) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type DevSecOpsAxis = 'sast' | 'sca' | 'secret-scan' | 'iac-scan' | 'dast' | 'container-security';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L29) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'sast.scan-started' | 'sast.finding-detected' | 'sast.suppressed' | 'sast.scan-completed' | 'sca.dependency-analyzed' | 'sca.vuln-detected' | 'sca.license-flagged' | 'sca.scan-completed' | 'secret.pattern-matched' | 'secret.entropy-flagged' | 'secret.allowlisted' | 'secret.scan-completed' | 'iac.resource-analyzed' | 'iac.misconfig-detected' | 'iac.compliance-checked' | 'iac.scan-completed' | 'dast.crawl-started' | 'dast.attack-attempted' | 'dast.vulnerability-confirmed' | 'dast.scan-completed' | 'container.image-scanned' | 'container.cve-detected' | 'container.malware-flagged' | 'container.scan-completed';
```

#### <code v-pre>ScanProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L13) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

DevSecOps semantics — provider-neutral axis SSOT (v0.1)。 v0.1 covers 6 axis = SAST (Static Application Security Testing) + SCA (Software Composition Analysis) + Secret scan + IaC scan + DAST (Dynamic Application Security Testing) + Container security。 Each axis is a small pure state-machine helper that returns a neutral envelope。 downstream tests can drive the axis without knowing the provider payload dialect (Semgrep / Trivy / Gitleaks / tfsec / OWASP ZAP / Grype)。

```ts
export type ScanProvider = 'semgrep' | 'trivy' | 'gitleaks' | 'tfsec' | 'owasp-zap' | 'grype';
```

#### <code v-pre>Severity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L61) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```
