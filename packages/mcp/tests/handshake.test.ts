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
});
