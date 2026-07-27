import { connectClientToServer, McpServer, registerAllFixtureTools, textContent } from '@kiwa-lab/mcp';
import { describe, expect, it, vi } from 'vitest';

function createNotesServer() {
  const server = new McpServer({ name: 'notes', version: '1.0.0' });
  const handler = vi.fn(async (input: Record<string, unknown>) => [
    textContent(String(input.text)),
  ]);
  server.register(
    {
      name: 'echo',
      description: 'Returns the supplied text',
      inputSchema: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
    handler,
  );
  return { server, handler };
}

describe('library documentation MCP recipes', () => {
  it('calls a fixture tool through an initialized client', async () => {
    const server = new McpServer({ name: 'test-server', version: '1.0.0' });
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);

    await expect(client.callTool('calc', { op: 'add', a: 2, b: 3 })).resolves.toMatchObject({
      content: [{ type: 'text', text: '5' }],
    });
    await expect(client.callTool('echo', { message: 123 })).rejects.toMatchObject({ code: -32001 });
  });

  it('rejects invalid input before a custom tool handler runs', async () => {
    const { server, handler } = createNotesServer();
    const { client } = await connectClientToServer(server);

    await expect(client.callTool('echo', { text: 'hello' })).resolves.toMatchObject({
      content: [{ type: 'text', text: 'hello' }],
    });
    await expect(client.callTool('echo', { text: 123 })).rejects.toMatchObject({ code: -32001 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
