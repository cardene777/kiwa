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
| `real driver requested but KIWA_SECURITY_MODE!=='real'; call skipped for ${spec.cliName}` | [packages/security-devsecops/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L45) |
| `${spec.cliName} URL env (${String(spec.urlEnvKey)}) not set; real driver unavailable` | [packages/security-devsecops/src/adapters/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L50) |
| `detectSastFinding: session is ${session.state}` | [packages/security-devsecops/src/semantics/sast.ts](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L53) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `allowlistSecret`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L98) `packages/security-devsecops/src/semantics/secret-scan.ts`

```ts
export function allowlistSecret(
  session: SecretScanSession,
  input: { ruleId: string; reason: string },
): AxisStep<SecretScanState>;
```

#### `analyzeIacResource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L56) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export function analyzeIacResource(
  session: IacScanSession,
  input: { count: number },
): AxisStep<IacScanState>;
```

#### `analyzeScaDependency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L55) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export function analyzeScaDependency(
  session: ScaSession,
  input: { count: number },
): AxisStep<ScaState>;
```

#### `assertRealDriverAvailable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L40) `packages/security-devsecops/src/adapters/real-driver.ts`

```ts
export function assertRealDriverAvailable(
  spec: CliDriverSpec,
  env: RealDriverEnv | null,
): void;
```

#### `attemptDastAttack`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L71) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export function attemptDastAttack(
  session: DastSession,
  attack: DastAttack,
): AxisStep<DastState>;
```

#### `axisForPreset`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/preset.ts#L19) `packages/security-devsecops/src/orchestrator/preset.ts`

```ts
export function axisForPreset(preset: AuditPreset): DevSecOpsAxis[];
```

#### `checkIacCompliance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L92) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export function checkIacCompliance(
  session: IacScanSession,
  check: IacComplianceCheck,
): AxisStep<IacScanState>;
```

#### `completeContainerScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L124) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export function completeContainerScan(
  session: ContainerSecuritySession,
): AxisStep<ContainerSecState>;
```

#### `completeDastScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L114) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export function completeDastScan(session: DastSession): AxisStep<DastState>;
```

#### `completeIacScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L112) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export function completeIacScan(session: IacScanSession): AxisStep<IacScanState>;
```

#### `completeSastScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L92) `packages/security-devsecops/src/semantics/sast.ts`

```ts
export function completeSastScan(session: SastSession): AxisStep<SastState>;
```

#### `completeScaScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L106) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export function completeScaScan(session: ScaSession): AxisStep<ScaState>;
```

#### `completeSecretScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L117) `packages/security-devsecops/src/semantics/secret-scan.ts`

```ts
export function completeSecretScan(session: SecretScanSession): AxisStep<SecretScanState>;
```

#### `confirmDastVuln`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L92) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export function confirmDastVuln(
  session: DastSession,
  vuln: DastVuln,
): AxisStep<DastState>;
```

#### `containerSecurityMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-mock.ts#L18) `packages/security-devsecops/src/adapters/container-security-mock.ts`

Container mock adapter — Grype-style deterministic replay。

```ts
export declare const containerSecurityMockAdapter: ContainerAdapter;
```

#### `containerSecurityRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/container-security-real.ts#L22) `packages/security-devsecops/src/adapters/container-security-real.ts`

Container real adapter — Grype CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_GRYPE_URL` opt-in。

```ts
export declare const containerSecurityRealAdapter: ContainerAdapter;
```

#### `crawlDastUrls`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L56) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export function crawlDastUrls(
  session: DastSession,
  input: { count: number },
): AxisStep<DastState>;
```

#### `dastMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/dast-mock.ts#L18) `packages/security-devsecops/src/adapters/dast-mock.ts`

DAST mock adapter — OWASP ZAP-style deterministic replay。

```ts
export declare const dastMockAdapter: DastAdapter;
```

#### `dastRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/dast-real.ts#L22) `packages/security-devsecops/src/adapters/dast-real.ts`

DAST real adapter — OWASP ZAP CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_ZAP_URL` opt-in。

```ts
export declare const dastRealAdapter: DastAdapter;
```

#### `detectContainerCve`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L80) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export function detectContainerCve(
  session: ContainerSecuritySession,
  cve: ContainerCve,
): AxisStep<ContainerSecState>;
```

#### `detectIacMisconfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L71) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export function detectIacMisconfig(
  session: IacScanSession,
  misconfig: IacMisconfig,
): AxisStep<IacScanState>;
```

#### `detectSastFinding`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L48) `packages/security-devsecops/src/semantics/sast.ts`

```ts
export function detectSastFinding(
  session: SastSession,
  finding: SastFinding,
): AxisStep<SastState>;
```

#### `detectScaVuln`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L70) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export function detectScaVuln(session: ScaSession, vuln: ScaVuln): AxisStep<ScaState>;
```

#### `flagContainerMalware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L103) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export function flagContainerMalware(
  session: ContainerSecuritySession,
  malware: ContainerMalware,
): AxisStep<ContainerSecState>;
```

#### `flagScaLicense`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L89) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export function flagScaLicense(session: ScaSession, flag: ScaLicenseFlag): AxisStep<ScaState>;
```

#### `flagSecretEntropy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L70) `packages/security-devsecops/src/semantics/secret-scan.ts`

```ts
export function flagSecretEntropy(
  session: SecretScanSession,
  input: { filePath: string; line: number; entropyScore: number; redactedValue: string },
): AxisStep<SecretScanState>;
```

#### `iacScanMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-mock.ts#L19) `packages/security-devsecops/src/adapters/iac-scan-mock.ts`

IaC mock adapter — tfsec-style deterministic replay。 1 misconfig + 1 pass + 1 fail compliance check。

```ts
export declare const iacScanMockAdapter: IacAdapter;
```

#### `iacScanRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/iac-scan-real.ts#L22) `packages/security-devsecops/src/adapters/iac-scan-real.ts`

IaC real adapter — tfsec CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TFSEC_URL` opt-in。

```ts
export declare const iacScanRealAdapter: IacAdapter;
```

#### `matchSecretPattern`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L48) `packages/security-devsecops/src/semantics/secret-scan.ts`

```ts
export function matchSecretPattern(
  session: SecretScanSession,
  match: Omit<SecretMatch, 'matchType'>,
): AxisStep<SecretScanState>;
```

#### `PRESET_AXIS_MAP`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/preset.ts#L12) `packages/security-devsecops/src/orchestrator/preset.ts`

```ts
export declare const PRESET_AXIS_MAP: Record<AuditPreset, DevSecOpsAxis[]>;
```

#### `readRealDriverEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L22) `packages/security-devsecops/src/adapters/real-driver.ts`

```ts
export function readRealDriverEnv(env: NodeJS.ProcessEnv = process.env): RealDriverEnv | null;
```

#### `runSecurityAudit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/run-audit.ts#L53) `packages/security-devsecops/src/orchestrator/run-audit.ts`

DevSecOps library single entry (v0.3、 Phase 3)。 skill 4 種の workflow を library 内に集約、 skill 側は preset 選択だけで 6 axis を横断的に扱える。 backward compat 維持 = v0.1 semantics 直接使用 + v0.2 adapter 個別使用も引き続き動作。

```ts
export async function runSecurityAudit(input: AuditInvocation): Promise<AuditReport>;
```

#### `sastMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-mock.ts#L18) `packages/security-devsecops/src/adapters/sast-mock.ts`

SAST mock adapter — Semgrep-neutral pattern を semantics 経路で deterministic に再生する。 `input.metadata.presetFindings` に JSON 文字列で 事前 finding を渡す経路も持つ (test fixture 用)。

```ts
export declare const sastMockAdapter: SastAdapter;
```

#### `sastRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sast-real.ts#L21) `packages/security-devsecops/src/adapters/sast-real.ts`

SAST real adapter — Semgrep CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_SEMGREP_URL` opt-in。

```ts
export declare const sastRealAdapter: SastAdapter;
```

#### `scaMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-mock.ts#L18) `packages/security-devsecops/src/adapters/sca-mock.ts`

SCA mock adapter — Trivy-style deterministic replay。 2 CVE + 1 license flag。

```ts
export declare const scaMockAdapter: ScaAdapter;
```

#### `scanContainerImage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L61) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export function scanContainerImage(
  session: ContainerSecuritySession,
  input: { layerCount: number },
): AxisStep<ContainerSecState>;
```

#### `scaRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/sca-real.ts#L22) `packages/security-devsecops/src/adapters/sca-real.ts`

SCA real adapter — Trivy CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_TRIVY_URL` opt-in。

```ts
export declare const scaRealAdapter: ScaAdapter;
```

#### `secretScanMockAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/secret-scan-mock.ts#L17) `packages/security-devsecops/src/adapters/secret-scan-mock.ts`

Secret mock adapter — Gitleaks-style deterministic replay。

```ts
export declare const secretScanMockAdapter: SecretAdapter;
```

#### `secretScanRealAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/secret-scan-real.ts#L21) `packages/security-devsecops/src/adapters/secret-scan-real.ts`

Secret real adapter — Gitleaks CLI 呼出隠蔽。 env `KIWA_SECURITY_MODE=real` + `KIWA_GITLEAKS_URL` opt-in。

```ts
export declare const secretScanRealAdapter: SecretAdapter;
```

#### `startContainerScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L37) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export function startContainerScan(input: {
  scanId: string;
  imageRef: string;
}): ContainerSecuritySession;
```

#### `startDastScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L35) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export function startDastScan(input: { scanId: string; target: string }): DastSession;
```

#### `startIacScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L35) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export function startIacScan(input: { scanId: string; target: string }): IacScanSession;
```

#### `startSastScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L28) `packages/security-devsecops/src/semantics/sast.ts`

```ts
export function startSastScan(input: { scanId: string; target: string }): SastSession;
```

#### `startScaScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L34) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export function startScaScan(input: { scanId: string; target: string }): ScaSession;
```

#### `startSecretScan`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L28) `packages/security-devsecops/src/semantics/secret-scan.ts`

```ts
export function startSecretScan(input: { scanId: string; target: string }): SecretScanSession;
```

#### `summarizeAuditReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/summary.ts#L8) `packages/security-devsecops/src/orchestrator/summary.ts`

Audit report 集約 API — skill 出力層 (STRIDE / DREAD 分類 tag 添付) に流し込む。 threat-model preset の時のみ STRIDE tag 添付、 他 preset は tag 空。

```ts
export function summarizeAuditReport(report: AuditReport): AuditSummary;
```

#### `suppressSastFinding`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L73) `packages/security-devsecops/src/semantics/sast.ts`

```ts
export function suppressSastFinding(
  session: SastSession,
  input: { ruleId: string; reason: string },
): AxisStep<SastState>;
```

### 型

#### `AdapterInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L21) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface AdapterInvocation {
  scanId: string;
  target: string;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}
```

#### `AdapterMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L19) `packages/security-devsecops/src/adapters/types.ts`

```ts
export type AdapterMode = 'mock' | 'real';
```

#### `AdapterResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L28) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface AdapterResult<TState> {
  axis: DevSecOpsAxis;
  mode: AdapterMode;
  history: AxisStep<TState>[];
  completed: boolean;
  durationMs: number;
}
```

#### `AnyAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L66) `packages/security-devsecops/src/adapters/types.ts`

```ts
export type AnyAdapter =
  | SastAdapter
  | ScaAdapter
  | SecretAdapter
  | IacAdapter
  | DastAdapter
  | ContainerAdapter;
```

#### `AuditInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L21) `packages/security-devsecops/src/orchestrator/types.ts`

```ts
export interface AuditInvocation {
  preset: AuditPreset;
  target: string;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}
```

#### `AuditPreset`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L15) `packages/security-devsecops/src/orchestrator/types.ts`

```ts
export type AuditPreset =
  | 'audit-all'
  | 'supply-chain'
  | 'specialty'
  | 'threat-model';
```

#### `AuditReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L37) `packages/security-devsecops/src/orchestrator/types.ts`

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

#### `AuditSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L46) `packages/security-devsecops/src/orchestrator/types.ts`

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
  stridDreadTags?: Array<{ axis: DevSecOpsAxis; tag: string; severity: Severity }>;
}
```

#### `AxisAuditResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/orchestrator/types.ts#L28) `packages/security-devsecops/src/orchestrator/types.ts`

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

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L63) `packages/security-devsecops/src/semantics/types.ts`

```ts
export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  provider: ScanProvider;
  state: TState;
  metadata: Record<string, string | number | boolean>;
}
```

#### `CliDriverSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L34) `packages/security-devsecops/src/adapters/real-driver.ts`

```ts
export interface CliDriverSpec {
  cliName: string;
  urlEnvKey: keyof RealDriverEnv;
  requiredEnvValue: string | undefined;
}
```

#### `ContainerAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L61) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface ContainerAdapter {
  axis: 'container-security';
  scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>>;
}
```

#### `ContainerCve`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L9) `packages/security-devsecops/src/semantics/container-security.ts`

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

#### `ContainerMalware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L18) `packages/security-devsecops/src/semantics/container-security.ts`

```ts
export interface ContainerMalware {
  malwareType: 'trojan' | 'backdoor' | 'cryptominer' | 'rootkit' | 'ransomware';
  filePath: string;
  layer: string;
  signature: string;
  severity: Severity;
}
```

#### `ContainerSecState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L7) `packages/security-devsecops/src/semantics/container-security.ts`

Container security axis — Grype-style container image scan + CVE detection + malware detection。

```ts
export type ContainerSecState = 'idle' | 'scanning' | 'threats-found' | 'completed';
```

#### `ContainerSecuritySession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/container-security.ts#L26) `packages/security-devsecops/src/semantics/container-security.ts`

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

#### `DastAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L56) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface DastAdapter {
  axis: 'dast';
  scan(input: AdapterInvocation): Promise<AdapterResult<DastState>>;
}
```

#### `DastAttack`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L9) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export interface DastAttack {
  attackType: 'xss' | 'sqli' | 'csrf' | 'xxe' | 'ssrf' | 'command-injection' | 'path-traversal';
  targetUrl: string;
  payload: string;
  successful: boolean;
}
```

#### `DastSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L24) `packages/security-devsecops/src/semantics/dast.ts`

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

#### `DastState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L7) `packages/security-devsecops/src/semantics/dast.ts`

DAST (Dynamic Application Security Testing) axis — OWASP ZAP-style live-app crawl + attack attempt + vulnerability confirmation。

```ts
export type DastState = 'idle' | 'crawling' | 'attacking' | 'vuln-found' | 'completed';
```

#### `DastVuln`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/dast.ts#L16) `packages/security-devsecops/src/semantics/dast.ts`

```ts
export interface DastVuln {
  vulnClass: string;
  cweId: string;
  targetUrl: string;
  severity: Severity;
  evidence: string;
}
```

#### `DevSecOpsAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L21) `packages/security-devsecops/src/semantics/types.ts`

```ts
export type DevSecOpsAxis =
  | 'sast'
  | 'sca'
  | 'secret-scan'
  | 'iac-scan'
  | 'dast'
  | 'container-security';
```

#### `IacAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L51) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface IacAdapter {
  axis: 'iac-scan';
  scan(input: AdapterInvocation): Promise<AdapterResult<IacScanState>>;
}
```

#### `IacComplianceCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L18) `packages/security-devsecops/src/semantics/iac-scan.ts`

```ts
export interface IacComplianceCheck {
  framework: 'soc2' | 'cis-benchmark' | 'pci-dss' | 'hipaa';
  controlId: string;
  passed: boolean;
}
```

#### `IacMisconfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L9) `packages/security-devsecops/src/semantics/iac-scan.ts`

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

#### `IacScanSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L24) `packages/security-devsecops/src/semantics/iac-scan.ts`

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

#### `IacScanState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/iac-scan.ts#L7) `packages/security-devsecops/src/semantics/iac-scan.ts`

IaC scan axis — tfsec-style Terraform / CloudFormation misconfiguration detection + compliance policy check (SOC 2 / CIS Benchmark)。

```ts
export type IacScanState = 'idle' | 'analyzing' | 'misconfig-found' | 'completed';
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L29) `packages/security-devsecops/src/semantics/types.ts`

```ts
export type NeutralEventName =
  // SAST
  | 'sast.scan-started'
  | 'sast.finding-detected'
  | 'sast.suppressed'
  | 'sast.scan-completed'
  // SCA
  | 'sca.dependency-analyzed'
  | 'sca.vuln-detected'
  | 'sca.license-flagged'
  | 'sca.scan-completed'
  // Secret scan
  | 'secret.pattern-matched'
  | 'secret.entropy-flagged'
  | 'secret.allowlisted'
  | 'secret.scan-completed'
  // IaC scan
  | 'iac.resource-analyzed'
  | 'iac.misconfig-detected'
  | 'iac.compliance-checked'
  | 'iac.scan-completed'
  // DAST
  | 'dast.crawl-started'
  | 'dast.attack-attempted'
  | 'dast.vulnerability-confirmed'
  | 'dast.scan-completed'
  // Container security
  | 'container.image-scanned'
  | 'container.cve-detected'
  | 'container.malware-flagged'
  | 'container.scan-completed';
```

#### `RealDriverEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/real-driver.ts#L12) `packages/security-devsecops/src/adapters/real-driver.ts`

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

#### `SastAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L36) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface SastAdapter {
  axis: 'sast';
  scan(input: AdapterInvocation): Promise<AdapterResult<SastState>>;
}
```

#### `SastFinding`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L10) `packages/security-devsecops/src/semantics/sast.ts`

```ts
export interface SastFinding {
  ruleId: string;
  filePath: string;
  line: number;
  severity: Severity;
  message: string;
}
```

#### `SastSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L18) `packages/security-devsecops/src/semantics/sast.ts`

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

#### `SastState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sast.ts#L8) `packages/security-devsecops/src/semantics/sast.ts`

SAST (Static Application Security Testing) axis — code scan → finding detection → severity classification → suppression / completion。 Semgrep-neutral pattern。

```ts
export type SastState = 'idle' | 'scanning' | 'findings-detected' | 'completed';
```

#### `ScaAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L41) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface ScaAdapter {
  axis: 'sca';
  scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>>;
}
```

#### `ScaLicenseFlag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L17) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export interface ScaLicenseFlag {
  package: string;
  license: string;
  reason: 'copyleft' | 'unknown' | 'restricted';
}
```

#### `ScanProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L13) `packages/security-devsecops/src/semantics/types.ts`

DevSecOps semantics — provider-neutral axis SSOT (v0.1)。 v0.1 covers 6 axis = SAST (Static Application Security Testing) + SCA (Software Composition Analysis) + Secret scan + IaC scan + DAST (Dynamic Application Security Testing) + Container security。 Each axis is a small pure state-machine helper that returns a neutral envelope。 downstream tests can drive the axis without knowing the provider payload dialect (Semgrep / Trivy / Gitleaks / tfsec / OWASP ZAP / Grype)。

```ts
export type ScanProvider =
  | 'semgrep'
  | 'trivy'
  | 'gitleaks'
  | 'tfsec'
  | 'owasp-zap'
  | 'grype';
```

#### `ScaSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L23) `packages/security-devsecops/src/semantics/sca.ts`

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

#### `ScaState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L7) `packages/security-devsecops/src/semantics/sca.ts`

SCA (Software Composition Analysis) axis — Trivy-style dependency scan + CVE lookup + license flagging。

```ts
export type ScaState = 'idle' | 'analyzing' | 'vulns-detected' | 'completed';
```

#### `ScaVuln`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/sca.ts#L9) `packages/security-devsecops/src/semantics/sca.ts`

```ts
export interface ScaVuln {
  cveId: string;
  package: string;
  version: string;
  severity: Severity;
  fixedVersion?: string;
}
```

#### `SecretAdapter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/adapters/types.ts#L46) `packages/security-devsecops/src/adapters/types.ts`

```ts
export interface SecretAdapter {
  axis: 'secret-scan';
  scan(input: AdapterInvocation): Promise<AdapterResult<SecretScanState>>;
}
```

#### `SecretMatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L9) `packages/security-devsecops/src/semantics/secret-scan.ts`

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

#### `SecretScanSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L18) `packages/security-devsecops/src/semantics/secret-scan.ts`

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

#### `SecretScanState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/secret-scan.ts#L7) `packages/security-devsecops/src/semantics/secret-scan.ts`

Secret scan axis — Gitleaks-style secret pattern matching + entropy analysis + allowlist support。

```ts
export type SecretScanState = 'idle' | 'scanning' | 'secrets-found' | 'completed';
```

#### `Severity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/semantics/types.ts#L61) `packages/security-devsecops/src/semantics/types.ts`

```ts
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```
<!-- kiwa-public-api:end -->
