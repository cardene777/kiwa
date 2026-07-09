import {
  createAnthropicMock,
  type AnthropicContentBlock,
  type AnthropicMessagesRequest,
  type AnthropicMessagesResponse,
  type MockResponse,
} from '@kiwa-lab/ai-llm';
import {
  McpServer,
  connectClientToServer,
  type McpClient,
  type McpTool,
  type ToolCallResult,
} from '@kiwa-lab/mcp';
import { ALL_TOOLS, TOOL_HANDLERS } from '../tools/schema.js';
import type {
  AgentLoopResult,
  AgentLoopStep,
  AgentToolCall,
  AgentToolResult,
  McpAgentAdapter,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up an in-process `@kiwa-lab/mcp` `McpServer` with the
 * 3 dogfood tools registered, connects a `McpClient` via `InMemoryTransport`
 * (courtesy of {@link connectClientToServer}), and drives an Anthropic Claude
 * tool-use loop through `@kiwa-lab/ai-llm` `createAnthropicMock`. Every
 * `tool_use` block the LLM emits is forwarded to `McpClient.callTool`, and
 * the MCP result is fed back as an Anthropic `tool_result` block on the next
 * turn.
 *
 * The mock response bank is intentionally close to the shape a Claude 3.5
 * Sonnet tool-use reply would take — the fidelity harness compares mock vs
 * real behaviour (tool schema round-trip, call order, MCP result shape)
 * rather than exact text.
 */
export function makeMockAdapter(): McpAgentAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    totalCostUsd: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalToolCalls: 0,
    latencySamplesMs: [] as number[],
    requests: 0,
  };

  // The MCP server + client live for the adapter's lifetime; reset() tears
  // them down and re-creates them so the next test starts clean.
  let server: McpServer | null = null;
  let client: McpClient | null = null;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensureServer(): McpServer {
    if (server) return server;
    const s = new McpServer({ name: 'kiwa-mcp-mock', version: '0.1.0' });
    for (const tool of ALL_TOOLS) {
      const handler = TOOL_HANDLERS[tool.name];
      if (!handler) throw new Error(`missing handler for tool ${tool.name}`);
      s.register(tool, handler);
    }
    server = s;
    return s;
  }

  async function ensureClient(): Promise<McpClient> {
    if (client) return client;
    const s = ensureServer();
    // connectClientToServer runs initialize under the hood so subsequent
    // tools/list + tools/call succeed without additional wiring.
    const { client: c } = await connectClientToServer(s, {
      name: 'dogfood-mcp-tool-agent',
      version: '0.0.1',
    });
    client = c;
    return c;
  }

  function absorbResponse(res: AnthropicMessagesResponse): void {
    metricsAgg.totalCostUsd += res._kiwa.costUsd;
    metricsAgg.totalPromptTokens += res.usage.input_tokens;
    metricsAgg.totalCompletionTokens += res.usage.output_tokens;
    metricsAgg.latencySamplesMs.push(res._kiwa.latencyMs);
    metricsAgg.requests += 1;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async handshake() {
      // ensureClient runs initialize; capture the negotiated version afterward.
      const c = await ensureClient();
      const protocolVersion = c.serverProtocolVersion ?? '2024-11-05';
      const s = ensureServer();
      record('handshake', true, {
        detail: {
          protocolVersion,
          serverName: s.name,
          toolCount: s.toolCount,
        },
      });
      return {
        protocolVersion,
        serverName: s.name,
        serverVersion: s.version,
      };
    },

    async listTools() {
      const c = await ensureClient();
      const tools = await c.listTools();
      record('listTools', true, { detail: { toolCount: tools.length } });
      return tools;
    },

    async callTool(name, args) {
      const c = await ensureClient();
      try {
        const result = await c.callTool(name, args);
        metricsAgg.totalToolCalls += 1;
        record('callTool', !result.isError, {
          detail: { name, isError: result.isError },
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        record('callTool', false, {
          errorKind: 'MCP_TOOL_ERROR',
          detail: { name, message },
        });
        throw err;
      }
    },

    async runMcpToolLoop(input) {
      const c = await ensureClient();
      const maxIter = input.maxIterations ?? 5;
      const steps: AgentLoopStep[] = [];
      const toolCallOrder: string[] = [];
      const parallelBatches: number[] = [];
      const conversation: AnthropicMessagesRequest['messages'] = [
        { role: 'user', content: input.userMessage },
      ];

      let finalText = '';
      let finish: AgentLoopResult['finishReason'] = 'iteration_cap';

      for (let iter = 0; iter < maxIter; iter += 1) {
        // Per-turn mock — Anthropic follow-up turns append tool_result blocks
        // and the mock keys its response bank on the last text-carrying user
        // block. To keep the loop from looping on the same prompt, wire a
        // fresh mock per turn with a distinct response bank.
        const llm = createAnthropicMock({
          model: 'claude-3-5-sonnet-mock',
          responses: buildResponseBank(iter),
          artificialLatencyMs: 6,
          costPer1kTokens: { prompt: 0.003, completion: 0.015 },
        });
        const req: AnthropicMessagesRequest = {
          model: 'claude-3-5-sonnet-mock',
          messages: conversation,
          max_tokens: 512,
        };
        if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
        const res = await llm.messages.create(req);
        absorbResponse(res);

        const toolCalls = extractToolCalls(res);
        const step: AgentLoopStep = {
          iteration: iter,
          toolCalls,
          toolResults: [],
          finishReason: res.stop_reason,
          costUsd: res._kiwa.costUsd,
          latencyMs: res._kiwa.latencyMs,
          usage: {
            promptTokens: res.usage.input_tokens,
            completionTokens: res.usage.output_tokens,
            totalTokens: res.usage.input_tokens + res.usage.output_tokens,
          },
        };

        if (toolCalls.length === 0 || res.stop_reason !== 'tool_use') {
          finalText = extractText(res);
          finish = res.stop_reason === 'max_tokens' ? 'max_tokens' : 'end_turn';
          steps.push(step);
          break;
        }

        // Append the assistant turn verbatim so the follow-up turn matches
        // Anthropic's expected content-block layout (tool_use blocks first,
        // optional trailing text). The Anthropic API requires the tool_use
        // block on the assistant turn before the matching tool_result on the
        // subsequent user turn.
        conversation.push({
          role: 'assistant',
          content: res.content,
        });

        if (toolCalls.length > 1) parallelBatches.push(toolCalls.length);

        // Resolve every tool_use via MCP client — mirrors how a real MCP-aware
        // Claude client would forward each tool call to the MCP server and
        // await the JSON-RPC response before the next turn.
        const toolResultBlocks: AnthropicContentBlock[] = [];
        for (const call of toolCalls) {
          toolCallOrder.push(call.name);
          let result: ToolCallResult;
          try {
            result = await c.callTool(call.name, call.args);
            metricsAgg.totalToolCalls += 1;
            record('callTool', !result.isError, {
              detail: { name: call.name, isError: result.isError },
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            record('callTool', false, {
              errorKind: 'MCP_TOOL_ERROR',
              detail: { name: call.name, message },
            });
            result = { content: [{ type: 'text', text: message }], isError: true };
          }
          const resultText = extractContentText(result);
          const agentResult: AgentToolResult = {
            toolUseId: call.id,
            toolName: call.name,
            text: resultText,
            isError: result.isError,
          };
          step.toolResults.push(agentResult);
          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: resultText,
          });
        }
        conversation.push({
          role: 'user',
          content: toolResultBlocks,
        });
        steps.push(step);
      }

      record('runMcpToolLoop', true, {
        detail: {
          iterations: steps.length,
          toolCallOrder,
          parallelBatches,
          finish,
        },
      });

      return {
        finalText,
        steps,
        toolCallOrder,
        parallelBatches,
        ...summariseSteps(steps),
        finishReason: finish,
      };
    },

    metrics() {
      return {
        totalCostUsd: metricsAgg.totalCostUsd,
        totalPromptTokens: metricsAgg.totalPromptTokens,
        totalCompletionTokens: metricsAgg.totalCompletionTokens,
        totalTokens: metricsAgg.totalPromptTokens + metricsAgg.totalCompletionTokens,
        totalToolCalls: metricsAgg.totalToolCalls,
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        requests: metricsAgg.requests,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.totalCostUsd = 0;
      metricsAgg.totalPromptTokens = 0;
      metricsAgg.totalCompletionTokens = 0;
      metricsAgg.totalToolCalls = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.requests = 0;
      // Tear down the MCP server + client so the next handshake exercises the
      // full protocol chain from scratch (mirrors real MCP where a fresh
      // stdio child + JSON-RPC pipe reset per test session).
      server = null;
      client = null;
    },
  };
}

function extractToolCalls(res: AnthropicMessagesResponse): AgentToolCall[] {
  return res.content
    .filter(
      (c): c is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
        c.type === 'tool_use',
    )
    .map((c) => ({ id: c.id, name: c.name, args: c.input }));
}

function extractText(res: AnthropicMessagesResponse): string {
  return res.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

function extractContentText(result: ToolCallResult): string {
  return result.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

function summariseSteps(steps: AgentLoopStep[]): {
  totalCostUsd: number;
  totalLatencyMs: number;
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
} {
  let cost = 0;
  let latency = 0;
  let prompt = 0;
  let completion = 0;
  for (const s of steps) {
    cost += s.costUsd;
    latency += s.latencyMs;
    prompt += s.usage.promptTokens;
    completion += s.usage.completionTokens;
  }
  return {
    totalCostUsd: cost,
    totalLatencyMs: latency,
    totalUsage: {
      promptTokens: prompt,
      completionTokens: completion,
      totalTokens: prompt + completion,
    },
  };
}

/**
 * Per-turn MockConfig factory for the canonical dogfood scenario prompt.
 *
 * The scenario the tests + docs describe: "Fetch the weather in Tokyo,
 * convert the temperature to Fahrenheit using the calculator, and search
 * for typhoon-related news." Turn 0 requests `weather`, turn 1 requests
 * `calculator`, turn 2 requests `search`, turn 3+ returns the finalisation
 * text.
 *
 * The mock engine keys its response lookup on the last user message's text
 * content. On turn 0 that is the original prompt; on turn 1+ the follow-up
 * user turn is a list of `tool_result` blocks whose text content extracts
 * to an empty string (the tool_result payload is not a text block). To
 * avoid an infinite loop on the same bank entry, the factory below returns
 * a `defaultResponse` per turn (rather than a keyed bank), so the fresh
 * mock instance always resolves to the correct turn-index reply regardless
 * of what the follow-up user message extracts to.
 */
function buildResponseBank(iteration: number): Record<string, MockResponse> {
  const prompt =
    'Fetch the weather in Tokyo, convert the temperature to Fahrenheit, and search for typhoon-related news.';
  const turn = turnResponse(iteration);
  // Key the response on both the original prompt AND the empty string
  // (tool_result-only user turns) so the follow-up turns still resolve.
  return {
    [prompt]: turn,
    '': turn,
  };
}

function turnResponse(iteration: number): MockResponse {
  if (iteration === 0) {
    return {
      content: '',
      toolCalls: [
        {
          id: 'toolu_mock_weather',
          name: 'weather',
          arguments: JSON.stringify({ city: 'tokyo' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 60, completionTokens: 22 },
    };
  }
  if (iteration === 1) {
    return {
      content: '',
      toolCalls: [
        {
          id: 'toolu_mock_calc',
          name: 'calculator',
          arguments: JSON.stringify({ op: 'multiply', a: 22, b: 1.8 }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 78, completionTokens: 26 },
    };
  }
  if (iteration === 2) {
    return {
      content: '',
      toolCalls: [
        {
          id: 'toolu_mock_search',
          name: 'search',
          arguments: JSON.stringify({ query: 'typhoon japan' }),
        },
      ],
      finishReason: 'tool_use',
      usage: { promptTokens: 96, completionTokens: 24 },
    };
  }
  return {
    content:
      'Tokyo is 22C (about 39.6 in the raw multiplier, i.e. 71.6F after adding 32). Related news: doc-3 titled "Typhoon Nari approaches Kanto".',
    finishReason: 'stop',
    usage: { promptTokens: 128, completionTokens: 38 },
  };
}
