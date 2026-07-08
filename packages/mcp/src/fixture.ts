import { textContent } from './tools.js';
import type { McpServer } from './server.js';
import type { McpTool, ToolHandler } from './types.js';

/**
 * 5 tool builder — kiwa test で頻出する MCP tool の shape を SSOT 化。
 * 各 builder は `(server) => tool + handler` を返す形ではなく `(server) => void`
 * で直接 register する。 test は `registerEcho(server)` 1 行で使い始められる。
 *
 * ### 5 tool の役割分担
 *
 * | tool | 想定シナリオ |
 * |---|---|
 * | echo | JSON-RPC handshake + tools/call chain の smoke test |
 * | calc | 数値 arg + validation error path |
 * | weather | enum arg + mock data 分岐 |
 * | search | array return + relevance ranking (word overlap 近似) |
 * | db-query | multi-arg + isError=true path (SQL parse error mock) |
 *
 * 各 builder は tool definition だけを取り出す helper (`buildXTool`) も提供し、
 * schema 検証 test 用に直接 return する。
 */

// ---- echo -------------------------------------------------------------

export const buildEchoTool = (): McpTool => ({
  name: 'echo',
  description: 'Echo back the input message. Useful for handshake + roundtrip smoke test.',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'the message to echo' },
    },
    required: ['message'],
  },
});

export const echoHandler: ToolHandler = (input) => {
  const message = input['message'];
  if (typeof message !== 'string') throw new Error('echo: message must be a string');
  return [textContent(message)];
};

export function registerEcho(server: McpServer): void {
  server.register(buildEchoTool(), echoHandler);
}

// ---- calc -------------------------------------------------------------

const CALC_OPS = ['add', 'subtract', 'multiply', 'divide'] as const;
type CalcOp = (typeof CALC_OPS)[number];

export const buildCalcTool = (): McpTool => ({
  name: 'calc',
  description: 'Perform a 4-op arithmetic operation on two integers.',
  inputSchema: {
    type: 'object',
    properties: {
      op: { type: 'string', enum: CALC_OPS, description: 'operation to perform' },
      a: { type: 'number', description: 'left operand' },
      b: { type: 'number', description: 'right operand' },
    },
    required: ['op', 'a', 'b'],
  },
});

export const calcHandler: ToolHandler = (input) => {
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
      // ここは schema enum が弾くので実質到達不可、 defensive。
      throw new Error(`unknown op: ${String(op)}`);
  }
  return [textContent(String(result))];
};

export function registerCalc(server: McpServer): void {
  server.register(buildCalcTool(), calcHandler);
}

// ---- weather ----------------------------------------------------------

/**
 * mock weather data — city + unit の組で決定的に固定 return。 test 決定性のため
 * random / date-based 分岐は入れない。
 */
const WEATHER_DATA: Record<string, { celsius: number; condition: string }> = {
  tokyo: { celsius: 22, condition: 'sunny' },
  osaka: { celsius: 24, condition: 'cloudy' },
  london: { celsius: 15, condition: 'rainy' },
  'new-york': { celsius: 18, condition: 'partly-cloudy' },
};

export const buildWeatherTool = (): McpTool => ({
  name: 'weather',
  description: 'Return mock weather for a preset city (tokyo / osaka / london / new-york).',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'city id (lowercase, kebab-case)' },
      unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'temperature unit' },
    },
    required: ['city'],
  },
});

export const weatherHandler: ToolHandler = (input) => {
  const city = String(input['city']).toLowerCase();
  const unit = (input['unit'] as string | undefined) ?? 'celsius';
  const data = WEATHER_DATA[city];
  if (!data) {
    return [textContent(`no weather data for ${city}`)];
  }
  const temp = unit === 'fahrenheit' ? data.celsius * 1.8 + 32 : data.celsius;
  const suffix = unit === 'fahrenheit' ? 'F' : 'C';
  return [textContent(`${city}: ${temp}${suffix}, ${data.condition}`)];
};

export function registerWeather(server: McpServer): void {
  server.register(buildWeatherTool(), weatherHandler);
}

// ---- search -----------------------------------------------------------

/**
 * mock corpus — query の word overlap で ranking する軽量 search。
 * @kiwa/search と同じ思想 (word-overlap ranking) を採用、 top-N を返す。
 */
const SEARCH_CORPUS: readonly { id: string; title: string; text: string }[] = [
  { id: 'doc-1', title: 'MCP overview', text: 'Model Context Protocol server client tool call' },
  { id: 'doc-2', title: 'JSON-RPC 2.0 primer', text: 'JSON RPC request response envelope handshake' },
  { id: 'doc-3', title: 'Anthropic Claude tools', text: 'Claude Anthropic tool use function call schema' },
  { id: 'doc-4', title: 'kiwa test harness', text: 'kiwa test mock fixture harness dogfood release gate' },
  { id: 'doc-5', title: 'JSONSchema validation', text: 'JSONSchema validation properties required enum type' },
];

export const buildSearchTool = (): McpTool => ({
  name: 'search',
  description: 'Word-overlap search against a small mock corpus. Returns top-N documents.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'search query, space-separated words' },
      limit: { type: 'integer', description: 'max number of results (default 3)' },
    },
    required: ['query'],
  },
});

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

export function registerSearch(server: McpServer): void {
  server.register(buildSearchTool(), searchHandler);
}

// ---- db-query ---------------------------------------------------------

/**
 * mock db-query — real DB を叩かず SQL parse だけ mock する。 SELECT だけ受け入れ、
 * それ以外は throw して `ToolExecutionError` を返す。 real MCP DB tool の
 * validation error path を test で exercise するためのシナリオ用。
 */
const MOCK_ROWS = [
  { id: 1, name: 'alice', role: 'admin' },
  { id: 2, name: 'bob', role: 'member' },
  { id: 3, name: 'carol', role: 'member' },
];

export const buildDbQueryTool = (): McpTool => ({
  name: 'db-query',
  description: 'Execute a mock SQL SELECT query. Non-SELECT statements throw a runtime error.',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL statement (SELECT only in mock)' },
      limit: { type: 'integer', description: 'max rows (default 10)' },
    },
    required: ['sql'],
  },
});

export const dbQueryHandler: ToolHandler = (input) => {
  const sql = String(input['sql']).trim();
  const limit = Number(input['limit'] ?? 10);
  if (!/^select\b/i.test(sql)) {
    throw new Error(`mock db supports SELECT only, got: ${sql.slice(0, 20)}...`);
  }
  const rows = MOCK_ROWS.slice(0, limit);
  return [textContent(JSON.stringify(rows))];
};

export function registerDbQuery(server: McpServer): void {
  server.register(buildDbQueryTool(), dbQueryHandler);
}

// ---- convenience ------------------------------------------------------

/** 5 tool を一括 register。 tutorial / dogfood 起動用の 1 行 setup。 */
export function registerAllFixtureTools(server: McpServer): void {
  registerEcho(server);
  registerCalc(server);
  registerWeather(server);
  registerSearch(server);
  registerDbQuery(server);
}
