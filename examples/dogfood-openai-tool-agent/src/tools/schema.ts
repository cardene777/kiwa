/**
 * Tool schema definitions shared by both real and mock adapters.
 *
 * The dogfood app declares three tools — `get_weather`, `calculator` and
 * `search` — so the fidelity harness can measure whether the mock returns
 * the same tool_call *shape* (JSON Schema arguments) as real OpenAI when
 * asked to orchestrate them. Schemas are expressed as the JSON Schema
 * subset OpenAI's function calling API expects (v1.12-3 AC Task 2.1-2.4).
 */
export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const WEATHER_TOOL: ToolSchema = {
  name: 'get_weather',
  description: 'Return the current weather for a city as a compact JSON string with temperature (celsius) and humidity (percent).',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name in English, e.g. "Tokyo" or "Washington DC".' },
    },
    required: ['location'],
  },
};

export const CALCULATOR_TOOL: ToolSchema = {
  name: 'calculator',
  description: 'Evaluate a simple arithmetic expression and return the result as a number. Supports +, -, *, /, parentheses.',
  parameters: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Arithmetic expression, e.g. "12 * 7" or "(15 + 5) / 4".' },
    },
    required: ['expression'],
  },
};

export const SEARCH_TOOL: ToolSchema = {
  name: 'search',
  description: 'Search a small canned news / topic index and return up to 3 result titles as a JSON array.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Free-text query, e.g. "typhoon Japan".' },
    },
    required: ['query'],
  },
};

/** The 3 tools the dogfood agent exercises. Order matters for AC 3.2 (sequence assertion). */
export const AGENT_TOOLS: ToolSchema[] = [WEATHER_TOOL, CALCULATOR_TOOL, SEARCH_TOOL];
