import { describe, expect, it } from 'vitest';
import {
  connectClientToServer,
  InMemoryTransport,
  MCP_PROTOCOL_VERSION,
  McpClient,
  McpRpcError,
  McpServer,
} from '../src/index.js';

describe('MCP handshake — initialize', () => {
  it('server responds to initialize with protocolVersion + serverInfo', async () => {
    const server = new McpServer({ name: 'test-server', version: '9.9.9' });
    const { client } = await connectClientToServer(server, { name: 'test-client', version: '1.0.0' });
    expect(client.isInitialized).toBe(true);
    expect(client.serverProtocolVersion).toBe(MCP_PROTOCOL_VERSION);
  });

  it('server rejects tools/list before initialize (NotInitialized code -32002)', async () => {
    const server = new McpServer();
    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    // no initialize()、 tools/list を叩く
    await expect(client.listTools()).rejects.toMatchObject({
      code: -32002,
    });
  });

  it('requireHandshake=false disables the pre-initialize guard', async () => {
    const server = new McpServer({ requireHandshake: false });
    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    // register 1 tool then call tools/list without initialize
    server.register(
      { name: 't', description: 'x', inputSchema: { type: 'object' } },
      () => [{ type: 'text' as const, text: 'ok' }],
    );
    const tools = await client.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe('t');
  });

  it('server rejects request with jsonrpc != "2.0"', async () => {
    const server = new McpServer();
    const response = await server.handle({ jsonrpc: '1.0' as unknown as '2.0', id: 1, method: 'initialize' });
    expect(response).toMatchObject({
      error: { code: -32600 },
    });
  });

  it('unknown method returns MethodNotFound -32601', async () => {
    const server = new McpServer();
    const { client } = await connectClientToServer(server);
    await expect(client.call('resources/list', undefined)).rejects.toBeInstanceOf(McpRpcError);
    await expect(client.call('resources/list', undefined)).rejects.toMatchObject({ code: -32601 });
  });

  it('server initialize without params returns InvalidParams -32602', async () => {
    const server = new McpServer();
    const response = await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize' });
    expect(response).toMatchObject({ error: { code: -32602 } });
  });

  it('server rejects an empty method with InvalidRequest -32600', async () => {
    // The `typeof request.method !== 'string' || length === 0` guard was
    // uncovered.
    const server = new McpServer();
    const withEmpty = await server.handle({ jsonrpc: '2.0', id: 1, method: '' });
    expect(withEmpty).toMatchObject({ error: { code: -32600 } });
    const withNonString = await server.handle({
      jsonrpc: '2.0',
      id: 2,
      method: 123 as unknown as string,
    });
    expect(withNonString).toMatchObject({ error: { code: -32600 } });
  });

  it('tools/call without a valid { name } params object returns InvalidParams -32602', async () => {
    const server = new McpServer();
    const { client } = await connectClientToServer(server);
    void client;
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 42,
      method: 'tools/call',
      params: { arguments: {} } as unknown as { name: string },
    });
    expect(response).toMatchObject({ error: { code: -32602 } });
    // Also cover the `!params` branch.
    const noParams = await server.handle({
      jsonrpc: '2.0',
      id: 43,
      method: 'tools/call',
    } as unknown as Parameters<typeof server.handle>[0]);
    expect(noParams).toMatchObject({ error: { code: -32602 } });
  });

  it('server rejects tools/call before initialize (NotInitialized -32002)', async () => {
    // The handshake guard on the `tools/call` case was uncovered because
    // no earlier test made the call before initialize.
    const server = new McpServer();
    server.register(
      { name: 't', description: 'x', inputSchema: { type: 'object' } },
      () => [{ type: 'text' as const, text: 'ok' }],
    );
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 't', arguments: {} },
    });
    expect(response).toMatchObject({ error: { code: -32002 } });
  });

  it('client detects response id mismatch (InternalError -32603)', async () => {
    // The client `if (response.id !== expectedId)` throw was uncovered
    // because every roundtrip pairs the transport's echoed id. Build a
    // stub transport that flips the id and observe the throw.
    class SwapIdTransport {
      async send(request: { id: number | string }): Promise<{ id: number | string; result?: unknown; error?: unknown }> {
        return {
          jsonrpc: '2.0',
          id: (request.id as number) + 999,
          result: {},
        } as { id: number | string; result?: unknown; error?: unknown };
      }
    }
    const client = new McpClient(
      new SwapIdTransport() as unknown as ConstructorParameters<typeof McpClient>[0],
    );
    await expect(client.call('any', undefined)).rejects.toMatchObject({
      code: -32603,
      message: expect.stringContaining('response id mismatch'),
    });
  });

  it('server exposes reset / toolCount / isInitialized getters', () => {
    const server = new McpServer();
    expect(server.toolCount).toBe(0);
    expect(server.isInitialized).toBe(false);
    server.register(
      { name: 't1', description: 'x', inputSchema: { type: 'object' } },
      () => [{ type: 'text' as const, text: 'ok' }],
    );
    expect(server.toolCount).toBe(1);
    // reset() reverts handshake state to false.
    server.reset();
    expect(server.isInitialized).toBe(false);
    // unregister returns true when the tool exists, false otherwise.
    expect(server.unregister('t1')).toBe(true);
    expect(server.unregister('t1')).toBe(false);
    expect(server.toolCount).toBe(0);
  });
});
