import type { ChatbotAdapter } from '../adapters/interface.js';

/**
 * User-facing flows the chatbot app exposes. Each flow talks only through
 * {@link ChatbotAdapter} so the same code powers both `KIWA_MODE=real`
 * (Anthropic Messages API) and `KIWA_MODE=mock` (`@kiwa-lab/ai-llm`
 * createAnthropicMock).
 *
 * The 3 flows below mirror the AC in Issue #696 —
 * chat streaming (Task 3.1), system prompt fidelity (Task 3.2) and
 * tool_use loop fidelity (Task 3.3).
 */

export async function greetUser(
  adapter: ChatbotAdapter,
): Promise<{ text: string; costUsd: number }> {
  const result = await adapter.reply({ userMessage: 'Say hi in one sentence.' });
  return { text: result.text, costUsd: result.costUsd };
}

export async function streamBedtimeStory(
  adapter: ChatbotAdapter,
): Promise<{ chunks: string[]; full: string; costUsd: number }> {
  const result = await adapter.replyStream({
    userMessage: 'Stream a short bedtime story about a robot.',
  });
  return { chunks: result.chunks, full: result.full, costUsd: result.costUsd };
}

export async function replyWithSystemPrompt(
  adapter: ChatbotAdapter,
): Promise<{ text: string; costUsd: number }> {
  const result = await adapter.reply({
    userMessage: 'Reply as a pirate.',
    systemPrompt: 'You are a helpful pirate. Speak in a swashbuckling tone.',
  });
  return { text: result.text, costUsd: result.costUsd };
}

/**
 * Two-tool orchestration — the assistant is expected to emit tool_use for
 * both `get_weather` and `calculator`, the app resolves each via
 * {@link resolveTools}, and the loop terminates with a plain-text
 * finalisation.
 */
export async function askWeatherAndMath(
  adapter: ChatbotAdapter,
): Promise<{
  finalText: string;
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
  costUsd: number;
}> {
  const result = await adapter.toolLoop({
    userMessage: 'What is the weather in Tokyo and what is 12 * 7?',
    tools: [
      {
        name: 'get_weather',
        description: 'Return the current weather for a city as a short phrase.',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name in English' },
          },
          required: ['city'],
        },
      },
      {
        name: 'calculator',
        description: 'Evaluate a simple arithmetic expression and return the number.',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'e.g. "12 * 7"' },
          },
          required: ['expression'],
        },
      },
    ],
    resolveTool: resolveTools,
  });
  return {
    finalText: result.finalText,
    toolCalls: result.toolCalls,
    costUsd: result.costUsd,
  };
}

/**
 * App-side tool implementations. Kept dead simple so real vs mock diffs
 * measure the model's tool_use pattern rather than the tool implementation.
 */
export async function resolveTools(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (name === 'get_weather') {
    const city = typeof args['city'] === 'string' ? args['city'] : 'unknown';
    return `${city}: clear skies, 22C`;
  }
  if (name === 'calculator') {
    const expression = typeof args['expression'] === 'string' ? args['expression'] : '';
    return String(evalSafeArithmetic(expression));
  }
  return `unknown tool ${name}`;
}

/**
 * Minimal arithmetic evaluator — supports the operators listed in the
 * calculator tool description. Refuses anything else so we never `eval()`
 * untrusted content.
 */
function evalSafeArithmetic(expression: string): number {
  if (!/^[\s0-9+\-*/().]+$/.test(expression)) return NaN;
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${expression});`) as () => number;
  try {
    const v = fn();
    return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}
