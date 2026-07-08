/**
 * v1.42-5 docs 補強 (Issue #1161 / CAR-1050) — tutorial 91-93 code snippet
 * validation for `@kiwa/observability` v2.2 advanced III 8 axis (IaC +
 * Service mesh + eBPF profiling III + LLM observability + FinOps + Chaos
 * engineering + Data pipeline + AIOps).
 *
 * `docs/tutorials/91-iac-servicemesh-ebpf.md` /
 * `docs/tutorials/92-llm-observability-finops.md` /
 * `docs/tutorials/93-chaos-datapipeline-aiops.md`
 * に載っている snippet が実際に動作することを担保する。
 *
 * v1.23 → v1.42 で 20 milestone 連続 snippet validation streak を延伸.
 */
import { describe, expect, it } from 'vitest';
import { semantics } from '../src/index.js';

const {
  analyzeRootCause,
  applyTrafficSplit,
  attributeCost,
  attributeTeam,
  captureLineage,
  captureNetworkFlow,
  capturePlan,
  checkBudget,
  collectFidelityCoverage,
  computeBlastRadius,
  correlateAlerts,
  countTokens,
  detectAnomaly,
  detectDrift,
  detectSchemaDrift,
  evaluateFreshness,
  evaluatePolicy,
  executeRemediation,
  flagHallucination,
  handshakeMtls,
  injectFault,
  injectSidecar,
  logPrompt,
  optimizeSpot,
  probeUserspace,
  recommendRightsizing,
  recordCostPerRequest,
  recordGameDay,
  recordSyscall,
  scoreDataQuality,
  startAiopsSession,
  startChaosSession,
  startEbpfIiiSession,
  startFinopsSession,
  startIacSession,
  startLlmObsSession,
  startMeshSession,
  startPipelineSession,
  traceKernel,
  triggerRollback,
  tripCircuitBreaker,
} = semantics;

// ---------------------------------------------------------------------------
// Tutorial 91 — IaC + Service mesh + eBPF profiling III
// (capturePlan → detectDrift → evaluatePolicy → attributeCost + handshakeMtls
//  → injectSidecar → tripCircuitBreaker → applyTrafficSplit + probeUserspace
//  → traceKernel → recordSyscall → captureNetworkFlow)
// ---------------------------------------------------------------------------

describe('tutorial 91 — iac plan capture', () => {
  it('captures a plan and counts create/update/delete (tutorial: capturePlan snippet)', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    const step = capturePlan(s, {
      changes: [
        { address: 'aws_instance.web[0]', action: 'create' },
        { address: 'aws_instance.web[1]', action: 'update' },
        { address: 'aws_instance.old', action: 'delete' },
      ],
    });
    expect(step.neutralEvent).toBe('iac.plan_captured');
    expect(step.metadata.additions).toBe(1);
    expect(step.metadata.modifications).toBe(1);
    expect(step.metadata.deletions).toBe(1);
    expect(s.state).toBe('plan-captured');
  });

  it('rejects an empty change list (tutorial: capturePlan empty snippet)', () => {
    const s = startIacSession({ target: 'grafana-oss', workspace: 'stg' });
    expect(() => capturePlan(s, { changes: [] })).toThrow(/must not be empty/);
  });
});

describe('tutorial 91 — iac drift detection', () => {
  it('detects a resource missing in actual state (tutorial: detectDrift snippet)', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    capturePlan(s, { changes: [{ address: 'aws_instance.web[0]', action: 'create' }] });
    const step = detectDrift(s, {
      expected: ['aws_instance.web[0]', 'aws_instance.web[1]'],
      actual: ['aws_instance.web[0]'],
    });
    expect(step.metadata.driftCount).toBeGreaterThan(0);
    expect(s.driftedResources).toContain('aws_instance.web[1]');
    expect(s.state).toBe('drift-detected');
  });

  it('returns zero drift when sets match (tutorial: detectDrift no-drift snippet)', () => {
    const s = startIacSession({ target: 'grafana-oss', workspace: 'stg' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    const step = detectDrift(s, {
      expected: ['aws_instance.web[0]'],
      actual: ['aws_instance.web[0]'],
    });
    expect(step.metadata.driftCount).toBe(0);
    expect(s.driftedResources).toEqual([]);
  });
});

describe('tutorial 91 — iac policy evaluation', () => {
  it('counts passed vs failed policies (tutorial: evaluatePolicy snippet)', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    const step = evaluatePolicy(s, {
      results: [
        { policyId: 'no-public-s3', passed: true, violationCount: 0 },
        { policyId: 'require-tags', passed: false, violationCount: 3 },
      ],
    });
    expect(step.metadata.passed).toBe(1);
    expect(step.metadata.failed).toBe(1);
    expect(s.state).toBe('policy-evaluated');
  });
});

describe('tutorial 91 — iac cost attribution', () => {
  it('sums the total monthly cost across teams (tutorial: attributeCost snippet)', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    evaluatePolicy(s, {
      results: [{ policyId: 'p', passed: true, violationCount: 0 }],
    });
    const step = attributeCost(s, {
      attributions: [
        { team: 'platform', monthlyCostUsd: 1000 },
        { team: 'growth', monthlyCostUsd: 500 },
      ],
    });
    expect(step.metadata.totalMonthlyCostUsd).toBe(1500);
    expect(s.state).toBe('cost-attributed');
  });
});

describe('tutorial 91 — mesh mTLS handshake', () => {
  it('accepts a valid SPIFFE pair (tutorial: handshakeMtls snippet)', () => {
    const s = startMeshSession({ target: 'otel-collector', meshName: 'prod-mesh' });
    const step = handshakeMtls(s, {
      clientSpiffe: 'spiffe://cluster/ns/default/sa/web',
      serverSpiffe: 'spiffe://cluster/ns/default/sa/api',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
    });
    expect(step.neutralEvent).toBe('mesh.mtls_handshaked');
    expect(step.metadata.cipherSuite).toBe('TLS_AES_128_GCM_SHA256');
    expect(s.state).toBe('mtls-handshaked');
  });

  it('rejects a client SPIFFE without spiffe:// prefix (tutorial: handshakeMtls reject snippet)', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() =>
      handshakeMtls(s, {
        clientSpiffe: 'sa/web',
        serverSpiffe: 'spiffe://cluster/ns/default/sa/api',
        cipherSuite: 'c',
      }),
    ).toThrow(/spiffe:\/\/ URI/);
  });
});

describe('tutorial 91 — mesh sidecar + circuit breaker', () => {
  it('counts envoy vs linkerd sidecars separately (tutorial: injectSidecar snippet)', () => {
    const s = startMeshSession({ target: 'grafana-oss', meshName: 'prod-mesh' });
    handshakeMtls(s, {
      clientSpiffe: 'spiffe://x/a',
      serverSpiffe: 'spiffe://x/b',
      cipherSuite: 'c',
    });
    const step = injectSidecar(s, {
      injections: [
        { pod: 'web-1', namespace: 'default', proxy: 'envoy' },
        { pod: 'web-2', namespace: 'default', proxy: 'linkerd2-proxy' },
      ],
    });
    expect(step.metadata.envoyCount).toBe(1);
    expect(step.metadata.linkerdCount).toBe(1);
  });

  it('trips the circuit breaker when failure rate meets threshold (tutorial: tripCircuitBreaker snippet)', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    const step = tripCircuitBreaker(s, { failures: 40, total: 100, failureThreshold: 0.3 });
    expect(step.metadata.tripped).toBe(true);
    expect(s.circuitBreakerOpen).toBe(true);
  });
});

describe('tutorial 91 — mesh traffic split', () => {
  it('records the weight sum across services (tutorial: applyTrafficSplit snippet)', () => {
    const s = startMeshSession({ target: 'otel-collector', meshName: 'prod-mesh' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    tripCircuitBreaker(s, { failures: 10, total: 100, failureThreshold: 0.3 });
    const step = applyTrafficSplit(s, {
      splits: [
        { service: 'api-v1', weight: 80 },
        { service: 'api-v2', weight: 20 },
      ],
    });
    expect(step.metadata.totalWeight).toBe(100);
    expect(step.metadata.serviceCount).toBe(2);
    expect(s.state).toBe('traffic-split-applied');
  });
});

describe('tutorial 91 — ebpf userspace + kernel probes', () => {
  it('counts uprobes by symbol (tutorial: probeUserspace snippet)', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'host-1' });
    const step = probeUserspace(s, {
      probes: [
        { kind: 'uprobe', symbol: 'malloc' },
        { kind: 'uprobe', symbol: 'free' },
      ],
    });
    expect(step.metadata.probeCount).toBe(2);
    expect(step.metadata.symbols).toBe('malloc,free');
  });

  it('separates kprobe / tracepoint / lsm buckets (tutorial: traceKernel snippet)', () => {
    const s = startEbpfIiiSession({ target: 'otel-collector', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    const step = traceKernel(s, {
      probes: [
        { kind: 'kprobe', symbol: 'sys_read' },
        { kind: 'tracepoint', symbol: 'sched_switch' },
        { kind: 'lsm', symbol: 'inode_permission' },
      ],
    });
    expect(step.metadata.kprobeCount).toBe(1);
    expect(step.metadata.tracepointCount).toBe(1);
    expect(step.metadata.lsmCount).toBe(1);
  });
});

describe('tutorial 91 — ebpf syscall + network flow', () => {
  it('sums syscall counts across categories (tutorial: recordSyscall snippet)', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'host-1' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    const step = recordSyscall(s, { counts: { read: 1000, write: 500, open: 200 } });
    expect(step.metadata.syscallCount).toBe(3);
    expect(step.metadata.totalCalls).toBe(1700);
  });

  it('captures per-flow bytes and packets (tutorial: captureNetworkFlow snippet)', () => {
    const s = startEbpfIiiSession({ target: 'otel-collector', hostId: 'host-2' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    recordSyscall(s, { counts: { read: 1 } });
    const step = captureNetworkFlow(s, {
      flows: [
        { srcIp: '10.0.0.1', dstIp: '10.0.0.2', bytes: 4096, packets: 4 },
        { srcIp: '10.0.0.1', dstIp: '10.0.0.3', bytes: 2048, packets: 2 },
      ],
    });
    expect(step.metadata.totalBytes).toBe(6144);
    expect(step.metadata.totalPackets).toBe(6);
    expect(s.state).toBe('network-flow-captured');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 92 — LLM observability + FinOps
// (countTokens → logPrompt → flagHallucination → checkBudget +
//  recordCostPerRequest → attributeTeam → recommendRightsizing → optimizeSpot)
// ---------------------------------------------------------------------------

describe('tutorial 92 — llm token counting', () => {
  it('sums prompt and completion tokens (tutorial: countTokens snippet)', () => {
    const s = startLlmObsSession({ target: 'otel-collector', serviceName: 'chat-api' });
    const step = countTokens(s, {
      model: 'claude-opus-4-7',
      promptTokens: 500,
      completionTokens: 300,
    });
    expect(step.neutralEvent).toBe('llmobs.token_counted');
    expect(step.metadata.totalTokens).toBe(800);
    expect(step.metadata.model).toBe('claude-opus-4-7');
    expect(s.state).toBe('tokens-counted');
  });

  it('rejects negative token counts (tutorial: countTokens reject snippet)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      countTokens(s, { model: 'gpt-4', promptTokens: -1, completionTokens: 0 }),
    ).toThrow();
  });
});

describe('tutorial 92 — llm prompt log', () => {
  it('records prompt lengths and redaction flag (tutorial: logPrompt snippet)', () => {
    const s = startLlmObsSession({ target: 'loki', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    const step = logPrompt(s, {
      requestId: 'req_42',
      system: 'you are helpful',
      user: 'what is 2+2',
      redacted: true,
    });
    expect(step.metadata.systemLength).toBe('you are helpful'.length);
    expect(step.metadata.userLength).toBe('what is 2+2'.length);
    expect(step.metadata.redacted).toBe(true);
    expect(s.state).toBe('prompt-logged');
  });
});

describe('tutorial 92 — llm hallucination flagging', () => {
  it('flags below-threshold faithfulness and relevance (tutorial: flagHallucination faithfulness snippet)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [
        { metric: 'faithfulness', score: 0.3, threshold: 0.7 },
        { metric: 'relevance', score: 0.9, threshold: 0.5 },
      ],
    });
    expect(step.metadata.flaggedCount).toBe(1);
    expect(step.metadata.anyFlagged).toBe(true);
  });

  it('flags above-threshold toxicity (tutorial: flagHallucination toxicity snippet)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [{ metric: 'toxicity', score: 0.85, threshold: 0.7 }],
    });
    expect(step.metadata.flaggedCount).toBe(1);
  });
});

describe('tutorial 92 — llm budget check', () => {
  it('flags overBudget when spend >= limit (tutorial: checkBudget over snippet)', () => {
    const s = startLlmObsSession({ target: 'otel-collector', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, {
      signals: [{ metric: 'faithfulness', score: 1.0, threshold: 0.5 }],
    });
    const step = checkBudget(s, { spentUsd: 120, limitUsd: 100 });
    expect(step.metadata.exhausted).toBe(true);
    expect(step.metadata.ratio).toBeCloseTo(1.2);
    expect(s.state).toBe('budget-checked');
  });

  it('reports under-budget when spend < limit (tutorial: checkBudget under snippet)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, {
      signals: [{ metric: 'faithfulness', score: 1.0, threshold: 0.5 }],
    });
    const step = checkBudget(s, { spentUsd: 10, limitUsd: 100 });
    expect(step.metadata.exhausted).toBe(false);
    expect(step.metadata.ratio).toBeCloseTo(0.1);
  });
});

describe('tutorial 92 — finops cost per request', () => {
  it('computes cost per request across a workload (tutorial: recordCostPerRequest snippet)', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'acct-1' });
    const step = recordCostPerRequest(s, { requests: 1_000_000, totalCostUsd: 5000 });
    expect(step.neutralEvent).toBe('finops.cost_per_request_recorded');
    expect(step.metadata.costPerRequestUsd).toBeCloseTo(0.005);
    expect(s.state).toBe('cost-per-request-recorded');
  });

  it('rejects a zero-request workload (tutorial: recordCostPerRequest reject snippet)', () => {
    const s = startFinopsSession({ target: 'grafana-oss', accountId: 'x' });
    expect(() =>
      recordCostPerRequest(s, { requests: 0, totalCostUsd: 100 }),
    ).toThrow();
  });
});

describe('tutorial 92 — finops team attribution', () => {
  it('computes unattributed remainder when teams under-account (tutorial: attributeTeam snippet)', () => {
    const s = startFinopsSession({ target: 'loki', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    const step = attributeTeam(s, {
      teamCosts: [
        { team: 'platform', costUsd: 40 },
        { team: 'growth', costUsd: 30 },
      ],
    });
    expect(step.metadata.totalAttributedUsd).toBe(70);
    expect(step.metadata.unattributedUsd).toBe(30);
    expect(step.metadata.teamCount).toBe(2);
  });

  it('clamps unattributed to 0 when teams over-account (tutorial: attributeTeam clamp snippet)', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'x' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 50 });
    const step = attributeTeam(s, {
      teamCosts: [
        { team: 'a', costUsd: 40 },
        { team: 'b', costUsd: 30 },
      ],
    });
    expect(step.metadata.unattributedUsd).toBe(0);
  });
});

describe('tutorial 92 — finops rightsizing', () => {
  it('sums per-resource savings (tutorial: recommendRightsizing snippet)', () => {
    const s = startFinopsSession({ target: 'otel-collector', accountId: 'acct-1' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    const step = recommendRightsizing(s, {
      recommendations: [
        { resource: 'ec2/i-1', currentSizeUsd: 500, recommendedSizeUsd: 300 },
        { resource: 'ec2/i-2', currentSizeUsd: 800, recommendedSizeUsd: 400 },
      ],
    });
    expect(step.metadata.totalSavingsUsd).toBe(600);
    expect(step.metadata.resourceCount).toBe(2);
    expect(s.state).toBe('rightsizing-recommended');
  });
});

describe('tutorial 92 — finops spot optimization', () => {
  it('computes spot savings ratio (tutorial: optimizeSpot snippet)', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'acct-1' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 'a', costUsd: 100 }] });
    recommendRightsizing(s, {
      recommendations: [{ resource: 'r', currentSizeUsd: 100, recommendedSizeUsd: 50 }],
    });
    const step = optimizeSpot(s, { onDemandUsd: 1000, spotUsd: 300 });
    expect(step.metadata.savingsRatio).toBeCloseTo(0.7);
    expect(s.spotSavingsRatio).toBeCloseTo(0.7);
    expect(s.state).toBe('spot-optimized');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 93 — Chaos engineering + Data pipeline + AIOps
// (injectFault → computeBlastRadius → triggerRollback → recordGameDay +
//  captureLineage → evaluateFreshness → detectSchemaDrift → scoreDataQuality
//  + detectAnomaly → executeRemediation → analyzeRootCause → correlateAlerts)
// ---------------------------------------------------------------------------

describe('tutorial 93 — chaos fault injection', () => {
  it('injects a pod-kill fault and moves state (tutorial: injectFault snippet)', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'exp-1' });
    const step = injectFault(s, { kind: 'pod-kill', target: 'api', durationSec: 30 });
    expect(step.neutralEvent).toBe('chaos.fault_injected');
    expect(step.metadata.kind).toBe('pod-kill');
    expect(s.fault).toEqual({ kind: 'pod-kill', target: 'api', durationSec: 30 });
    expect(s.state).toBe('fault-injected');
  });

  it('rejects a zero-duration fault (tutorial: injectFault reject snippet)', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'e' });
    expect(() =>
      injectFault(s, { kind: 'cpu-stress', target: 't', durationSec: 0 }),
    ).toThrow();
  });
});

describe('tutorial 93 — chaos blast radius', () => {
  it('computes affected ratio (tutorial: computeBlastRadius snippet)', () => {
    const s = startChaosSession({ target: 'otel-collector', experimentId: 'e' });
    injectFault(s, { kind: 'network-latency', target: 'svc-a', durationSec: 60 });
    const step = computeBlastRadius(s, { affectedInstances: 25, totalInstances: 100 });
    expect(step.metadata.blastRadiusRatio).toBe(0.25);
    expect(s.blastRadiusRatio).toBe(0.25);
  });

  it('returns 0 when no instance is affected (tutorial: computeBlastRadius zero snippet)', () => {
    const s = startChaosSession({ target: 'loki', experimentId: 'e' });
    injectFault(s, { kind: 'disk-fill', target: 'x', durationSec: 10 });
    const step = computeBlastRadius(s, { affectedInstances: 0, totalInstances: 50 });
    expect(step.metadata.blastRadiusRatio).toBe(0);
  });
});

describe('tutorial 93 — chaos rollback + game day', () => {
  it('triggers rollback when errorRate >= threshold (tutorial: triggerRollback snippet)', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'network-partition', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 5, totalInstances: 10 });
    const step = triggerRollback(s, { errorRate: 0.15, threshold: 0.1 });
    expect(step.metadata.triggered).toBe(true);
    expect(s.rollbackTriggered).toBe(true);
  });

  it('records participants + issues + duration (tutorial: recordGameDay snippet)', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'gd-2026-Q3' });
    injectFault(s, { kind: 'pod-kill', target: 'api', durationSec: 60 });
    computeBlastRadius(s, { affectedInstances: 3, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.2, threshold: 0.1 });
    const step = recordGameDay(s, { participants: 5, issuesFound: 3, durationMinutes: 90 });
    expect(step.metadata.participants).toBe(5);
    expect(step.metadata.issuesFound).toBe(3);
    expect(step.metadata.durationMinutes).toBe(90);
    expect(s.state).toBe('game-day-recorded');
  });
});

describe('tutorial 93 — pipeline lineage', () => {
  it('counts nodes and edges (tutorial: captureLineage snippet)', () => {
    const s = startPipelineSession({
      target: 'otel-collector',
      namespace: 'analytics',
      jobName: 'daily-etl',
    });
    const step = captureLineage(s, {
      edges: [
        { from: 'raw.events', to: 'stg.events' },
        { from: 'stg.events', to: 'mart.daily_active_users' },
      ],
    });
    expect(step.neutralEvent).toBe('pipeline.lineage_captured');
    expect(step.metadata.edgeCount).toBe(2);
    expect(step.metadata.nodeCount).toBe(3);
    expect(s.state).toBe('lineage-captured');
  });
});

describe('tutorial 93 — pipeline freshness', () => {
  it('passes when the pipeline is within SLA (tutorial: evaluateFreshness snippet)', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 30 * 60_000,
      slaMinutes: 60,
    });
    expect(step.metadata.withinSla).toBe(true);
    expect(step.metadata.ageMinutes).toBe(30);
    expect(s.state).toBe('freshness-evaluated');
  });

  it('fails when the pipeline exceeds SLA (tutorial: evaluateFreshness fail snippet)', () => {
    const s = startPipelineSession({ target: 'loki', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 90 * 60_000,
      slaMinutes: 60,
    });
    expect(step.metadata.withinSla).toBe(false);
    expect(step.metadata.ageMinutes).toBe(90);
  });
});

describe('tutorial 93 — pipeline schema drift', () => {
  it('detects a renamed column as drift (tutorial: detectSchemaDrift snippet)', () => {
    const s = startPipelineSession({ target: 'grafana-oss', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1, slaMinutes: 60 });
    const step = detectSchemaDrift(s, {
      expected: [
        { name: 'id', type: 'int' },
        { name: 'created_at', type: 'timestamp' },
      ],
      actual: [
        { name: 'id', type: 'int' },
        { name: 'createdAt', type: 'timestamp' },
      ],
    });
    expect(step.metadata.driftCount).toBeGreaterThan(0);
    expect(s.state).toBe('schema-drift-detected');
  });
});

describe('tutorial 93 — pipeline data quality', () => {
  it('computes pass ratio across checks (tutorial: scoreDataQuality snippet)', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1, slaMinutes: 60 });
    detectSchemaDrift(s, {
      expected: [{ name: 'id', type: 'int' }],
      actual: [{ name: 'id', type: 'int' }],
    });
    const step = scoreDataQuality(s, {
      checks: [
        { ruleId: 'not-null', passed: true },
        { ruleId: 'unique-id', passed: true },
        { ruleId: 'range-check', passed: false },
      ],
    });
    expect(step.metadata.score).toBeCloseTo(2 / 3);
    expect(step.metadata.passedCount).toBe(2);
    expect(step.metadata.failedCount).toBe(1);
    expect(s.state).toBe('data-quality-scored');
  });
});

describe('tutorial 93 — aiops anomaly + remediation', () => {
  it('filters anomalies by absolute z-score (tutorial: detectAnomaly snippet)', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'prod-us-east' });
    const step = detectAnomaly(s, {
      points: [
        { metric: 'cpu', value: 90, zScore: 3.2 },
        { metric: 'mem', value: 40, zScore: -3.5 },
        { metric: 'io', value: 10, zScore: 1.0 },
      ],
      zScoreThreshold: 3.0,
    });
    expect(step.metadata.anomalyCount).toBe(2);
    expect(step.metadata.hasAnomaly).toBe(true);
    expect(s.anomalies).toHaveLength(2);
  });

  it('records successRatio for remediation actions (tutorial: executeRemediation snippet)', () => {
    const s = startAiopsSession({ target: 'otel-collector', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    const step = executeRemediation(s, {
      actions: [
        { actionId: 'a1', runbookId: 'r1', success: true },
        { actionId: 'a2', runbookId: 'r2', success: false },
      ],
    });
    expect(step.metadata.succeeded).toBe(1);
    expect(step.metadata.failed).toBe(1);
    expect(step.metadata.allSucceeded).toBe(false);
  });
});

describe('tutorial 93 — aiops RCA + correlation', () => {
  it('identifies the topological root of a failure set (tutorial: analyzeRootCause snippet)', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, {
      actions: [{ actionId: 'a1', runbookId: 'r1', success: true }],
    });
    const step = analyzeRootCause(s, {
      edges: [
        { from: 'db', to: 'api' },
        { from: 'api', to: 'web' },
      ],
      failedServices: ['db', 'api', 'web'],
    });
    expect(step.metadata.rootCause).toBe('db');
    expect(s.rootCauseService).toBe('db');
  });

  it('groups alerts within a correlation window (tutorial: correlateAlerts snippet)', () => {
    const s = startAiopsSession({ target: 'grafana-oss', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, {
      actions: [{ actionId: 'a', runbookId: 'r', success: true }],
    });
    analyzeRootCause(s, { edges: [], failedServices: ['web'] });
    const step = correlateAlerts(s, {
      alerts: [
        { alertId: 'a1', service: 'x', firedAtMs: 1000 },
        { alertId: 'a2', service: 'y', firedAtMs: 1200 },
        { alertId: 'a3', service: 'z', firedAtMs: 5000 },
      ],
      windowMs: 500,
    });
    expect(step.metadata.groupCount).toBeGreaterThanOrEqual(2);
    expect(s.state).toBe('alerts-correlated');
  });
});

// ---------------------------------------------------------------------------
// Cross-tutorial — 16-axis combined fidelity harness (v2.1 8 + v2.2 8)
// (concept doc: observability-advanced-III-testing.md — 4 provider × 16 axis
//  = 64 cell grid)
// ---------------------------------------------------------------------------

describe('concept doc — 64-cell fidelity harness', () => {
  it('walks 4 provider × 16 axis = 64 rows (concept doc: collectFidelityCoverage snippet)', () => {
    const cov = collectFidelityCoverage();
    expect(cov.providers).toEqual(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    expect(cov.rows.length).toBe(64);
  });

  it('every provider × axis pair emits the same number of provider events as neutral events', () => {
    const cov = collectFidelityCoverage();
    expect(
      cov.rows.every((r) => r.providerEvents.length === r.neutralEvents.length),
    ).toBe(true);
  });

  it('covers all 8 v2.2 advanced III axes across all 4 providers', () => {
    const cov = collectFidelityCoverage();
    const v22Axes = [
      'iac',
      'service-mesh',
      'ebpf-iii',
      'llm-observability',
      'finops',
      'chaos',
      'data-pipeline',
      'aiops',
    ] as const;
    for (const axis of v22Axes) {
      const rowsForAxis = cov.rows.filter((r) => r.axis === axis);
      expect(rowsForAxis.length).toBe(4); // 4 providers
      for (const r of rowsForAxis) {
        expect(r.providerEvents.length).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
