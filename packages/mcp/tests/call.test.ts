import { describe, expect, it } from 'vitest';
import {
  connectClientToServer,
  McpServer,
  registerAllFixtureTools,
  registerCalc,
  registerEcho,
  textContent,
} from '../src/index.js';

describe('tools/list + tools/call roundtrip', () => {
  it('lists 5 fixture tools after registerAllFixtureTools', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const tools = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(['echo', 'calc', 'weather', 'search', 'db-query']);
  });

  it('echo tool returns the message verbatim', async () => {
    const server = new McpServer();
    registerEcho(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('echo', { message: 'hello mcp' });
    expect(result.isError).toBe(false);
    expect(result.content[0]).toEqual({ type: 'text', text: 'hello mcp' });
  });

  it('calc add returns numeric result as text', async () => {
    const server = new McpServer();
    registerCalc(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });
    expect(result.content[0]).toEqual({ type: 'text', text: '5' });
  });

  it('async handler is awaited', async () => {
    const server = new McpServer();
    server.register(
      { name: 'delayed', description: '', inputSchema: { type: 'object' } },
      async () => {
        await new Promise((r) => setTimeout(r, 5));
        return [textContent('done')];
      },
    );
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('delayed', {});
    expect(result.content[0]).toEqual({ type: 'text', text: 'done' });
  });

  it('unknown tool returns ToolNotFound -32003', async () => {
    const server = new McpServer();
    const { client } = await connectClientToServer(server);
    await expect(client.callTool('nope')).rejects.toMatchObject({ code: -32003 });
  });

  it('schema validation error returns ToolSchemaError -32001', async () => {
    const server = new McpServer();
    registerEcho(server);
    const { client } = await connectClientToServer(server);
    // echo requires string `message`、 number を渡して validation error 経路
    await expect(client.callTool('echo', { message: 123 })).rejects.toMatchObject({ code: -32001 });
  });

  it('handler throw returns ToolExecutionError -32000', async () => {
    const server = new McpServer();
    server.register(
      { name: 'boom', description: '', inputSchema: { type: 'object' } },
      () => {
        throw new Error('runtime failure');
      },
    );
    const { client } = await connectClientToServer(server);
    await expect(client.callTool('boom')).rejects.toMatchObject({
      code: -32000,
      message: expect.stringContaining('runtime failure'),
    });
  });

  it('server dispatch preserves request id', async () => {
    const server = new McpServer();
    registerEcho(server);
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 'req-42',
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'x', version: '0' } },
    });
    expect(response?.id).toBe('req-42');
  });
});
