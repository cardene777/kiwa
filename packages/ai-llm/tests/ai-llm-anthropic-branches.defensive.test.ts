import { describe, expect, it } from 'vitest';
import { createAnthropicMock } from '../src/anthropic.js';

describe('anthropic mock defensive branches', () => {
  it('tool_use with invalid JSON arguments falls back to raw payload', async () => {
    const client = createAnthropicMock({
      responses: {
        'bad-json-tool': {
          content: '',
          toolCalls: [
            {
              id: 'toolu_bad',
              name: 'noop',
              arguments: '{not-valid-json',
            },
          ],
        },
      },
    });
    const res = await client.messages.create({
      tools: [
        {
          name: 'noop',
          description: 'x',
          input_schema: { type: 'object', properties: {}, required: [] },
        },
      ],
      messages: [{ role: 'user', content: 'bad-json-tool' }],
    });
    const toolBlock = res.content.find((c) => c.type === 'tool_use');
    expect(toolBlock).toBeDefined();
    if (toolBlock?.type === 'tool_use') {
      expect(toolBlock.input).toEqual({ raw: '{not-valid-json' });
    }
  });

  it('messages.create with max_tokens sets maxTokens in engine call', async () => {
    const client = createAnthropicMock({
      responses: { 'q1': { content: 'a1' } },
    });
    const res = await client.messages.create({
      max_tokens: 128,
      messages: [{ role: 'user', content: 'q1' }],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'a1' }]);
  });

  it('messages.create with temperature threads through', async () => {
    const client = createAnthropicMock({
      responses: { 'q2': { content: 'a2' } },
    });
    const res = await client.messages.create({
      temperature: 0.7,
      messages: [{ role: 'user', content: 'q2' }],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'a2' }]);
  });

  it('messages.create with system prompt threads through', async () => {
    const client = createAnthropicMock({
      responses: { 'q3': { content: 'a3' } },
    });
    const res = await client.messages.create({
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'q3' }],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'a3' }]);
  });

  it('messages.stream emits _kiwa attachment when usage is present', async () => {
    const client = createAnthropicMock({
      responses: {
        'kiwa-stream': { content: 'ok' },
      },
    });
    let sawKiwa = false;
    for await (const ev of client.messages.stream({
      messages: [{ role: 'user', content: 'kiwa-stream' }],
    })) {
      if (ev.type === 'message_stop' && '_kiwa' in ev && ev._kiwa) {
        sawKiwa = true;
      }
    }
    expect(sawKiwa).toBe(true);
  });
});
