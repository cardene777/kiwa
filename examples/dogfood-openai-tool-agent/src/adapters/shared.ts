import type { AgentLoopResult, AgentLoopStep, AgentToolCall } from './interface.js';

/**
 * Small helpers shared between the mock and real OpenAI adapters. Kept
 * lightweight — anything OpenAI-shape-specific stays in the adapter that
 * owns it, but the tool_call parsing and step-total roll-up logic is
 * identical either way.
 */

interface RawToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/**
 * Parse an OpenAI-shape tool_call into the internal {@link AgentToolCall}
 * form. Invalid JSON in `function.arguments` collapses to an empty object
 * so the tool loop can still route the call to an executor.
 */
export function parseToolCall(tc: RawToolCall): AgentToolCall {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(tc.function.arguments) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  return {
    id: tc.id,
    name: tc.function.name,
    argumentsRaw: tc.function.arguments,
    args: parsed,
  };
}

/**
 * Aggregate cost / latency / usage across a completed sequence of steps.
 * Both `runToolLoop` and `runParallelToolCall` in each adapter roll up
 * results with the same reducer — this helper is the single source of
 * truth for that math.
 */
export function summariseSteps(
  steps: AgentLoopStep[],
): Pick<AgentLoopResult, 'totalCostUsd' | 'totalLatencyMs' | 'totalUsage'> {
  const totalCostUsd = steps.reduce((s, x) => s + x.costUsd, 0);
  const totalLatencyMs = steps.reduce((s, x) => s + x.latencyMs, 0);
  const totalUsage = steps.reduce(
    (acc, x) => ({
      promptTokens: acc.promptTokens + x.usage.promptTokens,
      completionTokens: acc.completionTokens + x.usage.completionTokens,
      totalTokens: acc.totalTokens + x.usage.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  );
  return { totalCostUsd, totalLatencyMs, totalUsage };
}
