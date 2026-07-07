/**
 * Agent pipeline end-to-end spec (agent-orchestration pipeline axis:
 * multi-stage plan → tool → act → reflect).
 *
 * Sub-Issue CAR-858 (v1.38-4) AC — the pipeline surface is the
 * highest-level integration point v1.38-4 ships. The spec exercises the
 * 5 stage transitions:
 *
 *  1. plan (Tree-of-Thought expansion) records nodeCount + topScore.
 *  2. tool selection with a fallback ladder demotes the top candidate
 *     when it fails the score threshold.
 *  3. act (ReAct trace) records the exercised step count.
 *  4. reflect either completes the pipeline or blocks it when the
 *     revised output contains a critique violation.
 *  5. blocked-no-tool is returned when the ladder exhausts.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePipelineRequest,
  validatePipelineRequest,
} from '../src/app/pipeline/route.js';
import type {
  LlmAgentAdapter,
  PipelineInput,
} from '../src/adapters/interface.js';

let mock: LlmAgentAdapter;

function benignPipelineInput(sessionId: string): PipelineInput {
  return {
    sessionId,
    intent: 'fetch weather',
    candidates: [
      { name: 'weather', description: 'fetch weather data for a city' },
      { name: 'read-file', description: 'read local files from disk' },
    ],
    plan: {
      root: { thought: 'plan trip' },
      branches: [
        { thought: 'search hotels', score: 1 },
        { thought: 'search flights', score: 0.5 },
      ],
      depth: 2,
    },
    reactSteps: [
      {
        thought: 'search',
        action: { tool: 'weather', input: 'tokyo' },
        observation: 'sunny, 72F',
      },
    ],
    reflect: { output: 'clean output', critiqueRules: ['forbidden'] },
  };
}

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — pipeline', () => {
  it('axis 1: runPipeline completes with plan.nodeCount + topScore', async () => {
    await mock.startPipeline({ sessionId: 'p1' });
    const r = await mock.runPipeline(benignPipelineInput('p1'));
    expect(r.stage).toBe('completed');
    expect(r.plan.nodeCount).toBe(3);
    expect(r.plan.topScore).toBe(1.0);
  });

  it('axis 2: runPipeline selects top-scoring tool', async () => {
    await mock.startPipeline({ sessionId: 'p2' });
    const r = await mock.runPipeline(benignPipelineInput('p2'));
    expect(r.toolSelection.selectedName).toBe('weather');
    expect(r.toolSelection.topScore).toBeGreaterThan(0);
  });

  it('axis 2: runPipeline demotes to fallback when top fails threshold', async () => {
    await mock.startPipeline({ sessionId: 'p3' });
    const input = benignPipelineInput('p3');
    // With a threshold above the top score, the ladder should exhaust
    // and return blocked-no-tool.
    input.toolScoreThreshold = 1.5;
    const r = await mock.runPipeline(input);
    expect(r.stage).toBe('blocked-no-tool');
    expect(r.toolSelection.selectedName).toBeNull();
    expect(r.fallbackDepth).toBeGreaterThan(0);
  });

  it('axis 3: runPipeline records reactTraceLength', async () => {
    await mock.startPipeline({ sessionId: 'p4' });
    const input = benignPipelineInput('p4');
    input.reactSteps = [
      { thought: 't1', action: { tool: 'weather', input: 'x' }, observation: 'o1' },
      { thought: 't2', action: { tool: 'weather', input: 'y' }, observation: 'o2' },
    ];
    const r = await mock.runPipeline(input);
    expect(r.reactTraceLength).toBe(2);
  });

  it('axis 4: runPipeline blocks when reflect detects a critique violation', async () => {
    await mock.startPipeline({ sessionId: 'p5' });
    const input = benignPipelineInput('p5');
    input.reflect = {
      output: 'contains forbidden phrase',
      critiqueRules: ['forbidden'],
    };
    const r = await mock.runPipeline(input);
    expect(r.stage).toBe('blocked-reflection');
    expect(r.reflection.violationCount).toBeGreaterThan(0);
    expect(r.reflection.revised).toContain('[revised]');
  });

  it('axis 4: runPipeline completed reflection returns revised output unchanged', async () => {
    await mock.startPipeline({ sessionId: 'p6' });
    const input = benignPipelineInput('p6');
    const r = await mock.runPipeline(input);
    expect(r.stage).toBe('completed');
    expect(r.reflection.violationCount).toBe(0);
    // The revised output equals the input output when no rule matched.
    expect(r.reflection.revised).toBe('clean output');
  });

  it('axis 5: blocked-no-tool sets blockedReason with threshold detail', async () => {
    await mock.startPipeline({ sessionId: 'p7' });
    const input = benignPipelineInput('p7');
    input.toolScoreThreshold = 1.5;
    const r = await mock.runPipeline(input);
    expect(r.blockedReason).toContain('no candidate met threshold');
  });

  it('axis 5: blocked-reflection sets blockedReason with critique detail', async () => {
    await mock.startPipeline({ sessionId: 'p8' });
    const input = benignPipelineInput('p8');
    input.reflect = {
      output: 'contains forbidden phrase',
      critiqueRules: ['forbidden'],
    };
    const r = await mock.runPipeline(input);
    expect(r.blockedReason).toContain('reflection critique');
  });

  it('axis 5: runPipeline latency is positive', async () => {
    await mock.startPipeline({ sessionId: 'p9' });
    const r = await mock.runPipeline(benignPipelineInput('p9'));
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('axis 5: startPipeline twice throws DUPLICATE_SESSION', async () => {
    await mock.startPipeline({ sessionId: 'p10' });
    await expect(mock.startPipeline({ sessionId: 'p10' })).rejects.toThrow(
      /duplicate session p10/,
    );
  });

  it('axis 5: runPipeline without startPipeline throws MISSING_SESSION', async () => {
    await expect(
      mock.runPipeline(benignPipelineInput('missing')),
    ).rejects.toThrow(/no session missing/);
  });
});

describe('pipeline route validator', () => {
  it('rejects missing intent', () => {
    const r = validatePipelineRequest({ sessionId: 's', candidates: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('intent_required');
  });

  it('rejects empty candidates', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      intent: 'x',
      candidates: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('candidates_required');
  });

  it('rejects missing plan', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      intent: 'x',
      candidates: [{ name: 'w', description: 'x' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('plan_required');
  });

  it('rejects empty reactSteps', () => {
    const r = validatePipelineRequest({
      sessionId: 's',
      intent: 'x',
      candidates: [{ name: 'w', description: 'x' }],
      plan: {
        root: { thought: 'x' },
        branches: [{ thought: 'a', score: 1 }],
        depth: 2,
      },
      reactSteps: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('reactSteps_required');
  });

  it('accepts valid full pipeline request', () => {
    const r = validatePipelineRequest(benignPipelineInput('s'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.intent).toBe('fetch weather');
  });

  it('accepts threshold as optional field', () => {
    const input = { ...benignPipelineInput('s'), toolScoreThreshold: 0.5 };
    const r = validatePipelineRequest(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.toolScoreThreshold).toBe(0.5);
  });
});

describe('pipeline route handler', () => {
  it('handles pipeline end-to-end via mock', async () => {
    await mock.startPipeline({ sessionId: 'h1' });
    const res = await handlePipelineRequest(mock, benignPipelineInput('h1'));
    expect(res.ok).toBe(true);
    expect(res.result?.stage).toBe('completed');
  });

  it('handles missing session with errorKind', async () => {
    const res = await handlePipelineRequest(
      mock,
      benignPipelineInput('nope'),
    );
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });
});
