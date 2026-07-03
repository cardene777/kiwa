import { McpServer } from './server.js';
import {
  JsonRpcErrorCode,
  type InitializeResult,
  type JsonRpcErrorObject,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpTool,
  type McpTransport,
  type ToolCallResult,
} from './types.js';

/** MCP client 起動時 config。 */
export interface McpClientConfig {
  /** client identifier (initialize params.clientInfo で送出)。 */
  name?: string;
  version?: string;
  /** 話す protocol version、 default は server 側 SSOT に揃える。 */
  protocolVersion?: string;
}

/**
 * client → server 呼出で error response を受け取った場合の JS 例外。
 * `code` / `message` / `data` は JSON-RPC error object のまま。
 */
export class McpRpcError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(error: JsonRpcErrorObject) {
    super(error.message);
    this.name = 'McpRpcError';
    this.code = error.code;
    this.data = error.data;
  }
}

/**
 * MCP client mock — real MCP client と同じく initialize → tools/list →
 * tools/call の 3 op を wrap する。 in-process McpServer と直結する
 * `InMemoryTransport` を default で使うが、 real MCP client と mock server の
 * 突合 test 用に任意 `McpTransport` を注入可能。
 */
export class McpClient {
  readonly name: string;
  readonly version: string;
  readonly protocolVersion: string | undefined;
  private readonly transport: McpTransport;
  private nextId = 1;
  private negotiatedProtocolVersion: string | undefined;
  private initialized = false;

  constructor(transport: McpTransport, config: McpClientConfig = {}) {
    this.transport = transport;
    this.name = config.name ?? 'kiwa-mcp-client';
    this.version = config.version ?? '0.1.0';
    this.protocolVersion = config.protocolVersion;
  }

  /** handshake 済かどうか (test / debug 用)。 */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /** server と handshake した後の合意 protocol version、 未 handshake は undefined。 */
  get serverProtocolVersion(): string | undefined {
    return this.negotiatedProtocolVersion;
  }

  /**
   * handshake — real MCP は initialize request → initialized notification の
   * 2 step。 mock も 2 step を実行して server の initialize 済 flag を立てる。
   */
  async initialize(): Promise<InitializeResult> {
    const params = {
      protocolVersion: this.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: this.name, version: this.version },
    };
    const result = await this.call<InitializeResult>('initialize', params);
    this.negotiatedProtocolVersion = result.protocolVersion;
    // real MCP に合わせて notifications/initialized も送出、 response は null。
    await this.notify('notifications/initialized', undefined);
    this.initialized = true;
    return result;
  }

  /** tools/list — 登録 tool 一覧を取得。 */
  async listTools(): Promise<McpTool[]> {
    const result = await this.call<{ tools: McpTool[] }>('tools/list', undefined);
    return result.tools;
  }

  /** tools/call — 1 tool を呼び出す、 result は content + isError。 */
  async callTool(name: string, args?: Record<string, unknown>): Promise<ToolCallResult> {
    const params = args !== undefined ? { name, arguments: args } : { name };
    return this.call<ToolCallResult>('tools/call', params);
  }

  /**
   * 任意 JSON-RPC method を呼び出す (未対応の MCP op 実験 / test 用)。 error
   * response は McpRpcError で throw する。
   */
  async call<T>(method: string, params: unknown): Promise<T> {
    const id = this.nextId++;
    const request: JsonRpcRequest = params !== undefined
      ? { jsonrpc: '2.0', id, method, params }
      : { jsonrpc: '2.0', id, method };
    const response = await this.transport.send(request);
    return this.unwrap<T>(response, id);
  }

  /**
   * notification (response なし) を送出。 JSON-RPC 2.0 では id 省略で
   * notification 扱い、 transport は null / 相応の non-response を返す。
   */
  async notify(method: string, params: unknown): Promise<void> {
    // JSON-RPC 2.0 notification は id を持たない (spec 上 `id must not be present`)。
    // 型上 id は required なので id=null (null は notification と等価扱い) を送出、
    // server 側 handler は response なし (null 返却) で扱う。
    const request: JsonRpcRequest = params !== undefined
      ? { jsonrpc: '2.0', id: null, method, params }
      : { jsonrpc: '2.0', id: null, method };
    // transport は response を返す想定だが、 notification 対応 transport は null を返す。
    // 実行結果は破棄。
    await this.transport.send(request).catch(() => undefined);
  }

  private unwrap<T>(response: JsonRpcResponse, expectedId: JsonRpcId): T {
    if (response.id !== expectedId) {
      throw new McpRpcError({
        code: JsonRpcErrorCode.InternalError,
        message: `response id mismatch: expected ${String(expectedId)}, got ${String(response.id)}`,
      });
    }
    if ('error' in response) {
      throw new McpRpcError(response.error);
    }
    return response.result as T;
  }
}

/**
 * In-process transport — client の request を直接 server の `handle` に渡す。
 * real MCP は stdio / SSE / websocket 等を挟むが、 mock test の 9 割はこの
 * transport で足りる。 notification (response なし) には null-response を
 * 合成して JsonRpcResponse 型を満たす。
 */
export class InMemoryTransport implements McpTransport {
  constructor(private readonly server: McpServer) {}

  async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const response = await this.server.handle(request);
    if (response === null) {
      // notification 相当、 client 側は結果を使わないが type 上 null 返却不可なので
      // 空 success を合成する。 client.notify 側で結果は破棄されるため実害なし。
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: null,
      };
    }
    return response;
  }
}

/**
 * shortcut — server + client + transport を 1 発で組み立てて handshake まで完了する
 * factory。 test の 8 割はこれで足りる想定。
 */
export async function connectClientToServer(
  server: McpServer,
  clientConfig?: McpClientConfig,
): Promise<{ client: McpClient; transport: InMemoryTransport }> {
  const transport = new InMemoryTransport(server);
  const client = new McpClient(transport, clientConfig);
  await client.initialize();
  return { client, transport };
}
