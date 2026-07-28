# Security DevSecOps リファレンス

`@kiwa-lab/security-devsecops` は6つの CI security axis を orchestrator へまとめます。

## Orchestrator API

`runSecurityAudit` はpresetが選ぶaxisを順番に実行します。`audit-all` と `threat-model` は6軸、`supply-chain` はSCAとcontainer security、`specialty` はSAST、secret scan、DASTを選びます。scan IDは `preset-axis-index` の形で自動生成されます。

`axisForPreset` と `PRESET_AXIS_MAP` はpresetの軸を確認します。`summarizeAuditReport` は `AuditReport` からaggregateと `perAxis` を作ります。threat-model presetだけはaxisごとにSTRIDE tagと、completedならmedium、未完了ならhighのseverityを追加します。

## Adapter と制約

各axisはmockとreal-mode adapterを持ちます。real adapterは `KIWA_SECURITY_MODE=real` と対応URL環境変数の有無だけを検査します。CLIの可用性、URL到達性、targetの内容は検査しません。`target` は状態遷移のmetadataとしてadapterへ渡されます。安全なmockを既定とし、real modeも外部副作用はありません。

## 後始末

orchestratorが返すreportは値です。mock runにもreal-mode runにも外部cleanupはありません。実toolが作るreportやtemporary fileは、このライブラリでは生成しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>real driver requested but KIWA&#95;SECURITY&#95;MODE!=='real'; call skipped for $&#123;spec.cliName&#125;</code> | [packages/security-devsecops/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L45) |
| <code v-pre>$&#123;spec.cliName&#125; URL env ($&#123;String(spec.urlEnvKey)&#125;) not set; real driver unavailable</code> | [packages/security-devsecops/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L50) |
| <code v-pre>detectSastFinding: session is $&#123;session.state&#125;</code> | [packages/security-devsecops/src/semantics/sast.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L53) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>allowlistSecret</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L98) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function allowlistSecret(session: SecretScanSession, input: {
    ruleId: string;
    reason: string;
}): AxisStep<SecretScanState>;
```

#### <code v-pre>analyzeIacResource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L56) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function analyzeIacResource(session: IacScanSession, input: {
    count: number;
}): AxisStep<IacScanState>;
```

#### <code v-pre>analyzeScaDependency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L55) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function analyzeScaDependency(session: ScaSession, input: {
    count: number;
}): AxisStep<ScaState>;
```

#### <code v-pre>assertRealDriverAvailable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L40) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export declare function assertRealDriverAvailable(spec: CliDriverSpec, env: RealDriverEnv | null): void;
```

#### <code v-pre>attemptDastAttack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L71) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function attemptDastAttack(session: DastSession, attack: DastAttack): AxisStep<DastState>;
```

#### <code v-pre>axisForPreset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/preset.ts#L19) <code v-pre>packages/security-devsecops/src/orchestrator/preset.ts</code>

```ts
export declare function axisForPreset(preset: AuditPreset): DevSecOpsAxis[];
```

#### <code v-pre>checkIacCompliance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function checkIacCompliance(session: IacScanSession, check: IacComplianceCheck): AxisStep<IacScanState>;
```

#### <code v-pre>completeContainerScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L124) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function completeContainerScan(session: ContainerSecuritySession): AxisStep<ContainerSecState>;
```

#### <code v-pre>completeDastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L114) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function completeDastScan(session: DastSession): AxisStep<DastState>;
```

#### <code v-pre>completeIacScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L112) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function completeIacScan(session: IacScanSession): AxisStep<IacScanState>;
```

#### <code v-pre>completeSastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function completeSastScan(session: SastSession): AxisStep<SastState>;
```

#### <code v-pre>completeScaScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L106) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function completeScaScan(session: ScaSession): AxisStep<ScaState>;
```

#### <code v-pre>completeSecretScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L117) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function completeSecretScan(session: SecretScanSession): AxisStep<SecretScanState>;
```

#### <code v-pre>confirmDastVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L92) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function confirmDastVuln(session: DastSession, vuln: DastVuln): AxisStep<DastState>;
```

#### <code v-pre>containerSecurityMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-mock.ts#L18) <code v-pre>packages/security-devsecops/src/adapters/container-security-mock.ts</code>

Container mock adapter — Grype-style deterministic replay。

```ts
export declare const containerSecurityMockAdapter: ContainerAdapter;
```

#### <code v-pre>containerSecurityRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/container-security-real.ts</code>

Container real adapter — Grype CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_GRYPE_URL` opt-in。

```ts
export declare const containerSecurityRealAdapter: ContainerAdapter;
```

#### <code v-pre>crawlDastUrls</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L56) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function crawlDastUrls(session: DastSession, input: {
    count: number;
}): AxisStep<DastState>;
```

#### <code v-pre>dastMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/dast-mock.ts#L18) <code v-pre>packages/security-devsecops/src/adapters/dast-mock.ts</code>

DAST mock adapter — OWASP ZAP-style deterministic replay。

```ts
export declare const dastMockAdapter: DastAdapter;
```

#### <code v-pre>dastRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/dast-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/dast-real.ts</code>

DAST real adapter — OWASP ZAP CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_ZAP_URL` opt-in。

```ts
export declare const dastRealAdapter: DastAdapter;
```

#### <code v-pre>detectContainerCve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L80) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function detectContainerCve(session: ContainerSecuritySession, cve: ContainerCve): AxisStep<ContainerSecState>;
```

#### <code v-pre>detectIacMisconfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L71) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function detectIacMisconfig(session: IacScanSession, misconfig: IacMisconfig): AxisStep<IacScanState>;
```

#### <code v-pre>detectSastFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L48) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function detectSastFinding(session: SastSession, finding: SastFinding): AxisStep<SastState>;
```

#### <code v-pre>detectScaVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L70) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function detectScaVuln(session: ScaSession, vuln: ScaVuln): AxisStep<ScaState>;
```

#### <code v-pre>flagContainerMalware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L103) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function flagContainerMalware(session: ContainerSecuritySession, malware: ContainerMalware): AxisStep<ContainerSecState>;
```

#### <code v-pre>flagScaLicense</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L89) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function flagScaLicense(session: ScaSession, flag: ScaLicenseFlag): AxisStep<ScaState>;
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

#### <code v-pre>iacScanMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-mock.ts#L19) <code v-pre>packages/security-devsecops/src/adapters/iac-scan-mock.ts</code>

IaC mock adapter — tfsec-style deterministic replay。 1 misconfig + 1 pass + 1 fail compliance check。

```ts
export declare const iacScanMockAdapter: IacAdapter;
```

#### <code v-pre>iacScanRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/iac-scan-real.ts</code>

IaC real adapter — tfsec CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TFSEC_URL` opt-in。

```ts
export declare const iacScanRealAdapter: IacAdapter;
```

#### <code v-pre>matchSecretPattern</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L48) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function matchSecretPattern(session: SecretScanSession, match: Omit<SecretMatch, 'matchType'>): AxisStep<SecretScanState>;
```

#### <code v-pre>PRESET&#95;AXIS&#95;MAP</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/preset.ts#L12) <code v-pre>packages/security-devsecops/src/orchestrator/preset.ts</code>

```ts
export declare const PRESET_AXIS_MAP: Record<AuditPreset, DevSecOpsAxis[]>;
```

#### <code v-pre>readRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export declare function readRealDriverEnv(env?: NodeJS.ProcessEnv): RealDriverEnv | null;
```

#### <code v-pre>runSecurityAudit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/run-audit.ts#L53) <code v-pre>packages/security-devsecops/src/orchestrator/run-audit.ts</code>

DevSecOps library single entry (v0.3、 Phase 3)。 skill 4 種の workflow を library 内に集約、 skill 側は preset 選択だけで 6 axis を横断的に扱える。 backward compat 維持 = v0.1 semantics 直接使用 + v0.2 adapter 個別使用も引き続き動作。

```ts
export declare function runSecurityAudit(input: AuditInvocation): Promise<AuditReport>;
```

#### <code v-pre>sastMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-mock.ts#L18) <code v-pre>packages/security-devsecops/src/adapters/sast-mock.ts</code>

SAST mock adapter — Semgrep-neutral pattern を semantics 経路で deterministic に再生する。 `input.metadata.presetFindings` に JSON 文字列で 事前 finding を渡す経路も持つ (test fixture 用)。

```ts
export declare const sastMockAdapter: SastAdapter;
```

#### <code v-pre>sastRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-real.ts#L21) <code v-pre>packages/security-devsecops/src/adapters/sast-real.ts</code>

SAST real adapter — Semgrep CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_SEMGREP_URL` opt-in。

```ts
export declare const sastRealAdapter: SastAdapter;
```

#### <code v-pre>scaMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-mock.ts#L18) <code v-pre>packages/security-devsecops/src/adapters/sca-mock.ts</code>

SCA mock adapter — Trivy-style deterministic replay。 2 CVE + 1 license flag。

```ts
export declare const scaMockAdapter: ScaAdapter;
```

#### <code v-pre>scanContainerImage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L61) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function scanContainerImage(session: ContainerSecuritySession, input: {
    layerCount: number;
}): AxisStep<ContainerSecState>;
```

#### <code v-pre>scaRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-real.ts#L22) <code v-pre>packages/security-devsecops/src/adapters/sca-real.ts</code>

SCA real adapter — Trivy CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TRIVY_URL` opt-in。

```ts
export declare const scaRealAdapter: ScaAdapter;
```

#### <code v-pre>secretScanMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/secret-scan-mock.ts#L17) <code v-pre>packages/security-devsecops/src/adapters/secret-scan-mock.ts</code>

Secret mock adapter — Gitleaks-style deterministic replay。

```ts
export declare const secretScanMockAdapter: SecretAdapter;
```

#### <code v-pre>secretScanRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/secret-scan-real.ts#L21) <code v-pre>packages/security-devsecops/src/adapters/secret-scan-real.ts</code>

Secret real adapter — Gitleaks CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_GITLEAKS_URL` opt-in。

```ts
export declare const secretScanRealAdapter: SecretAdapter;
```

#### <code v-pre>startContainerScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L37) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export declare function startContainerScan(input: {
    scanId: string;
    imageRef: string;
}): ContainerSecuritySession;
```

#### <code v-pre>startDastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L35) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export declare function startDastScan(input: {
    scanId: string;
    target: string;
}): DastSession;
```

#### <code v-pre>startIacScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L35) <code v-pre>packages/security-devsecops/src/semantics/iac-scan.ts</code>

```ts
export declare function startIacScan(input: {
    scanId: string;
    target: string;
}): IacScanSession;
```

#### <code v-pre>startSastScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L28) <code v-pre>packages/security-devsecops/src/semantics/sast.ts</code>

```ts
export declare function startSastScan(input: {
    scanId: string;
    target: string;
}): SastSession;
```

#### <code v-pre>startScaScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L34) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export declare function startScaScan(input: {
    scanId: string;
    target: string;
}): ScaSession;
```

#### <code v-pre>startSecretScan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L28) <code v-pre>packages/security-devsecops/src/semantics/secret-scan.ts</code>

```ts
export declare function startSecretScan(input: {
    scanId: string;
    target: string;
}): SecretScanSession;
```

#### <code v-pre>summarizeAuditReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/summary.ts#L8) <code v-pre>packages/security-devsecops/src/orchestrator/summary.ts</code>

Audit report 集約 API — skill 出力層 (STRIDE / DREAD 分類 tag 添付) に流し込む。 threat-model preset の時のみ STRIDE tag 添付、 他 preset は tag 空。

```ts
export declare function summarizeAuditReport(report: AuditReport): AuditSummary;
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

#### <code v-pre>AdapterInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L21) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface AdapterInvocation {
    scanId: string;
    target: string;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>AdapterMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L19) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export type AdapterMode = 'mock' | 'real';
```

#### <code v-pre>AdapterResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L28) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface AdapterResult<TState> {
    axis: DevSecOpsAxis;
    mode: AdapterMode;
    history: AxisStep<TState>[];
    completed: boolean;
    durationMs: number;
}
```

#### <code v-pre>AnyAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L66) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export type AnyAdapter = SastAdapter | ScaAdapter | SecretAdapter | IacAdapter | DastAdapter | ContainerAdapter;
```

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

#### <code v-pre>CliDriverSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L34) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

```ts
export interface CliDriverSpec {
    cliName: string;
    urlEnvKey: keyof RealDriverEnv;
    requiredEnvValue: string | undefined;
}
```

#### <code v-pre>ContainerAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L61) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface ContainerAdapter {
    axis: 'container-security';
    scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>>;
}
```

#### <code v-pre>ContainerCve</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerCve {
    cveId: string;
    package: string;
    version: string;
    layer: string;
    severity: Severity;
    fixedVersion?: string;
}
```

#### <code v-pre>ContainerMalware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L18) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerMalware {
    malwareType: 'trojan' | 'backdoor' | 'cryptominer' | 'rootkit' | 'ransomware';
    filePath: string;
    layer: string;
    signature: string;
    severity: Severity;
}
```

#### <code v-pre>ContainerSecState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

Container security axis — Grype-style container image scan + CVE detection + malware detection。

```ts
export type ContainerSecState = 'idle' | 'scanning' | 'threats-found' | 'completed';
```

#### <code v-pre>ContainerSecuritySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L26) <code v-pre>packages/security-devsecops/src/semantics/container-security.ts</code>

```ts
export interface ContainerSecuritySession {
    scanId: string;
    provider: 'grype';
    imageRef: string;
    layerCount: number;
    cves: ContainerCve[];
    malwares: ContainerMalware[];
    state: ContainerSecState;
    history: AxisStep<ContainerSecState>[];
}
```

#### <code v-pre>DastAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L56) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface DastAdapter {
    axis: 'dast';
    scan(input: AdapterInvocation): Promise<AdapterResult<DastState>>;
}
```

#### <code v-pre>DastAttack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L9) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastAttack {
    attackType: 'xss' | 'sqli' | 'csrf' | 'xxe' | 'ssrf' | 'command-injection' | 'path-traversal';
    targetUrl: string;
    payload: string;
    successful: boolean;
}
```

#### <code v-pre>DastSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L24) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastSession {
    scanId: string;
    provider: 'owasp-zap';
    target: string;
    crawledUrls: number;
    attacks: DastAttack[];
    vulns: DastVuln[];
    state: DastState;
    history: AxisStep<DastState>[];
}
```

#### <code v-pre>DastState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L7) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

DAST (Dynamic Application Security Testing) axis — OWASP ZAP-style live-app crawl + attack attempt + vulnerability confirmation。

```ts
export type DastState = 'idle' | 'crawling' | 'attacking' | 'vuln-found' | 'completed';
```

#### <code v-pre>DastVuln</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L16) <code v-pre>packages/security-devsecops/src/semantics/dast.ts</code>

```ts
export interface DastVuln {
    vulnClass: string;
    cweId: string;
    targetUrl: string;
    severity: Severity;
    evidence: string;
}
```

#### <code v-pre>DevSecOpsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L21) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type DevSecOpsAxis = 'sast' | 'sca' | 'secret-scan' | 'iac-scan' | 'dast' | 'container-security';
```

#### <code v-pre>IacAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L51) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface IacAdapter {
    axis: 'iac-scan';
    scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>>;
}
```

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

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L29) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'sast.scan-started' | 'sast.finding-detected' | 'sast.suppressed' | 'sast.scan-completed' | 'sca.dependency-analyzed' | 'sca.vuln-detected' | 'sca.license-flagged' | 'sca.scan-completed' | 'secret.pattern-matched' | 'secret.entropy-flagged' | 'secret.allowlisted' | 'secret.scan-completed' | 'iac.resource-analyzed' | 'iac.misconfig-detected' | 'iac.compliance-checked' | 'iac.scan-completed' | 'dast.crawl-started' | 'dast.attack-attempted' | 'dast.vulnerability-confirmed' | 'dast.scan-completed' | 'container.image-scanned' | 'container.cve-detected' | 'container.malware-flagged' | 'container.scan-completed';
```

#### <code v-pre>RealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L12) <code v-pre>packages/security-devsecops/src/adapters/real-driver.ts</code>

Real driver 共通 helper — 実 CLI 呼出を child_process 経由で隠蔽する契約。 v0.2 では adapter interface を confirm し、 実 CLI 呼出は env-gate + spawnCliDriver に集約する。 env 未設定 or CLI 不在時は explicit throw、 test 側は mock adapter を使う (default 経路)。 production 経路。 `KIWA_SECURITY_MODE=real` + 各 CLI URL env が全部揃った時のみ 実 CLI 呼出、 それ以外は throw。 mock adapter は env に関係なく常時動作。

```ts
export interface RealDriverEnv {
    mode: 'real';
    semgrepUrl?: string;
    trivyUrl?: string;
    gitleaksUrl?: string;
    tfsecUrl?: string;
    zapUrl?: string;
    grypeUrl?: string;
}
```

#### <code v-pre>SastAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L36) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface SastAdapter {
    axis: 'sast';
    scan(input: AdapterInvocation): Promise<AdapterResult<SastState>>;
}
```

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

#### <code v-pre>ScaAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L41) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface ScaAdapter {
    axis: 'sca';
    scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>>;
}
```

#### <code v-pre>ScaLicenseFlag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L17) <code v-pre>packages/security-devsecops/src/semantics/sca.ts</code>

```ts
export interface ScaLicenseFlag {
    package: string;
    license: string;
    reason: 'copyleft' | 'unknown' | 'restricted';
}
```

#### <code v-pre>ScanProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L13) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

DevSecOps semantics — provider-neutral axis SSOT (v0.1)。 v0.1 covers 6 axis = SAST (Static Application Security Testing) + SCA (Software Composition Analysis) + Secret scan + IaC scan + DAST (Dynamic Application Security Testing) + Container security。 Each axis is a small pure state-machine helper that returns a neutral envelope。 downstream tests can drive the axis without knowing the provider payload dialect (Semgrep / Trivy / Gitleaks / tfsec / OWASP ZAP / Grype)。

```ts
export type ScanProvider = 'semgrep' | 'trivy' | 'gitleaks' | 'tfsec' | 'owasp-zap' | 'grype';
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

#### <code v-pre>SecretAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L46) <code v-pre>packages/security-devsecops/src/adapters/types.ts</code>

```ts
export interface SecretAdapter {
    axis: 'secret-scan';
    scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>>;
}
```

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

#### <code v-pre>Severity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L61) <code v-pre>packages/security-devsecops/src/semantics/types.ts</code>

```ts
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```
<!-- kiwa-public-api:end -->
