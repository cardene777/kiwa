/**
 * Sandbox lifecycle end-to-end fidelity spec (sandbox axis: startSandbox
 * → executeCode → rollback).
 *
 * Sub-Issue CAR-890 (v1.40-3) AC — the mock adapter drives a full
 * sandboxed Python REPL ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across the axis.
 *
 *  1. startCi + startSandbox binds a sandbox to the session.
 *  2. executeCode appends to history + updates memory when assigns are
 *     supplied.
 *  3. executeCode reports ok=false on Python raise / JS throw statements.
 *  4. rollback pops N most-recent executions and restores memory snapshot.
 *  5. closeCi records the session history length.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleExecuteRequest,
  handleRollbackRequest,
  handleStartRequest,
  validateExecuteRequest,
  validateRollbackRequest,
  validateStartRequest,
} from '../src/app/sandbox/route.js';
import type { LlmCodeInterpreterAdapter } from '../src/adapters/interface.js';

let mock: LlmCodeInterpreterAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — sandbox lifecycle', () => {
  it('startSandbox binds a sandbox to the session with expected id + timeout', async () => {
    await mock.startCi({ sessionId: 's1' });
    const r = await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    expect(r.sandboxId).toBe('sb-1');
    expect(r.timeoutMs).toBe(30_000);
    expect(r.latencyMs).toBeGreaterThanOrEqual(1);
  });

  it('startSandbox rejects zero / negative timeout', async () => {
    await mock.startCi({ sessionId: 's1' });
    await expect(
      mock.startSandbox({ sessionId: 's1', sandboxId: 'sb-1', timeoutMs: 0 }),
    ).rejects.toThrow(/timeoutMs must be positive/);
  });

  it('startSandbox rejects empty sandboxId', async () => {
    await mock.startCi({ sessionId: 's1' });
    await expect(
      mock.startSandbox({ sessionId: 's1', sandboxId: '', timeoutMs: 30_000 }),
    ).rejects.toThrow(/sandboxId must not be empty/);
  });

  it('startCi refuses a duplicate session id', async () => {
    await mock.startCi({ sessionId: 's1' });
    await expect(mock.startCi({ sessionId: 's1' })).rejects.toThrow(
      /duplicate session/,
    );
  });

  it('startSandbox refuses a missing session', async () => {
    await expect(
      mock.startSandbox({
        sessionId: 'no-such',
        sandboxId: 'sb-1',
        timeoutMs: 30_000,
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('mock adapter — executeCode', () => {
  beforeEach(async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
  });

  it('executes a simple ok statement', async () => {
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    expect(r.ok).toBe(true);
    expect(r.executionIndex).toBe(0);
    expect(r.stdout).toMatch(/executed: x = 1/);
    expect(r.codeLength).toBe(5);
  });

  it('appends executions in index order', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'y = 2' },
    });
    expect(r.executionIndex).toBe(1);
  });

  it('records ok=false when the code raises', async () => {
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'raise ValueError("boom")' },
    });
    expect(r.ok).toBe(false);
    expect(r.stdout).toBe('ExecutionError');
  });

  it('records ok=false when the code throws (JS)', async () => {
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'throw new Error("boom")' },
    });
    expect(r.ok).toBe(false);
    expect(r.stdout).toBe('ExecutionError');
  });

  it('does not mutate memory on ok=false path', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'raise ValueError("boom")', assigns: { x: '99' } },
    });
    expect(r.ok).toBe(false);
    expect(r.memoryKeys).toBe(1);
  });

  it('records memory assigns when supplied', async () => {
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    expect(r.memoryKeys).toBe(1);
  });

  it('memoryKeys grows with each new assigned key', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'y = 2', assigns: { y: '2' } },
    });
    expect(r.memoryKeys).toBe(2);
  });

  it('reassigning an existing key does not grow memoryKeys', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 2', assigns: { x: '2' } },
    });
    expect(r.memoryKeys).toBe(1);
  });

  it('rejects empty code', async () => {
    await expect(
      mock.executeCode({
        sessionId: 's1',
        execution: { code: '' },
      }),
    ).rejects.toThrow(/code must not be empty/);
  });

  it('rejects executeCode before startSandbox', async () => {
    await mock.startCi({ sessionId: 's2' });
    await expect(
      mock.executeCode({
        sessionId: 's2',
        execution: { code: 'x = 1' },
      }),
    ).rejects.toThrow(/start sandbox first/);
  });
});

describe('mock adapter — rollback', () => {
  beforeEach(async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
  });

  it('pops the most-recent execution', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'y = 2' },
    });
    const r = await mock.rollback({ sessionId: 's1', steps: 1 });
    expect(r.poppedCount).toBe(1);
    expect(r.remainingExecutions).toBe(1);
    expect(mock.executions('s1')).toHaveLength(1);
    expect(mock.executions('s1')[0]?.code).toBe('x = 1');
  });

  it('rollback restores prior memory snapshot', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'y = 2', assigns: { y: '2' } },
    });
    // After rollback 1 step, y should be gone → memoryKeys back to 1.
    await mock.rollback({ sessionId: 's1', steps: 1 });
    // Verify snapshot via a fresh execution reporting memoryKeys.
    const r = await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'z = 3', assigns: { z: '3' } },
    });
    expect(r.memoryKeys).toBe(2);
  });

  it('clamps rollback steps to available history', async () => {
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    const r = await mock.rollback({ sessionId: 's1', steps: 5 });
    expect(r.poppedCount).toBe(1);
    expect(r.remainingExecutions).toBe(0);
  });

  it('rejects zero rollback steps', async () => {
    await expect(
      mock.rollback({ sessionId: 's1', steps: 0 }),
    ).rejects.toThrow(/steps must be positive/);
  });

  it('rejects negative rollback steps', async () => {
    await expect(
      mock.rollback({ sessionId: 's1', steps: -1 }),
    ).rejects.toThrow(/steps must be positive/);
  });

  it('rejects rollback before startSandbox', async () => {
    await mock.startCi({ sessionId: 's2' });
    await expect(
      mock.rollback({ sessionId: 's2', steps: 1 }),
    ).rejects.toThrow(/start sandbox first/);
  });
});

describe('mock adapter — session lifecycle', () => {
  it('closeCi records history length', async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    await mock.closeCi({ sessionId: 's1' });
    const traces = mock.traces();
    const closed = traces.find((t) => t.op === 'closeCi' && t.ok);
    expect(closed).toBeDefined();
    const detail = closed?.detail as { historyLength: number };
    // startSandbox + executeCode = 2 neutral events in history.
    expect(detail.historyLength).toBeGreaterThanOrEqual(2);
  });

  it('closeCi refuses a missing session', async () => {
    await expect(
      mock.closeCi({ sessionId: 'no-such' }),
    ).rejects.toThrow(/no session no-such/);
  });

  it('reset clears all rooms and trace', async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    await mock.reset();
    expect(mock.traces()).toHaveLength(0);
    // Recreating the session should now succeed.
    await mock.startCi({ sessionId: 's1' });
  });
});

describe('route validation — start', () => {
  it('accepts a valid start body', () => {
    const r = validateStartRequest({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validateStartRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validateStartRequest({
      sessionId: '',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects an empty sandboxId', () => {
    const r = validateStartRequest({
      sessionId: 's1',
      sandboxId: '',
      timeoutMs: 30_000,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sandboxId_required');
  });

  it('rejects zero timeout', () => {
    const r = validateStartRequest({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('timeoutMs_required');
  });
});

describe('route validation — execute', () => {
  it('accepts a valid execute body', () => {
    const r = validateExecuteRequest({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    expect(r.ok).toBe(true);
  });

  it('accepts an execute body with assigns', () => {
    const r = validateExecuteRequest({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: { x: '1' } },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.execution.assigns).toEqual({ x: '1' });
  });

  it('rejects a missing execution field', () => {
    const r = validateExecuteRequest({ sessionId: 's1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('execution_required');
  });

  it('rejects an empty code string', () => {
    const r = validateExecuteRequest({
      sessionId: 's1',
      execution: { code: '' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('execution.code_required');
  });

  it('rejects a null assigns field', () => {
    const r = validateExecuteRequest({
      sessionId: 's1',
      execution: { code: 'x = 1', assigns: null },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('execution.assigns_shape');
  });
});

describe('route validation — rollback', () => {
  it('accepts a valid rollback body', () => {
    const r = validateRollbackRequest({ sessionId: 's1', steps: 2 });
    expect(r.ok).toBe(true);
  });

  it('rejects zero steps', () => {
    const r = validateRollbackRequest({ sessionId: 's1', steps: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('steps_required');
  });

  it('rejects negative steps', () => {
    const r = validateRollbackRequest({ sessionId: 's1', steps: -1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('steps_required');
  });
});

describe('route handlers — start / execute / rollback', () => {
  it('handleStartRequest wraps a successful start op', async () => {
    await mock.startCi({ sessionId: 's1' });
    const r = await handleStartRequest(mock, {
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    expect(r.ok).toBe(true);
    expect(r.result?.sandboxId).toBe('sb-1');
  });

  it('handleStartRequest translates thrown errors to errorKind', async () => {
    const r = await handleStartRequest(mock, {
      sessionId: 'no-such',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });

  it('handleExecuteRequest wraps a successful execute op', async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    const r = await handleExecuteRequest(mock, {
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.executionIndex).toBe(0);
  });

  it('handleRollbackRequest wraps a successful rollback op', async () => {
    await mock.startCi({ sessionId: 's1' });
    await mock.startSandbox({
      sessionId: 's1',
      sandboxId: 'sb-1',
      timeoutMs: 30_000,
    });
    await mock.executeCode({
      sessionId: 's1',
      execution: { code: 'x = 1' },
    });
    const r = await handleRollbackRequest(mock, {
      sessionId: 's1',
      steps: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.result?.poppedCount).toBe(1);
  });
});
