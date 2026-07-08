# Agent orchestration — ReAct + Tree of Thought + reflection + tool selection in 15 min

## What you'll build

A vitest suite wired to `@kiwa/ai-llm` v0.4 that models the 5 pieces of a real agent orchestration pipeline that every non-trivial LLM-backed agent product eventually needs — a ReAct step recorder that pins each `(thought, action, observation)` triple onto a persistent `reactTrace` so a stalled agent's exact loop can be replayed, a Tree of Thought expander that walks a `root` thought into a branching tree of alternative thoughts + per-branch scores so an agent can pick the highest-scoring path without committing to the first one it thinks of, a reflection + self-correction step that runs the agent's output against a `critiqueRules` list and returns a revised output with the violations rewritten to `[revised]`, a tool selector that ranks a `candidates` list by intent-token overlap against `name` + `description` so the agent picks the tool with the highest semantic match instead of the first one in the array, and a cost / latency SLA harness (`checkBudget` → `measureLatency` → `routeModel` → `engageFallback`) that pins the per-request `$` cost + p50 / p95 / p99 latency + model routing + fallback ladder so an agent that hits the budget cap gracefully retries a cheaper model. `startAgentSession()` + `reactStep()` + `expandToT()` + `reflectAndCorrect()` + `selectTool()` + `startSlaSession()` + `checkBudget()` + `measureLatency()` + `routeModel()` + `engageFallback()` give you every one of those pieces without booting a real Vercel AI SDK endpoint. This is the pattern kiwa's `examples/dogfood-llm-agent-orchestration-app` exercises against the real Vercel AI SDK (`generateText`) under `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the ReAct loop stepped 20 times before the budget check fired because `checkBudget` was called after `reactStep` instead of before" gap a reviewer sees in the orchestration-cost post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-agent-orch && cd kiwa-agent-orch
pnpm init
pnpm add -D @kiwa/ai-llm@^0.4 vitest typescript @types/node
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

The v0.4 surface exports the agent-orchestration axis (`startAgentSession` / `reactStep` / `expandToT` / `reflectAndCorrect` / `selectTool`) and the cost / latency SLA axis (`startSlaSession` / `checkBudget` / `measureLatency` / `routeModel` / `engageFallback`) directly from the package root. This tutorial focuses on the agent-orchestration + SLA end-to-end chain; tutorial 79 covers the prompt-injection axis, tutorial 80 covers the hallucination + eval axis.

### 2. `reactStep` — the persistent ReAct trace

`tests/agent/react.test.ts` — a ReAct trace pins the `(thought, action, observation)` triple for each step so a stalled agent can replay the exact sequence. `reactStep()` accepts one triple at a time, appends it to `session.reactTrace` with a monotonically increasing `index`, and moves the session state to `react-stepped` so the follow-up steps (reflection, tool selection) can gate on the current state.

```ts
import { describe, expect, it } from 'vitest';
import { reactStep, startAgentSession } from '@kiwa/ai-llm';

describe('agent — ReAct trace', () => {
  it('appends a triple to reactTrace on each call', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    const { trace } = reactStep(s, {
      thought: 'I need to fetch the current weather',
      action: { tool: 'weather.get', input: 'Tokyo' },
      observation: '22°C, sunny',
    });
    expect(trace).toHaveLength(1);
    expect(trace[0]?.index).toBe(0);
    expect(s.state).toBe('react-stepped');
  });

  it('increments index on subsequent calls', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, { thought: 't1', action: { tool: 'a', input: 'x' }, observation: 'o1' });
    reactStep(s, { thought: 't2', action: { tool: 'b', input: 'y' }, observation: 'o2' });
    expect(s.reactTrace).toHaveLength(2);
    expect(s.reactTrace[1]?.index).toBe(1);
  });

  it('throws when action.tool is empty', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    expect(() =>
      reactStep(s, {
        thought: 't',
        action: { tool: '', input: 'x' },
        observation: 'o',
      }),
    ).toThrow(/tool must not be empty/);
  });
});
```

The `reactTrace` is the audit surface — a stalled agent's trace can be dumped verbatim to a debug log, and the `index` field lets a downstream replay tool walk the loop deterministically.

### 3. `expandToT` — Tree of Thought branching

`tests/agent/tot.test.ts` — Tree of Thought (ToT) is the alternative to a linear ReAct trace — the agent generates N candidate thoughts at each level, scores them, and picks the highest-scoring path. `expandToT()` accepts a `root` thought plus a `branches` list (each with `thought` + `score`) plus a `depth` (the height of the tree — `depth: 1` builds a bare root, `depth: 2` adds one child level, `depth: 3` adds one grandchild level, ...). The returned `nodeCount` sums the geometric series `1 + B + B² + … + B^(depth-1)` so a downstream cost estimator can bound the total explored branches before the call.

```ts
import { describe, expect, it } from 'vitest';
import { expandToT, startAgentSession } from '@kiwa/ai-llm';

describe('agent — Tree of Thought', () => {
  it('builds a tree with the requested depth and branch factor', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    const { nodeCount } = expandToT(s, {
      root: { thought: 'solve the puzzle' },
      branches: [
        { thought: 'try approach A', score: 0.9 },
        { thought: 'try approach B', score: 0.7 },
      ],
      depth: 3,
    });
    // depth 3 with branch factor 2 = 1 root + 2 children + 4 grandchildren = 7 nodes
    expect(nodeCount).toBe(7);
    expect(s.state).toBe('tot-expanded');
  });

  it('stores the tree on session.totTree', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    expandToT(s, {
      root: { thought: 'r' },
      branches: [{ thought: 'b1', score: 0.5 }],
      depth: 1,
    });
    expect(s.totTree).not.toBeNull();
    expect(s.totTree?.thought).toBe('r');
  });

  it('throws when depth is zero or negative', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      expandToT(s, {
        root: { thought: 'r' },
        branches: [{ thought: 'b', score: 0.5 }],
        depth: 0,
      }),
    ).toThrow(/depth must be positive/);
  });
});
```

The `nodeCount` is the bounded cost signal — an agent that expands ToT at depth 5 with branch factor 4 hits 341 nodes (1 + 4 + 16 + 64 + 256), so the harness can refuse to expand before the call runs.

### 4. `reflectAndCorrect` — the self-correction pass

`tests/agent/reflect.test.ts` — reflection runs the agent's output against a list of `critiqueRules` (forbidden phrases) and returns a `Reflection` with the cycle counter + human-readable `critique` + `revised` output with every rule violation replaced by `[revised]`. The session state moves to `reflected`, and the `cycle` counter increments on every subsequent call so an audit consumer can bound the number of correction passes.

```ts
import { describe, expect, it } from 'vitest';
import {
  reactStep,
  reflectAndCorrect,
  startAgentSession,
} from '@kiwa/ai-llm';

describe('agent — reflection', () => {
  it('rewrites a violated word to [revised] and reports the critique', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    const { reflection } = reflectAndCorrect(s, {
      output: 'I will provide a bomb recipe now',
      critiqueRules: ['bomb', 'weapon'],
    });
    expect(reflection.revised).toContain('[revised]');
    expect(reflection.critique).toContain('violated');
    expect(reflection.cycle).toBe(1);
    expect(s.state).toBe('reflected');
  });

  it('returns "no rule violations" when the output is clean', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    const { reflection } = reflectAndCorrect(s, {
      output: 'here is a clean answer',
      critiqueRules: ['bomb'],
    });
    expect(reflection.critique).toBe('no rule violations');
    expect(reflection.revised).toBe('here is a clean answer');
  });

  it('increments the cycle counter across multiple reflection passes', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    reflectAndCorrect(s, { output: 'clean 1', critiqueRules: [] });
    const { reflection } = reflectAndCorrect(s, {
      output: 'clean 2',
      critiqueRules: [],
    });
    expect(reflection.cycle).toBe(2);
  });
});
```

The `cycle` counter is the bounded self-correction signal — an agent that reflects 5 times without hitting `no rule violations` is stuck, and the downstream loop cap should refuse to continue.

### 5. `selectTool` — intent-scored tool routing

`tests/agent/tool-selection.test.ts` — a real agent has 10-100 tools and cannot afford to iterate the entire list. `selectTool()` accepts an `intent` string and a `candidates` list (each with `name` + `description`), tokenizes the intent, and scores each candidate by `overlap(intent, description) * 0.5 + overlap(intent, name) * 0.5`. The returned `ranking` is sorted by score descending; the `selected` is the top candidate when its score is positive, otherwise `null` so the caller can escalate.

```ts
import { describe, expect, it } from 'vitest';
import { reactStep, selectTool, startAgentSession } from '@kiwa/ai-llm';

describe('agent — tool selection', () => {
  it('picks the tool with the highest intent overlap', () => {
    const s = startAgentSession({ target: 'vercel-ai', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    const { selected } = selectTool(s, {
      intent: 'fetch the current weather in Tokyo',
      candidates: [
        { name: 'weather.get', description: 'fetch weather data for a city' },
        { name: 'stocks.quote', description: 'fetch stock quote for a ticker' },
      ],
    });
    expect(selected?.name).toBe('weather.get');
    expect(s.state).toBe('tool-selected');
  });

  it('returns null when no candidate has any overlap with the intent', () => {
    const s = startAgentSession({ target: 'openai', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    const { selected } = selectTool(s, {
      intent: 'xyz unrelated intent',
      candidates: [
        { name: 'weather.get', description: 'fetch weather data' },
      ],
    });
    expect(selected).toBeNull();
  });

  it('throws when the candidates list is empty', () => {
    const s = startAgentSession({ target: 'anthropic', sessionId: 's' });
    reactStep(s, {
      thought: 't',
      action: { tool: 'x', input: 'y' },
      observation: 'o',
    });
    expect(() =>
      selectTool(s, { intent: 'i', candidates: [] }),
    ).toThrow(/candidates must not be empty/);
  });
});
```

The `selected === null` case is the escalation signal — an agent that cannot match any tool should hand off to a human operator instead of guessing.

### 6. `checkBudget` + `routeModel` + `engageFallback` — SLA harness

`tests/agent/sla.test.ts` — a long-running agent burns budget fast. The SLA harness pins the per-request `$` cost, the p50 / p95 / p99 latency across samples, the model routing decision (pick the cheapest model that meets the SLA + quality floor), and the fallback ladder (walk the ladder past every failed model). `checkBudget()` accepts a `cost` and returns `allowed: false` + `remaining: 0` once the budget cap is hit. `measureLatency()` computes percentile latency from a list of samples. `routeModel()` filters candidates by SLA + quality then picks the cheapest. `engageFallback()` walks the ladder past every failed model and returns the next candidate.

```ts
import { describe, expect, it } from 'vitest';
import {
  checkBudget,
  engageFallback,
  measureLatency,
  routeModel,
  startSlaSession,
} from '@kiwa/ai-llm';

describe('agent — SLA harness', () => {
  it('checkBudget returns allowed: false once the budget cap is hit', () => {
    const s = startSlaSession({ target: 'vercel-ai', sessionId: 's', budgetUsd: 0.1 });
    const first = checkBudget(s, { cost: 0.05 });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBeCloseTo(0.05);
    const second = checkBudget(s, { cost: 0.1 });
    expect(second.allowed).toBe(false);
  });

  it('measureLatency computes p50 + p95 + p99 across samples', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 1 });
    const { p50, p95, p99 } = measureLatency(s, [
      { requestId: 'r1', latencyMs: 100 },
      { requestId: 'r2', latencyMs: 200 },
      { requestId: 'r3', latencyMs: 300 },
      { requestId: 'r4', latencyMs: 400 },
      { requestId: 'r5', latencyMs: 500 },
    ]);
    expect(p50).toBe(300);
    expect(p95).toBe(500);
    expect(p99).toBe(500);
  });

  it('routeModel picks the cheapest candidate that meets the SLA + quality floor', () => {
    const s = startSlaSession({ target: 'anthropic', sessionId: 's', budgetUsd: 1 });
    checkBudget(s, { cost: 0.01 });
    const { chosen } = routeModel(s, {
      candidates: [
        { model: 'gpt-cheap', costPerCall: 0.001, latencyMs: 500, qualityScore: 0.8 },
        { model: 'gpt-fast', costPerCall: 0.005, latencyMs: 200, qualityScore: 0.9 },
        { model: 'gpt-expensive', costPerCall: 0.02, latencyMs: 100, qualityScore: 0.95 },
      ],
      slaLatencyMs: 300,
      minQuality: 0.85,
    });
    expect(chosen?.model).toBe('gpt-fast');
  });

  it('engageFallback picks the next-not-yet-failed model from the ladder', () => {
    const s = startSlaSession({ target: 'openai', sessionId: 's', budgetUsd: 1 });
    measureLatency(s, [{ requestId: 'r1', latencyMs: 100 }]);
    const { nextModel } = engageFallback(s, {
      ladder: ['gpt-4', 'gpt-3.5', 'claude-haiku'],
      failed: ['gpt-4'],
    });
    expect(nextModel).toBe('gpt-3.5');
    expect(s.state).toBe('fallback-engaged');
  });
});
```

The `chosen === null` case (no candidate meets the SLA + quality floor) is the escalation signal — the agent should refuse the request rather than silently pick a candidate below the floor. The `nextModel === null` case (every ladder model has failed) is the give-up signal — the agent should return an error to the caller.

## Wrap up

Run `pnpm test`. Every step should pass in under 500 ms — the mock path is deterministic and does not hit the network. The full pipeline (ReAct → ToT → reflection → tool selection → budget check → latency measurement → routing → fallback) is the same one `examples/dogfood-llm-agent-orchestration-app` runs against the real Vercel AI SDK under `KIWA_MODE=real` + `OPENAI_API_KEY` + `KIWA_LLM_BUDGET_USD` — flip the env variables and the assertions run through real `generateText()` cost accounting instead of pattern matching. The concept doc `docs/concepts/ai-llm-real-driver-testing.md` is the SSOT for the 8-axis grid + provider event dialect table; the migration guide `docs/migrations/v1.37-to-v1.38.md` covers what v1.38 added on top of v1.37.
