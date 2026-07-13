/**
 * skill test — MCP `ToolRegistry` + `McpClient` の tool 発火経路を behavior test で検証する。
 *
 * MCP における「skill」 = client からの `callTool(name, args)` request で server 側の
 * registered handler が呼ばれる経路。 本 file は agent lib exemplar と同 pattern で、
 * spy を handler wrapper に注入し、 assertion 4 primitive で発火 / 順序 / 引数を検証する。
 */
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransport,
  McpClient,
  McpServer,
  textContent,
  ToolRegistry,
  type McpTool,
  type ToolHandler,
} from '../../src/index.js';

const readTool: McpTool = {
  name: 'Read',
  description: 'read file',
  inputSchema: {
    type: 'object',
    properties: { file: { type: 'string' } },
    required: ['file'],
  },
};

const bashTool: McpTool = {
  name: 'Bash',
  description: 'run cmd',
  inputSchema: {
    type: 'object',
    properties: { cmd: { type: 'string' } },
    required: ['cmd'],
  },
};

/** spy 経由で handler を wrap するヘルパー。 実装は spy.record → 実 handler の順で呼ぶ。 */
function spyWrap(spy: ReturnType<typeof createToolSpy>, name: string, handler: ToolHandler): ToolHandler {
  return async (args) => {
    spy.record(name, JSON.stringify(args ?? {}));
    return handler(args);
  };
}

describe('MCP ToolRegistry skill 発火 assertion', () => {
  it('直接 registry.get(name).handler で呼ぶと spy が捕捉する', async () => {
    const spy = createToolSpy();
    const registry = new ToolRegistry();
    registry.register(readTool, spyWrap(spy, 'Read', async () => [textContent('data')]));

    const entry = registry.get('Read');
    expect(entry).toBeDefined();
    await entry?.handler({ file: 'a.md' });

    assertToolCalled(spy, 'Read');
    assertToolCalledWith(spy, 'Read', { file: 'a.md' });
    assertToolNotCalled(spy, 'Bash');
  });

  it('client.callTool 経由で spy が捕捉される (server round-trip)', async () => {
    const spy = createToolSpy();
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    server.register(readTool, spyWrap(spy, 'Read', async () => [textContent('r')]));
    server.register(bashTool, spyWrap(spy, 'Bash', async () => [textContent('b')]));

    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    await client.initialize();

    await client.callTool('Read', { file: 'a.md' });
    await client.callTool('Bash', { cmd: 'ls' });

    assertToolCalled(spy, 'Read');
    assertToolCalled(spy, 'Bash');
    assertToolCallOrder(spy, ['Read', 'Bash']);
    assertToolCalledWith(spy, 'Bash', { cmd: 'ls' });
  });

  it('禁止 tool を呼ばない client flow を assertion できる', async () => {
    const spy = createToolSpy();
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    server.register(readTool, spyWrap(spy, 'Read', async () => [textContent('r')]));
    server.register(bashTool, spyWrap(spy, 'Bash', async () => [textContent('b')]));

    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    await client.initialize();

    // 意図的に Read のみ呼ぶ = Bash 発火なし
    await client.callTool('Read', { file: 'safe.md' });

    assertToolCalled(spy, 'Read');
    assertToolNotCalled(spy, 'Bash');
  });

  it('引数 drift 検出 (client が想定引数と違う値を送る場合)', async () => {
    const spy = createToolSpy();
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    server.register(readTool, spyWrap(spy, 'Read', async () => [textContent('r')]));

    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    await client.initialize();

    // 意図的に想定と違う file を送る
    await client.callTool('Read', { file: 'wrong.md' });

    assertToolCalled(spy, 'Read');
    // 期待引数 (expected.md) と実際 (wrong.md) の不一致を assertion で捕捉
    expect(() =>
      assertToolCalledWith(spy, 'Read', { file: 'expected.md' }),
    ).toThrow(/no call matched expected args/);
  });

  it('回数厳密一致 assertion (Read を 3 回呼ぶ)', async () => {
    const spy = createToolSpy();
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    server.register(readTool, spyWrap(spy, 'Read', async () => [textContent('r')]));

    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    await client.initialize();

    await client.callTool('Read', { file: '1.md' });
    await client.callTool('Read', { file: '2.md' });
    await client.callTool('Read', { file: '3.md' });

    assertToolCalled(spy, 'Read', { times: 3 });
    assertToolCalledWith(spy, 'Read', { file: '2.md' });
  });
});
