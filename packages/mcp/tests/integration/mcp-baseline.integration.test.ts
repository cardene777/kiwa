import { describe, expect, it } from 'vitest';
import { McpServer, textContent } from '../../src/index.js';

describe('mcp integration — McpServer workflow', () => {
  it('T-INT-D-001 McpServer 初期化 + register tool', () => {
    const server = new McpServer({ name: 'test', requireHandshake: false });
    server.register(
      { name: 'ping', description: 'ping', inputSchema: { type: 'object' } },
      async () => [textContent('pong')],
    );
    expect(server.toolCount).toBe(1);
  });

  it('T-INT-D-002 register 複数 tool', () => {
    const server = new McpServer({ requireHandshake: false });
    server.register(
      { name: 't1', description: 't', inputSchema: { type: 'object' } },
      async () => [textContent('t1')],
    );
    server.register(
      { name: 't2', description: 't', inputSchema: { type: 'object' } },
      async () => [textContent('t2')],
    );
    expect(server.toolCount).toBe(2);
  });

  it('T-INT-D-003 unregister で 除去', () => {
    const server = new McpServer({ requireHandshake: false });
    server.register(
      { name: 'x', description: 'x', inputSchema: { type: 'object' } },
      async () => [textContent('x')],
    );
    const removed = server.unregister('x');
    expect(removed).toBe(true);
    expect(server.toolCount).toBe(0);
  });

  it('T-INT-D-004 unregister 存在しない tool = false', () => {
    const server = new McpServer({ requireHandshake: false });
    expect(server.unregister('missing')).toBe(false);
  });

  it('T-INT-D-005 同 name register で上書き', () => {
    const server = new McpServer({ requireHandshake: false });
    server.register(
      { name: 'same', description: 'v1', inputSchema: { type: 'object' } },
      async () => [textContent('v1')],
    );
    server.register(
      { name: 'same', description: 'v2', inputSchema: { type: 'object' } },
      async () => [textContent('v2')],
    );
    expect(server.toolCount).toBe(1);
  });
});
