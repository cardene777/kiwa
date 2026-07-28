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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>AlertRouter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L82) <code v-pre>packages/observability/src/alert.ts</code>

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

#### <code v-pre>analyzeSpecCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L21) <code v-pre>packages/observability/src/spec-coverage.ts</code>

```ts
export declare function analyzeSpecCoverage(opts: AnalyzeSpecCoverageOptions): SpecCoverageGap;
```

#### <code v-pre>buildDashboardMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L214) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

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

#### <code v-pre>buildRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L54) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function buildRealDriverConfig(backend: ObservabilityBackend, overrides?: Partial<Omit<RealDriverConfig, 'backend'>>, env?: NodeJS.ProcessEnv): RealDriverConfig;
```

#### <code v-pre>buildSpanTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L49) <code v-pre>packages/observability/src/trace-flame.ts</code>

Build a tree of SpanNodes from a flat span array. Spans reference their parent by `parentSpanName`; when the parent is null the span becomes a root. Children order preserves the collector insertion order (matches call order in the SUT).

```ts
export declare function buildSpanTree(spans: SpanRecord[]): SpanNode[];
```

#### <code v-pre>checkThresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L109) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export declare function checkThresholds(summary: CoverageSummary, thresholds: CoverageThresholds): ThresholdCheckResult;
```

#### <code v-pre>collectRunHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L12) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export declare function collectRunHistory(opts: CollectRunHistoryOptions): RunHistory;
```

#### <code v-pre>correlateLogsAndSpans</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L162) <code v-pre>packages/observability/src/log-correlation.ts</code>

Sugar for the common case: build an index over the entire collector state.

```ts
export declare function correlateLogsAndSpans(input: {
    logs: LogRecord[];
    spans: SpanRecord[];
}, keys?: CorrelationKeys): LogCorrelationIndex;
```

#### <code v-pre>createDatadogMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L191) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createDatadogMock(config?: {
    now?: () => number;
}): DatadogMock;
```

#### <code v-pre>createOtelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L113) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createOtelMock(config?: {
    now?: () => number;
}): OtelMock;
```

#### <code v-pre>createSentryMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L245) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export declare function createSentryMock(config?: {
    now?: () => number;
}): SentryMock;
```

#### <code v-pre>DashboardMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L73) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

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

#### <code v-pre>defaultRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L119) <code v-pre>packages/observability/src/fixtures.ts</code>

Alert routing tree — deepest match wins.

```ts
export declare function defaultRoute(): RouteEntry;
```

#### <code v-pre>detectFlaky</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L11) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export declare function detectFlaky(opts: DetectFlakyOptions): FlakyTest[];
```

#### <code v-pre>drillDown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L142) <code v-pre>packages/observability/src/trace-flame.ts</code>

Drill-down — return the subtree rooted at the first node whose name matches. Depth is normalized so the drilled-in root sits at depth 0. Returns null when no matching node exists.

```ts
export declare function drillDown(roots: FlameNode[], name: string): FlameNode | null;
```

#### <code v-pre>escalation&#95;pagerDutyTwoStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L142) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function escalation_pagerDutyTwoStep(): EscalationStep[];
```

#### <code v-pre>explicitEnvKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L35) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function explicitEnvKey(backend: ObservabilityBackend): string;
```

#### <code v-pre>flattenFlame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L172) <code v-pre>packages/observability/src/trace-flame.ts</code>

Flatten a flame tree into a depth-first list. Handy for kiwa assertions that need to iterate every node without recursing.

```ts
export declare function flattenFlame(roots: FlameNode[]): FlameNode[];
```

#### <code v-pre>fromIstanbulCoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L74) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export declare function fromIstanbulCoverageSummary(raw: IstanbulCoverageSummary): CoverageSummary;
```

#### <code v-pre>fromVitestJson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L58) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export declare function fromVitestJson(report: VitestStyleReport, opts: FromVitestJsonOptions): TestRunRecord[];
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L19) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>LogCorrelationIndex</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L42) <code v-pre>packages/observability/src/log-correlation.ts</code>

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

#### <code v-pre>logs&#95;forHttpTrace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L280) <code v-pre>packages/observability/src/fixtures.ts</code>

Log correlation fixture — matched log lines for the http handler trace. Timestamps sit inside the parent span window so join by timestamp bucket also works for callers that do not carry ids.

```ts
export declare function logs_forHttpTrace(startAt?: number): LogRecord[];
```

#### <code v-pre>metricsForRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L282) <code v-pre>packages/observability/src/alert.ts</code>

Convenience — narrow accessor: metric records for a metric name. Kept exported so kiwa test scenarios can double-check assertion denominators without duplicating the filter predicate.

```ts
export declare function metricsForRule(collector: TelemetryCollector, rule: AlertRule): MetricRecord[];
```

#### <code v-pre>panel&#95;httpErrorRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L29) <code v-pre>packages/observability/src/fixtures.ts</code>

Dashboard panel builders — 3 named scenarios covering the common SaaS observability wall.

```ts
export declare function panel_httpErrorRate(id?: string): PanelConfig;
```

#### <code v-pre>panel&#95;p99Latency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L46) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function panel_p99Latency(id?: string): PanelConfig;
```

#### <code v-pre>panel&#95;queueDepth</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L63) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function panel_queueDepth(id?: string, queue?: string): PanelConfig;
```

#### <code v-pre>renderDashboard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard.ts#L29) <code v-pre>packages/observability/src/dashboard.ts</code>

```ts
export declare function renderDashboard(input: DashboardInput): string;
```

#### <code v-pre>renderFlameGraph</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L103) <code v-pre>packages/observability/src/trace-flame.ts</code>

Render a flame graph structure. Nodes with the same name at the same depth in the same parent chain collapse into one flame node whose `samples` counts how many spans contributed. Only closed spans (endedAt != null) contribute to the numeric aggregate; open spans are counted but contribute 0 ms.

```ts
export declare function renderFlameGraph(roots: SpanNode[]): FlameNode[];
```

#### <code v-pre>resolveObservabilityEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L23) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function resolveObservabilityEndpoint(backend: ObservabilityBackend, env?: NodeJS.ProcessEnv): string;
```

#### <code v-pre>rule&#95;errorRateCritical</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L80) <code v-pre>packages/observability/src/fixtures.ts</code>

Alert rule builders — 3 named scenarios matching the panel wall.

```ts
export declare function rule_errorRateCritical(id?: string): AlertRule;
```

#### <code v-pre>rule&#95;latencyDegraded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L92) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function rule_latencyDegraded(id?: string): AlertRule;
```

#### <code v-pre>rule&#95;queueBackpressure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L104) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function rule_queueBackpressure(id?: string, queue?: string): AlertRule;
```

#### <code v-pre>semantics</code>

公開 entry point から解決しています。

```ts
export * as semantics from './semantics/index.js';
```

#### <code v-pre>silence&#95;maintenanceWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L149) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function silence_maintenanceWindow(id: string, minutesFromNow: number, now: number): Silence;
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L66) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export declare function skipUnlessReal(env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### <code v-pre>TelemetryCollector</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L63) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>trace&#95;fanoutParallel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L191) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function trace_fanoutParallel(startAt?: number): SpanRecord[];
```

#### <code v-pre>trace&#95;httpHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L161) <code v-pre>packages/observability/src/fixtures.ts</code>

Trace scenario builders — 3 named span shapes covering the common SUT flame graph patterns.

```ts
export declare function trace_httpHandler(startAt?: number): SpanRecord[];
```

#### <code v-pre>trace&#95;nestedRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/fixtures.ts#L229) <code v-pre>packages/observability/src/fixtures.ts</code>

```ts
export declare function trace_nestedRetry(startAt?: number): SpanRecord[];
```

### 型

#### <code v-pre>AlertFire</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L34) <code v-pre>packages/observability/src/alert.ts</code>

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

#### <code v-pre>AlertOperator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L14) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
```

#### <code v-pre>AlertReceiverEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L71) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface AlertReceiverEvent {
    receiver: string;
    fire: AlertFire;
    reason: 'route' | 'escalation';
    deliveredAt: number;
}
```

#### <code v-pre>AlertRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L20) <code v-pre>packages/observability/src/alert.ts</code>

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

#### <code v-pre>AlertSeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L16) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertSeverity = 'info' | 'warn' | 'critical';
```

#### <code v-pre>AlertState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L18) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export type AlertState = 'pending' | 'firing' | 'escalated' | 'resolved';
```

#### <code v-pre>AnalyzeSpecCoverageOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/spec-coverage.ts#L6) <code v-pre>packages/observability/src/spec-coverage.ts</code>

```ts
export interface AnalyzeSpecCoverageOptions {
    specMarkdown: string;
    testCode: string;
    module?: string;
    defaultLayer?: 'contract' | 'unit' | 'integration' | 'e2e' | 'api' | 'ui' | 'data' | 'cli';
}
```

#### <code v-pre>CollectRunHistoryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L3) <code v-pre>packages/observability/src/collect.ts</code>

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

#### <code v-pre>CorrelationKeys</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L20) <code v-pre>packages/observability/src/log-correlation.ts</code>

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

#### <code v-pre>CoverageFileEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L8) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageFileEntry {
    path: string;
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
}
```

#### <code v-pre>CoverageMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L1) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageMetric {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}
```

#### <code v-pre>CoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L16) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageSummary {
    total: CoverageFileEntry;
    files: CoverageFileEntry[];
}
```

#### <code v-pre>CoverageThresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L97) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export interface CoverageThresholds {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
}
```

#### <code v-pre>DashboardConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L63) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface DashboardConfig {
    id: string;
    title: string;
    panels: PanelConfig[];
}
```

#### <code v-pre>DashboardInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L32) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface DashboardInput {
    history: RunHistory;
    flaky: FlakyTest[];
    gaps: SpecCoverageGap[];
    coverage?: import('./coverage.js').CoverageSummary;
}
```

#### <code v-pre>DatadogMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L174) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>DetectFlakyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L3) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export interface DetectFlakyOptions {
    history: RunHistory;
    /** Minimum number of runs before a test is eligible for flaky scoring */
    minRuns?: number;
    /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
    threshold?: number;
}
```

#### <code v-pre>EscalationStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L65) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface EscalationStep {
    /** Milliseconds after firing before this step applies. */
    afterMs: number;
    receiver: string;
}
```

#### <code v-pre>ExceptionRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L42) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>FlakyTest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L16) <code v-pre>packages/observability/src/types.ts</code>

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

#### <code v-pre>FlameNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L29) <code v-pre>packages/observability/src/trace-flame.ts</code>

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

#### <code v-pre>FromVitestJsonOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L52) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface FromVitestJsonOptions {
    runId: string;
}
```

#### <code v-pre>IstanbulCoverageSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L35) <code v-pre>packages/observability/src/coverage.ts</code>

```ts
export type IstanbulCoverageSummary = Record<string, IstanbulFileSummary>;
```

#### <code v-pre>LogRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L35) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface LogRecord {
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    attributes: Record<string, unknown>;
    timestamp: number;
}
```

#### <code v-pre>LogSpanLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/log-correlation.ts#L30) <code v-pre>packages/observability/src/log-correlation.ts</code>

```ts
export interface LogSpanLink {
    log: LogRecord;
    span: SpanRecord | null;
    traceId: string | null;
    spanId: string | null;
}
```

#### <code v-pre>MetricAggregation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L18) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export type MetricAggregation = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'last';
```

#### <code v-pre>MetricQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L20) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

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

#### <code v-pre>MetricRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L27) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface MetricRecord {
    name: string;
    kind: 'counter' | 'gauge' | 'histogram';
    value: number;
    tags: Record<string, string>;
    timestamp: number;
}
```

#### <code v-pre>ObservabilityBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L10) <code v-pre>packages/observability/src/real-driver.ts</code>

Real driver env-gate for observability v2.1. Provides KIWA_MODE=real-based helpers for testing against actual observability backends (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector). Consumers gate a describe block on `isKiwaModeReal()`, and use `resolveObservabilityEndpoint()` to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.

```ts
export type ObservabilityBackend = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';
```

#### <code v-pre>OtelMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L93) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>PanelConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L45) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export interface PanelConfig {
    id: string;
    title: string;
    kind: PanelKind;
    query: MetricQuery;
    thresholds?: PanelThreshold[];
}
```

#### <code v-pre>PanelKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L16) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

```ts
export type PanelKind = 'stat' | 'timeseries' | 'gauge' | 'table';
```

#### <code v-pre>PanelResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L53) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

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

#### <code v-pre>PanelThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/dashboard-mock.ts#L36) <code v-pre>packages/observability/src/dashboard-mock.ts</code>

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

#### <code v-pre>RealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/real-driver.ts#L48) <code v-pre>packages/observability/src/real-driver.ts</code>

```ts
export interface RealDriverConfig {
    backend: ObservabilityBackend;
    endpoint: string;
    timeoutMs: number;
}
```

#### <code v-pre>RouteEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L43) <code v-pre>packages/observability/src/alert.ts</code>

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

#### <code v-pre>RunHistory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L12) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface RunHistory {
    records: TestRunRecord[];
}
```

#### <code v-pre>SentryMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L235) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>Silence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/alert.ts#L59) <code v-pre>packages/observability/src/alert.ts</code>

```ts
export interface Silence {
    id: string;
    match: Record<string, string>;
    expiresAt: number;
}
```

#### <code v-pre>SpanNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/trace-flame.ts#L16) <code v-pre>packages/observability/src/trace-flame.ts</code>

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

#### <code v-pre>SpanRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L18) <code v-pre>packages/observability/src/telemetry.ts</code>

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

#### <code v-pre>SpecCoverageGap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L25) <code v-pre>packages/observability/src/types.ts</code>

```ts
export interface SpecCoverageGap {
    module: string;
    layer: string;
    missingTcIds: string[];
    extraTcIds: string[];
}
```

#### <code v-pre>TelemetryProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L16) <code v-pre>packages/observability/src/telemetry.ts</code>

Telemetry provider mock — v0.2 addition (v1.14-4). Adds unified in-memory collectors for the 3 major APM / error providers: - OpenTelemetry (span / metric / log) - Datadog (StatsD gauge/increment/histogram + tracer.startSpan) - Sentry (captureException / addBreadcrumb / startTransaction) The v1.0 observability API (flaky + spec coverage) targets test-run analysis. This module targets application telemetry emitted during test execution so kiwa tests can assert "the SUT emitted span X", "the metric counter incremented", or "the exception was captured with fingerprint Y".

```ts
export type TelemetryProvider = 'otel' | 'datadog' | 'sentry';
```

#### <code v-pre>TestRunRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L3) <code v-pre>packages/observability/src/types.ts</code>

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

#### <code v-pre>TestStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/types.ts#L1) <code v-pre>packages/observability/src/types.ts</code>

```ts
export type TestStatus = 'passed' | 'failed' | 'skipped';
```

#### <code v-pre>ThresholdCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/coverage.ts#L104) <code v-pre>packages/observability/src/coverage.ts</code>

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

#### <code v-pre>TransactionRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/telemetry.ts#L51) <code v-pre>packages/observability/src/telemetry.ts</code>

```ts
export interface TransactionRecord {
    name: string;
    operation: string;
    startedAt: number;
    endedAt: number | null;
    tags: Record<string, string>;
}
```

#### <code v-pre>VitestStyleAssertionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L35) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleAssertionResult {
    fullName?: string;
    title?: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration?: number;
}
```

#### <code v-pre>VitestStyleReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L47) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleReport {
    testResults: VitestStyleTestResult[];
    startTime?: number;
}
```

#### <code v-pre>VitestStyleTestResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/collect.ts#L42) <code v-pre>packages/observability/src/collect.ts</code>

```ts
export interface VitestStyleTestResult {
    testFilePath?: string;
    assertionResults: VitestStyleAssertionResult[];
}
```
<!-- kiwa-public-api:end -->
