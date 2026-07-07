/**
 * Full pipeline end-to-end fidelity spec (pipeline axis: sandbox start
 * → multi-execution → tool-use → rollback → tolerance gate).
 *
 * Sub-Issue CAR-890 (v1.40-3) AC — the mock adapter runs a full
 * interpreter session through the runPipeline op and reports the
 * correct blocked / completed stage across all 4 branches.
 *
 *  1. Blocked when the executions list is empty (blocked-no-executions).
 *  2. Blocked when at least one tool call refuses with "unknown"
 *     (blocked-unknown-tool).
 *  3. Blocked when rollback steps exceed the execution history
 *     (blocked-rollback-exceeds-history).
 *  4. Completes when executions succeed + tools resolve + rollback fits.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePipelineRequest,
  validatePipelineRequest,
} from '../src/app/pipeline/route.js';
import type { LlmCodeInterpreterAdapter } from '../src/adapters/interface.js';

let mock: LlmCodeInterpreterAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — runPipeline completion', () => {
  it('completes when all stages resolve cleanly', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [
        { code: 'x = 1', assigns: { x: '1' } },
        { code: 'y = 2', assigns: { y: '2' } },
      ],
      tools: [{ name: 'httpFetch', args: { url: 'https://a' } }],
      rollbackSteps: 1,
    });
    expect(r.stage).toBe('completed');
    expect(r.blockedReason).toBeNull();
    expect(r.sandbox.sandboxId).toBe('sb-1');
    expect(r.executions.total).toBe(2);
    expect(r.executions.okCount).toBe(2);
    expect(r.executions.failCount).toBe(0);
    expect(r.tools.total).toBe(1);
    expect(r.tools.okCount).toBe(1);
    expect(r.rollback.poppedCount).toBe(1);
    expect(r.rollback.remainingExecutions).toBe(1);
  });

  it('reports memory keys reflecting all assigned bindings', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [
        { code: 'x = 1', assigns: { x: '1' } },
        { code: 'y = 2', assigns: { y: '2' } },
      ],
      tools: [],
      rollbackSteps: 1,
    });
    // Rollback pops 1 → memory should show 1 remaining key.
    expect(r.executions.memoryKeys).toBe(1);
  });

  it('counts failed executions toward failCount without blocking', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [
        { code: 'x = 1' },
        { code: 'raise ValueError("boom")' },
      ],
      tools: [{ name: 'httpFetch', args: {} }],
      rollbackSteps: 1,
    });
    // Note: a failed exec does not block the pipeline — only unknown
    // tools + over-rollback do.
    expect(r.stage).toBe('completed');
    expect(r.executions.okCount).toBe(1);
    expect(r.executions.failCount).toBe(1);
  });
});

describe('mock adapter — runPipeline blocking branches', () => {
  it('blocks when executions is empty', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [],
      tools: [{ name: 'httpFetch', args: {} }],
      rollbackSteps: 1,
    });
    expect(r.stage).toBe('blocked-no-executions');
    expect(r.blockedReason).toMatch(/must not be empty/);
    expect(r.executions.total).toBe(0);
    expect(r.tools.total).toBe(0);
  });

  it('blocks when a tool call refuses with "unknown"', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [
        { name: 'httpFetch', args: {} },
        { name: 'unknown', args: {} },
      ],
      rollbackSteps: 1,
    });
    expect(r.stage).toBe('blocked-unknown-tool');
    expect(r.blockedReason).toMatch(/unknown/);
    expect(r.tools.failCount).toBe(1);
  });

  it('blocks when rollbackSteps exceeds execution history', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [{ name: 'httpFetch', args: {} }],
      rollbackSteps: 5,
    });
    expect(r.stage).toBe('blocked-rollback-exceeds-history');
    expect(r.blockedReason).toMatch(/rollback 5 > history 1/);
  });

  it('unknown-tool blocking takes precedence over over-rollback', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [{ name: 'unknown', args: {} }],
      rollbackSteps: 5,
    });
    expect(r.stage).toBe('blocked-unknown-tool');
  });
});

describe('mock adapter — runPipeline trace + latency', () => {
  it('records a single runPipeline neutral event per call', async () => {
    await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    const evts = mock.traces().filter((t) => t.op === 'runPipeline');
    expect(evts).toHaveLength(1);
    expect(evts[0]?.ok).toBe(true);
  });

  it('reports a positive latencyMs', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.latencyMs).toBeGreaterThanOrEqual(1);
  });
});

describe('route validation — pipeline', () => {
  it('accepts a valid pipeline body', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [{ name: 'httpFetch', args: {} }],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validatePipelineRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validatePipelineRequest({
      sessionId: '',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects an empty sandboxId', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: '',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sandboxId_required');
  });

  it('rejects zero timeout', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 0,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('timeoutMs_required');
  });

  it('rejects a non-array executions field', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: 'oops',
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('executions_required');
  });

  it('rejects a non-array tools field', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: 'oops',
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('tools_required');
  });

  it('rejects negative rollback steps', () => {
    const r = validatePipelineRequest({
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: -1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('rollbackSteps_required');
  });
});

describe('route handlers — pipeline', () => {
  it('handlePipelineRequest wraps a completed pipeline', async () => {
    const r = await handlePipelineRequest(mock, {
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [{ code: 'x = 1' }],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.result?.stage).toBe('completed');
  });

  it('handlePipelineRequest reports a blocked pipeline as ok=true with the stage', async () => {
    // The op did not throw — the pipeline itself concluded "blocked",
    // so ok=true on the wrapper is expected (payload signals the stage).
    const r = await handlePipelineRequest(mock, {
      sessionId: 'p1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
      executions: [],
      tools: [],
      rollbackSteps: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.result?.stage).toBe('blocked-no-executions');
  });
});
