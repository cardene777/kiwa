import { ToolRegistry, validateSchema } from './tools.js';
import {
  JsonRpcErrorCode,
  type InitializeParams,
  type InitializeResult,
  type JsonRpcError,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type JsonRpcSuccess,
  type McpTool,
  type ToolCallResult,
  type ToolHandler,
  type ToolsCallParams,
  type ToolsListResult,
} from './types.js';

/** kiwa mock が話す MCP protocol version。 real MCP は "2024-11-05" 系。 */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/** server 起動時 config。 */
export interface McpServerConfig {
  name?: string;
  version?: string;
  protocolVersion?: string;
  /** handshake を強制するか (default true)、 false なら initialize 前でも tools/* 呼出可。 */
  requireHandshake?: boolean;
}

/**
 * MCP server mock — JSON-RPC 2.0 の request 1 件を受け取り response 1 件を返す
 * 純粋関数的 dispatch。 register / unregister で tool 登録、 `handle(request)` で
 * 呼出処理する。
 *
 * ### handshake 強制 (default)
 *
 * `initialize` op を先に呼び出さないと `tools/list` / `tools/call` は
 * `NotInitialized` (-32002) error を返す。 real MCP protocol spec でも
 * initialize が最初の必須 op と規定されている。
 *
 * ### method dispatch table
 *
 * | method | handler |
 * |---|---|
 * | `initialize` | handshake、 protocol version + capabilities + serverInfo を返す |
 * | `notifications/initialized` | client からの initialize 完了通知 (notification、 response なし) |
 * | `tools/list` | 登録 tool 一覧を返す |
 * | `tools/call` | 1 tool を invoke、 schema validate → handler → result |
 * | (other) | MethodNotFound (-32601) を返す |
 */
export class McpServer {
  readonly name: string;
  readonly version: string;
  readonly protocolVersion: string;
  private readonly registry = new ToolRegistry();
  private initialized = false;
  private readonly requireHandshake: boolean;

  constructor(config: McpServerConfig = {}) {
    this.name = config.name ?? 'kiwa-mcp-mock';
    this.version = config.version ?? '0.1.0';
    this.protocolVersion = config.protocolVersion ?? MCP_PROTOCOL_VERSION;
    this.requireHandshake = config.requireHandshake ?? true;
  }

  /** 1 tool を register。 handler は同期 or 非同期どちらでも可。 */
  register(tool: McpTool, handler: ToolHandler): void {
    this.registry.register(tool, handler);
  }

  /** 1 tool を unregister、 返り値は存在有無。 */
  unregister(name: string): boolean {
    return this.registry.unregister(name);
  }

  /** 登録 tool 数 (test / debug 用)。 */
  get toolCount(): number {
    return this.registry.size;
  }

  /** handshake 済みかどうか (test / debug 用)。 */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /** test 用に handshake 状態を reset (rare use、 stateful test 補助)。 */
  reset(): void {
    this.initialized = false;
  }

  /**
   * 1 JSON-RPC request を dispatch、 1 response を返す。 notification
   * (`notifications/*` prefix) は例外的に response なし (null 返り)。
   */
  async handle(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    if (request.jsonrpc !== '2.0') {
      return this.error(request.id, JsonRpcErrorCode.InvalidRequest, 'jsonrpc must be "2.0"');
    }
    if (typeof request.method !== 'string' || request.method.length === 0) {
      return this.error(request.id, JsonRpcErrorCode.InvalidRequest, 'method must be a non-empty string');
    }

    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'notifications/initialized':
        // notification — response なし。 handshake 完了 marker として initialized 状態を維持する。
        this.initialized = true;
        return null;
      case 'tools/list':
        if (!this.checkHandshake()) {
          return this.error(request.id, JsonRpcErrorCode.NotInitialized, 'server not initialized');
        }
        return this.handleToolsList(request);
      case 'tools/call':
        if (!this.checkHandshake()) {
          return this.error(request.id, JsonRpcErrorCode.NotInitialized, 'server not initialized');
        }
        return this.handleToolsCall(request);
      default:
        return this.error(
          request.id,
          JsonRpcErrorCode.MethodNotFound,
          `method not found: ${request.method}`,
        );
    }
  }

  private checkHandshake(): boolean {
    return !this.requireHandshake || this.initialized;
  }

  private handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
    const params = request.params as InitializeParams | undefined;
    if (!params || typeof params !== 'object') {
      return this.error(request.id, JsonRpcErrorCode.InvalidParams, 'initialize requires params');
    }
    // handshake 済 flag は notifications/initialized 受信で立てるのが real MCP の順序だが、
    // mock は initialize response 送出時点で「以降 tools/* 受け付け可」 に倒す (test 簡潔化)。
    this.initialized = true;
    const result: InitializeResult = {
      protocolVersion: this.protocolVersion,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: this.name,
        version: this.version,
      },
    };
    return this.success(request.id, result);
  }

  private handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
    const result: ToolsListResult = {
      tools: this.registry.list(),
    };
    return this.success(request.id, result);
  }

  private async handleToolsCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as ToolsCallParams | undefined;
    if (!params || typeof params !== 'object' || typeof params.name !== 'string') {
      return this.error(request.id, JsonRpcErrorCode.InvalidParams, 'tools/call requires { name, arguments? }');
    }
    const registered = this.registry.get(params.name);
    if (!registered) {
      return this.error(
        request.id,
        JsonRpcErrorCode.ToolNotFound,
        `tool not found: ${params.name}`,
      );
    }
    const args = params.arguments ?? {};
    const validationErrors = validateSchema(registered.tool.inputSchema, args);
    if (validationErrors.length > 0) {
      return this.error(
        request.id,
        JsonRpcErrorCode.ToolSchemaError,
        `input schema validation failed: ${validationErrors.join('; ')}`,
      );
    }
    try {
      const content = await registered.handler(args as Record<string, unknown>);
      const result: ToolCallResult = {
        content,
        isError: false,
      };
      return this.success(request.id, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.error(
        request.id,
        JsonRpcErrorCode.ToolExecutionError,
        `tool "${params.name}" threw: ${message}`,
      );
    }
  }

  private success<T>(id: JsonRpcRequest['id'], result: T): JsonRpcSuccess<T> {
    return { jsonrpc: '2.0', id, result };
  }

  private error(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown): JsonRpcError {
    return {
      jsonrpc: '2.0',
      id,
      error: data !== undefined ? { code, message, data } : { code, message },
    };
  }
}
