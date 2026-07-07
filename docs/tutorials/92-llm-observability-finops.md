# LLM observability + FinOps — token counting + prompt log + hallucination detection + budget check + cost per request + team attribution + rightsizing + spot optimization in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/observability` v2.2 that models the 2 pieces of a real advanced III cost + LLM posture that every non-trivial production LLM stack eventually needs — an LLM `countTokens` step that pins per-model prompt + completion counts (mirroring OpenTelemetry GenAI semantic conventions 2026-06 stable — `gen_ai.usage.input_tokens` + `gen_ai.usage.output_tokens`) so a per-request telemetry export lands with the correct totals, a `logPrompt` step that pins a per-request system + user prompt payload with a `redacted` flag so a PII-sensitive workload can turn on redaction without a separate config axis, a `flagHallucination` step that runs a multi-signal check (`faithfulness` / `relevance` / `toxicity`) against per-signal thresholds — faithfulness + relevance flag when the score is _below_ the threshold, toxicity flags when the score is _above_ the threshold — so a "did the model hallucinate?" question resolves to one boolean without a hand-rolled per-signal branch, a `checkBudget` step that pins per-session spend against an operator-supplied limit so a runaway experiment fires a budget alert instead of silently burning through the monthly cap, a FinOps `recordCostPerRequest` step that pins the derived `costPerRequestUsd = totalCostUsd / requests` metric so a "how much does one API call cost?" question lands on one number, an `attributeTeam` step that sums per-team costs against the recorded total to compute an `unattributedUsd` remainder (mirroring FOCUS 1.0 attribution semantics) so a Finance dashboard can call out un-tagged spend without a separate reconciliation pass, a `recommendRightsizing` step that pins per-resource savings (current − recommended) and totals across a portfolio so a "what would rightsizing save this month?" question lands on one number, and an `optimizeSpot` step that pins the `savingsRatio = (onDemandUsd - spotUsd) / onDemandUsd` (via `session.spotSavingsRatio` for downstream state read) so the spot policy return can be graphed against the on-demand baseline in one panel. `startLlmObsSession()` + `countTokens()` + `logPrompt()` + `flagHallucination()` + `checkBudget()` + `startFinopsSession()` + `recordCostPerRequest()` + `attributeTeam()` + `recommendRightsizing()` + `optimizeSpot()` give you every one of those pieces without booting a real Anthropic / OpenAI / Datadog LLM Observability / AWS Cost Explorer backend. This is the pattern kiwa's `examples/dogfood-observability-llm-ops-app` exercises against real Anthropic Messages API + OpenAI Chat Completions + Datadog LLM Observability + Grafana + Prometheus + AWS Cost Explorer + Kubecost backends under `KIWA_MODE=real` + the relevant `_API_KEY` / `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the budget alert never fired because `checkBudget` compared `spentUsd > limitUsd` instead of `>=`, the hallucination check missed a signal because `flagHallucination` used the same direction for toxicity as faithfulness, and the cost-per-request came out as `NaN` because `recordCostPerRequest` divided by zero when `requests: 0` was passed" gap a reviewer sees in an LLM-ops + FinOps post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-llm-obs-finops && cd kiwa-llm-obs-finops
pnpm init
pnpm add -D @kiwa-test/observability@^2.2 vitest typescript @types/node
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

The v2.2 surface exports the LLM observability axis (`startLlmObsSession` / `countTokens` / `logPrompt` / `flagHallucination` / `checkBudget`) and the FinOps axis (`startFinopsSession` / `recordCostPerRequest` / `attributeTeam` / `recommendRightsizing` / `optimizeSpot`) directly from the package root. Every v2.2 semantics function takes an `ObservabilityTarget` (`grafana-oss` / `prometheus` / `loki` / `otel-collector`) as first argument — the target selects the neutral event dialect via `providerEventName(target, neutralEvent)` (for LLM observability, the OTel Collector dialect uses the `otel.genai.*` GenAI stable convention names introduced in OTel 1.34+). This tutorial focuses on the LLM observability + FinOps end-to-end chain; tutorial 91 covers the IaC + service-mesh + eBPF-III axes, tutorial 93 covers the chaos + data-pipeline + AIOps chain.

### 2. `countTokens` — token usage recording

`tests/llm/tokens.test.ts` — an `LlmObsSession` pins a `serviceName` + a `state` that starts at `'idle'` and moves to `'tokens-counted'` on `countTokens`. The prompt + completion tokens sum into `metadata.totalTokens` so downstream metric exporters land on one number. The `model` value is passed through so per-model dashboards (e.g. Anthropic `claude-opus-4-7` vs. OpenAI `gpt-4`) can slice the same telemetry.

```ts
import { describe, expect, it } from 'vitest';
import { countTokens, startLlmObsSession } from '@kiwa-test/observability';

describe('llm-observability — token counting', () => {
  it('sums prompt and completion tokens', () => {
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

  it('rejects negative token counts', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      countTokens(s, { model: 'gpt-4', promptTokens: -1, completionTokens: 0 }),
    ).toThrow();
  });
});
```

### 3. `logPrompt` — prompt payload with redaction

`tests/llm/prompt.test.ts` — `logPrompt()` records the system + user prompt into `session.prompt` (whole strings retained for downstream export) and emits their lengths in metadata alongside the operator-supplied `redacted` flag. A workload that turns on redaction can slice its telemetry into "PII-safe" vs. "internal-only" panels using the emitted `redacted` field.

```ts
import { describe, expect, it } from 'vitest';
import {
  countTokens,
  logPrompt,
  startLlmObsSession,
} from '@kiwa-test/observability';

describe('llm-observability — prompt log', () => {
  it('records prompt lengths and redaction flag', () => {
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
```

### 4. `flagHallucination` — multi-signal hallucination detection

`tests/llm/hallucination.test.ts` — `flagHallucination()` walks a list of signals with per-signal thresholds. `faithfulness` and `relevance` flag when the score is _below_ the threshold (a low-quality answer). `toxicity` flags when the score is _above_ the threshold (a toxic answer). The emitted `flaggedCount` sums both directions so a "did anything go wrong?" question stays on one field regardless of signal shape.

```ts
import { describe, expect, it } from 'vitest';
import {
  countTokens,
  flagHallucination,
  logPrompt,
  startLlmObsSession,
} from '@kiwa-test/observability';

describe('llm-observability — hallucination flagging', () => {
  it('flags below-threshold faithfulness and relevance', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [
        { metric: 'faithfulness', score: 0.3, threshold: 0.7 }, // flagged (below)
        { metric: 'relevance', score: 0.9, threshold: 0.5 }, // not flagged
      ],
    });
    expect(step.metadata.flaggedCount).toBe(1);
    expect(step.metadata.anyFlagged).toBe(true);
  });

  it('flags above-threshold toxicity (inverse direction)', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    const step = flagHallucination(s, {
      signals: [
        { metric: 'toxicity', score: 0.85, threshold: 0.7 }, // flagged (above)
      ],
    });
    expect(step.metadata.flaggedCount).toBe(1);
  });
});
```

### 5. `checkBudget` — spend against a limit

`tests/llm/budget.test.ts` — `checkBudget()` pins per-session `spentUsd` against an operator-supplied `limitUsd`. `metadata.exhausted` flips true when `spentUsd >= limitUsd`, `metadata.ratio = spentUsd / limitUsd`. A runaway experiment fires a budget alert on the emitted metric without a hand-rolled ratio computation.

```ts
import { describe, expect, it } from 'vitest';
import {
  checkBudget,
  countTokens,
  flagHallucination,
  logPrompt,
  startLlmObsSession,
} from '@kiwa-test/observability';

describe('llm-observability — budget check', () => {
  it('flags exhausted when spend >= limit', () => {
    const s = startLlmObsSession({ target: 'otel-collector', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'faithfulness', score: 1.0, threshold: 0.5 }] });
    const step = checkBudget(s, { spentUsd: 120, limitUsd: 100 });
    expect(step.metadata.exhausted).toBe(true);
    expect(step.metadata.ratio).toBeCloseTo(1.2);
    expect(s.state).toBe('budget-checked');
  });

  it('reports under-budget when spend < limit', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'chat-api' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    logPrompt(s, { requestId: 'r', system: 's', user: 'u', redacted: false });
    flagHallucination(s, { signals: [{ metric: 'faithfulness', score: 1.0, threshold: 0.5 }] });
    const step = checkBudget(s, { spentUsd: 10, limitUsd: 100 });
    expect(step.metadata.exhausted).toBe(false);
    expect(step.metadata.ratio).toBeCloseTo(0.1);
  });
});
```

### 6. `recordCostPerRequest` — the FinOps cost per request primitive

`tests/finops/cpr.test.ts` — a `FinopsSession` pins an `accountId` + a `state` that starts at `'idle'` and moves to `'cost-per-request-recorded'` on `recordCostPerRequest`. The step's metadata emits `costPerRequestUsd = totalCostUsd / requests` — this is the FOCUS 1.0 CPR primitive that every cost dashboard uses as its baseline.

```ts
import { describe, expect, it } from 'vitest';
import { recordCostPerRequest, startFinopsSession } from '@kiwa-test/observability';

describe('finops — cost per request', () => {
  it('computes cost per request across a workload', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'acct-1' });
    const step = recordCostPerRequest(s, { requests: 1_000_000, totalCostUsd: 5000 });
    expect(step.neutralEvent).toBe('finops.cost_per_request_recorded');
    expect(step.metadata.costPerRequestUsd).toBeCloseTo(0.005);
    expect(s.state).toBe('cost-per-request-recorded');
  });

  it('rejects a zero-request workload', () => {
    const s = startFinopsSession({ target: 'grafana-oss', accountId: 'x' });
    expect(() =>
      recordCostPerRequest(s, { requests: 0, totalCostUsd: 100 }),
    ).toThrow();
  });
});
```

### 7. `attributeTeam` — FOCUS 1.0 team cost attribution

`tests/finops/team.test.ts` — `attributeTeam()` sums per-team costs into `totalAttributedUsd` and computes `unattributedUsd = totalCostUsd - totalAttributedUsd`, clamped to 0 when over-attribution happens. A Finance dashboard can call out untagged spend (positive remainder) without a separate reconciliation pass.

```ts
import { describe, expect, it } from 'vitest';
import {
  attributeTeam,
  recordCostPerRequest,
  startFinopsSession,
} from '@kiwa-test/observability';

describe('finops — team attribution', () => {
  it('computes unattributed remainder when teams under-account', () => {
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

  it('clamps unattributed to 0 when teams over-account', () => {
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
```

### 8. `recommendRightsizing` — per-resource savings

`tests/finops/rightsize.test.ts` — `recommendRightsizing()` sums `currentSizeUsd - recommendedSizeUsd` across every resource into `totalSavingsUsd`. A "what would rightsizing save this month?" question lands on one number without walking the raw recommendation list.

```ts
import { describe, expect, it } from 'vitest';
import {
  attributeTeam,
  recommendRightsizing,
  recordCostPerRequest,
  startFinopsSession,
} from '@kiwa-test/observability';

describe('finops — rightsizing recommendations', () => {
  it('sums per-resource savings', () => {
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
```

### 9. `optimizeSpot` — spot vs. on-demand ratio

`tests/finops/spot.test.ts` — `optimizeSpot()` computes `savingsRatio = (onDemandUsd - spotUsd) / onDemandUsd`, ready to plot against the on-demand baseline on the same panel. The 4-step lifecycle terminates at `'spot-optimized'` — an operator can then compare successive months against the ratio to track spot policy effectiveness.

```ts
import { describe, expect, it } from 'vitest';
import {
  attributeTeam,
  optimizeSpot,
  recommendRightsizing,
  recordCostPerRequest,
  startFinopsSession,
} from '@kiwa-test/observability';

describe('finops — spot optimization', () => {
  it('computes spot savings ratio', () => {
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
```

## Run the suite

```bash
pnpm test
```

The suite completes in under two seconds without a real Anthropic / OpenAI / Datadog LLM Observability / AWS Cost Explorer backend. The LLM observability axis and the FinOps axis stay orthogonal — a failure in a token counting assertion does not mask a rightsizing regression.

## What's next

Tutorial 91 (`docs/tutorials/91-iac-servicemesh-ebpf.md`) walks the IaC + service-mesh + eBPF-III axes. Tutorial 93 (`docs/tutorials/93-chaos-datapipeline-aiops.md`) walks the chaos + data-pipeline + AIOps chain. Concept doc `docs/concepts/observability-advanced-III-testing.md` documents the v2.2 8 axis SSOT and the 4 provider × 8 axis = 32 cell fidelity harness across all 3 v1.42 dogfood observability apps (`dogfood-observability-iac-drift-app` + `dogfood-observability-llm-ops-app` + `dogfood-observability-chaos-aiops-app`).
