# IaC + Service mesh + eBPF profiling III — Terraform drift + OPA policy + cost attribution + Istio/Linkerd + mTLS + sidecar + circuit breaker + user-space + kernel + LSM + syscall + network flow in 15 min

## What you'll build

A vitest suite wired to `@kiwa/observability` v2.2 that models the 3 pieces of a real advanced III observability posture that every non-trivial production platform eventually needs — an IaC `capturePlan` step that pins a per-workspace change catalog (create / update / delete / no-op counts) so a follow-up `detectDrift` step can compare the intended set against the actually-provisioned set, an `evaluatePolicy` step that gates the plan on OPA policy pass / fail (mirroring `terraform plan | conftest test` in a real Terraform + Sentinel / OPA stack), an `attributeCost` step that pins per-team monthly cost so a Finance dashboard can slice the same infra spend by team without a separate query, a service-mesh `handshakeMtls` step that pins a per-connection SPIFFE ID pair (mirroring Istio Citadel / Linkerd Proxy Identity) so a rogue workload cannot silently accept traffic on a mis-configured `spiffe://` URI, an `injectSidecar` step that counts envoy vs. linkerd2-proxy per-namespace so the mesh operator can audit adoption without a separate `kubectl get pods -o json` script, a `tripCircuitBreaker` step that pins the failure-rate threshold (mirroring Envoy `outlier_detection.consecutive_5xx` / Linkerd `service.circuit_breaker`) so a runaway upstream cannot cascade into the whole mesh, an `applyTrafficSplit` step that pins the per-service weight distribution (mirroring Istio VirtualService `weight` + Linkerd TrafficSplit v1alpha3) so a canary rollout can be re-computed in one place instead of a per-provider YAML diff, an eBPF-III `probeUserspace` step that pins per-symbol uprobe registration (mirroring `bpftrace 'uprobe:libc:malloc'`) so a memory-leak investigation can attach to a single `.so` without a full kernel-side sweep, a `traceKernel` step that separates kprobe / tracepoint / LSM hooks (mirroring `bpftool prog show` per-hook category counts) so the Linux 6.11+ Landlock LSM hook set can be audited independently of the older kprobe surface, a `recordSyscall` step that aggregates `read` / `write` / `open` / other syscall counts (mirroring `sysdig` / `falco` per-syscall totals) so a "which syscall is dominating my process?" investigation lands on one number, and a `captureNetworkFlow` step that pins per-flow bytes + packets (mirroring `bcc/tcpconnect` + `bpf/skops` egress instrumentation) so a "where is the bandwidth going?" investigation reproduces without a full `tcpdump` capture. `startIacSession()` + `capturePlan()` + `detectDrift()` + `evaluatePolicy()` + `attributeCost()` + `startMeshSession()` + `handshakeMtls()` + `injectSidecar()` + `tripCircuitBreaker()` + `applyTrafficSplit()` + `startEbpfIiiSession()` + `probeUserspace()` + `traceKernel()` + `recordSyscall()` + `captureNetworkFlow()` give you every one of those pieces without booting a real Terraform + OPA / Istio + Envoy / bpftrace kernel. This is the pattern kiwa's `examples/dogfood-observability-iac-drift-app` exercises against real Terraform 1.11+ + OPA 1.0 / Conftest + Kubernetes Istio 1.30+ / Linkerd 2.16+ + Linux 6.11+ bpftrace / bcc backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the drift detector missed a resource because `detectDrift` compared expected vs. actual with the wrong direction, the mTLS handshake accepted an un-scoped SPIFFE ID because `handshakeMtls` did not gate on `spiffe://` prefix, and the uprobe count double-fired because `probeUserspace` accepted a duplicate symbol without a set guard" gap a reviewer sees in an IaC + service-mesh + eBPF post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-iac-servicemesh-ebpf && cd kiwa-iac-servicemesh-ebpf
pnpm init
pnpm add -D @kiwa/observability@^2.2 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v2.2 surface exports the IaC axis (`startIacSession` / `capturePlan` / `detectDrift` / `evaluatePolicy` / `attributeCost`), the service-mesh axis (`startMeshSession` / `handshakeMtls` / `injectSidecar` / `tripCircuitBreaker` / `applyTrafficSplit`), and the eBPF-III axis (`startEbpfIiiSession` / `probeUserspace` / `traceKernel` / `recordSyscall` / `captureNetworkFlow`) directly from the package root. Every v2.2 semantics function takes an `ObservabilityTarget` (`grafana-oss` / `prometheus` / `loki` / `otel-collector`) as first argument — the target selects the neutral event dialect via `providerEventName(target, neutralEvent)` (Grafana OSS Alerting event name vs. Prometheus metric family name vs. Loki log field name vs. OTel Collector processor event name). This tutorial focuses on the IaC + service-mesh + eBPF-III chain; tutorial 92 covers the LLM observability + FinOps axes, tutorial 93 covers the chaos + data-pipeline + AIOps chain.

### 2. `capturePlan` — the IaC plan capture step

`tests/iac/plan.test.ts` — an `IacSession` pins a `workspace` + a `state` that starts at `'idle'` and moves to `'plan-captured'` on `capturePlan`. The change list is copied into `session.changes`; the emitted step's metadata carries `additions` (create), `modifications` (update), and `deletions` (delete) counts so a downstream dashboard can graph the change velocity per workspace.

```ts
import { describe, expect, it } from 'vitest';
import { capturePlan, startIacSession } from '@kiwa/observability';

describe('iac — plan capture', () => {
  it('captures a plan and counts create/update/delete', async () => {
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

  it('rejects an empty change list', () => {
    const s = startIacSession({ target: 'grafana-oss', workspace: 'stg' });
    expect(() => capturePlan(s, { changes: [] })).toThrow(/must not be empty/);
  });
});
```

`session.state` is now the SSOT for who the downstream `detectDrift` / `evaluatePolicy` / `attributeCost` steps operate on — every step gates on the state and refuses to run out of order.

### 3. `detectDrift` — expected vs. actual comparison

`tests/iac/drift.test.ts` — `detectDrift()` compares an `expected` set against an `actual` set and records every address that only appears in one side into `session.driftedResources`. The emitted step's metadata carries `driftCount` (union of missing + extra addresses) so a "did anything drift?" question resolves to one number.

```ts
import { describe, expect, it } from 'vitest';
import { capturePlan, detectDrift, startIacSession } from '@kiwa/observability';

describe('iac — drift detection', () => {
  it('detects a resource missing in actual state', () => {
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

  it('returns zero drift when sets match', () => {
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
```

### 4. `evaluatePolicy` — OPA policy result recording

`tests/iac/policy.test.ts` — `evaluatePolicy()` records a list of policy results (`policyId` + `passed` + `violationCount`) into `session.policyResults`. The emitted step's metadata carries `passed` and `failed` counts so an operator dashboard can tell "which policies broke?" at a glance without walking the raw result list.

```ts
import { describe, expect, it } from 'vitest';
import {
  capturePlan,
  detectDrift,
  evaluatePolicy,
  startIacSession,
} from '@kiwa/observability';

describe('iac — policy evaluation', () => {
  it('counts passed vs failed policies', () => {
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
```

### 5. `attributeCost` — per-team FinOps cost attribution

`tests/iac/cost.test.ts` — `attributeCost()` pins a list of team cost records (`team` + `monthlyCostUsd`) into `session.costAttributions`. The emitted step's metadata carries `totalMonthlyCostUsd` so the operator dashboard can graph the workspace-total spend on the same axis as the per-team slice.

```ts
import { describe, expect, it } from 'vitest';
import {
  attributeCost,
  capturePlan,
  detectDrift,
  evaluatePolicy,
  startIacSession,
} from '@kiwa/observability';

describe('iac — cost attribution', () => {
  it('sums the total monthly cost across teams', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    evaluatePolicy(s, { results: [{ policyId: 'p', passed: true, violationCount: 0 }] });
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
```

### 6. `handshakeMtls` — service-mesh mTLS handshake

`tests/mesh/mtls.test.ts` — a `MeshSession` starts at `'idle'` and moves to `'mtls-handshaked'` on `handshakeMtls`. The client + server SPIFFE IDs must both start with `spiffe://` — a mis-configured caller that passes a bare `sa/web` string is rejected immediately so a rogue workload cannot silently accept traffic.

```ts
import { describe, expect, it } from 'vitest';
import { handshakeMtls, startMeshSession } from '@kiwa/observability';

describe('mesh — mTLS handshake', () => {
  it('accepts a valid SPIFFE pair', () => {
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

  it('rejects a client SPIFFE without spiffe:// prefix', () => {
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
```

### 7. `injectSidecar` + `tripCircuitBreaker` — mesh data plane

`tests/mesh/sidecar-cb.test.ts` — `injectSidecar()` categorises injections into envoy vs. linkerd2-proxy counts so an operator can audit "which proxy runs on which pod?" from one metric. `tripCircuitBreaker()` compares `failures / total` against the operator-supplied `failureThreshold` and flips `session.circuitBreakerOpen` when the ratio meets the threshold (`>=`) — matching Envoy `outlier_detection.consecutive_5xx` semantics.

```ts
import { describe, expect, it } from 'vitest';
import {
  handshakeMtls,
  injectSidecar,
  startMeshSession,
  tripCircuitBreaker,
} from '@kiwa/observability';

describe('mesh — sidecar + circuit breaker', () => {
  it('counts envoy vs linkerd sidecars separately', () => {
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

  it('trips the circuit breaker when failure rate meets threshold', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    const step = tripCircuitBreaker(s, { failures: 40, total: 100, failureThreshold: 0.3 });
    expect(step.metadata.tripped).toBe(true);
    expect(s.circuitBreakerOpen).toBe(true);
  });
});
```

### 8. `applyTrafficSplit` — canary weight distribution

`tests/mesh/traffic-split.test.ts` — `applyTrafficSplit()` pins the per-service weight distribution and records `totalWeight` in the emitted step's metadata so the operator can assert "the weights add up to 100" without a separate reduce over the split list.

```ts
import { describe, expect, it } from 'vitest';
import {
  applyTrafficSplit,
  handshakeMtls,
  injectSidecar,
  startMeshSession,
  tripCircuitBreaker,
} from '@kiwa/observability';

describe('mesh — traffic split', () => {
  it('records the weight sum across services', () => {
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
```

### 9. `probeUserspace` + `traceKernel` — eBPF hook registration

`tests/ebpf/probes.test.ts` — `probeUserspace()` pins per-symbol uprobe registration (mirroring `bpftrace 'uprobe:libc:malloc { @[stack]=count(); }'`) so a memory-leak investigation can attach to a single symbol. `traceKernel()` separates kprobe / tracepoint / LSM hooks so the Linux 6.11+ Landlock LSM hook set can be audited independently of the older kprobe surface.

```ts
import { describe, expect, it } from 'vitest';
import {
  probeUserspace,
  startEbpfIiiSession,
  traceKernel,
} from '@kiwa/observability';

describe('ebpf — userspace + kernel probes', () => {
  it('counts uprobes by symbol', () => {
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

  it('separates kprobe / tracepoint / lsm buckets', () => {
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
```

### 10. `recordSyscall` + `captureNetworkFlow` — eBPF data collection

`tests/ebpf/syscall-flow.test.ts` — `recordSyscall()` sums per-syscall counts into `totalCalls` so a "which syscall is dominating my process?" investigation lands on one number. `captureNetworkFlow()` sums bytes + packets across flows so a "where is the bandwidth going?" investigation reproduces without a `tcpdump` capture.

```ts
import { describe, expect, it } from 'vitest';
import {
  captureNetworkFlow,
  probeUserspace,
  recordSyscall,
  startEbpfIiiSession,
  traceKernel,
} from '@kiwa/observability';

describe('ebpf — syscall + network flow', () => {
  it('sums syscall counts across categories', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'host-1' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    const step = recordSyscall(s, { counts: { read: 1000, write: 500, open: 200 } });
    expect(step.metadata.syscallCount).toBe(3);
    expect(step.metadata.totalCalls).toBe(1700);
  });

  it('captures per-flow bytes and packets', () => {
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
```

## Run the suite

```bash
pnpm test
```

The suite completes in under two seconds without a real Terraform + OPA / Istio / Envoy / bpftrace kernel. Each of the 3 axis chains stays independent, so a failure in an eBPF assertion does not mask a service-mesh regression.

## What's next

Tutorial 92 (`docs/tutorials/92-llm-observability-finops.md`) walks the LLM observability + FinOps axes (token counting + prompt log + hallucination detection + budget check + cost per request + team attribution + rightsizing + spot optimization). Tutorial 93 (`docs/tutorials/93-chaos-datapipeline-aiops.md`) walks the chaos engineering + data-pipeline + AIOps axes (fault injection + blast radius + auto-rollback + game day + lineage capture + freshness + schema drift + data quality + anomaly + auto-remediation + RCA + alert correlation). Concept doc `docs/concepts/observability-advanced-III-testing.md` documents the v2.2 8 axis SSOT and the 4 provider × 8 axis = 32 cell fidelity harness.
