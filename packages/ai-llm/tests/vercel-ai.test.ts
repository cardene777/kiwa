import { describe, expect, it } from 'vitest';
import { createVercelAiMock } from '../src/index.js';

describe('createVercelAiMock — generateText', () => {
  it('T-AI-VER-001 returns full text plus usage after single call', async () => {
    const client = createVercelAiMock({
      responses: { 'hi': { content: 'hello!' } },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.text).toBe('hello!');
    expect(res.usage.totalTokens).toBe(res.usage.promptTokens + res.usage.completionTokens);
    expect(res.finishReason).toBe('stop');
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
  });

  it('T-AI-VER-002 emits Vercel tool-calls shape when responses declare toolCalls', async () => {
    const client = createVercelAiMock({
      responses: {
        'call': {
          content: '',
          toolCalls: [
            { id: 'call_v', name: 'add', arguments: '{"a":1,"b":2}' },
          ],
        },
      },
    });
    const res = await client.generateText({
      tools: {
        add: {
          description: 'add two numbers',
          parameters: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } },
        },
      },
      messages: [{ role: 'user', content: 'call' }],
    });
    expect(res.finishReason).toBe('tool-calls');
    expect(res.toolCalls[0]?.toolName).toBe('add');
    expect(res.toolCalls[0]?.args).toEqual({ a: 1, b: 2 });
  });

  it('T-AI-VER-003 threads system field into token estimate', async () => {
    const client = createVercelAiMock();
    const res = await client.generateText({
      system: 'system instructions long enough',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.usage.promptTokens).toBeGreaterThan(2);
  });
});

describe('createVercelAiMock — streamText', () => {
  it('T-AI-VER-004 exposes textStream that yields chunks', async () => {
    const client = createVercelAiMock({
      responses: { 'q': { content: 'streamed', chunks: ['stream', 'ed'] } },
    });
    const res = client.streamText({
      messages: [{ role: 'user', content: 'q' }],
    });
    const collected: string[] = [];
    for await (const c of res.textStream) collected.push(c);
    expect(collected.join('')).toBe('streamed');
    expect(await res.text).toBe('streamed');
    const u = await res.usage;
    expect(u.totalTokens).toBeGreaterThan(0);
    const fr = await res.finishReason;
    expect(fr).toBe('stop');
    const k = await res._kiwa;
    expect(k.costUsd).toBeGreaterThan(0);
  });

  it('T-AI-VER-005 records metrics for streamText calls', async () => {
    const client = createVercelAiMock({ responses: { 'a': { content: 'b' } } });
    const res = client.streamText({
      messages: [{ role: 'user', content: 'a' }],
    });
    for await (const _c of res.textStream) {
      // consume
    }
    await res.text;
    const m = client.getMetrics();
    expect(m.requests).toBe(1);
  });

  it('T-AI-VER-006 reset clears cumulative state', async () => {
    const client = createVercelAiMock({ defaultResponse: 'ok' });
    await client.generateText({ messages: [{ role: 'user', content: 'x' }] });
    expect(client.getMetrics().requests).toBe(1);
    client.reset();
    expect(client.getMetrics().requests).toBe(0);
  });
});
