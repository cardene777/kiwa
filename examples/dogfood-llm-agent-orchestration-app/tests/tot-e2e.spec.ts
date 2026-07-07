/**
 * Tree-of-Thought end-to-end fidelity spec (agent-orchestration ToT
 * axis: root → branches → depth plan tree).
 *
 * Sub-Issue CAR-858 (v1.38-4) AC — the mock adapter drives a full ToT
 * expansion and the fidelity harness diffs the raw {@link TraceEvent}
 * sequence across the axis.
 *
 *  1. expandToT returns node counts consistent with (branches, depth).
 *  2. expandToT records depth + branchFactor in the trace detail.
 *  3. expandToT rejects invalid depth or empty branches.
 *  4. expandToT works after startAgent + before any reactStep.
 *  5. expandToT rootScore is 1.0 (seeded).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleTotRequest,
  validateTotRequest,
} from '../src/app/tot/route.js';
import type { LlmAgentAdapter } from '../src/adapters/interface.js';

let mock: LlmAgentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — Tree-of-Thought', () => {
  it('axis 1: expandToT depth=2 with 2 branches yields 3 nodes', async () => {
    await mock.startAgent({ sessionId: 't1' });
    const r = await mock.expandToT({
      sessionId: 't1',
      plan: {
        root: { thought: 'plan trip' },
        branches: [
          { thought: 'search hotels', score: 1 },
          { thought: 'search flights', score: 0.5 },
        ],
        depth: 2,
      },
    });
    expect(r.nodeCount).toBe(3);
    expect(r.depth).toBe(2);
    expect(r.branchFactor).toBe(2);
  });

  it('axis 1: expandToT depth=3 with 2 branches yields 7 nodes', async () => {
    await mock.startAgent({ sessionId: 't2' });
    const r = await mock.expandToT({
      sessionId: 't2',
      plan: {
        root: { thought: 'plan' },
        branches: [
          { thought: 'a', score: 1 },
          { thought: 'b', score: 0.5 },
        ],
        depth: 3,
      },
    });
    expect(r.nodeCount).toBe(7);
  });

  it('axis 2: expandToT records rootScore=1.0', async () => {
    await mock.startAgent({ sessionId: 't3' });
    const r = await mock.expandToT({
      sessionId: 't3',
      plan: {
        root: { thought: 'plan' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 2,
      },
    });
    expect(r.rootScore).toBe(1.0);
  });

  it('axis 2: expandToT trace detail includes depth + branchFactor', async () => {
    await mock.startAgent({ sessionId: 't4' });
    await mock.expandToT({
      sessionId: 't4',
      plan: {
        root: { thought: 'plan' },
        branches: [
          { thought: 'a', score: 1 },
          { thought: 'b', score: 0.5 },
          { thought: 'c', score: 0.3 },
        ],
        depth: 2,
      },
    });
    const trace = mock.traces().find((t) => t.op === 'expandToT');
    expect((trace?.detail as { depth?: number })?.depth).toBe(2);
    expect((trace?.detail as { branchFactor?: number })?.branchFactor).toBe(3);
  });

  it('axis 3: expandToT rejects depth=0', async () => {
    await mock.startAgent({ sessionId: 't5' });
    await expect(
      mock.expandToT({
        sessionId: 't5',
        plan: {
          root: { thought: 'plan' },
          branches: [{ thought: 'a', score: 1 }],
          depth: 0,
        },
      }),
    ).rejects.toThrow(/depth must be positive/);
  });

  it('axis 3: expandToT rejects empty branches', async () => {
    await mock.startAgent({ sessionId: 't6' });
    await expect(
      mock.expandToT({
        sessionId: 't6',
        plan: {
          root: { thought: 'plan' },
          branches: [],
          depth: 2,
        },
      }),
    ).rejects.toThrow(/branches must not be empty/);
  });

  it('axis 4: expandToT works right after startAgent (no reactStep needed)', async () => {
    await mock.startAgent({ sessionId: 't7' });
    const r = await mock.expandToT({
      sessionId: 't7',
      plan: {
        root: { thought: 'plan' },
        branches: [
          { thought: 'a', score: 1 },
          { thought: 'b', score: 0.5 },
        ],
        depth: 2,
      },
    });
    expect(r.nodeCount).toBe(3);
  });

  it('axis 4: expandToT latency is positive', async () => {
    await mock.startAgent({ sessionId: 't8' });
    const r = await mock.expandToT({
      sessionId: 't8',
      plan: {
        root: { thought: 'plan' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 2,
      },
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });
});

describe('tot route validator', () => {
  it('rejects missing plan', () => {
    const r = validateTotRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('plan_required');
  });

  it('rejects missing plan.root.thought', () => {
    const r = validateTotRequest({
      sessionId: 's',
      plan: { root: {}, branches: [{ thought: 'a', score: 1 }], depth: 2 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('plan.root.thought_required');
  });

  it('rejects empty branches', () => {
    const r = validateTotRequest({
      sessionId: 's',
      plan: { root: { thought: 'x' }, branches: [], depth: 2 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('plan.branches_required');
  });

  it('rejects depth <= 0', () => {
    const r = validateTotRequest({
      sessionId: 's',
      plan: {
        root: { thought: 'x' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 0,
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('plan.depth_must_be_positive');
  });

  it('accepts valid tot request', () => {
    const r = validateTotRequest({
      sessionId: 's',
      plan: {
        root: { thought: 'x' },
        branches: [
          { thought: 'a', score: 1 },
          { thought: 'b', score: 0.5 },
        ],
        depth: 2,
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.plan.depth).toBe(2);
  });
});

describe('tot route handler', () => {
  it('handles expandToT end-to-end via mock', async () => {
    await mock.startAgent({ sessionId: 'h1' });
    const res = await handleTotRequest(mock, {
      sessionId: 'h1',
      plan: {
        root: { thought: 'plan' },
        branches: [
          { thought: 'a', score: 1 },
          { thought: 'b', score: 0.5 },
        ],
        depth: 2,
      },
    });
    expect(res.ok).toBe(true);
    expect(res.result?.nodeCount).toBe(3);
  });

  it('handles missing session with errorKind', async () => {
    const res = await handleTotRequest(mock, {
      sessionId: 'nope',
      plan: {
        root: { thought: 'x' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 2,
      },
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
