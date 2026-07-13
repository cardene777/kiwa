import { describe, expect, it } from 'vitest';
import { McpServer } from '../src/server.js';
import { connectClientToServer } from '../src/client.js';
import { buildEchoTool, echoHandler, registerEcho } from '../src/fixture.js';

describe('McpClient notify defensive branches', () => {
  it('notify without params sends notification-shaped request', async () => {
    const server = new McpServer({ name: 'test', version: '1.0', requireHandshake: false });
    registerEcho(server);
    const { client } = await connectClientToServer(server);
    await expect(client.notify('ping', undefined)).resolves.toBeUndefined();
  });

  it('notify with params sends notification with params', async () => {
    const server = new McpServer({ name: 'test', version: '1.0', requireHandshake: false });
    registerEcho(server);
    const { client } = await connectClientToServer(server);
    await expect(
      client.notify('logMessage', { level: 'info', message: 'hi' }),
    ).resolves.toBeUndefined();
  });
});

describe('McpServer callTool error defensive branches', () => {
  it('callTool with handler that throws returns tool-execution error', async () => {
    const server = new McpServer({ name: 'test', version: '1.0', requireHandshake: false });
    server.register(
      { name: 'boomer', description: 'always throws', inputSchema: { type: 'object', properties: {}, required: [] } },
      () => {
        throw new Error('boomer explodes');
      },
    );
    const { client } = await connectClientToServer(server);
    await expect(
      client.callTool('boomer', {}),
    ).rejects.toThrow(/boomer explodes/);
  });

  it('callTool with unknown tool name returns error', async () => {
    const server = new McpServer({ name: 'test', version: '1.0', requireHandshake: false });
    const { client } = await connectClientToServer(server);
    await expect(client.callTool('nonexistent', {})).rejects.toThrow();
  });
});

describe('echoHandler defensive branches', () => {
  it('throws when message is not a string', () => {
    expect(() => echoHandler({ message: 123 })).toThrow(
      /message must be a string/,
    );
  });

  it('accepts valid string message', () => {
    const result = echoHandler({ message: 'hello' });
    expect(JSON.stringify(result)).toContain('hello');
  });
});

describe('buildEchoTool defensive branches', () => {
  it('produces echo tool with correct schema', () => {
    const tool = buildEchoTool();
    expect(tool.name).toBe('echo');
    expect(tool.inputSchema.type).toBe('object');
  });
});
