import type { McpTool, ToolHandler } from '@kiwa-test/mcp';
import { textContent } from '@kiwa-test/mcp';

/**
 * 3 MCP tool definitions the dogfood app exposes.
 *
 * These are the tools an MCP server registers so the client (an Anthropic
 * Claude agent, either mock or real) can discover them via `tools/list` and
 * invoke them via `tools/call`. The dogfood scenario mirrors the OpenAI
 * tool-agent dogfood (v1.12-3) but drives tool calls through MCP protocol
 * instead of the OpenAI function-calling channel — the point is to exercise
 * the MCP handshake + JSON-RPC roundtrip in exactly the shape a real MCP
 * server implements.
 *
 * Each tool is a pair of `McpTool` (schema) + `ToolHandler` (executor).
 * `@kiwa-test/mcp` `McpServer.register(tool, handler)` accepts them directly.
 */

// ---- weather ---------------------------------------------------------

/** Weather corpus — keyed by lowercase kebab-case city id, deterministic for tests. */
const WEATHER_CITIES: Record<
  string,
  { celsius: number; condition: string }
> = {
  tokyo: { celsius: 22, condition: 'sunny' },
  osaka: { celsius: 24, condition: 'cloudy' },
  london: { celsius: 15, condition: 'rainy' },
  'new-york': { celsius: 18, condition: 'partly-cloudy' },
  paris: { celsius: 17, condition: 'overcast' },
  sydney: { celsius: 26, condition: 'sunny' },
};

export const weatherTool: McpTool = {
  name: 'weather',
  description: 'Look up mock weather data for a preset city. Returns temperature + condition string.',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'city id, lowercase kebab-case (tokyo / osaka / london / new-york / paris / sydney)',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'temperature unit, defaults to celsius',
      },
    },
    required: ['city'],
  },
};

export const weatherHandler: ToolHandler = (input) => {
  const city = String(input['city']).toLowerCase();
  const unit = (input['unit'] as string | undefined) ?? 'celsius';
  const data = WEATHER_CITIES[city];
  if (!data) {
    return [textContent(`no weather data for ${city}`)];
  }
  const temp = unit === 'fahrenheit' ? data.celsius * 1.8 + 32 : data.celsius;
  const suffix = unit === 'fahrenheit' ? 'F' : 'C';
  return [textContent(`${city}: ${temp}${suffix}, ${data.condition}`)];
};

// ---- calculator ------------------------------------------------------

const CALC_OPS = ['add', 'subtract', 'multiply', 'divide'] as const;
type CalcOp = (typeof CALC_OPS)[number];

export const calculatorTool: McpTool = {
  name: 'calculator',
  description: 'Perform a 4-op arithmetic operation on two numbers (add / subtract / multiply / divide).',
  inputSchema: {
    type: 'object',
    properties: {
      op: {
        type: 'string',
        enum: CALC_OPS,
        description: 'operation to perform',
      },
      a: { type: 'number', description: 'left operand' },
      b: { type: 'number', description: 'right operand' },
    },
    required: ['op', 'a', 'b'],
  },
};

export const calculatorHandler: ToolHandler = (input) => {
  const op = input['op'] as CalcOp;
  const a = input['a'] as number;
  const b = input['b'] as number;
  let result: number;
  switch (op) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) throw new Error('division by zero');
      result = a / b;
      break;
    default:
      // schema enum guards this, defensive.
      throw new Error(`unknown op: ${String(op)}`);
  }
  return [textContent(String(result))];
};

// ---- search ----------------------------------------------------------

const SEARCH_CORPUS: readonly { id: string; title: string; text: string }[] = [
  { id: 'doc-1', title: 'MCP overview', text: 'Model Context Protocol server client tool call' },
  { id: 'doc-2', title: 'Anthropic Claude tool use', text: 'Claude Anthropic tool use function call schema' },
  { id: 'doc-3', title: 'Typhoon Nari approaches Kanto', text: 'typhoon japan tokyo storm rainfall' },
  { id: 'doc-4', title: 'kiwa MCP mock harness', text: 'kiwa test mock mcp fixture dogfood release gate' },
  { id: 'doc-5', title: 'JSON-RPC 2.0 primer', text: 'JSON RPC request response envelope handshake' },
];

export const searchTool: McpTool = {
  name: 'search',
  description: 'Word-overlap search against a small mock corpus. Returns top-N titles + score.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'search query, space-separated words' },
      limit: { type: 'integer', description: 'max number of results (default 3)' },
    },
    required: ['query'],
  },
};

export const searchHandler: ToolHandler = (input) => {
  const query = String(input['query']).toLowerCase();
  const limit = Number(input['limit'] ?? 3);
  const words = query.split(/\s+/).filter(Boolean);
  const scored = SEARCH_CORPUS.map((doc) => {
    const docWords = `${doc.title} ${doc.text}`.toLowerCase().split(/\s+/);
    const score = words.reduce((acc, w) => (docWords.includes(w) ? acc + 1 : acc), 0);
    return { doc, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (scored.length === 0) {
    return [textContent(`no results for: ${query}`)];
  }
  const summary = scored
    .map((entry) => `${entry.doc.id} (score=${entry.score}): ${entry.doc.title}`)
    .join('\n');
  return [textContent(summary)];
};

// ---- convenience -----------------------------------------------------

/** All 3 tool definitions in list form — useful for schema validation tests. */
export const ALL_TOOLS: readonly McpTool[] = [
  weatherTool,
  calculatorTool,
  searchTool,
];

/** Ordered handler map, keyed by tool name. */
export const TOOL_HANDLERS: Readonly<Record<string, ToolHandler>> = {
  weather: weatherHandler,
  calculator: calculatorHandler,
  search: searchHandler,
};
