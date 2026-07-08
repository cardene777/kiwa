import type { AgentAdapter, AgentLoopResult } from '../adapters/interface.js';
import { AGENT_TOOLS } from '../tools/schema.js';
import { executeTool } from '../tools/executors.js';

/**
 * User-facing agent flows the dogfood app exposes. Each flow talks only
 * through {@link AgentAdapter} so the same code powers both `KIWA_MODE=real`
 * (real OpenAI Chat Completions) and `KIWA_MODE=mock` (`@kiwa/ai-llm`
 * createOpenAIMock).
 *
 * The flows mirror AC in Issue #697 —
 *   Task 3.1 (schema validation) → validateAllToolSchemas
 *   Task 3.2 (tool-call sequence) → runOrderedThreeToolFlow
 *   Task 3.3 (parallel tool call) → runParallelWeatherFlow
 */

export async function validateAllToolSchemas(
  adapter: AgentAdapter,
): Promise<{ ok: boolean; failures: Array<{ tool: string; reason: string }> }> {
  return adapter.validateToolSchemas(AGENT_TOOLS);
}

export async function runOrderedThreeToolFlow(adapter: AgentAdapter): Promise<AgentLoopResult> {
  return adapter.runToolLoop({
    userMessage:
      'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for related typhoon news.',
    tools: AGENT_TOOLS,
    executeTool,
    maxIterations: 5,
  });
}

export async function runParallelWeatherFlow(adapter: AgentAdapter): Promise<AgentLoopResult> {
  return adapter.runParallelToolCall({
    userMessage:
      'What is the current temperature in Tokyo and Washington DC? Fetch both at the same time.',
    tools: AGENT_TOOLS,
    executeTool,
  });
}
