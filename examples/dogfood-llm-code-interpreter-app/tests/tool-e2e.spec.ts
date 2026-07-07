/**
 * Tool-use end-to-end fidelity spec (tool axis: useTool → tool call
 * ledger → unknown-tool refusal).
 *
 * Sub-Issue CAR-890 (v1.40-3) AC — the mock adapter drives a full
 * tool-use ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. useTool records the call in the ledger + reports the call count.
 *  2. useTool returns ok=false when the tool name is "unknown".
 *  3. useTool refuses to run before a sandbox is started.
 *  4. The trace stream carries `useTool` neutral events in call order.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleToolRequest,
  validateToolRequest,
} from '../src/app/sandbox/route.js';
import type { LlmCodeInterpreterAdapter } from '../src/adapters/interface.js';

let mock: LlmCodeInterpreterAdapter;

beforeEach(async () => {
  mock = makeMockAdapter({ latencyMs: 1 });
  await mock.startCi({ sessionId: 's1' });
  await mock.startSandbox({
    sessionId: 's1',
    sandboxId: 'sb-1',
    timeoutMs: 30_000,
  });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — useTool ledger', () => {
  it('records a known tool call as ok=true', async () => {
    const r = await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: { url: 'https://example.com' } },
    });
    expect(r.ok).toBe(true);
    expect(r.toolName).toBe('httpFetch');
    expect(r.argCount).toBe(1);
    expect(r.toolCallCount).toBe(1);
  });

  it('increments toolCallCount across repeated calls', async () => {
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: { url: 'https://a' } },
    });
    const r = await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: { url: 'https://b' } },
    });
    expect(r.toolCallCount).toBe(2);
  });

  it('preserves arbitrary arg shapes', async () => {
    const r = await mock.useTool({
      sessionId: 's1',
      tool: {
        name: 'searchIndex',
        args: { query: 'foo', limit: 10, includeArchived: true },
      },
    });
    expect(r.argCount).toBe(3);
    expect(r.ok).toBe(true);
  });

  it('marks the "unknown" tool as ok=false', async () => {
    const r = await mock.useTool({
      sessionId: 's1',
      tool: { name: 'unknown', args: {} },
    });
    expect(r.ok).toBe(false);
  });

  it('unknown tools still update the ledger count', async () => {
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: {} },
    });
    const r = await mock.useTool({
      sessionId: 's1',
      tool: { name: 'unknown', args: {} },
    });
    expect(r.ok).toBe(false);
    expect(r.toolCallCount).toBe(2);
  });

  it('rejects an empty tool name', async () => {
    await expect(
      mock.useTool({
        sessionId: 's1',
        tool: { name: '', args: {} },
      }),
    ).rejects.toThrow(/tool name must not be empty/);
  });

  it('rejects useTool before startSandbox', async () => {
    await mock.startCi({ sessionId: 's2' });
    await expect(
      mock.useTool({
        sessionId: 's2',
        tool: { name: 'httpFetch', args: {} },
      }),
    ).rejects.toThrow(/start sandbox first/);
  });

  it('refuses a missing session', async () => {
    await expect(
      mock.useTool({
        sessionId: 'no-such',
        tool: { name: 'httpFetch', args: {} },
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('mock adapter — trace order', () => {
  it('emits useTool events in call order', async () => {
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: {} },
    });
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'searchIndex', args: {} },
    });
    const trace = mock.traces().filter((t) => t.op === 'useTool');
    expect(trace).toHaveLength(2);
    // first / second events should be ok=true.
    expect(trace[0]?.ok).toBe(true);
    expect(trace[1]?.ok).toBe(true);
  });

  it('trace shows both success + unknown-tool refusals in order', async () => {
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: {} },
    });
    await mock.useTool({
      sessionId: 's1',
      tool: { name: 'unknown', args: {} },
    });
    const useToolTrace = mock.traces().filter((t) => t.op === 'useTool');
    expect(useToolTrace).toHaveLength(2);
    // Both trace records report ok=true at the neutral-event level (the
    // op succeeded — the *result* was ok=false, encoded in detail).
    expect(useToolTrace[0]?.ok).toBe(true);
    expect(useToolTrace[1]?.ok).toBe(true);
    const detail1 = useToolTrace[1]?.detail as { ok: boolean };
    expect(detail1.ok).toBe(false);
  });
});

describe('route validation — tool', () => {
  it('accepts a valid tool body', () => {
    const r = validateToolRequest({
      sessionId: 's1',
      tool: { name: 'httpFetch', args: { url: 'https://a' } },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validateToolRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validateToolRequest({
      sessionId: '',
      tool: { name: 'httpFetch', args: {} },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects a missing tool field', () => {
    const r = validateToolRequest({ sessionId: 's1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('tool_required');
  });

  it('rejects an empty tool name', () => {
    const r = validateToolRequest({
      sessionId: 's1',
      tool: { name: '', args: {} },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('tool.name_required');
  });

  it('rejects a missing args object', () => {
    const r = validateToolRequest({
      sessionId: 's1',
      tool: { name: 'httpFetch' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('tool.args_required');
  });
});

describe('route handlers — tool', () => {
  it('handleToolRequest wraps a successful tool op', async () => {
    const r = await handleToolRequest(mock, {
      sessionId: 's1',
      tool: { name: 'httpFetch', args: { url: 'https://a' } },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.toolName).toBe('httpFetch');
  });

  it('handleToolRequest translates thrown errors to errorKind', async () => {
    const r = await handleToolRequest(mock, {
      sessionId: 'no-such',
      tool: { name: 'httpFetch', args: {} },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });
});
