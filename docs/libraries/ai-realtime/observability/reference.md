# Observability リファレンス

## テスト結果

| API | 説明 |
| --- | --- |
| `fromVitestJson(report, options)` | Vitest JSON を `TestRunRecord[]` へ変換します |
| `collectRunHistory(options)` | 実行記録を test ID ごとの `RunHistory` に追加します |
| `detectFlaky(options)` | 混在する成否を持つテストを検出します |
| `analyzeSpecCoverage(options)` | 仕様とテストコードの ID を比較します |
| `renderDashboard(input)` | Markdown dashboard を作ります |
| `fromIstanbulCoverageSummary(input)` | Istanbul summary を coverage summary へ変換します |
| `checkThresholds(summary, thresholds)` | coverage 閾値を判定します |

## テレメトリーと分析

| API | 説明 |
| --- | --- |
| `TelemetryCollector` | span、metric、log、exception、transaction を保持します |
| `createOtelMock` | OpenTelemetry 形式のモックを作ります |
| `createDatadogMock` | Datadog 形式のモックを作ります |
| `createSentryMock` | Sentry 形式のモックを作ります |
| `DashboardMock` | metric を集計する dashboard を作ります |
| `AlertRouter` | alert rule、route、silence、escalation を評価します |
| `buildSpanTree` | span の親子関係を木へ変換します |
| `renderFlameGraph` | span tree を flame graph のデータへ変換します |
| `LogCorrelationIndex` | log と span を相互に検索する index です |

高度な observability semantics は `semantics` namespace から利用できます。real backend の設定には `buildRealDriverConfig`、環境条件の確認には `isKiwaModeReal` を使います。

Istanbul summaryにtotal行がない場合はfile行を集計します。対象数が0のmetricは100%になります。checkThresholdsは指定されたmetricだけを比較し、未指定thresholdをfailにしません。

buildRealDriverConfig はendpointとtimeoutの設定値を作るhelperです。KIWA_MODEがrealでない場合のskip判断も提供しますが、backendへ接続・送信・queryするclientは提供しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `executeRemediation: session is ${session.state}, not anomaly-detected` | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L101) |
| 'executeRemediation: actions must not be empty' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L104) |
| `analyzeRootCause: session is ${session.state}, not remediation-executed` | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L123) |
| 'analyzeRootCause: failedServices must not be empty' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L126) |
| `correlateAlerts: session is ${session.state}, not root-cause-analyzed` | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L157) |
| 'correlateAlerts: alerts must not be empty' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L160) |
| 'correlateAlerts: windowMs must be positive' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L163) |
| 'startAiopsSession: clusterId must not be empty' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L58) |
| `detectAnomaly: session is ${session.state}, not idle` | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L77) |
| 'detectAnomaly: points must not be empty' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L80) |
| 'detectAnomaly: zScoreThreshold must be positive' | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L83) |
| 'setEscalationChain: chain must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L106) |
| 'setEscalationChain: afterMinutes must be strictly increasing' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L110) |
| 'advanceEscalation: chain must be set first' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L121) |
| 'advanceEscalation: chain already at final step' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L124) |
| 'advanceEscalation: current step is undefined' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L129) |
| 'pageOncall: target must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L144) |
| 'startAlertRoutingAdvanced: routerId must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L45) |
| 'applySilence: endMs must be after startMs' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L65) |
| 'applySilence: matcher must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L68) |
| 'applyInhibit: sourceMatcher must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L84) |
| 'applyInhibit: targetMatcher must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L87) |
| 'applyInhibit: equalLabels must not be empty' | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L90) |
| 'reduceLabel: label must not be empty' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L112) |
| 'bucketHistogram: boundaries must not be empty' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L140) |
| 'bucketHistogram: boundaries must be strictly increasing' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L146) |
| 'startCardinalitySession: scopeId must not be empty' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L30) |
| 'scanSeries: series must not be empty' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L48) |
| 'detectHighCardinality: threshold must be positive' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L70) |
| 'detectHighCardinality: series must be scanned first' | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L73) |
| `triggerRollback: session is ${session.state}, not blast-radius-computed` | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L115) |
| 'triggerRollback: errorRate must be within [0, 1]' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L118) |
| 'triggerRollback: threshold must be within [0, 1]' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L121) |
| `recordGameDay: session is ${session.state}, not rollback-triggered` | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L137) |
| 'recordGameDay: participants must be positive' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L140) |
| 'recordGameDay: issuesFound must be non-negative' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L143) |
| 'recordGameDay: durationMinutes must be positive' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L146) |
| 'startChaosSession: experimentId must not be empty' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L50) |
| `injectFault: session is ${session.state}, not idle` | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L70) |
| 'injectFault: target must not be empty' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L73) |
| 'injectFault: durationSec must be positive' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L76) |
| `computeBlastRadius: session is ${session.state}, not fault-injected` | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L92) |
| 'computeBlastRadius: totalInstances must be positive' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L95) |
| 'computeBlastRadius: affectedInstances must be within [0, totalInstances]' | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L98) |
| `evaluateFreshness: session is ${session.state}, not lineage-captured` | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L108) |
| 'evaluateFreshness: slaMinutes must be positive' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L111) |
| 'evaluateFreshness: nowMs must be >= lastEventAtMs' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L114) |
| `detectSchemaDrift: session is ${session.state}, not freshness-evaluated` | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L133) |
| 'detectSchemaDrift: expected schema must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L136) |
| `scoreDataQuality: session is ${session.state}, not schema-drift-detected` | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L163) |
| 'scoreDataQuality: checks must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L166) |
| 'startPipelineSession: namespace must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L53) |
| 'startPipelineSession: jobName must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L56) |
| `captureLineage: session is ${session.state}, not idle` | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L77) |
| 'captureLineage: edges must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L80) |
| 'captureLineage: edge nodes must not be empty' | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L84) |
| `captureLineage: self-loop edge ${e.from}` | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L87) |
| `recordSyscall: session is ${session.state}, not kernel-traced` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L116) |
| 'recordSyscall: counts must not be empty' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L120) |
| `recordSyscall: count for ${name} must be non-negative` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L124) |
| `captureNetworkFlow: session is ${session.state}, not syscall-recorded` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L141) |
| 'captureNetworkFlow: flows must not be empty' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L144) |
| 'captureNetworkFlow: bytes/packets must be non-negative' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L148) |
| 'startEbpfIiiSession: hostId must not be empty' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L46) |
| `probeUserspace: session is ${session.state}, not idle` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L65) |
| 'probeUserspace: probes must not be empty' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L68) |
| `probeUserspace: expected uprobe, got ${p.kind}` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L72) |
| `traceKernel: session is ${session.state}, not userspace-probed` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L88) |
| 'traceKernel: probes must not be empty' | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L91) |
| `traceKernel: expected kprobe/tracepoint/lsm, got ${p.kind}` | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L95) |
| 'resolveTraceToMetric: traceId must not be empty' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L115) |
| 'startExemplarSession: bucket must not be empty' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L31) |
| 'recordExemplarMetric: metricName must not be empty' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L47) |
| 'recordExemplarMetric: traceId must be at least 8 chars' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L50) |
| 'recordExemplarMetric: spanId must be at least 4 chars' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L53) |
| `attachTraceToMetric: no exemplar for metric=${input.metricName} trace=${input.traceId}` | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L79) |
| 'resolveMetricToTrace: metricName must not be empty' | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L97) |
| `recommendRightsizing: session is ${session.state}, not team-attributed` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L117) |
| 'recommendRightsizing: recommendations must not be empty' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L120) |
| `recommendRightsizing: costs for ${r.resource} must be non-negative` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L124) |
| `optimizeSpot: session is ${session.state}, not rightsizing-recommended` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L144) |
| 'optimizeSpot: onDemandUsd must be positive' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L147) |
| 'optimizeSpot: spotUsd must be non-negative' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L150) |
| 'optimizeSpot: spotUsd must not exceed onDemandUsd' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L153) |
| 'startFinopsSession: accountId must not be empty' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L47) |
| `recordCostPerRequest: session is ${session.state}, not idle` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L67) |
| 'recordCostPerRequest: requests must be positive' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L70) |
| 'recordCostPerRequest: totalCostUsd must be non-negative' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L73) |
| `attributeTeam: session is ${session.state}, not cost-per-request-recorded` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L91) |
| 'attributeTeam: teamCosts must not be empty' | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L94) |
| `attributeTeam: cost for ${t.team} must be non-negative` | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L98) |
| `evaluatePolicy: session is ${session.state}, not drift-detected` | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L118) |
| 'evaluatePolicy: results must not be empty' | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L121) |
| `attributeCost: session is ${session.state}, not policy-evaluated` | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L141) |
| 'attributeCost: attributions must not be empty' | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L144) |
| `attributeCost: cost for ${a.team} must be non-negative` | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L148) |
| 'startIacSession: workspace must not be empty' | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L50) |
| `capturePlan: session is ${session.state}, not idle` | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L69) |
| 'capturePlan: changes must not be empty' | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L72) |
| `detectDrift: session is ${session.state}, not plan-captured` | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L92) |
| 'logPrompt: requestId must not be empty' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L102) |
| `flagHallucination: session is ${session.state}, not prompt-logged` | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L119) |
| 'flagHallucination: signals must not be empty' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L122) |
| `flagHallucination: score for ${s.metric} must be within [0, 1]` | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L126) |
| `checkBudget: session is ${session.state}, not hallucination-flagged` | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L147) |
| 'checkBudget: spentUsd must be non-negative' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L150) |
| 'checkBudget: limitUsd must be positive' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L153) |
| 'startLlmObsSession: serviceName must not be empty' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L55) |
| `countTokens: session is ${session.state}, not idle` | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L75) |
| 'countTokens: model must not be empty' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L78) |
| 'countTokens: token counts must be non-negative' | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L81) |
| `logPrompt: session is ${session.state}, not tokens-counted` | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L99) |
| 'startLogCorrelationAdvanced: namespace must not be empty' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L33) |
| 'emitStructuredLog: message must not be empty' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L50) |
| 'joinTraceIds: traceId must not be empty' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L67) |
| 'joinLogQLAndPromQL: logQlSelector must not be empty' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L89) |
| 'joinLogQLAndPromQL: promQlSelector must not be empty' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L92) |
| 'joinLogQLAndPromQL: at least one join label required' | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L95) |
| `extractW3CContext: invalid traceparent format (expected 4 parts, got ${parts.length})` | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L115) |
| `extractW3CContext: unsupported traceparent version ${version}` | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L121) |
| 'extractW3CContext: traceId must be 32 hex chars' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L124) |
| 'extractW3CContext: spanId must be 16 hex chars' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L127) |
| 'startOtelAdvanced: serviceName must not be empty' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L34) |
| 'enqueueSpan: spanId must not be empty' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L52) |
| 'flushBatch: maxBatchSize must be positive' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L62) |
| 'detectResource: attributes must not be empty' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L79) |
| 'propagateBaggage: baggage key must not be empty' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L95) |
| 'propagateBaggage: baggage value must not be empty' | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L98) |
| 'startProfiling: serviceName must not be empty' | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L34) |
| `${kind} sample: stack must not be empty` | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L78) |
| `${kind} sample: valueBytes must be non-negative` | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L81) |
| `buildFlameGraph: no samples for kind=${input.kind}` | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L99) |
| 'recordSaturation: saturation must be within [0, 1]' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L106) |
| 'startRedUse: serviceName must not be empty' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L28) |
| 'recordRequestRate: requests must be non-negative' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L47) |
| 'recordRequestRate: windowSeconds must be positive' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L50) |
| 'recordErrors: rate must be recorded first' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L66) |
| 'recordErrors: errors must be non-negative' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L69) |
| 'recordErrors: errors must not exceed total requests' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L72) |
| 'recordDuration: rate must be recorded first' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L88) |
| 'recordDuration: durationMs must be non-negative' | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L91) |
| `tripCircuitBreaker: session is ${session.state}, not sidecar-injected` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L113) |
| 'tripCircuitBreaker: total must be positive' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L116) |
| 'tripCircuitBreaker: failures must be within [0, total]' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L119) |
| `applyTrafficSplit: session is ${session.state}, not circuit-breaker-tripped` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L139) |
| 'applyTrafficSplit: splits must not be empty' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L142) |
| `applyTrafficSplit: weights must sum to 100 (got ${totalWeight})` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L146) |
| `applyTrafficSplit: weight for ${s.service} must be within [0, 100]` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L150) |
| 'startMeshSession: meshName must not be empty' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L51) |
| `handshakeMtls: session is ${session.state}, not idle` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L70) |
| 'handshakeMtls: clientSpiffe must be a spiffe:// URI' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L73) |
| 'handshakeMtls: serverSpiffe must be a spiffe:// URI' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L76) |
| `injectSidecar: session is ${session.state}, not mtls-handshaked` | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L92) |
| 'injectSidecar: injections must not be empty' | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L95) |
| `evaluateBurnRate: session is ${session.state}, not budget-computed` | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L106) |
| `fireMultiWindowMultiBurnRateAlert: session is ${session.state}, not burn-evaluated` | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L125) |
| 'fireMultiWindowMultiBurnRateAlert: thresholds must not be empty' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L128) |
| 'startSLO: sloId must not be empty' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L36) |
| 'startSLO: targetObjective must be 0 < objective < 1' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L39) |
| 'startSLO: windowDays must be positive' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L42) |
| `openSLOWindow: session is ${session.state}, not idle` | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L60) |
| 'recordRequests: window must be opened first' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L74) |
| 'recordRequests: counts must be non-negative' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L77) |
| 'recordRequests: errors must not exceed requests' | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L80) |
| `computeErrorBudget: session is ${session.state}, not window-open` | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L88) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `AlertRouter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L82) `packages/observability/src/alert.ts`

Prometheus AlertManager style alert router + rule engine + silence store + escalation state machine, glued to a TelemetryCollector.

```ts
/**
 * Prometheus AlertManager style alert router + rule engine + silence
 * store + escalation state machine, glued to a TelemetryCollector.
 */
export declare class AlertRouter {
    constructor(collector: TelemetryCollector, options?: {
        now?: () => number;
    });
    registerRule(rule: AlertRule): void;
    setRoute(route: RouteEntry): void;
    addSilence(silence: Silence): void;
    setEscalation(ruleId: string, steps: EscalationStep[]): void;
    /**
     * Evaluate every registered rule against the current collector
     * state. Rules whose predicate holds continuously for `forSamples`
     * evaluations transition pending → firing and are routed. Rules
     * whose predicate flips back to false transition to resolved.
     */
    evaluate(): AlertReceiverEvent[];
    /**
     * Advance the escalation clock. Any active fire whose escalation
     * step's `afterMs` has elapsed since firedAt gets routed to the
     * escalation receiver and transitions firing → escalated.
     */
    tickEscalation(): AlertReceiverEvent[];
    getDeliveries(): AlertReceiverEvent[];
    getActive(): AlertFire[];
}
```

#### `analyzeSpecCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L21) `packages/observability/src/spec-coverage.ts`

```ts
export declare function analyzeSpecCoverage(opts: AnalyzeSpecCoverageOptions): SpecCoverageGap;
```

#### `buildDashboardMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L214) `packages/observability/src/dashboard-mock.ts`

Builder helper — construct a DashboardMock from an already-populated collector plus a panel list. Sugar for the common test setup.

```ts
export declare function buildDashboardMock(input: {
    id: string;
    title: string;
    panels: PanelConfig[];
    collector: TelemetryCollector;
    now?: () => number;
}): DashboardMock;
```

#### `buildRealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L54) `packages/observability/src/real-driver.ts`

```ts
export declare function buildRealDriverConfig(backend: ObservabilityBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### `buildSpanTree`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L49) `packages/observability/src/trace-flame.ts`

Build a tree of SpanNodes from a flat span array. Spans reference their parent by `parentSpanName`; when the parent is null the span becomes a root. Children order preserves the collector insertion order (matches call order in the SUT).

```ts
export declare function buildSpanTree(spans: SpanRecord[]): SpanNode[];
```

#### `checkThresholds`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L109) `packages/observability/src/coverage.ts`

```ts
export declare function checkThresholds(summary: CoverageSummary, thresholds: CoverageThresholds): ThresholdCheckResult;
```

#### `collectRunHistory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L12) `packages/observability/src/collect.ts`

```ts
export declare function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory;
```

#### `correlateLogsAndSpans`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L162) `packages/observability/src/log-correlation.ts`

Sugar for the common case: build an index over the entire collector state.

```ts
export declare function correlateLogsAndSpans(input: {
    logs: LogRecord[];
    spans: SpanRecord[];
}, keys?: CorrelationKeys): LogCorrelationIndex;
```

#### `createDatadogMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L191) `packages/observability/src/telemetry.ts`

```ts
export declare function createDatadogMock(config?: {
    now?: () => number;
}): DatadogMock;
```

#### `createOtelMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L113) `packages/observability/src/telemetry.ts`

```ts
export declare function createOtelMock(config?: {
    now?: () => number;
}): OtelMock;
```

#### `createSentryMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L245) `packages/observability/src/telemetry.ts`

```ts
export declare function createSentryMock(config?: {
    now?: () => number;
}): SentryMock;
```

#### `DashboardMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L73) `packages/observability/src/dashboard-mock.ts`

Grafana-style dashboard mock. A single dashboard binds to a single TelemetryCollector and re-queries metrics on each `refresh()` call.

```ts
/**
 * Grafana-style dashboard mock. A single dashboard binds to a single
 * TelemetryCollector and re-queries metrics on each `refresh()` call.
 */
export declare class DashboardMock {
    readonly id: string;
    readonly title: string;
    constructor(config: DashboardConfig, collector: TelemetryCollector, options?: {
        now?: () => number;
    });
    /**
     * Re-execute every panel query against the current collector state.
     * Returns the new panel results and increments refreshCount.
     */
    refresh(): PanelResult[];
    /**
     * Number of times refresh() has been called since construction.
     */
    getRefreshCount(): number;
    /**
     * The most recent set of panel results (empty array before first
     * refresh call).
     */
    getLastResults(): PanelResult[];
    /**
     * Convenience accessor by panel id from the most recent results.
     */
    panel(panelId: string): PanelResult | undefined;
}
```

#### `defaultRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L119) `packages/observability/src/fixtures.ts`

Alert routing tree — deepest match wins.

```ts
export declare function defaultRoute(): RouteEntry;
```

#### `detectFlaky`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L11) `packages/observability/src/flaky.ts`

```ts
export declare function detectFlaky(opts: DetectFlakyOptions): FlakyTest[];
```

#### `drillDown`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L142) `packages/observability/src/trace-flame.ts`

Drill-down — return the subtree rooted at the first node whose name matches. Depth is normalized so the drilled-in root sits at depth 0. Returns null when no matching node exists.

```ts
export declare function drillDown(roots: FlameNode[], name: string): FlameNode | null;
```

#### `escalation_pagerDutyTwoStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L142) `packages/observability/src/fixtures.ts`

```ts
export declare function escalation_pagerDutyTwoStep(): EscalationStep[];
```

#### `explicitEnvKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L35) `packages/observability/src/real-driver.ts`

```ts
export declare function explicitEnvKey(backend: ObservabilityBackend): string;
```

#### `flattenFlame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L172) `packages/observability/src/trace-flame.ts`

Flatten a flame tree into a depth-first list. Handy for kiwa assertions that need to iterate every node without recursing.

```ts
export declare function flattenFlame(roots: FlameNode[]): FlameNode[];
```

#### `fromIstanbulCoverageSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L74) `packages/observability/src/coverage.ts`

```ts
export declare function fromIstanbulCoverageSummary(raw: IstanbulCoverageSummary): CoverageSummary;
```

#### `fromVitestJson`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L58) `packages/observability/src/collect.ts`

```ts
export declare function fromVitestJson(report: VitestStyleReport, opts: FromVitestJsonOptions): TestRunRecord[];
```

#### `isKiwaModeReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L19) `packages/observability/src/real-driver.ts`

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### `LogCorrelationIndex`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L42) `packages/observability/src/log-correlation.ts`

Bidirectional index over the collector's logs / spans sinks. The index is built once from the current collector state; callers who mutate the collector after building must rebuild.

```ts
/**
 * Bidirectional index over the collector's logs / spans sinks. The
 * index is built once from the current collector state; callers who
 * mutate the collector after building must rebuild.
 */
export declare class LogCorrelationIndex {
    constructor(input: {
        logs: LogRecord[];
        spans: SpanRecord[];
    }, keys?: CorrelationKeys);
    /**
     * Logs whose spanId attribute equals the given span id.
     */
    logsForSpan(spanId: string): LogRecord[];
    /**
     * Logs whose traceId attribute equals the given trace id (across
     * every span in the trace).
     */
    logsForTrace(traceId: string): LogRecord[];
    /**
     * Spans in the given trace, insertion order.
     */
    spansForTrace(traceId: string): SpanRecord[];
    /**
     * Convenience — return every log with the span it joins to, or
     * null when the log carries no correlatable id.
     */
    linkAll(): LogSpanLink[];
    /**
     * Count logs that carry at least one correlatable id. Useful for
     * kiwa tests that measure the SUT's instrumentation coverage of
     * its own log surface.
     */
    correlatedCount(): number;
}
```

#### `logs_forHttpTrace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L280) `packages/observability/src/fixtures.ts`

Log correlation fixture — matched log lines for the http handler trace. Timestamps sit inside the parent span window so join by timestamp bucket also works for callers that do not carry ids.

```ts
export declare function logs_forHttpTrace(startAt?: number): LogRecord[];
```

#### `metricsForRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L282) `packages/observability/src/alert.ts`

Convenience — narrow accessor: metric records for a metric name. Kept exported so kiwa test scenarios can double-check assertion denominators without duplicating the filter predicate.

```ts
export declare function metricsForRule(collector: TelemetryCollector, rule: AlertRule): MetricRecord[];
```

#### `panel_httpErrorRate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L29) `packages/observability/src/fixtures.ts`

Dashboard panel builders — 3 named scenarios covering the common SaaS observability wall.

```ts
export declare function panel_httpErrorRate(id?: string): PanelConfig;
```

#### `panel_p99Latency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L46) `packages/observability/src/fixtures.ts`

```ts
export declare function panel_p99Latency(id?: string): PanelConfig;
```

#### `panel_queueDepth`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L63) `packages/observability/src/fixtures.ts`

```ts
export declare function panel_queueDepth(id?: string, queue?: string): PanelConfig;
```

#### `renderDashboard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard.ts#L29) `packages/observability/src/dashboard.ts`

```ts
export declare function renderDashboard(input: DashboardInput): string;
```

#### `renderFlameGraph`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L103) `packages/observability/src/trace-flame.ts`

Render a flame graph structure. Nodes with the same name at the same depth in the same parent chain collapse into one flame node whose `samples` counts how many spans contributed. Only closed spans (endedAt != null) contribute to the numeric aggregate; open spans are counted but contribute 0 ms.

```ts
export declare function renderFlameGraph(roots: SpanNode[]): FlameNode[];
```

#### `resolveObservabilityEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L23) `packages/observability/src/real-driver.ts`

```ts
export declare function resolveObservabilityEndpoint(backend: ObservabilityBackend, env?: NodeJS.ProcessEnv): string;
```

#### `rule_errorRateCritical`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L80) `packages/observability/src/fixtures.ts`

Alert rule builders — 3 named scenarios matching the panel wall.

```ts
export declare function rule_errorRateCritical(id?: string): AlertRule;
```

#### `rule_latencyDegraded`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L92) `packages/observability/src/fixtures.ts`

```ts
export declare function rule_latencyDegraded(id?: string): AlertRule;
```

#### `rule_queueBackpressure`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L104) `packages/observability/src/fixtures.ts`

```ts
export declare function rule_queueBackpressure(id?: string, queue?: string): AlertRule;
```

#### `semantics`

公開 entry point から解決しています。

```ts
export * as semantics from './semantics/index.js';
```

#### `silence_maintenanceWindow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L149) `packages/observability/src/fixtures.ts`

```ts
export declare function silence_maintenanceWindow(id: string, minutesFromNow: number, now: number): Silence;
```

#### `skipUnlessReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L66) `packages/observability/src/real-driver.ts`

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### `TelemetryCollector`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L63) `packages/observability/src/telemetry.ts`

Shared collector — every provider mock writes into the same shape so kiwa tests can assert once regardless of provider chosen.

```ts
export declare class TelemetryCollector {
    readonly spans: SpanRecord[];
    readonly metrics: MetricRecord[];
    readonly logs: LogRecord[];
    readonly exceptions: ExceptionRecord[];
    readonly transactions: TransactionRecord[];
    clear(): void;
    spanByName(name: string): SpanRecord | undefined;
    metricSum(name: string): number;
    hasException(fingerprint: string): boolean;
}
```

#### `trace_fanoutParallel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L191) `packages/observability/src/fixtures.ts`

```ts
export declare function trace_fanoutParallel(startAt?: number): SpanRecord[];
```

#### `trace_httpHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L161) `packages/observability/src/fixtures.ts`

Trace scenario builders — 3 named span shapes covering the common SUT flame graph patterns.

```ts
export declare function trace_httpHandler(startAt?: number): SpanRecord[];
```

#### `trace_nestedRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L229) `packages/observability/src/fixtures.ts`

```ts
export declare function trace_nestedRetry(startAt?: number): SpanRecord[];
```

### 型

#### `AlertFire`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L34) `packages/observability/src/alert.ts`

```ts
export interface AlertFire {
    ruleId: string;
    severity: AlertSeverity;
    labels: Record<string, string>;
    value: number;
    firedAt: number;
    state: AlertState;
}
```

#### `AlertOperator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L14) `packages/observability/src/alert.ts`

```ts
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
```

#### `AlertReceiverEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L71) `packages/observability/src/alert.ts`

```ts
export interface AlertReceiverEvent {
    receiver: string;
    fire: AlertFire;
    reason: 'route' | 'escalation';
    deliveredAt: number;
}
```

#### `AlertRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L20) `packages/observability/src/alert.ts`

```ts
export interface AlertRule {
    id: string;
    metricName: string;
    operator: AlertOperator;
    threshold: number;
    /**
     * Sample count required over which the operator must hold before
     * the rule transitions from pending → firing. Default: 1.
     */
    forSamples?: number;
    labels: Record<string, string>;
    severity: AlertSeverity;
}
```

#### `AlertSeverity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L16) `packages/observability/src/alert.ts`

```ts
export type AlertSeverity = 'info' | 'warn' | 'critical';
```

#### `AlertState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L18) `packages/observability/src/alert.ts`

```ts
export type AlertState = 'pending' | 'firing' | 'escalated' | 'resolved';
```

#### `AnalyzeSpecCoverageOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L6) `packages/observability/src/spec-coverage.ts`

```ts
export interface AnalyzeSpecCoverageOptions {
    specMarkdown: string;
    testCode: string;
    module?: string;
    defaultLayer?: 'contract' | 'unit' | 'integration' | 'e2e' | 'api' | 'ui' | 'data' | 'cli';
}
```

#### `CollectRunHistoryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L3) `packages/observability/src/collect.ts`

```ts
export interface CollectRunHistoryOptions {
    /** Existing history to extend */
    history?: RunHistory;
    /** New records to append */
    records: TestRunRecord[];
    /** Cap the number of retained records per testId (FIFO eviction) */
    maxPerTest?: number;
}
```

#### `CorrelationKeys`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L20) `packages/observability/src/log-correlation.ts`

Attribute keys used to look up trace / span ids on both sides. Callers can override for SDKs that use different key conventions (OpenTelemetry canonical is `trace_id` / `span_id`, Datadog is `dd.trace_id`, Sentry is `sentry-trace`).

```ts
export interface CorrelationKeys {
    traceIdKey?: string;
    spanIdKey?: string;
    /**
     * Fallback trace key checked when `traceIdKey` is not present.
     * Useful when the SUT mixes conventions during a migration.
     */
    altTraceIdKeys?: string[];
}
```

#### `CoverageFileEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L8) `packages/observability/src/coverage.ts`

```ts
export interface CoverageFileEntry {
    path: string;
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
}
```

#### `CoverageMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L1) `packages/observability/src/coverage.ts`

```ts
export interface CoverageMetric {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}
```

#### `CoverageSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L16) `packages/observability/src/coverage.ts`

```ts
export interface CoverageSummary {
    total: CoverageFileEntry;
    files: CoverageFileEntry[];
}
```

#### `CoverageThresholds`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L97) `packages/observability/src/coverage.ts`

```ts
export interface CoverageThresholds {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
}
```

#### `DashboardConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L63) `packages/observability/src/dashboard-mock.ts`

```ts
export interface DashboardConfig {
    id: string;
    title: string;
    panels: PanelConfig[];
}
```

#### `DashboardInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L32) `packages/observability/src/types.ts`

```ts
export interface DashboardInput {
    history: RunHistory;
    flaky: FlakyTest[];
    gaps: SpecCoverageGap[];
    coverage?: import('./coverage.js').CoverageSummary;
}
```

#### `DatadogMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L174) `packages/observability/src/telemetry.ts`

```ts
export interface DatadogMock {
    readonly provider: 'datadog';
    readonly collector: TelemetryCollector;
    statsd: {
        increment(name: string, value?: number, tags?: Record<string, string>): void;
        gauge(name: string, value: number, tags?: Record<string, string>): void;
        histogram(name: string, value: number, tags?: Record<string, string>): void;
    };
    tracer: {
        startSpan(name: string, options?: {
            tags?: Record<string, string>;
            childOf?: string;
        }): {
            addTags(tags: Record<string, string>): void;
            log(fields: Record<string, unknown>): void;
            finish(): void;
        };
    };
}
```

#### `DetectFlakyOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L3) `packages/observability/src/flaky.ts`

```ts
export interface DetectFlakyOptions {
    history: RunHistory;
    /** Minimum number of runs before a test is eligible for flaky scoring */
    minRuns?: number;
    /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
    threshold?: number;
}
```

#### `EscalationStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L65) `packages/observability/src/alert.ts`

```ts
export interface EscalationStep {
    /** Milliseconds after firing before this step applies. */
    afterMs: number;
    receiver: string;
}
```

#### `ExceptionRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L42) `packages/observability/src/telemetry.ts`

```ts
export interface ExceptionRecord {
    message: string;
    fingerprint: string;
    stack: string | null;
    breadcrumbs: Array<{
        category: string;
        message: string;
        level: string;
        timestamp: number;
    }>;
    tags: Record<string, string>;
    timestamp: number;
}
```

#### `FlakyTest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L16) `packages/observability/src/types.ts`

```ts
export interface FlakyTest {
    testId: string;
    fullName: string;
    totalRuns: number;
    passes: number;
    failures: number;
    failureRate: number;
}
```

#### `FlameNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L29) `packages/observability/src/trace-flame.ts`

```ts
export interface FlameNode {
    name: string;
    depth: number;
    totalMs: number;
    selfMs: number;
    /**
     * Sample count — how many spans with this name aggregated into
     * this flame node. When multiple root/parent chains share a name
     * they collapse into a single flame node.
     */
    samples: number;
    children: FlameNode[];
}
```

#### `FromVitestJsonOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L52) `packages/observability/src/collect.ts`

```ts
export interface FromVitestJsonOptions {
    runId: string;
}
```

#### `IstanbulCoverageSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L35) `packages/observability/src/coverage.ts`

```ts
export type IstanbulCoverageSummary = Record<string, IstanbulFileSummary>;
```

#### `LogRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L35) `packages/observability/src/telemetry.ts`

```ts
export interface LogRecord {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    attributes: Record<string, unknown>;
    timestamp: number;
}
```

#### `LogSpanLink`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L30) `packages/observability/src/log-correlation.ts`

```ts
export interface LogSpanLink {
    log: LogRecord;
    span: SpanRecord | null;
    traceId: string | null;
    spanId: string | null;
}
```

#### `MetricAggregation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L18) `packages/observability/src/dashboard-mock.ts`

```ts
export type MetricAggregation = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'last';
```

#### `MetricQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L20) `packages/observability/src/dashboard-mock.ts`

```ts
export interface MetricQuery {
    metricName: string;
    aggregation: MetricAggregation;
    /**
     * Optional tag filter. All tag key/value pairs must match on a
     * MetricRecord for it to enter the aggregation.
     */
    tagFilter?: Record<string, string>;
    /**
     * Optional time window. `sinceMs` and `untilMs` bound the
     * MetricRecord.timestamp against the collector clock.
     */
    sinceMs?: number;
    untilMs?: number;
}
```

#### `MetricRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L27) `packages/observability/src/telemetry.ts`

```ts
export interface MetricRecord {
    name: string;
    kind: 'counter' | 'gauge' | 'histogram';
    value: number;
    tags: Record<string, string>;
    timestamp: number;
}
```

#### `ObservabilityBackend`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L10) `packages/observability/src/real-driver.ts`

Real driver env-gate for observability v2.1. Provides KIWA_MODE=real-based helpers for testing against actual observability backends (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveObservabilityEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type ObservabilityBackend = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';
```

#### `OtelMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L93) `packages/observability/src/telemetry.ts`

```ts
export interface OtelMock {
    readonly provider: 'otel';
    readonly collector: TelemetryCollector;
    tracer: {
        startSpan(name: string, options?: {
            attributes?: Record<string, unknown>;
            parent?: string;
        }): {
            addEvent(name: string, attributes?: Record<string, unknown>): void;
            setAttribute(key: string, value: unknown): void;
            end(): void;
        };
    };
    meter: {
        createCounter(name: string): {
            add(value: number, tags?: Record<string, string>): void;
        };
        createGauge(name: string): {
            record(value: number, tags?: Record<string, string>): void;
        };
        createHistogram(name: string): {
            record(value: number, tags?: Record<string, string>): void;
        };
    };
    logger: {
        emit(record: Omit<LogRecord, 'timestamp'>): void;
    };
}
```

#### `PanelConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L45) `packages/observability/src/dashboard-mock.ts`

```ts
export interface PanelConfig {
    id: string;
    title: string;
    kind: PanelKind;
    query: MetricQuery;
    thresholds?: PanelThreshold[];
}
```

#### `PanelKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L16) `packages/observability/src/dashboard-mock.ts`

```ts
export type PanelKind = 'stat' | 'timeseries' | 'gauge' | 'table';
```

#### `PanelResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L53) `packages/observability/src/dashboard-mock.ts`

```ts
export interface PanelResult {
    panelId: string;
    title: string;
    kind: PanelKind;
    value: number;
    matchedRecords: number;
    badge: PanelThreshold['label'] | null;
    refreshedAt: number;
}
```

#### `PanelThreshold`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L36) `packages/observability/src/dashboard-mock.ts`

```ts
export interface PanelThreshold {
    /** Comparison operator against the aggregated numeric result. */
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    /** Threshold value; result compared with `operator` decides badge. */
    value: number;
    /** Badge label emitted when the comparison is true. */
    label: 'ok' | 'warn' | 'critical';
}
```

#### `RealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L48) `packages/observability/src/real-driver.ts`

```ts
export interface RealDriverConfig {
    backend: ObservabilityBackend;
    endpoint: string;
    timeoutMs: number;
}
```

#### `RouteEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L43) `packages/observability/src/alert.ts`

```ts
export interface RouteEntry {
    /**
     * Label match — all key/value pairs must be present on the fire's
     * labels for the entry to be considered.
     */
    match: Record<string, string>;
    receiver: string;
    /**
     * Nested routes are evaluated when the parent match holds; the
     * first nested match that satisfies wins over the parent (deepest
     * match wins). Nested routes without a match are treated as a
     * catch-all inside the parent branch.
     */
    routes?: RouteEntry[];
}
```

#### `RunHistory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L12) `packages/observability/src/types.ts`

```ts
export interface RunHistory {
    records: TestRunRecord[];
}
```

#### `SentryMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L235) `packages/observability/src/telemetry.ts`

```ts
export interface SentryMock {
    readonly provider: 'sentry';
    readonly collector: TelemetryCollector;
    captureException(err: Error | {
        message: string;
        stack?: string;
    }, options?: {
        tags?: Record<string, string>;
    }): string;
    addBreadcrumb(input: {
        category: string;
        message: string;
        level?: string;
    }): void;
    startTransaction(input: {
        name: string;
        op: string;
        tags?: Record<string, string>;
    }): {
        finish(): void;
    };
}
```

#### `Silence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L59) `packages/observability/src/alert.ts`

```ts
export interface Silence {
    id: string;
    match: Record<string, string>;
    expiresAt: number;
}
```

#### `SpanNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L16) `packages/observability/src/trace-flame.ts`

```ts
export interface SpanNode {
    name: string;
    attributes: Record<string, unknown>;
    startedAt: number;
    endedAt: number | null;
    /** Total time (endedAt - startedAt); null when span is still open. */
    totalMs: number | null;
    /** Time spent in this node minus time spent in its children. */
    selfMs: number | null;
    children: SpanNode[];
    depth: number;
}
```

#### `SpanRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L18) `packages/observability/src/telemetry.ts`

```ts
export interface SpanRecord {
    name: string;
    attributes: Record<string, unknown>;
    startedAt: number;
    endedAt: number | null;
    parentSpanName: string | null;
    events: Array<{
        name: string;
        attributes: Record<string, unknown>;
        timestamp: number;
    }>;
}
```

#### `SpecCoverageGap`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L25) `packages/observability/src/types.ts`

```ts
export interface SpecCoverageGap {
    module: string;
    layer: string;
    missingTcIds: string[];
    extraTcIds: string[];
}
```

#### `TelemetryProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L16) `packages/observability/src/telemetry.ts`

Telemetry provider mock — v0.2 addition (v1.14-4). Adds unified in-memory collectors for the 3 major APM / error providers: - OpenTelemetry (span / metric / log) - Datadog (StatsD gauge/increment/histogram + tracer.startSpan) - Sentry (captureException / addBreadcrumb / startTransaction) The v1.0 observability API (flaky + spec coverage) targets test-run analysis. This module targets application telemetry emitted during test execution so kiwa tests can assert "the SUT emitted span X", "the metric counter incremented", or "the exception was captured with fingerprint Y".

```ts
export type TelemetryProvider = 'otel' | 'datadog' | 'sentry';
```

#### `TestRunRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L3) `packages/observability/src/types.ts`

```ts
export interface TestRunRecord {
    testId: string;
    fullName: string;
    status: TestStatus;
    durationMs: number;
    runId: string;
    startedAt: number;
}
```

#### `TestStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L1) `packages/observability/src/types.ts`

```ts
export type TestStatus = 'passed' | 'failed' | 'skipped';
```

#### `ThresholdCheckResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L104) `packages/observability/src/coverage.ts`

```ts
export interface ThresholdCheckResult {
    ok: boolean;
    failures: Array<{
        metric: keyof CoverageThresholds;
        required: number;
        actual: number;
    }>;
}
```

#### `TransactionRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L51) `packages/observability/src/telemetry.ts`

```ts
export interface TransactionRecord {
    name: string;
    operation: string;
    startedAt: number;
    endedAt: number | null;
    tags: Record<string, string>;
}
```

#### `VitestStyleAssertionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L35) `packages/observability/src/collect.ts`

```ts
export interface VitestStyleAssertionResult {
    fullName?: string;
    title?: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration?: number;
}
```

#### `VitestStyleReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L47) `packages/observability/src/collect.ts`

```ts
export interface VitestStyleReport {
    testResults: VitestStyleTestResult[];
    startTime?: number;
}
```

#### `VitestStyleTestResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L42) `packages/observability/src/collect.ts`

```ts
export interface VitestStyleTestResult {
    testFilePath?: string;
    assertionResults: VitestStyleAssertionResult[];
}
```
<!-- kiwa-public-api:end -->
