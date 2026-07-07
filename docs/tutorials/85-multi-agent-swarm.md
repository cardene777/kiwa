# Multi-agent orchestration + Agent swarm — CrewAI + LangGraph supervisor + role-based swarm + Byzantine consensus in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/ai-llm` v0.5 that models the 5 pieces of a real multi-agent + swarm coordination pipeline that every non-trivial LLM-backed agent product eventually needs — a `crew assembly` step that pins a role snapshot onto the session so a supervisor sees the exact roster it can delegate to, a `supervisor delegation` step that runs deterministic round-robin across the worker pool so a `round=1` task lands on `worker A` and a `round=2` task lands on `worker B` without a flake, a `graph transition` step (LangGraph-shaped) that walks the `entry → terminal` node chain via edge follow so the agent workflow can be replayed for debugging, a role assignment + task allocation step (swarm-shaped) that assigns roles by index modulo + allocates tasks by priority descending so a high-priority task always lands on the first agent regardless of the input array order, and a Byzantine consensus + fault tolerance step that measures the `honest ratio` against a configurable `faultThreshold` (PBFT-lite invariant, default `> 2/3`) so a swarm with 4 faulty out of 10 agents lands on `tolerated: false` and a swarm with 2 faulty out of 10 lands on `tolerated: true`. `startMaoSession()` + `assembleCrew()` + `delegateBySupervisor()` + `transitionGraph()` + `completeRound()` + `startSwarmSession()` + `assignRoles()` + `allocateTasks()` + `reachConsensus()` + `tolerateByzantine()` give you every one of those pieces without booting a real CrewAI or LangGraph runtime. This is the pattern kiwa's `examples/dogfood-llm-multi-agent-swarm-app` exercises against the real LangGraph + CrewAI SDKs under `KIWA_MODE=real` + `ANTHROPIC_API_KEY` + `KIWA_LLM_BUDGET_USD`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the supervisor delegated the same task to `worker A` twice because the round counter was reset on session save" gap a reviewer sees in the multi-agent-delegation post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-multi-agent-swarm && cd kiwa-multi-agent-swarm
pnpm init
pnpm add -D @kiwa-test/ai-llm@^0.5 vitest typescript @types/node
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

The v0.5 surface exports the multi-agent-orchestration axis (`startMaoSession` / `assembleCrew` / `delegateBySupervisor` / `transitionGraph` / `completeRound`) and the agent-swarm axis (`startSwarmSession` / `assignRoles` / `allocateTasks` / `reachConsensus` / `tolerateByzantine`) directly from the package root. This tutorial focuses on the multi-agent + swarm end-to-end chain; tutorial 86 covers the code interpreter + fine-tuning pipeline axis, tutorial 87 covers the LLM ops + prompt engineering + RAG III + cost optimization axis.

### 2. `assembleCrew` — the role snapshot on the supervisor session

`tests/mao/crew.test.ts` — an `MaoSession` pins a `target` (`anthropic` / `openai` / `vercel-ai` / `langchain`) + `sessionId` + a `state` that starts at `idle` and walks through `crew-assembled` → `supervisor-delegated` / `graph-transitioned` / `round-completed`. `assembleCrew()` refuses duplicate agent IDs so a mis-configured supervisor cannot delegate a task to two agents with the same ID and land on undefined behavior.

```ts
import { describe, expect, it } from 'vitest';
import { assembleCrew, startMaoSession } from '@kiwa-test/ai-llm';

describe('mao — crew assembly', () => {
  it('records the crew and moves state to crew-assembled', () => {
    const s = startMaoSession({ target: 'anthropic', sessionId: 's-1' });
    const { agentCount } = assembleCrew(s, {
      agents: [
        { id: 'a1', role: 'planner', capabilities: ['plan'] },
        { id: 'a2', role: 'worker', capabilities: ['exec'] },
      ],
    });
    expect(agentCount).toBe(2);
    expect(s.state).toBe('crew-assembled');
  });

  it('rejects duplicate agent ids', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-2' });
    expect(() =>
      assembleCrew(s, {
        agents: [
          { id: 'a1', role: 'r', capabilities: [] },
          { id: 'a1', role: 'r', capabilities: [] },
        ],
      }),
    ).toThrow(/duplicate agent id/);
  });
});
```

`session.crew` is now the SSOT for who the supervisor can delegate to — a downstream `delegateBySupervisor` call that names a `workerId` not in the crew throws immediately instead of silently no-op'ing.

### 3. `delegateBySupervisor` — deterministic round-robin delegation

`tests/mao/delegate.test.ts` — the supervisor rotates through the worker pool by `(round - 1) % workerIds.length` so `round=1` picks `workerIds[0]`, `round=2` picks `workerIds[1]`, and the assignment is reproducible across test runs. This is the invariant that lets a stalled multi-agent workflow be replayed without flake.

```ts
import { describe, expect, it } from 'vitest';
import {
  assembleCrew,
  delegateBySupervisor,
  startMaoSession,
} from '@kiwa-test/ai-llm';

describe('mao — supervisor delegation', () => {
  it('rotates workers round-robin', () => {
    const s = startMaoSession({ target: 'vercel-ai', sessionId: 's-3' });
    assembleCrew(s, {
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: [] },
        { id: 'w1', role: 'worker', capabilities: [] },
        { id: 'w2', role: 'worker', capabilities: [] },
      ],
    });
    const r1 = delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 'task-1',
      workerIds: ['w1', 'w2'],
    });
    const r2 = delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 'task-2',
      workerIds: ['w1', 'w2'],
    });
    expect(r1.delegation.worker).toBe('w1');
    expect(r2.delegation.worker).toBe('w2');
  });

  it('throws when supervisor is not in crew', () => {
    const s = startMaoSession({ target: 'langchain', sessionId: 's-4' });
    assembleCrew(s, { agents: [{ id: 'w1', role: 'w', capabilities: [] }] });
    expect(() =>
      delegateBySupervisor(s, {
        supervisorId: 'ghost',
        task: 't',
        workerIds: ['w1'],
      }),
    ).toThrow(/supervisor ghost not in crew/);
  });
});
```

The delegation record (`round` + `supervisor` + `worker` + `task`) is now on `session.delegations` — a follow-up `completeRound()` gates on that array length to decide if the round is `sufficient`.

### 4. `transitionGraph` — LangGraph-shaped entry-to-terminal walk

`tests/mao/graph.test.ts` — `transitionGraph()` walks the node graph from the `entryNodeId` following the first unvisited outgoing edge for each node so the traversal is deterministic (BFS with edge-order priority), and stores the terminal node on `session.currentNode` for a follow-up `completeRound` step.

```ts
import { describe, expect, it } from 'vitest';
import {
  assembleCrew,
  startMaoSession,
  transitionGraph,
} from '@kiwa-test/ai-llm';

describe('mao — graph transition', () => {
  it('walks entry → terminal via edge follow', () => {
    const s = startMaoSession({ target: 'anthropic', sessionId: 's-5' });
    assembleCrew(s, {
      agents: [
        { id: 'a1', role: 'r', capabilities: [] },
        { id: 'a2', role: 'r', capabilities: [] },
      ],
    });
    const { visited } = transitionGraph(s, {
      nodes: [
        { id: 'n1', agentId: 'a1' },
        { id: 'n2', agentId: 'a2' },
        { id: 'n3', agentId: 'a1' },
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
      ],
      entryNodeId: 'n1',
    });
    expect(visited).toEqual(['n1', 'n2', 'n3']);
    expect(s.currentNode).toBe('n3');
    expect(s.state).toBe('graph-transitioned');
  });

  it('rejects an entry not in nodes', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-6' });
    assembleCrew(s, { agents: [{ id: 'a1', role: 'r', capabilities: [] }] });
    expect(() =>
      transitionGraph(s, {
        nodes: [{ id: 'n1', agentId: 'a1' }],
        edges: [],
        entryNodeId: 'ghost',
      }),
    ).toThrow(/entry ghost not in nodes/);
  });
});
```

The `visited` array is the replayable trace — a stalled workflow's exact node chain is one `console.log(session.currentNode)` away from a debug session.

### 5. `assignRoles` + `allocateTasks` — swarm role snapshot + priority queue

`tests/swarm/roles.test.ts` — a `SwarmSession` pins roles by `agents[i] → roles[i % roles.length]` so a 3-agent + 2-role pool ends up with roles cycled `[r0, r1, r0]`, and `allocateTasks()` sorts input tasks by `priority` descending before round-robin assignment so a `priority: 10` task always lands on the first agent regardless of the input array order.

```ts
import { describe, expect, it } from 'vitest';
import {
  allocateTasks,
  assignRoles,
  startSwarmSession,
} from '@kiwa-test/ai-llm';

describe('swarm — role + task assignment', () => {
  it('cycles roles by index modulo', () => {
    const s = startSwarmSession({ target: 'anthropic', sessionId: 's-7' });
    const { assignments } = assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.8 },
        { id: 'a3', reliability: 0.95 },
      ],
      roles: ['coder', 'reviewer'],
    });
    expect(assignments.map((a) => a.role)).toEqual([
      'coder',
      'reviewer',
      'coder',
    ]);
  });

  it('allocates highest-priority task to first agent', () => {
    const s = startSwarmSession({ target: 'openai', sessionId: 's-8' });
    assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 1 },
        { id: 'a2', reliability: 1 },
      ],
      roles: ['r'],
    });
    const { allocations } = allocateTasks(s, {
      tasks: [
        { id: 't1', priority: 1 },
        { id: 't2', priority: 10 },
      ],
    });
    expect(allocations[0]?.id).toBe('t2');
    expect(allocations[0]?.assignee).toBe('a1');
  });
});
```

The `assignments` snapshot is the swarm SSOT — a follow-up `reachConsensus` or `tolerateByzantine` step gates on `session.agents` and the assignment is idempotent under a stable input.

### 6. `reachConsensus` + `tolerateByzantine` — PBFT-lite majority + fault threshold

`tests/swarm/consensus.test.ts` — `reachConsensus()` returns the `winner` proposal only when its vote count is a strict majority (`agreementRatio > 0.5`); a tie returns `winner: null` so a caller cannot silently accept a split vote. `tolerateByzantine()` computes the `honestRatio` against a session-level `faultThreshold` (default `0.34`, PBFT-lite invariant) so a swarm with `honestRatio >= 1 - threshold` lands on `tolerated: true`.

```ts
import { describe, expect, it } from 'vitest';
import {
  assignRoles,
  reachConsensus,
  startSwarmSession,
  tolerateByzantine,
} from '@kiwa-test/ai-llm';

describe('swarm — Byzantine consensus', () => {
  it('picks the majority proposal', () => {
    const s = startSwarmSession({ target: 'vercel-ai', sessionId: 's-9' });
    assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 1 },
        { id: 'a2', reliability: 1 },
        { id: 'a3', reliability: 1 },
      ],
      roles: ['voter'],
    });
    const { winner, agreementRatio } = reachConsensus(s, {
      votes: [
        { agentId: 'a1', proposal: 'X' },
        { agentId: 'a2', proposal: 'X' },
        { agentId: 'a3', proposal: 'Y' },
      ],
    });
    expect(winner).toBe('X');
    expect(agreementRatio).toBeGreaterThan(0.5);
  });

  it('tolerates minority faulty agents', () => {
    const s = startSwarmSession({
      target: 'langchain',
      sessionId: 's-10',
      faultThreshold: 0.34,
    });
    assignRoles(s, {
      agents: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`,
        reliability: 1,
      })),
      roles: ['r'],
    });
    const { tolerated, honestRatio } = tolerateByzantine(s, {
      faultyAgentIds: ['a0', 'a1'],
    });
    expect(honestRatio).toBeCloseTo(0.8);
    expect(tolerated).toBe(true);
  });

  it('rejects majority faulty agents', () => {
    const s = startSwarmSession({
      target: 'anthropic',
      sessionId: 's-11',
      faultThreshold: 0.34,
    });
    assignRoles(s, {
      agents: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`,
        reliability: 1,
      })),
      roles: ['r'],
    });
    const { tolerated } = tolerateByzantine(s, {
      faultyAgentIds: ['a0', 'a1', 'a2', 'a3', 'a4'],
    });
    expect(tolerated).toBe(false);
  });
});
```

The `tolerated` boolean is the gate a downstream orchestrator uses to decide if it can trust the swarm's `winner` — a `tolerated: false` outcome means the swarm should abort the round and re-run with a fresh agent pool.

### 7. `completeRound` — round accounting + delegation floor

`tests/mao/round.test.ts` — `completeRound()` bumps `session.rounds` and compares `session.delegations.length` against a caller-supplied `minDelegations` floor so a workflow that only fired 1 delegation in a `minDelegations: 3` gate lands on `sufficient: false` and a follow-up orchestrator loop can re-fire the round.

```ts
import { describe, expect, it } from 'vitest';
import {
  assembleCrew,
  completeRound,
  delegateBySupervisor,
  startMaoSession,
} from '@kiwa-test/ai-llm';

describe('mao — round completion', () => {
  it('flags sufficient when delegations meet the floor', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-12' });
    assembleCrew(s, {
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: [] },
        { id: 'w1', role: 'worker', capabilities: [] },
      ],
    });
    delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 't1',
      workerIds: ['w1'],
    });
    delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 't2',
      workerIds: ['w1'],
    });
    const { sufficient, roundsCompleted } = completeRound(s, {
      minDelegations: 2,
    });
    expect(sufficient).toBe(true);
    expect(roundsCompleted).toBe(1);
  });
});
```

The `sufficient` boolean is the outer-loop gate — a caller can chain `while (!completeRound(s, { minDelegations: N }).sufficient) delegateBySupervisor(...)` to keep the workflow running until the floor is met.

## Wrap-up

You now have a multi-agent + swarm coordination pipeline that (a) records the crew snapshot, (b) delegates by deterministic round-robin, (c) walks the LangGraph-shaped node chain, (d) assigns roles + tasks by priority, (e) reaches PBFT-lite consensus + tolerates minority Byzantine agents, and (f) closes the round with an explicit delegation floor — all without a real CrewAI runtime, all in a millisecond-scale inner loop, and all on the same neutral event names (`mao.crew_assembled` / `swarm.consensus_reached` / etc.) that the 4 provider dialects (`anthropic` / `openai` / `vercel-ai` / `langchain`) emit under real routing. The v1.40 dogfood app (`examples/dogfood-llm-multi-agent-swarm-app`) runs the same assertions against real LangGraph + CrewAI SDKs under `KIWA_MODE=real` + `ANTHROPIC_API_KEY`; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
