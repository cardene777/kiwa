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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security-devsecops/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [adapters/container-security-mock.ts](./api/adapters__container-security-mock) | 1 | 0 |
| [adapters/container-security-real.ts](./api/adapters__container-security-real) | 1 | 0 |
| [adapters/dast-mock.ts](./api/adapters__dast-mock) | 1 | 0 |
| [adapters/dast-real.ts](./api/adapters__dast-real) | 1 | 0 |
| [adapters/iac-scan-mock.ts](./api/adapters__iac-scan-mock) | 1 | 0 |
| [adapters/iac-scan-real.ts](./api/adapters__iac-scan-real) | 1 | 0 |
| [adapters/real-driver.ts](./api/adapters__real-driver) | 2 | 2 |
| [adapters/sast-mock.ts](./api/adapters__sast-mock) | 1 | 0 |
| [adapters/sast-real.ts](./api/adapters__sast-real) | 1 | 0 |
| [adapters/sca-mock.ts](./api/adapters__sca-mock) | 1 | 0 |
| [adapters/sca-real.ts](./api/adapters__sca-real) | 1 | 0 |
| [adapters/secret-scan-mock.ts](./api/adapters__secret-scan-mock) | 1 | 0 |
| [adapters/secret-scan-real.ts](./api/adapters__secret-scan-real) | 1 | 0 |
| [adapters/types.ts](./api/adapters__types) | 0 | 10 |
| [orchestrator/preset.ts](./api/orchestrator__preset) | 2 | 0 |
| [orchestrator/run-audit.ts](./api/orchestrator__run-audit) | 1 | 0 |
| [orchestrator/summary.ts](./api/orchestrator__summary) | 1 | 0 |
| [orchestrator/types.ts](./api/orchestrator__types) | 0 | 5 |
| [semantics/container-security.ts](./api/semantics__container-security) | 5 | 4 |
| [semantics/dast.ts](./api/semantics__dast) | 5 | 4 |
| [semantics/iac-scan.ts](./api/semantics__iac-scan) | 5 | 4 |
| [semantics/sast.ts](./api/semantics__sast) | 4 | 3 |
| [semantics/sca.ts](./api/semantics__sca) | 5 | 4 |
| [semantics/secret-scan.ts](./api/semantics__secret-scan) | 5 | 3 |
| [semantics/types.ts](./api/semantics__types) | 0 | 5 |

<!-- kiwa-public-api:end -->
