# MCP tool-use agent in 12 min

## What you'll build

A vitest test file that boots an **in-process MCP server** with 3 fixture tools (`calc` / `weather` / `echo`), connects a client through the `InMemoryTransport`, walks the 4-step JSON-RPC 2.0 chain (`initialize` → `notifications/initialized` → `tools/list` → `tools/call`), and asserts the exact `NotInitialized` (`-32002`) / `ToolNotFound` (`-32003`) / `ToolSchemaError` (`-32001`) error semantics the real Model Context Protocol enforces. The same `McpClient` API works against a stdio child process when you drop in a real transport later.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-mcp-agent && cd kiwa-mcp-agent
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/mcp
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/server.ts` — build the server + register 3 tools:

```ts
import {
  McpServer,
  registerCalc,
  registerEcho,
  registerWeather,
} from '@kiwa-lab/mcp';

export function makeMcpServer() {
  const server = new McpServer({ name: 'kiwa-mcp-agent-demo', version: '1.0.0' });
  registerEcho(server);
  registerCalc(server);
  registerWeather(server);
  return server;
}
```

`@kiwa-lab/mcp` also ships `registerAllFixtureTools(server)` which registers all 5 fixture tools (echo / calc / weather / search / db-query) in one call — use the per-tool form when the test suite should only expose a subset.

## Test — 4-step chain + 3 error semantics

Create `tests/mcp-chain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { connectClientToServer, InMemoryTransport, McpClient } from '@kiwa-lab/mcp';
import { makeMcpServer } from '../src/server';

describe('MCP chain — initialize → tools/list → tools/call', () => {
  it('handshake + tools/list returns the 3 registered tools', async () => {
    const server = makeMcpServer();
    const { client } = await connectClientToServer(server);

    const tools = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['calc', 'echo', 'weather']);
  });

  it('tools/call for calc returns the arithmetic result', async () => {
    const server = makeMcpServer();
    const { client } = await connectClientToServer(server);

    const result = await client.callTool('calc', { op: 'add', a: 2, b: 3 });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]).toEqual({ type: 'text', text: '5' });
  });

  it('tools/call for weather returns city forecast text', async () => {
    const server = makeMcpServer();
    const { client } = await connectClientToServer(server);

    const result = await client.callTool('weather', { city: 'tokyo' });

    expect(result.isError).not.toBe(true);
    const firstBlock = result.content[0];
    if (firstBlock?.type !== 'text') throw new Error('expected text block');
    expect(firstBlock.text).toMatch(/tokyo/i);
  });
});

describe('MCP error codes — the 3 the spec cares about most', () => {
  it('NotInitialized (-32002) when tools/* is called before initialize', async () => {
    const server = makeMcpServer();
    // build client manually so we can skip the handshake
    const transport = new InMemoryTransport(server);
    const client = new McpClient(transport);
    // note: no client.initialize() call here

    await expect(client.listTools()).rejects.toMatchObject({
      code: -32002,
      message: expect.stringMatching(/not initialized/i),
    });
  });

  it('ToolNotFound (-32003) for an unregistered tool name', async () => {
    const server = makeMcpServer();
    const { client } = await connectClientToServer(server);

    await expect(client.callTool('does-not-exist', {})).rejects.toMatchObject({
      code: -32003,
    });
  });

  it('ToolSchemaError (-32001) when calc receives a non-numeric argument', async () => {
    const server = makeMcpServer();
    const { client } = await connectClientToServer(server);

    await expect(
      client.callTool('calc', { op: 'add', a: 'nope', b: 3 }),
    ).rejects.toMatchObject({
      code: -32001,
    });
  });
});
```

Run:

```bash
pnpm test
```

You should see 6 passing tests across the chain + 3 error scenarios.

## The 4 ops of MCP v0.1

`@kiwa-lab/mcp` v0.1 covers the tool-use half of the Model Context Protocol spec. The remaining ops (resources / prompts / sampling / logging) land in a future release.

| op | direction | shape | notes |
|---|---|---|---|
| `initialize` | client → server | sync request | server latches an `initialized` flag; further tool ops fail until this succeeds |
| `notifications/initialized` | client → server | notification (no response) | signals the client is ready — mock accepts it as no-op |
| `tools/list` | client → server | sync request | returns the tool descriptors registered via `server.tools.register` |
| `tools/call` | client → server | sync request | schema-validates input, executes the handler, wraps in JSON-RPC result |

The mock enforces the same order as the real MCP spec. Trying to call `tools/list` before `initialize` returns `-32002 NotInitialized` — a mock that skipped the handshake would let bugs slip through, so kiwa refuses to do so.

## JSON-RPC error codes the mock reproduces

| code | name | trigger |
|---|---|---|
| `-32700` | ParseError | malformed JSON request |
| `-32600` | InvalidRequest | missing `jsonrpc`/`id`/`method` fields |
| `-32601` | MethodNotFound | unknown method |
| `-32602` | InvalidParams | required param missing |
| `-32603` | InternalError | unexpected server exception |
| `-32000` | ToolExecutionError | handler threw during execution |
| `-32001` | ToolSchemaError | input failed JSONSchema validation |
| `-32002` | NotInitialized | tool op called before handshake |
| `-32003` | ToolNotFound | unregistered tool name |

The last four are MCP-specific extensions. Tests that assert on these codes will keep passing when you swap the `InMemoryTransport` for a stdio child process transport, because the wire format is identical.

## Wiring MCP tools into Claude tool-use

Real MCP-aware Claude clients treat the tool descriptors returned by `tools/list` as `input_schema` blocks in Claude's `tool_use` API. The dogfood app `examples/dogfood-mcp-tool-agent` shows the full loop.

```ts
import { createAnthropicMock } from '@kiwa-lab/ai-llm';
import { connectClientToServer } from '@kiwa-lab/mcp';
import { makeMcpServer } from './server';

const server = makeMcpServer();
const { client: mcp } = await connectClientToServer(server);
const tools = await mcp.listTools();

const claude = createAnthropicMock({
  responses: {
    'weather in tokyo?': {
      content: 'let me check',
      toolCalls: [{ name: 'weather', input: { city: 'tokyo' } }],
    },
  },
});

const first = await claude.messages.create({
  model: 'claude-3-5-sonnet-mock',
  max_tokens: 200,
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  })),
  messages: [{ role: 'user', content: 'weather in tokyo?' }],
});

// Forward Claude's tool_use to the MCP tools/call op
const call = first.content.find((b) => b.type === 'tool_use');
if (call?.type === 'tool_use') {
  const result = await mcp.callTool(call.name, call.input as Record<string, unknown>);
  // ... feed result back to Claude as a tool_result block on turn 2 ...
}
```

## When to use MCP vs native tool-use

- **Use MCP** when your tools live behind a process boundary (a language-server-like server, a database gateway, a hardware bridge) and multiple client-side agents need to reuse them.
- **Use native Claude / OpenAI tool-use** when tools are functions inside your app process. There's no need for the JSON-RPC hop.
- **Use both** in the dogfood pattern above — the MCP server owns the schemas + implementations, and the LLM client threads them into the model prompt as native tool descriptors.

## Related

- [Tutorial 07 — OpenAI tool-use agent](./07-openai-tool-agent) — non-MCP tool loop for comparison
- [Tutorial 18 — Agent orchestration (LangGraph + Assistants v2)](./18-agent-orchestration) — stateful multi-turn agent
- [Concept — AI-LLM multimodal testing SSOT](../concepts/ai-llm-multimodal-testing) — includes MCP handshake gotchas
- [`@kiwa-lab/mcp` on npm](https://www.npmjs.com/package/@kiwa-lab/mcp)
- [Model Context Protocol spec](https://modelcontextprotocol.io/)
