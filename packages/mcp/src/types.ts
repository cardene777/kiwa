/**
 * Model Context Protocol (MCP) — Anthropic の Claude で proliferate した
 * tool 交換 protocol。 JSON-RPC 2.0 の上に載っており、 server 側で公開する
 * tool 一覧を client が `tools/list` で取得、 `tools/call` で呼出す 2-op
 * が中核。 kiwa mock は server / client 双方の in-process 実装を提供する。
 *
 * ### 対応する MCP protocol op (v1.15-2 対象)
 *
 * 1. `initialize` — 双方向 handshake、 client capabilities + server capabilities
 *    交換。 real MCP は最初の必須 op。
 * 2. `tools/list` — server が提供する tool 一覧を返す。
 * 3. `tools/call` — client が tool を呼び出す。 server は登録された handler
 *    を実行し JSON-RPC 2.0 response を返す。
 *
 * ### 対応しない op (v0.1 対象外)
 *
 * - `resources/*` (blob / file 系)、 `prompts/*` (server 側 prompt template)、
 *   `sampling/*` (server → client back-call)、 `logging/*` (logging notification)
 *   は v0.2 以降。 v0.1 は「tool 呼出 chain」 に絞る。
 *
 * ### JSON-RPC 2.0 envelope
 *
 * request  { jsonrpc: "2.0", id, method, params }
 * response { jsonrpc: "2.0", id, result | error }
 * error    { code, message, data? } (code -32700 parse / -32600 invalid /
 *   -32601 method not found / -32602 invalid params / -32603 internal /
 *   -32000〜-32099 server-defined)
 */

/** JSON-RPC 2.0 request id — real spec は string / number / null (notification)。 */
export type JsonRpcId = string | number | null;

/** JSON-RPC 2.0 request envelope。 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: unknown;
}

/** JSON-RPC 2.0 successful response envelope。 */
export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: T;
}

/** JSON-RPC 2.0 error object。 */
export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

/** JSON-RPC 2.0 error response envelope。 */
export interface JsonRpcError {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: JsonRpcErrorObject;
}

/** JSON-RPC 2.0 response union。 */
export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;

/** JSON-RPC 2.0 error code SSOT — spec 4 種 + MCP server-defined 4 種。 */
export const JsonRpcErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  /** MCP server-defined — tool 実行時 handler が throw した runtime error。 */
  ToolExecutionError: -32000,
  /** MCP server-defined — tool schema validation で reject された input。 */
  ToolSchemaError: -32001,
  /** MCP server-defined — handshake 前に protocol op が呼ばれた。 */
  NotInitialized: -32002,
  /** MCP server-defined — 未登録 tool 名を tools/call で呼んだ。 */
  ToolNotFound: -32003,
} as const;

/**
 * Tool の JSONSchema (subset)。 real MCP は Draft 7 の full JSONSchema を許容
 * するが、 kiwa mock は type + properties + required + items + enum の 5 種
 * のみを検証、 それ以外は「always valid」 と扱う。 v0.2 以降で拡張予定。
 */
export interface ToolInputSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  properties?: Record<string, ToolInputSchema>;
  required?: string[];
  items?: ToolInputSchema;
  enum?: readonly (string | number | boolean | null)[];
  description?: string;
}

/**
 * MCP tool definition — server 側に register する 1 tool の shape。 tools/list
 * response で client に返される。
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

/**
 * 1 tool の実 handler。 tools/call で呼び出される。 input は
 * inputSchema で validate 済、 handler は同期 or 非同期どちらでも可。 return
 * value は MCP tools/call の `content` block 相当。
 */
export type ToolHandler = (input: Record<string, unknown>) => ToolCallContent[] | Promise<ToolCallContent[]>;

/** tools/call response の content block (real MCP shape に整合)。 */
export type ToolCallContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; mimeType: string; text?: string } };

/** tools/call result — content 配列 + `isError` flag。 real MCP と同 shape。 */
export interface ToolCallResult {
  content: ToolCallContent[];
  isError: boolean;
}

/** initialize request params (client → server)。 */
export interface InitializeParams {
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

/** initialize response result (server → client)。 */
export interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

/** tools/list response result。 */
export interface ToolsListResult {
  tools: McpTool[];
}

/** tools/call request params。 */
export interface ToolsCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * MCP transport — server と client を直接繋ぐ in-process channel の抽象。
 * real MCP は stdio / SSE / websocket 等を使うが、 mock は関数呼出 1 段の
 * bidirectional channel だけあれば test を書ける。
 */
export interface McpTransport {
  /** client → server request、 server の 1 response を返す。 */
  send(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}
