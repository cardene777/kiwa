/**
 * Tool selection end-to-end fidelity spec (agent-orchestration
 * tool-select axis: intent → ranked candidates → fallback ladder).
 *
 * Sub-Issue CAR-858 (v1.38-4) AC — the mock adapter drives a full
 * tool-selection ceremony and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. selectTool picks the candidate whose description overlaps the
 *     intent tokens the most.
 *  2. selectTool returns null when no candidate overlaps.
 *  3. selectTool rejects empty candidate list.
 *  4. selectTool ranking is sorted descending by score (fallback
 *     ladder order).
 *  5. selectTool trace records selectedName + topScore in detail.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleToolSelectRequest,
  validateToolSelectRequest,
} from '../src/app/tool-select/route.js';
import type { LlmAgentAdapter } from '../src/adapters/interface.js';

let mock: LlmAgentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — tool selection', () => {
  it('axis 1: selectTool picks candidate whose description overlaps intent', async () => {
    await mock.startAgent({ sessionId: 's1' });
    await mock.reactStep({
      sessionId: 's1',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.selectTool({
      sessionId: 's1',
      intent: 'fetch weather',
      candidates: [
        { name: 'weather', description: 'fetch weather data for a city' },
        { name: 'read-file', description: 'read local files from disk' },
      ],
    });
    expect(r.selectedName).toBe('weather');
    expect(r.topScore).toBeGreaterThan(0);
  });

  it('axis 2: selectTool returns null when no overlap', async () => {
    await mock.startAgent({ sessionId: 's2' });
    await mock.reactStep({
      sessionId: 's2',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.selectTool({
      sessionId: 's2',
      intent: 'zzz qqq wxy',
      candidates: [
        { name: 'weather', description: 'fetch data' },
        { name: 'read-file', description: 'read files' },
      ],
    });
    expect(r.selectedName).toBeNull();
    expect(r.topScore).toBe(0);
  });

  it('axis 3: selectTool rejects empty candidate list', async () => {
    await mock.startAgent({ sessionId: 's3' });
    await mock.reactStep({
      sessionId: 's3',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    await expect(
      mock.selectTool({
        sessionId: 's3',
        intent: 'x',
        candidates: [],
      }),
    ).rejects.toThrow(/candidates must not be empty/);
  });

  it('axis 4: selectTool ranking is descending by score', async () => {
    await mock.startAgent({ sessionId: 's4' });
    await mock.reactStep({
      sessionId: 's4',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.selectTool({
      sessionId: 's4',
      intent: 'search weather',
      candidates: [
        { name: 'w', description: 'weather search' },
        { name: 'x', description: 'foo bar' },
      ],
    });
    expect(r.ranking[0]?.score).toBeGreaterThanOrEqual(
      r.ranking[1]?.score ?? 0,
    );
  });

  it('axis 5: selectTool trace records selected + topScore', async () => {
    await mock.startAgent({ sessionId: 's5' });
    await mock.reactStep({
      sessionId: 's5',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    await mock.selectTool({
      sessionId: 's5',
      intent: 'fetch weather',
      candidates: [
        { name: 'weather', description: 'fetch weather' },
        { name: 'other', description: 'do something else' },
      ],
    });
    const trace = mock.traces().find((t) => t.op === 'selectTool');
    expect(
      (trace?.detail as { selectedName?: string })?.selectedName,
    ).toBe('weather');
  });

  it('axis 5: selectTool latency is positive', async () => {
    await mock.startAgent({ sessionId: 's6' });
    await mock.reactStep({
      sessionId: 's6',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    const r = await mock.selectTool({
      sessionId: 's6',
      intent: 'weather',
      candidates: [{ name: 'w', description: 'weather' }],
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('axis 5: selectTool throws when session idle', async () => {
    await mock.startAgent({ sessionId: 's7' });
    await expect(
      mock.selectTool({
        sessionId: 's7',
        intent: 'x',
        candidates: [{ name: 'w', description: 'weather' }],
      }),
    ).rejects.toThrow(/run react or tot first/);
  });
});

describe('tool-select route validator', () => {
  it('rejects missing intent', () => {
    const r = validateToolSelectRequest({
      sessionId: 's',
      candidates: [{ name: 'w', description: 'x' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('intent_required');
  });

  it('rejects empty candidates', () => {
    const r = validateToolSelectRequest({
      sessionId: 's',
      intent: 'x',
      candidates: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('candidates_required');
  });

  it('rejects candidate without name', () => {
    const r = validateToolSelectRequest({
      sessionId: 's',
      intent: 'x',
      candidates: [{ description: 'x' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('candidates[].name_required');
  });

  it('accepts valid request', () => {
    const r = validateToolSelectRequest({
      sessionId: 's',
      intent: 'fetch weather',
      candidates: [{ name: 'w', description: 'weather' }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.intent).toBe('fetch weather');
  });
});

describe('tool-select route handler', () => {
  it('handles selectTool end-to-end via mock', async () => {
    await mock.startAgent({ sessionId: 'h1' });
    await mock.reactStep({
      sessionId: 'h1',
      step: {
        thought: 't',
        action: { tool: 'noop', input: 'x' },
        observation: 'o',
      },
    });
    const res = await handleToolSelectRequest(mock, {
      sessionId: 'h1',
      intent: 'fetch weather',
      candidates: [{ name: 'w', description: 'weather' }],
    });
    expect(res.ok).toBe(true);
    expect(res.result?.selectedName).toBe('w');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleToolSelectRequest(mock, {
      sessionId: 'nope',
      intent: 'x',
      candidates: [{ name: 'w', description: 'weather' }],
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
