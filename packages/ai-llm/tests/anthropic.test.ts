import { describe, expect, it } from 'vitest';
import { createAnthropicMock } from '../src/index.js';

describe('createAnthropicMock — messages.create', () => {
  it('T-AI-ANT-001 returns text content block for a matched user prompt', async () => {
    const client = createAnthropicMock({
      responses: {
        'hello': { content: 'hi there' },
      },
    });
    const res = await client.messages.create({
      model: 'claude-3-haiku',
      max_tokens: 200,
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(res.type).toBe('message');
    expect(res.role).toBe('assistant');
    expect(res.content).toEqual([{ type: 'text', text: 'hi there' }]);
    expect(res.stop_reason).toBe('end_turn');
    expect(res.usage.input_tokens).toBeGreaterThan(0);
    expect(res.usage.output_tokens).toBeGreaterThan(0);
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
    expect(res._kiwa.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('T-AI-ANT-002 falls back to defaultResponse when prompt is unmatched', async () => {
    const client = createAnthropicMock({ defaultResponse: 'default answer' });
    const res = await client.messages.create({
      messages: [{ role: 'user', content: 'anything' }],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'default answer' }]);
  });

  it('T-AI-ANT-003 threads system prompt into token estimate', async () => {
    const client = createAnthropicMock();
    const res = await client.messages.create({
      system: 'You are a helpful assistant that answers in one word.',
      messages: [{ role: 'user', content: 'hi' }],
    });
    // system prompt が長いので promptTokens は user prompt 単体より
    // 大きくなる。
    expect(res.usage.input_tokens).toBeGreaterThan(2);
  });

  it('T-AI-ANT-004 emits tool_use content block when responses declare toolCalls', async () => {
    const client = createAnthropicMock({
      responses: {
        'call the tool': {
          content: '',
          toolCalls: [
            { id: 'toolu_1', name: 'get_weather', arguments: '{"city":"tokyo"}' },
          ],
        },
      },
    });
    const res = await client.messages.create({
      tools: [
        {
          name: 'get_weather',
          description: 'get the weather',
          input_schema: {
            type: 'object',
            properties: { city: { type: 'string' } },
            required: ['city'],
          },
        },
      ],
      messages: [{ role: 'user', content: 'call the tool' }],
    });
    expect(res.stop_reason).toBe('tool_use');
    const toolBlock = res.content.find((c) => c.type === 'tool_use');
    expect(toolBlock).toBeDefined();
    if (toolBlock?.type === 'tool_use') {
      expect(toolBlock.name).toBe('get_weather');
      expect(toolBlock.input).toEqual({ city: 'tokyo' });
    }
  });

  it('T-AI-ANT-005 records cumulative metrics across multiple calls', async () => {
    const client = createAnthropicMock({ responses: { 'q': { content: 'a' } } });
    await client.messages.create({ messages: [{ role: 'user', content: 'q' }] });
    await client.messages.create({ messages: [{ role: 'user', content: 'q' }] });
    const m = client.getMetrics();
    expect(m.requests).toBe(2);
    expect(m.totalCostUsd).toBeGreaterThan(0);
    expect(m.latencySamplesMs.length).toBe(2);
  });
});

describe('createAnthropicMock — messages.stream', () => {
  it('T-AI-ANT-006 emits event sequence with content_block_delta and message_stop', async () => {
    const client = createAnthropicMock({
      responses: { 'hello': { content: 'hello world' } },
    });
    const events = [];
    for await (const ev of client.messages.stream({
      messages: [{ role: 'user', content: 'hello' }],
    })) {
      events.push(ev.type);
    }
    expect(events[0]).toBe('message_start');
    expect(events).toContain('content_block_delta');
    expect(events).toContain('content_block_stop');
    expect(events[events.length - 1]).toBe('message_stop');
  });

  it('T-AI-ANT-007 emits full text across delta events', async () => {
    const client = createAnthropicMock({
      responses: {
        'stream test': { content: 'streamed content ok', chunks: ['stream', 'ed ', 'content ', 'ok'] },
      },
    });
    const collected: string[] = [];
    for await (const ev of client.messages.stream({
      messages: [{ role: 'user', content: 'stream test' }],
    })) {
      if (ev.type === 'content_block_delta' && ev.delta && 'text' in ev.delta) {
        collected.push(ev.delta.text);
      }
    }
    expect(collected.join('')).toBe('streamed content ok');
  });

  it('T-AI-ANT-008 reset zeroes accumulated metrics', async () => {
    const client = createAnthropicMock({ responses: { 'q': { content: 'a' } } });
    await client.messages.create({ messages: [{ role: 'user', content: 'q' }] });
    expect(client.getMetrics().requests).toBe(1);
    client.reset();
    expect(client.getMetrics().requests).toBe(0);
    expect(client.getMetrics().totalCostUsd).toBe(0);
  });
});
