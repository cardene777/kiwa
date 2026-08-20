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
| <code v-pre>executeRemediation: session is $&#123;session.state&#125;, not anomaly-detected</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L101) |
| <code v-pre>executeRemediation: actions must not be empty</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L104) |
| <code v-pre>analyzeRootCause: session is $&#123;session.state&#125;, not remediation-executed</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L123) |
| <code v-pre>analyzeRootCause: failedServices must not be empty</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L126) |
| <code v-pre>correlateAlerts: session is $&#123;session.state&#125;, not root-cause-analyzed</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L157) |
| <code v-pre>correlateAlerts: alerts must not be empty</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L160) |
| <code v-pre>correlateAlerts: windowMs must be positive</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L163) |
| <code v-pre>startAiopsSession: clusterId must not be empty</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L58) |
| <code v-pre>detectAnomaly: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L77) |
| <code v-pre>detectAnomaly: points must not be empty</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L80) |
| <code v-pre>detectAnomaly: zScoreThreshold must be positive</code> | [packages/observability/src/semantics/aiops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/aiops.ts#L83) |
| <code v-pre>setEscalationChain: chain must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L106) |
| <code v-pre>setEscalationChain: afterMinutes must be strictly increasing</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L110) |
| <code v-pre>advanceEscalation: chain must be set first</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L121) |
| <code v-pre>advanceEscalation: chain already at final step</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L124) |
| <code v-pre>advanceEscalation: current step is undefined</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L129) |
| <code v-pre>pageOncall: target must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L144) |
| <code v-pre>startAlertRoutingAdvanced: routerId must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L45) |
| <code v-pre>applySilence: endMs must be after startMs</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L65) |
| <code v-pre>applySilence: matcher must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L68) |
| <code v-pre>applyInhibit: sourceMatcher must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L84) |
| <code v-pre>applyInhibit: targetMatcher must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L87) |
| <code v-pre>applyInhibit: equalLabels must not be empty</code> | [packages/observability/src/semantics/alert-routing-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/alert-routing-advanced.ts#L90) |
| <code v-pre>reduceLabel: label must not be empty</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L112) |
| <code v-pre>bucketHistogram: boundaries must not be empty</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L140) |
| <code v-pre>bucketHistogram: boundaries must be strictly increasing</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L146) |
| <code v-pre>startCardinalitySession: scopeId must not be empty</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L30) |
| <code v-pre>scanSeries: series must not be empty</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L48) |
| <code v-pre>detectHighCardinality: threshold must be positive</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L70) |
| <code v-pre>detectHighCardinality: series must be scanned first</code> | [packages/observability/src/semantics/cardinality.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/cardinality.ts#L73) |
| <code v-pre>triggerRollback: session is $&#123;session.state&#125;, not blast-radius-computed</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L115) |
| <code v-pre>triggerRollback: errorRate must be within &#91;0, 1&#93;</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L118) |
| <code v-pre>triggerRollback: threshold must be within &#91;0, 1&#93;</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L121) |
| <code v-pre>recordGameDay: session is $&#123;session.state&#125;, not rollback-triggered</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L137) |
| <code v-pre>recordGameDay: participants must be positive</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L140) |
| <code v-pre>recordGameDay: issuesFound must be non-negative</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L143) |
| <code v-pre>recordGameDay: durationMinutes must be positive</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L146) |
| <code v-pre>startChaosSession: experimentId must not be empty</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L50) |
| <code v-pre>injectFault: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L70) |
| <code v-pre>injectFault: target must not be empty</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L73) |
| <code v-pre>injectFault: durationSec must be positive</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L76) |
| <code v-pre>computeBlastRadius: session is $&#123;session.state&#125;, not fault-injected</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L92) |
| <code v-pre>computeBlastRadius: totalInstances must be positive</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L95) |
| <code v-pre>computeBlastRadius: affectedInstances must be within &#91;0, totalInstances&#93;</code> | [packages/observability/src/semantics/chaos.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/chaos.ts#L98) |
| <code v-pre>evaluateFreshness: session is $&#123;session.state&#125;, not lineage-captured</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L108) |
| <code v-pre>evaluateFreshness: slaMinutes must be positive</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L111) |
| <code v-pre>evaluateFreshness: nowMs must be &gt;= lastEventAtMs</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L114) |
| <code v-pre>detectSchemaDrift: session is $&#123;session.state&#125;, not freshness-evaluated</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L133) |
| <code v-pre>detectSchemaDrift: expected schema must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L136) |
| <code v-pre>scoreDataQuality: session is $&#123;session.state&#125;, not schema-drift-detected</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L163) |
| <code v-pre>scoreDataQuality: checks must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L166) |
| <code v-pre>startPipelineSession: namespace must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L53) |
| <code v-pre>startPipelineSession: jobName must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L56) |
| <code v-pre>captureLineage: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L77) |
| <code v-pre>captureLineage: edges must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L80) |
| <code v-pre>captureLineage: edge nodes must not be empty</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L84) |
| <code v-pre>captureLineage: self-loop edge $&#123;e.from&#125;</code> | [packages/observability/src/semantics/data-pipeline.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/data-pipeline.ts#L87) |
| <code v-pre>recordSyscall: session is $&#123;session.state&#125;, not kernel-traced</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L116) |
| <code v-pre>recordSyscall: counts must not be empty</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L120) |
| <code v-pre>recordSyscall: count for $&#123;name&#125; must be non-negative</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L124) |
| <code v-pre>captureNetworkFlow: session is $&#123;session.state&#125;, not syscall-recorded</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L141) |
| <code v-pre>captureNetworkFlow: flows must not be empty</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L144) |
| <code v-pre>captureNetworkFlow: bytes/packets must be non-negative</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L148) |
| <code v-pre>startEbpfIiiSession: hostId must not be empty</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L46) |
| <code v-pre>probeUserspace: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L65) |
| <code v-pre>probeUserspace: probes must not be empty</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L68) |
| <code v-pre>probeUserspace: expected uprobe, got $&#123;p.kind&#125;</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L72) |
| <code v-pre>traceKernel: session is $&#123;session.state&#125;, not userspace-probed</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L88) |
| <code v-pre>traceKernel: probes must not be empty</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L91) |
| <code v-pre>traceKernel: expected kprobe/tracepoint/lsm, got $&#123;p.kind&#125;</code> | [packages/observability/src/semantics/ebpf-iii.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/ebpf-iii.ts#L95) |
| <code v-pre>resolveTraceToMetric: traceId must not be empty</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L115) |
| <code v-pre>startExemplarSession: bucket must not be empty</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L31) |
| <code v-pre>recordExemplarMetric: metricName must not be empty</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L47) |
| <code v-pre>recordExemplarMetric: traceId must be at least 8 chars</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L50) |
| <code v-pre>recordExemplarMetric: spanId must be at least 4 chars</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L53) |
| <code v-pre>attachTraceToMetric: no exemplar for metric=$&#123;input.metricName&#125; trace=$&#123;input.traceId&#125;</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L79) |
| <code v-pre>resolveMetricToTrace: metricName must not be empty</code> | [packages/observability/src/semantics/exemplar.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/exemplar.ts#L97) |
| <code v-pre>recommendRightsizing: session is $&#123;session.state&#125;, not team-attributed</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L117) |
| <code v-pre>recommendRightsizing: recommendations must not be empty</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L120) |
| <code v-pre>recommendRightsizing: costs for $&#123;r.resource&#125; must be non-negative</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L124) |
| <code v-pre>optimizeSpot: session is $&#123;session.state&#125;, not rightsizing-recommended</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L144) |
| <code v-pre>optimizeSpot: onDemandUsd must be positive</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L147) |
| <code v-pre>optimizeSpot: spotUsd must be non-negative</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L150) |
| <code v-pre>optimizeSpot: spotUsd must not exceed onDemandUsd</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L153) |
| <code v-pre>startFinopsSession: accountId must not be empty</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L47) |
| <code v-pre>recordCostPerRequest: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L67) |
| <code v-pre>recordCostPerRequest: requests must be positive</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L70) |
| <code v-pre>recordCostPerRequest: totalCostUsd must be non-negative</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L73) |
| <code v-pre>attributeTeam: session is $&#123;session.state&#125;, not cost-per-request-recorded</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L91) |
| <code v-pre>attributeTeam: teamCosts must not be empty</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L94) |
| <code v-pre>attributeTeam: cost for $&#123;t.team&#125; must be non-negative</code> | [packages/observability/src/semantics/finops.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/finops.ts#L98) |
| <code v-pre>evaluatePolicy: session is $&#123;session.state&#125;, not drift-detected</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L118) |
| <code v-pre>evaluatePolicy: results must not be empty</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L121) |
| <code v-pre>attributeCost: session is $&#123;session.state&#125;, not policy-evaluated</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L141) |
| <code v-pre>attributeCost: attributions must not be empty</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L144) |
| <code v-pre>attributeCost: cost for $&#123;a.team&#125; must be non-negative</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L148) |
| <code v-pre>startIacSession: workspace must not be empty</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L50) |
| <code v-pre>capturePlan: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L69) |
| <code v-pre>capturePlan: changes must not be empty</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L72) |
| <code v-pre>detectDrift: session is $&#123;session.state&#125;, not plan-captured</code> | [packages/observability/src/semantics/iac.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/iac.ts#L92) |
| <code v-pre>logPrompt: requestId must not be empty</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L102) |
| <code v-pre>flagHallucination: session is $&#123;session.state&#125;, not prompt-logged</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L119) |
| <code v-pre>flagHallucination: signals must not be empty</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L122) |
| <code v-pre>flagHallucination: score for $&#123;s.metric&#125; must be within &#91;0, 1&#93;</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L126) |
| <code v-pre>checkBudget: session is $&#123;session.state&#125;, not hallucination-flagged</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L147) |
| <code v-pre>checkBudget: spentUsd must be non-negative</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L150) |
| <code v-pre>checkBudget: limitUsd must be positive</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L153) |
| <code v-pre>startLlmObsSession: serviceName must not be empty</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L55) |
| <code v-pre>countTokens: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L75) |
| <code v-pre>countTokens: model must not be empty</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L78) |
| <code v-pre>countTokens: token counts must be non-negative</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L81) |
| <code v-pre>logPrompt: session is $&#123;session.state&#125;, not tokens-counted</code> | [packages/observability/src/semantics/llm-observability.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/llm-observability.ts#L99) |
| <code v-pre>startLogCorrelationAdvanced: namespace must not be empty</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L33) |
| <code v-pre>emitStructuredLog: message must not be empty</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L50) |
| <code v-pre>joinTraceIds: traceId must not be empty</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L67) |
| <code v-pre>joinLogQLAndPromQL: logQlSelector must not be empty</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L89) |
| <code v-pre>joinLogQLAndPromQL: promQlSelector must not be empty</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L92) |
| <code v-pre>joinLogQLAndPromQL: at least one join label required</code> | [packages/observability/src/semantics/log-correlation-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/log-correlation-advanced.ts#L95) |
| <code v-pre>extractW3CContext: invalid traceparent format (expected 4 parts, got $&#123;parts.length&#125;)</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L115) |
| <code v-pre>extractW3CContext: unsupported traceparent version $&#123;version&#125;</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L121) |
| <code v-pre>extractW3CContext: traceId must be 32 hex chars</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L124) |
| <code v-pre>extractW3CContext: spanId must be 16 hex chars</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L127) |
| <code v-pre>startOtelAdvanced: serviceName must not be empty</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L34) |
| <code v-pre>enqueueSpan: spanId must not be empty</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L52) |
| <code v-pre>flushBatch: maxBatchSize must be positive</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L62) |
| <code v-pre>detectResource: attributes must not be empty</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L79) |
| <code v-pre>propagateBaggage: baggage key must not be empty</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L95) |
| <code v-pre>propagateBaggage: baggage value must not be empty</code> | [packages/observability/src/semantics/otel-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/otel-advanced.ts#L98) |
| <code v-pre>startProfiling: serviceName must not be empty</code> | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L34) |
| <code v-pre>$&#123;kind&#125; sample: stack must not be empty</code> | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L78) |
| <code v-pre>$&#123;kind&#125; sample: valueBytes must be non-negative</code> | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L81) |
| <code v-pre>buildFlameGraph: no samples for kind=$&#123;input.kind&#125;</code> | [packages/observability/src/semantics/profiling.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/profiling.ts#L99) |
| <code v-pre>recordSaturation: saturation must be within &#91;0, 1&#93;</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L106) |
| <code v-pre>startRedUse: serviceName must not be empty</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L28) |
| <code v-pre>recordRequestRate: requests must be non-negative</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L47) |
| <code v-pre>recordRequestRate: windowSeconds must be positive</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L50) |
| <code v-pre>recordErrors: rate must be recorded first</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L66) |
| <code v-pre>recordErrors: errors must be non-negative</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L69) |
| <code v-pre>recordErrors: errors must not exceed total requests</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L72) |
| <code v-pre>recordDuration: rate must be recorded first</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L88) |
| <code v-pre>recordDuration: durationMs must be non-negative</code> | [packages/observability/src/semantics/red-use.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/red-use.ts#L91) |
| <code v-pre>tripCircuitBreaker: session is $&#123;session.state&#125;, not sidecar-injected</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L113) |
| <code v-pre>tripCircuitBreaker: total must be positive</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L116) |
| <code v-pre>tripCircuitBreaker: failures must be within &#91;0, total&#93;</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L119) |
| <code v-pre>applyTrafficSplit: session is $&#123;session.state&#125;, not circuit-breaker-tripped</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L139) |
| <code v-pre>applyTrafficSplit: splits must not be empty</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L142) |
| <code v-pre>applyTrafficSplit: weights must sum to 100 (got $&#123;totalWeight&#125;)</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L146) |
| <code v-pre>applyTrafficSplit: weight for $&#123;s.service&#125; must be within &#91;0, 100&#93;</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L150) |
| <code v-pre>startMeshSession: meshName must not be empty</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L51) |
| <code v-pre>handshakeMtls: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L70) |
| <code v-pre>handshakeMtls: clientSpiffe must be a spiffe:// URI</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L73) |
| <code v-pre>handshakeMtls: serverSpiffe must be a spiffe:// URI</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L76) |
| <code v-pre>injectSidecar: session is $&#123;session.state&#125;, not mtls-handshaked</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L92) |
| <code v-pre>injectSidecar: injections must not be empty</code> | [packages/observability/src/semantics/service-mesh.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/service-mesh.ts#L95) |
| <code v-pre>evaluateBurnRate: session is $&#123;session.state&#125;, not budget-computed</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L106) |
| <code v-pre>fireMultiWindowMultiBurnRateAlert: session is $&#123;session.state&#125;, not burn-evaluated</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L125) |
| <code v-pre>fireMultiWindowMultiBurnRateAlert: thresholds must not be empty</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L128) |
| <code v-pre>startSLO: sloId must not be empty</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L36) |
| <code v-pre>startSLO: targetObjective must be 0 &lt; objective &lt; 1</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L39) |
| <code v-pre>startSLO: windowDays must be positive</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L42) |
| <code v-pre>openSLOWindow: session is $&#123;session.state&#125;, not idle</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L60) |
| <code v-pre>recordRequests: window must be opened first</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L74) |
| <code v-pre>recordRequests: counts must be non-negative</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L77) |
| <code v-pre>recordRequests: errors must not exceed requests</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L80) |
| <code v-pre>computeErrorBudget: session is $&#123;session.state&#125;, not window-open</code> | [packages/observability/src/semantics/slo.ts](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/semantics/slo.ts#L88) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [alert.ts](./api/alert) | 2 | 9 |
| [collect.ts](./api/collect) | 3 | 11 |
| [coverage.ts](./api/coverage) | 2 | 6 |
| [dashboard.ts](./api/dashboard) | 1 | 0 |
| [dashboard-mock.ts](./api/dashboard-mock) | 2 | 7 |
| [fixtures.ts](./api/fixtures) | 13 | 0 |
| [flaky.ts](./api/flaky) | 3 | 2 |
| [index.ts](./api/index) | 1 | 0 |
| [log-correlation.ts](./api/log-correlation) | 2 | 2 |
| [real-driver.ts](./api/real-driver) | 5 | 2 |
| [spec-coverage.ts](./api/spec-coverage) | 1 | 1 |
| [telemetry.ts](./api/telemetry) | 4 | 9 |
| [trace-flame.ts](./api/trace-flame) | 4 | 2 |
| [types.ts](./api/types) | 0 | 6 |

<!-- kiwa-public-api:end -->
