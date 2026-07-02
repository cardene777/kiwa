import { describe, expect, it } from 'vitest';
import {
  createOpenAIMock,
  type OpenAiChatCompletionsResponse,
  type OpenAiStreamChunk,
} from '../src/index.js';

describe('createOpenAIMock — chat.completions.create', () => {
  it('T-AI-OAI-001 returns non-streaming completion with assistant content', async () => {
    const client = createOpenAIMock({
      responses: { 'ping': { content: 'pong' } },
    });
    const res = (await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
    })) as OpenAiChatCompletionsResponse;
    expect(res.object).toBe('chat.completion');
    expect(res.choices[0]?.message.content).toBe('pong');
    expect(res.choices[0]?.finish_reason).toBe('stop');
    expect(res.usage.total_tokens).toBe(res.usage.prompt_tokens + res.usage.completion_tokens);
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
  });

  it('T-AI-OAI-002 threads system message into token estimate', async () => {
    const client = createOpenAIMock();
    const res = (await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'you are helpful' },
        { role: 'user', content: 'hi' },
      ],
    })) as OpenAiChatCompletionsResponse;
    // system prompt が prompt tokens に加算される
    expect(res.usage.prompt_tokens).toBeGreaterThan(0);
  });

  it('T-AI-OAI-003 emits tool_calls in the message when responses declare them', async () => {
    const client = createOpenAIMock({
      responses: {
        'lookup': {
          content: '',
          toolCalls: [
            { id: 'call_1', name: 'get_stock', arguments: '{"symbol":"AAPL"}' },
          ],
        },
      },
    });
    const res = (await client.chat.completions.create({
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_stock',
            description: 'get a stock quote',
            parameters: { type: 'object', properties: { symbol: { type: 'string' } } },
          },
        },
      ],
      messages: [{ role: 'user', content: 'lookup' }],
    })) as OpenAiChatCompletionsResponse;
    expect(res.choices[0]?.finish_reason).toBe('tool_calls');
    const tc = res.choices[0]?.message.tool_calls;
    expect(tc?.[0]?.function.name).toBe('get_stock');
    expect(tc?.[0]?.function.arguments).toBe('{"symbol":"AAPL"}');
  });

  it('T-AI-OAI-004 propagates tool response messages back through the loop', async () => {
    // OpenAI tool-use は multi-turn — assistant tool_call → tool role message
    // → 次 assistant 応答。 mock 側は last user prompt を key にするが、
    // tool role message も input shape として通ることを検証。
    const client = createOpenAIMock({
      defaultResponse: 'noop',
    });
    const res = (await client.chat.completions.create({
      messages: [
        { role: 'user', content: 'kick off' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            { id: 'call_1', type: 'function', function: { name: 't', arguments: '{}' } },
          ],
        },
        { role: 'tool', tool_call_id: 'call_1', content: 'tool result' },
      ],
    })) as OpenAiChatCompletionsResponse;
    expect(res.choices[0]?.message.content).toBeDefined();
  });
});

describe('createOpenAIMock — streaming', () => {
  it('T-AI-OAI-005 returns AsyncIterable when stream=true and yields delta chunks', async () => {
    const client = createOpenAIMock({
      responses: { 'chat': { content: 'hello world', chunks: ['hello ', 'world'] } },
    });
    const stream = client.chat.completions.create({
      stream: true,
      messages: [{ role: 'user', content: 'chat' }],
    }) as AsyncIterable<OpenAiStreamChunk>;
    const collected: string[] = [];
    let finishReason: string | null = null;
    for await (const chunk of stream) {
      const d = chunk.choices[0]?.delta;
      if (d?.content) collected.push(d.content);
      if (chunk.choices[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
    }
    expect(collected.join('')).toBe('hello world');
    expect(finishReason).toBe('stop');
  });

  it('T-AI-OAI-006 emits usage in the terminal chunk when streaming', async () => {
    const client = createOpenAIMock({
      responses: { 'stream': { content: 'ok' } },
    });
    const stream = client.chat.completions.create({
      stream: true,
      messages: [{ role: 'user', content: 'stream' }],
    }) as AsyncIterable<OpenAiStreamChunk>;
    let sawUsage = false;
    for await (const chunk of stream) {
      if (chunk.usage) {
        sawUsage = true;
        expect(chunk.usage.total_tokens).toBeGreaterThan(0);
      }
    }
    expect(sawUsage).toBe(true);
  });

  it('T-AI-OAI-007 records metrics for streaming calls too', async () => {
    const client = createOpenAIMock({ responses: { 'x': { content: 'y' } } });
    const stream = client.chat.completions.create({
      stream: true,
      messages: [{ role: 'user', content: 'x' }],
    }) as AsyncIterable<OpenAiStreamChunk>;
    for await (const _chunk of stream) {
      // consume
    }
    const m = client.getMetrics();
    expect(m.requests).toBe(1);
    expect(m.totalCostUsd).toBeGreaterThan(0);
  });
});
