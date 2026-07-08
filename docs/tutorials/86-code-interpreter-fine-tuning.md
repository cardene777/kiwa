# Code interpreter + Fine-tuning pipeline — sandboxed REPL + tool use + rollback + RLHF/DPO + drift detection in 15 min

## What you'll build

A vitest suite wired to `@kiwa/ai-llm` v0.5 that models the 5 pieces of a real code-interpreter + fine-tuning workflow that every non-trivial LLM-backed product eventually needs — a sandboxed code execution session that pins a per-run `sandboxId` + `timeoutMs` so a rogue snippet cannot hijack a shared runtime, a memory-snapshotting `executeCode` step that walks the assignment tape `{k: v}` so a follow-up `rollback` can pop N executions and restore the exact `memory` shape, an external `useTool` step that records a `{name, args, ok}` triple so a stalled agent's tool-call log is a `console.log(session.toolCalls)` away from a debug session, a fine-tuning dataset preparer that walks `(prompt, chosen, rejected)` triples and dedupes them by hash so a poisoned dataset with 3 duplicate rows shrinks to 2 unique rows before any RLHF step runs, an RLHF policy-update step that computes `policyDelta = learningRate * meanReward` so a batch of rewards `[0.5, 0.7]` and a learning rate `0.1` lands on a deterministic `policyDelta` of `0.06`, an eval loop that appends scores to an `evalHistory` tape and pins the `baselineScore` on first call so a follow-up drift step can compare `latest - baseline`, and a drift detector that flags `Math.abs(delta) >= threshold` so a `baseline: 0.7` + `latest: 0.5` + `threshold: 0.15` combination lands on `drifted: true` and a downstream orchestrator can trigger a rollback of the fine-tuning run. `startCiSession()` + `startSandbox()` + `executeCode()` + `useTool()` + `rollback()` + `startFtpSession()` + `prepareDataset()` + `stepRlhf()` + `runEvalLoop()` + `detectDrift()` give you every one of those pieces without booting a real Python sandbox or a real RLHF training loop. This is the pattern kiwa's `examples/dogfood-llm-code-interpreter-app` exercises against a real Docker-isolated Python REPL under `KIWA_MODE=real` + `KIWA_CI_SANDBOX_URL` + `KIWA_LLM_BUDGET_USD`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the rollback popped 3 executions but the memory snapshot was one step stale because the snapshot was taken after the assignment instead of before" gap a reviewer sees in the code-interpreter-rollback post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-code-interpreter-ft && cd kiwa-code-interpreter-ft
pnpm init
pnpm add -D @kiwa/ai-llm@^0.5 vitest typescript @types/node
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

The v0.5 surface exports the code-interpreter axis (`startCiSession` / `startSandbox` / `executeCode` / `useTool` / `rollback`) and the fine-tuning-pipeline axis (`startFtpSession` / `prepareDataset` / `stepRlhf` / `runEvalLoop` / `detectDrift`) directly from the package root. This tutorial focuses on the code-interpreter + fine-tuning pipeline chain; tutorial 85 covers the multi-agent + swarm axis, tutorial 87 covers the LLM ops + prompt engineering + RAG III + cost optimization axis.

### 2. `startSandbox` — the sandbox binding step

`tests/ci/sandbox.test.ts` — a `CiSession` pins a `target` (`anthropic` / `openai` / `vercel-ai` / `langchain`) + `sessionId` + a `state` that starts at `idle` and walks through `sandbox-started` → `code-executed` / `tool-used` / `rolled-back`. `startSandbox()` refuses a zero or negative `timeoutMs` so a mis-configured caller cannot leave a runaway sandbox open forever.

```ts
import { describe, expect, it } from 'vitest';
import { startCiSession, startSandbox } from '@kiwa/ai-llm';

describe('ci — sandbox binding', () => {
  it('starts a sandbox and moves state to sandbox-started', () => {
    const s = startCiSession({ target: 'anthropic', sessionId: 's-1' });
    const { sandboxId } = startSandbox(s, {
      sandboxId: 'sbx-1',
      timeoutMs: 5000,
    });
    expect(sandboxId).toBe('sbx-1');
    expect(s.state).toBe('sandbox-started');
    expect(s.sandboxId).toBe('sbx-1');
  });

  it('refuses non-positive timeoutMs', () => {
    const s = startCiSession({ target: 'openai', sessionId: 's-2' });
    expect(() =>
      startSandbox(s, { sandboxId: 'sbx-2', timeoutMs: 0 }),
    ).toThrow(/timeoutMs must be positive/);
  });
});
```

The `session.sandboxId` binding is the SSOT for the follow-up `executeCode` / `useTool` calls — every step routes through the same sandbox until `rollback()` or a fresh `startSandbox()` re-binds it.

### 3. `executeCode` — memory-snapshotting execution

`tests/ci/execute.test.ts` — `executeCode()` snapshots the current `session.memory` before applying the caller's `assigns` map so a follow-up `rollback()` step can pop N executions and restore the exact `memory` shape. The `stdout` field is a deterministic string prefix so a snapshot test can assert the exact code that ran.

```ts
import { describe, expect, it } from 'vitest';
import { executeCode, startCiSession, startSandbox } from '@kiwa/ai-llm';

describe('ci — code execution', () => {
  it('records execution and applies assigns to memory', () => {
    const s = startCiSession({ target: 'vercel-ai', sessionId: 's-3' });
    startSandbox(s, { sandboxId: 'sbx-3', timeoutMs: 5000 });
    const { execution } = executeCode(s, {
      code: 'x = 42',
      assigns: { x: '42' },
    });
    expect(execution.ok).toBe(true);
    expect(execution.index).toBe(0);
    expect(s.memory.x).toBe('42');
    expect(s.state).toBe('code-executed');
  });

  it('flags a raise as an execution error without applying assigns', () => {
    const s = startCiSession({ target: 'langchain', sessionId: 's-4' });
    startSandbox(s, { sandboxId: 'sbx-4', timeoutMs: 5000 });
    const { execution } = executeCode(s, {
      code: 'raise ValueError("bad")',
      assigns: { x: '42' },
    });
    expect(execution.ok).toBe(false);
    expect(execution.stdout).toBe('ExecutionError');
    expect(s.memory.x).toBeUndefined();
  });
});
```

`session.executions` is now the audit tape — every execution is appended with a monotonically increasing `index` so a downstream `rollback` step can pop the last N without walking the array manually.

### 4. `useTool` + `rollback` — tool-call log + step-wise memory restore

`tests/ci/tool-rollback.test.ts` — `useTool()` records the `{name, args, ok}` triple onto `session.toolCalls` (the special name `unknown` lands on `ok: false` for a fuzz test), and `rollback()` pops the last N executions + their memory snapshots so a `steps: 2` rollback against 3 executions leaves 1 execution and restores the memory to the pre-execution-2 state.

```ts
import { describe, expect, it } from 'vitest';
import {
  executeCode,
  rollback,
  startCiSession,
  startSandbox,
  useTool,
} from '@kiwa/ai-llm';

describe('ci — tool + rollback', () => {
  it('records a tool call', () => {
    const s = startCiSession({ target: 'openai', sessionId: 's-5' });
    startSandbox(s, { sandboxId: 'sbx-5', timeoutMs: 5000 });
    const { call } = useTool(s, {
      name: 'search',
      args: { q: 'kiwa' },
    });
    expect(call.name).toBe('search');
    expect(call.ok).toBe(true);
    expect(s.toolCalls).toHaveLength(1);
  });

  it('flags an unknown tool as ok=false', () => {
    const s = startCiSession({ target: 'anthropic', sessionId: 's-6' });
    startSandbox(s, { sandboxId: 'sbx-6', timeoutMs: 5000 });
    const { call } = useTool(s, { name: 'unknown', args: {} });
    expect(call.ok).toBe(false);
  });

  it('restores memory on rollback', () => {
    const s = startCiSession({ target: 'vercel-ai', sessionId: 's-7' });
    startSandbox(s, { sandboxId: 'sbx-7', timeoutMs: 5000 });
    executeCode(s, { code: 'x = 1', assigns: { x: '1' } });
    executeCode(s, { code: 'x = 2', assigns: { x: '2' } });
    executeCode(s, { code: 'x = 3', assigns: { x: '3' } });
    const { poppedCount, remaining } = rollback(s, { steps: 2 });
    expect(poppedCount).toBe(2);
    expect(remaining).toBe(1);
    expect(s.memory.x).toBe('1');
  });
});
```

The rollback semantics are the key invariant — a code-interpreter agent that steps into a bad path must be able to rewind memory without losing the sandbox binding, and the snapshot-before-assign order is what makes the rewind consistent.

### 5. `prepareDataset` — dedupe + snapshot the fine-tuning corpus

`tests/ftp/dataset.test.ts` — an `FtpSession` pins a `target` + `sessionId` + a `state` that starts at `idle` and walks through `dataset-prepared` → `rlhf-stepped` / `eval-loop-ran` / `drift-detected`. `prepareDataset()` walks the input `(prompt, chosen, rejected)` triples and dedupes by the concatenated key so a poisoned corpus with 3 duplicate rows shrinks to 2 unique rows before any RLHF step runs.

```ts
import { describe, expect, it } from 'vitest';
import { prepareDataset, startFtpSession } from '@kiwa/ai-llm';

describe('ftp — dataset preparation', () => {
  it('dedupes duplicate samples when dedupe is on', () => {
    const s = startFtpSession({ target: 'anthropic', sessionId: 's-8' });
    const { sampleCount, deduped } = prepareDataset(s, {
      samples: [
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p2', chosen: 'a', rejected: 'b' },
      ],
      dedupe: true,
    });
    expect(sampleCount).toBe(2);
    expect(deduped).toBe(1);
    expect(s.state).toBe('dataset-prepared');
  });

  it('keeps duplicates when dedupe is off', () => {
    const s = startFtpSession({ target: 'openai', sessionId: 's-9' });
    const { sampleCount, deduped } = prepareDataset(s, {
      samples: [
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p', chosen: 'a', rejected: 'b' },
      ],
      dedupe: false,
    });
    expect(sampleCount).toBe(2);
    expect(deduped).toBe(0);
  });
});
```

`session.dataset` is now the corpus SSOT — a follow-up `stepRlhf` call can trust that the samples are unique (or explicitly not, when `dedupe: false`) and the dedupe count is emitted on the neutral event for a downstream audit consumer.

### 6. `stepRlhf` — deterministic policy update from reward batch

`tests/ftp/rlhf.test.ts` — `stepRlhf()` computes `avgReward = mean(rewards)` + `policyDelta = learningRate * avgReward` so a caller with a `[0.5, 0.7]` reward batch and a `0.1` learning rate ends up with a deterministic `policyDelta` of `0.06`. The step index is monotonically increasing so a downstream drift-detection step can walk the RLHF history.

```ts
import { describe, expect, it } from 'vitest';
import { prepareDataset, startFtpSession, stepRlhf } from '@kiwa/ai-llm';

describe('ftp — RLHF stepping', () => {
  it('records a step with deterministic policy delta', () => {
    const s = startFtpSession({ target: 'vercel-ai', sessionId: 's-10' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    const { totalStep } = stepRlhf(s, {
      rewards: [0.5, 0.7],
      learningRate: 0.1,
    });
    expect(totalStep.step).toBe(1);
    expect(totalStep.reward).toBeCloseTo(0.6);
    expect(totalStep.policyDelta).toBeCloseTo(0.06);
    expect(s.state).toBe('rlhf-stepped');
  });

  it('refuses a non-positive learning rate', () => {
    const s = startFtpSession({ target: 'langchain', sessionId: 's-11' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    expect(() =>
      stepRlhf(s, { rewards: [0.5], learningRate: 0 }),
    ).toThrow(/learningRate must be positive/);
  });
});
```

The `rlhfSteps` history is the deterministic training tape — the same input reward batch on a fresh session always lands on the same `policyDelta`, which is what makes the mock fidelity harness useful.

### 7. `runEvalLoop` + `detectDrift` — score baseline + delta gate

`tests/ftp/eval-drift.test.ts` — `runEvalLoop()` appends `(epoch, score)` pairs to `session.evalHistory` and pins the `baselineScore` on the first call so a subsequent `detectDrift()` step compares `latest - baseline` against a configurable threshold. `Math.abs(delta) >= threshold` lands on `drifted: true`.

```ts
import { describe, expect, it } from 'vitest';
import {
  detectDrift,
  prepareDataset,
  runEvalLoop,
  startFtpSession,
} from '@kiwa/ai-llm';

describe('ftp — eval + drift', () => {
  it('flags drift when latest deviates from baseline beyond threshold', () => {
    const s = startFtpSession({ target: 'openai', sessionId: 's-12' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    runEvalLoop(s, { epochScores: [0.7, 0.65, 0.5] });
    const { drifted, delta } = detectDrift(s, { threshold: 0.15 });
    expect(drifted).toBe(true);
    expect(delta).toBeCloseTo(-0.2);
    expect(s.state).toBe('drift-detected');
  });

  it('stays undrifted when delta is under threshold', () => {
    const s = startFtpSession({ target: 'anthropic', sessionId: 's-13' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    runEvalLoop(s, { epochScores: [0.7, 0.72] });
    const { drifted } = detectDrift(s, { threshold: 0.15 });
    expect(drifted).toBe(false);
  });
});
```

The `drifted` boolean is the outer-loop gate — a training orchestrator can chain `if (detectDrift(s, { threshold: 0.15 }).drifted) rollbackModel()` to guard against a fine-tuning run that regresses beyond an acceptable envelope.

## Wrap-up

You now have a code-interpreter + fine-tuning pipeline that (a) binds a sandboxed execution session, (b) snapshots memory + records executions + tool calls, (c) rolls back N steps while restoring the exact memory shape, (d) prepares a fine-tuning corpus with dedupe control, (e) steps an RLHF policy with deterministic `policyDelta`, and (f) detects benchmark drift against a threshold — all without a real Python sandbox or a real RLHF training loop, all in a millisecond-scale inner loop, and all on the same neutral event names (`ci.sandbox_started` / `ftp.drift_detected` / etc.) that the 4 provider dialects emit under real routing. The v1.40 dogfood app (`examples/dogfood-llm-code-interpreter-app`) runs the same assertions against a real Docker-isolated Python REPL under `KIWA_MODE=real` + `KIWA_CI_SANDBOX_URL`; the fidelity harness (`collectFidelityCoverage()`) reports the mock-vs-real coverage on a per-axis basis.
