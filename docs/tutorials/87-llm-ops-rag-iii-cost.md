# LLM ops + Prompt engineering + RAG III + Cost optimization — model registry + A/B + canary + shadow + CoT + few-shot + caching + versioning + GraphRAG + agentic + self-query + parent doc + batch + cascade + semantic cache in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/ai-llm` v0.5 that models the 5 pieces of a real LLM ops + advanced prompt engineering + GraphRAG III + cost-optimization pipeline that every non-trivial LLM-backed product eventually needs — an LLM ops registry that pins per-version model entries + an `active` flag so a follow-up rollout / canary / A/B step operates on a single SSOT, a rollout advancer that walks the `currentPercent` toward a target in `incrementPercent` steps so a 0 → 10 → 20 → 50 rollout ladder is a deterministic 3-call sequence, an A/B evaluator that filters variants by a `minSamples` floor then ranks the survivors by mean score so a variant with 20 samples and score 0.8 beats a variant with 20 samples and score 0.75, a canary promoter that gates on `errorRate <= threshold` so a canary with 5 % error and a 10 % threshold flips `promoted: true` and rewrites `active` on the registry, a shadow comparator that returns `(prodAvg, shadowAvg, delta, better)` so a shadow model that scores 0.85 vs prod's 0.80 lands on `better: true` without shipping any user-facing traffic, an advanced prompt-engineering axis that walks `expandChainOfThought` + `selectFewShot` + `cachePrompt` + `pinVersion` so a stalled prompt run can be replayed under a pinned `semver+hash` combination, a GraphRAG III axis that walks `traverseGraph` (BFS with edge-weight priority) + `stepAgentic` (fetch-vs-answer decision via `confidence >= threshold`) + `selfQuery` (NL → filter predicate via schema-field match) + `expandParent` (chunk → parent doc lookup) so a hybrid retrieval loop can be replayed deterministically, and a cost-optimization axis that walks `submitBatch` (0.5x savings estimate) + `compressPrompt` (char slice to `maxChars`) + `stepCascade` (cheapest-tier-first with escalation ladder) + `lookupSemanticCache` (hash lookup + backfill) so a per-request cost gate is a single object away. `startOpsSession()` + `updateRegistry()` + `advanceRollout()` + `evaluateAb()` + `promoteCanary()` + `compareShadow()` + `startPeaSession()` + `expandChainOfThought()` + `selectFewShot()` + `cachePrompt()` + `pinVersion()` + `startRag3Session()` + `traverseGraph()` + `stepAgentic()` + `selfQuery()` + `expandParent()` + `startCoSession()` + `submitBatch()` + `compressPrompt()` + `stepCascade()` + `lookupSemanticCache()` give you every one of those pieces without booting a real model registry or a real GraphRAG index. This is the pattern kiwa's `examples/dogfood-llm-ops-registry-app` exercises against a real Redis + Postgres model registry backend under `KIWA_MODE=real` + `KIWA_OPS_REGISTRY_URL` + `KIWA_LLM_BUDGET_USD`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the A/B evaluator picked the variant with 5 samples over the one with 500 samples because `minSamples` was not enforced" gap a reviewer sees in the LLM-ops-rollout post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-ops-rag-cost && cd kiwa-ops-rag-cost
pnpm init
pnpm add -D @kiwa-lab/ai-llm@^0.5 vitest typescript @types/node
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

The v0.5 surface exports the LLM ops axis (`startOpsSession` / `updateRegistry` / `advanceRollout` / `evaluateAb` / `promoteCanary` / `compareShadow`), the prompt-engineering advanced axis (`startPeaSession` / `expandChainOfThought` / `selectFewShot` / `cachePrompt` / `pinVersion`), the RAG III axis (`startRag3Session` / `traverseGraph` / `stepAgentic` / `selfQuery` / `expandParent`), and the cost-optimization axis (`startCoSession` / `submitBatch` / `compressPrompt` / `stepCascade` / `lookupSemanticCache`) directly from the package root. This tutorial focuses on the LLM ops + prompt engineering + RAG III + cost optimization chain; tutorial 85 covers the multi-agent + swarm axis, tutorial 86 covers the code interpreter + fine-tuning pipeline axis.

### 2. `updateRegistry` + `advanceRollout` — versioned registry + rollout ladder

`tests/ops/registry.test.ts` — an `OpsSession` pins a `target` (`anthropic` / `openai` / `vercel-ai` / `langchain`) + `sessionId` + a `state` that starts at `idle` and walks through `registry-updated` → `rollout-advanced` / `ab-evaluated` / `canary-promoted` / `shadow-compared`. `updateRegistry()` refuses a duplicate version so a mis-configured caller cannot register the same model twice and land on undefined behavior. `advanceRollout()` walks `currentPercent` toward `targetPercent` in `incrementPercent` steps.

```ts
import { describe, expect, it } from 'vitest';
import {
  advanceRollout,
  startOpsSession,
  updateRegistry,
} from '@kiwa-lab/ai-llm';

describe('ops — registry + rollout', () => {
  it('registers and activates a version', () => {
    const s = startOpsSession({ target: 'anthropic', sessionId: 's-1' });
    const { registrySize } = updateRegistry(s, {
      version: 'v1.0',
      activate: true,
    });
    expect(registrySize).toBe(1);
    expect(s.registry[0]?.active).toBe(true);
    expect(s.state).toBe('registry-updated');
  });

  it('advances rollout toward target', () => {
    const s = startOpsSession({ target: 'openai', sessionId: 's-2' });
    updateRegistry(s, { version: 'v1.0', activate: true });
    const r1 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    const r2 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    const r3 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    expect(r1.currentPercent).toBe(20);
    expect(r2.currentPercent).toBe(40);
    expect(r3.currentPercent).toBe(50);
    expect(r3.reachedTarget).toBe(true);
  });

  it('rejects duplicate versions', () => {
    const s = startOpsSession({ target: 'vercel-ai', sessionId: 's-3' });
    updateRegistry(s, { version: 'v1', activate: false });
    expect(() => updateRegistry(s, { version: 'v1', activate: false })).toThrow(
      /already registered/,
    );
  });
});
```

The `session.registry` snapshot + `session.rolloutPercent` counter are now the SSOT for downstream A/B + canary + shadow steps — every gate reads from the same session state.

### 3. `evaluateAb` + `promoteCanary` — mean-score winner + error-rate gate

`tests/ops/ab-canary.test.ts` — `evaluateAb()` filters variants by a `minSamples` floor then ranks the survivors by mean score so a variant with 20 samples + 0.8 score beats a variant with 20 samples + 0.75 score, and a fewer-than-minimum variant is silently dropped. `promoteCanary()` gates on `errorRate <= threshold` so a canary with 5 % error + 10 % threshold lands on `promoted: true`.

```ts
import { describe, expect, it } from 'vitest';
import {
  evaluateAb,
  promoteCanary,
  startOpsSession,
  updateRegistry,
} from '@kiwa-lab/ai-llm';

describe('ops — A/B + canary', () => {
  it('picks the higher-mean variant with sufficient samples', () => {
    const s = startOpsSession({ target: 'langchain', sessionId: 's-4' });
    updateRegistry(s, { version: 'v1', activate: false });
    const { winner, delta } = evaluateAb(s, {
      results: [
        { variant: 'A', score: 0.75, samples: 20 },
        { variant: 'B', score: 0.8, samples: 20 },
      ],
      minSamples: 10,
    });
    expect(winner).toBe('B');
    expect(delta).toBeCloseTo(0.05);
  });

  it('drops variants under the minSamples floor', () => {
    const s = startOpsSession({ target: 'anthropic', sessionId: 's-5' });
    updateRegistry(s, { version: 'v1', activate: false });
    const { winner } = evaluateAb(s, {
      results: [
        { variant: 'A', score: 0.5, samples: 3 },
        { variant: 'B', score: 0.9, samples: 5 },
      ],
      minSamples: 10,
    });
    expect(winner).toBe(null);
  });

  it('promotes a canary under the error threshold', () => {
    const s = startOpsSession({ target: 'openai', sessionId: 's-6' });
    updateRegistry(s, { version: 'v2', activate: false });
    const { promoted } = promoteCanary(s, {
      canaryVersion: 'v2',
      errorRate: 0.05,
      threshold: 0.1,
    });
    expect(promoted).toBe(true);
    expect(s.registry.find((e) => e.version === 'v2')?.active).toBe(true);
  });
});
```

The `promoted` flag rewrites the `active` bit on the registry — a follow-up prod request routes to the promoted version without touching a separate feature-flag service.

### 4. `compareShadow` — shadow model comparison without user-facing traffic

`tests/ops/shadow.test.ts` — `compareShadow()` computes `prodAvg = mean(productionScores)` + `shadowAvg = mean(shadowScores)` + `delta = shadowAvg - prodAvg` + `better = delta > 0` so a caller can decide if the shadow model is worth promoting to canary without shipping any user-visible traffic.

```ts
import { describe, expect, it } from 'vitest';
import {
  compareShadow,
  startOpsSession,
  updateRegistry,
} from '@kiwa-lab/ai-llm';

describe('ops — shadow compare', () => {
  it('reports better when shadow beats production', () => {
    const s = startOpsSession({ target: 'vercel-ai', sessionId: 's-7' });
    updateRegistry(s, { version: 'v1', activate: true });
    const { delta, better } = compareShadow(s, {
      productionScores: [0.8, 0.82, 0.79],
      shadowScores: [0.85, 0.87, 0.88],
    });
    expect(better).toBe(true);
    expect(delta).toBeGreaterThan(0);
    expect(s.state).toBe('shadow-compared');
  });
});
```

The `better` boolean is the outer-loop signal — a shadow evaluation orchestrator can chain `if (compareShadow(s, {...}).better) promoteCanary(s, {...})` to walk the ladder from shadow → canary → active without a human in the loop.

### 5. `expandChainOfThought` + `selectFewShot` + `cachePrompt` + `pinVersion` — advanced prompt engineering

`tests/pea/prompt.test.ts` — a `PeaSession` walks CoT expansion + top-k few-shot selection + deterministic prompt caching + `semver+hash` version pinning. `selectFewShot()` sorts the pool by score descending so the top-k selection is stable across runs. `pinVersion()` refuses a non-semver string so a mis-configured caller cannot pin `v1.0.0-alpha` and land on undefined behavior.

```ts
import { describe, expect, it } from 'vitest';
import {
  cachePrompt,
  expandChainOfThought,
  pinVersion,
  selectFewShot,
  startPeaSession,
} from '@kiwa-lab/ai-llm';

describe('pea — advanced prompt engineering', () => {
  it('expands CoT steps in order', () => {
    const s = startPeaSession({ target: 'anthropic', sessionId: 's-8' });
    const { steps } = expandChainOfThought(s, {
      thoughts: ['step 1', 'step 2', 'step 3'],
    });
    expect(steps).toHaveLength(3);
    expect(steps[0]?.index).toBe(0);
    expect(steps[2]?.index).toBe(2);
    expect(s.state).toBe('chain-of-thought-expanded');
  });

  it('picks top-k few-shot examples by score', () => {
    const s = startPeaSession({ target: 'openai', sessionId: 's-9' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const { selected } = selectFewShot(s, {
      pool: [
        { id: 'e1', input: 'x', output: 'y', score: 0.5 },
        { id: 'e2', input: 'x', output: 'y', score: 0.9 },
        { id: 'e3', input: 'x', output: 'y', score: 0.7 },
      ],
      k: 2,
    });
    expect(selected.map((e) => e.id)).toEqual(['e2', 'e3']);
  });

  it('reports a cache hit on repeat key', () => {
    const s = startPeaSession({ target: 'vercel-ai', sessionId: 's-10' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const first = cachePrompt(s, { key: 'k1', value: 'v1' });
    const second = cachePrompt(s, { key: 'k1', value: 'v2' });
    expect(first.wasHit).toBe(false);
    expect(second.wasHit).toBe(true);
  });

  it('pins a semver+hash version', () => {
    const s = startPeaSession({ target: 'langchain', sessionId: 's-11' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const { version } = pinVersion(s, { semver: '1.2.3', hash: 'abcd' });
    expect(version).toBe('1.2.3+abcd');
    expect(s.currentVersion).toBe('1.2.3+abcd');
  });

  it('refuses a non-semver string', () => {
    const s = startPeaSession({ target: 'anthropic', sessionId: 's-12' });
    expandChainOfThought(s, { thoughts: ['t'] });
    expect(() =>
      pinVersion(s, { semver: 'v1', hash: 'abcd' }),
    ).toThrow(/semver must match N.N.N/);
  });
});
```

The `session.currentVersion` snapshot is the reproducibility SSOT — a stalled prompt run can be replayed against the exact `semver+hash` combination that landed the bad output.

### 6. `traverseGraph` + `stepAgentic` + `selfQuery` + `expandParent` — RAG III GraphRAG walk

`tests/rag3/graph.test.ts` — a `Rag3Session` walks GraphRAG BFS traversal (edge-weight priority) + agentic fetch-vs-answer decision + self-query filter predicate + chunk-to-parent doc expansion. `stepAgentic()` decides `action: 'answer'` when `confidence >= threshold` and `action: 'fetch'` otherwise.

```ts
import { describe, expect, it } from 'vitest';
import {
  expandParent,
  selfQuery,
  startRag3Session,
  stepAgentic,
  traverseGraph,
} from '@kiwa-lab/ai-llm';

describe('rag3 — GraphRAG traversal', () => {
  it('walks nodes via edge-weight BFS', () => {
    const s = startRag3Session({ target: 'openai', sessionId: 's-13' });
    const { visited, totalWeight } = traverseGraph(s, {
      nodes: [
        { id: 'n1', label: 'A' },
        { id: 'n2', label: 'B' },
        { id: 'n3', label: 'C' },
      ],
      edges: [
        { from: 'n1', to: 'n2', weight: 0.9 },
        { from: 'n1', to: 'n3', weight: 0.5 },
      ],
      startNodeId: 'n1',
      maxHops: 2,
    });
    expect(visited).toContain('n2');
    expect(visited).toContain('n3');
    expect(totalWeight).toBeGreaterThan(0);
  });

  it('decides answer when confidence >= threshold', () => {
    const s = startRag3Session({ target: 'anthropic', sessionId: 's-14' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { action } = stepAgentic(s, {
      confidence: 0.85,
      threshold: 0.7,
      reason: 'top-hit score is high enough',
    });
    expect(action).toBe('answer');
  });

  it('decides fetch when confidence < threshold', () => {
    const s = startRag3Session({ target: 'vercel-ai', sessionId: 's-15' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { action } = stepAgentic(s, {
      confidence: 0.3,
      threshold: 0.7,
      reason: 'need more evidence',
    });
    expect(action).toBe('fetch');
  });

  it('builds a filter predicate from schema-field match', () => {
    const s = startRag3Session({ target: 'langchain', sessionId: 's-16' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { predicate, matchedFields } = selfQuery(s, {
      question: 'find rows where title contains kiwa and priority is high',
      schemaFields: ['title', 'priority', 'author'],
    });
    expect(matchedFields).toEqual(['title', 'priority']);
    expect(predicate).toBe('title MATCHES AND priority MATCHES');
  });

  it('expands a chunk to its parent doc', () => {
    const s = startRag3Session({ target: 'openai', sessionId: 's-17' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { parent } = expandParent(s, {
      chunkId: 'c1',
      parents: [
        { id: 'p1', content: 'full doc text', chunkIds: ['c1', 'c2'] },
        { id: 'p2', content: 'other doc', chunkIds: ['c3'] },
      ],
    });
    expect(parent?.id).toBe('p1');
    expect(parent?.content).toBe('full doc text');
  });
});
```

The RAG III chain (traverse → agentic → self-query → expand) is the replayable retrieval trace — a downstream orchestrator can chain the 4 steps with a determined `confidence` gate and know that the same query always lands on the same doc set.

### 7. `submitBatch` + `compressPrompt` + `stepCascade` + `lookupSemanticCache` — cost optimization ladder

`tests/co/cost.test.ts` — a `CoSession` walks the batch API estimate (0.5x savings) + prompt compression (char slice to `maxChars`) + model cascade (cheapest-tier-first with escalation) + semantic cache (hash lookup + backfill). The cascade sorts tiers by `costPerToken` ascending so the cheapest tier is tried first, and only when confidence falls below the tier's threshold does it escalate to the next tier.

```ts
import { describe, expect, it } from 'vitest';
import {
  compressPrompt,
  lookupSemanticCache,
  startCoSession,
  stepCascade,
  submitBatch,
} from '@kiwa-lab/ai-llm';

describe('co — cost optimization', () => {
  it('estimates 0.5x batch savings', () => {
    const s = startCoSession({ target: 'anthropic', sessionId: 's-18' });
    const { estimatedSavings } = submitBatch(s, {
      requests: [
        { id: 'r1', tokens: 100 },
        { id: 'r2', tokens: 200 },
      ],
    });
    expect(estimatedSavings).toBe(150);
    expect(s.state).toBe('batch-submitted');
  });

  it('compresses prompt to maxChars', () => {
    const s = startCoSession({ target: 'openai', sessionId: 's-19' });
    submitBatch(s, { requests: [{ id: 'r1', tokens: 10 }] });
    const { compressed, ratio } = compressPrompt(s, {
      prompt: 'a'.repeat(100),
      maxChars: 40,
    });
    expect(compressed.length).toBe(40);
    expect(ratio).toBeCloseTo(0.4);
  });

  it('escalates when confidence falls below tier threshold', () => {
    const s = startCoSession({ target: 'vercel-ai', sessionId: 's-20' });
    submitBatch(s, { requests: [{ id: 'r1', tokens: 10 }] });
    const { selectedTier, escalated } = stepCascade(s, {
      confidence: 0.5,
      tiers: [
        { name: 'cheap', costPerToken: 0.0001, confidenceThreshold: 0.8 },
        { name: 'mid', costPerToken: 0.001, confidenceThreshold: 0.4 },
      ],
    });
    expect(selectedTier).toBe('mid');
    expect(escalated).toBe(true);
  });

  it('backfills a semantic cache miss', () => {
    const s = startCoSession({ target: 'langchain', sessionId: 's-21' });
    const first = lookupSemanticCache(s, {
      queryHash: 'h1',
      value: 'cached-answer',
    });
    const second = lookupSemanticCache(s, { queryHash: 'h1' });
    expect(first.hit).toBe(false);
    expect(second.hit).toBe(true);
    expect(second.cached).toBe('cached-answer');
  });
});
```

The cascade + semantic cache combination is the per-request cost gate — a caller can chain `lookupSemanticCache → stepCascade → submitBatch → compressPrompt` to walk from cheapest (cache hit) to most-expensive (compressed prompt to a top-tier model) without any hard-coded routing logic.

## Wrap-up

You now have an LLM ops + advanced prompt engineering + GraphRAG III + cost-optimization pipeline that (a) registers versioned models + walks the rollout ladder, (b) evaluates A/B variants with a sample floor + promotes canaries by error-rate gate, (c) compares shadow vs prod without user-facing traffic, (d) expands CoT + selects top-k few-shot + caches prompts + pins semver+hash versions, (e) walks the GraphRAG BFS + agentic decision + self-query predicate + parent-doc expansion, and (f) walks the cost ladder from semantic cache to batch to compression to model cascade — all without a real model registry or a real GraphRAG index, all in a millisecond-scale inner loop, and all on the same neutral event names (`ops.canary_promoted` / `rag3.graph_traversed` / `co.cascade_stepped` / etc.) that the 4 provider dialects emit under real routing. The v1.40 dogfood app (`examples/dogfood-llm-ops-registry-app`) runs the same assertions against a real Redis + Postgres model registry backend under `KIWA_MODE=real` + `KIWA_OPS_REGISTRY_URL`; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
