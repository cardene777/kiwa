import { describe, expect, it } from 'vitest';
import {
  buildCalcTool,
  buildDbQueryTool,
  buildEchoTool,
  buildSearchTool,
  buildWeatherTool,
  connectClientToServer,
  McpServer,
  registerAllFixtureTools,
} from '../src/index.js';

describe('fixture tools — schema shape', () => {
  it('each builder returns a tool with non-empty name + inputSchema', () => {
    const tools = [
      buildEchoTool(),
      buildCalcTool(),
      buildWeatherTool(),
      buildSearchTool(),
      buildDbQueryTool(),
    ];
    for (const t of tools) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.inputSchema.type).toBe('object');
    }
  });

  it('calc schema declares 4 op enum', () => {
    const t = buildCalcTool();
    const opSchema = t.inputSchema.properties?.['op'];
    expect(opSchema?.enum).toEqual(['add', 'subtract', 'multiply', 'divide']);
  });
});

describe('fixture tools — behavior', () => {
  it('calc divide by zero surfaces as ToolExecutionError', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    await expect(client.callTool('calc', { op: 'divide', a: 1, b: 0 })).rejects.toMatchObject({
      code: -32000,
      message: expect.stringContaining('division by zero'),
    });
  });

  it('calc handles every op enum: add / subtract / multiply / divide', async () => {
    // Every prior test only exercised divide (through the divide-by-zero
    // error path). The subtract / multiply / divide branches of the switch
    // in the calc handler were uncovered because `add` was the default and
    // `divide` was the only other explicit call.
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const add = await client.callTool('calc', { op: 'add', a: 3, b: 4 });
    expect(add.content[0]).toMatchObject({ type: 'text', text: '7' });
    const sub = await client.callTool('calc', { op: 'subtract', a: 10, b: 4 });
    expect(sub.content[0]).toMatchObject({ type: 'text', text: '6' });
    const mul = await client.callTool('calc', { op: 'multiply', a: 6, b: 7 });
    expect(mul.content[0]).toMatchObject({ type: 'text', text: '42' });
    const div = await client.callTool('calc', { op: 'divide', a: 20, b: 4 });
    expect(div.content[0]).toMatchObject({ type: 'text', text: '5' });
  });

  it('weather returns fahrenheit when unit=fahrenheit', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('weather', { city: 'tokyo', unit: 'fahrenheit' });
    // 22C -> 71.6F
    expect(result.content[0]).toMatchObject({ type: 'text', text: expect.stringContaining('71.6F') });
  });

  it('weather returns no-data message for unknown city', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('weather', { city: 'atlantis' });
    expect(result.content[0]).toMatchObject({ text: expect.stringContaining('no weather data') });
  });

  it('search ranks by word overlap and respects limit', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('search', { query: 'json rpc handshake', limit: 2 });
    const text = (result.content[0] as { text: string }).text;
    // JSON-RPC 2.0 primer doc-2 が最上位、 2 件までに絞られる
    expect(text).toContain('doc-2');
    expect(text.split('\n').length).toBeLessThanOrEqual(2);
  });

  it('search returns no-results text when query matches nothing', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('search', { query: 'zzzz-nomatch' });
    expect((result.content[0] as { text: string }).text).toContain('no results');
  });

  it('db-query SELECT returns rows JSON', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    const result = await client.callTool('db-query', { sql: 'SELECT * FROM users', limit: 2 });
    const rows = JSON.parse((result.content[0] as { text: string }).text) as Array<{ id: number }>;
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe(1);
  });

  it('db-query rejects non-SELECT with ToolExecutionError', async () => {
    const server = new McpServer();
    registerAllFixtureTools(server);
    const { client } = await connectClientToServer(server);
    await expect(client.callTool('db-query', { sql: 'DROP TABLE users' })).rejects.toMatchObject({
      code: -32000,
      message: expect.stringContaining('SELECT only'),
    });
  });
});
