import { describe, expect, it } from 'vitest';
import {
  createLangchainMock,
  type LangchainAIMessageChunk,
} from '../src/index.js';

describe('createLangchainMock — invoke', () => {
  it('T-AI-LC-001 returns AIMessage shape with response_metadata + usage_metadata', async () => {
    const client = createLangchainMock({
      responses: { 'hello': { content: 'world' } },
    });
    const msg = await client.invoke([{ role: 'human', content: 'hello' }]);
    expect(msg._type).toBe('AIMessage');
    expect(msg.content).toBe('world');
    expect(msg.response_metadata.finish_reason).toBe('stop');
    expect(msg.usage_metadata.total_tokens).toBe(
      msg.usage_metadata.input_tokens + msg.usage_metadata.output_tokens,
    );
    expect(msg._kiwa.costUsd).toBeGreaterThan(0);
  });

  it('T-AI-LC-002 threads system messages into token estimate', async () => {
    const client = createLangchainMock();
    const msg = await client.invoke([
      { role: 'system', content: 'you are helpful' },
      { role: 'human', content: 'hi' },
    ]);
    expect(msg.usage_metadata.input_tokens).toBeGreaterThan(0);
  });

  it('T-AI-LC-003 emits tool_calls in AIMessage when responses declare toolCalls', async () => {
    const client = createLangchainMock({
      responses: {
        'do it': {
          content: '',
          toolCalls: [
            { id: 'lc_1', name: 'lookup', arguments: '{"q":"kiwa"}' },
          ],
        },
      },
    });
    const msg = await client.invoke([{ role: 'human', content: 'do it' }]);
    expect(msg.response_metadata.finish_reason).toBe('tool_calls');
    expect(msg.tool_calls?.[0]?.name).toBe('lookup');
    expect(msg.tool_calls?.[0]?.args).toEqual({ q: 'kiwa' });
  });
});

describe('createLangchainMock — stream', () => {
  it('T-AI-LC-004 yields AIMessageChunk sequence and terminal metadata', async () => {
    const client = createLangchainMock({
      responses: { 'q': { content: 'answer', chunks: ['ans', 'wer'] } },
    });
    const collected: string[] = [];
    let terminal: LangchainAIMessageChunk | null = null;
    const iter = client.stream([{ role: 'human', content: 'q' }]);
    for await (const chunk of iter as AsyncIterable<LangchainAIMessageChunk>) {
      collected.push(chunk.content);
      if (chunk.response_metadata) terminal = chunk;
    }
    expect(collected.join('')).toBe('answer');
    expect(terminal?.response_metadata?.finish_reason).toBe('stop');
    expect(terminal?.usage_metadata?.total_tokens).toBeGreaterThan(0);
  });
});

describe('createLangchainMock — batch', () => {
  it('T-AI-LC-005 runs batches sequentially and returns AIMessages array', async () => {
    const client = createLangchainMock({
      responses: {
        'q1': { content: 'a1' },
        'q2': { content: 'a2' },
      },
    });
    const results = await client.batch([
      [{ role: 'human', content: 'q1' }],
      [{ role: 'human', content: 'q2' }],
    ]);
    expect(results.length).toBe(2);
    expect(results[0]?.content).toBe('a1');
    expect(results[1]?.content).toBe('a2');
  });

  it('T-AI-LC-006 identifies as kiwa-mock-chat-model via _llmType', () => {
    const client = createLangchainMock();
    expect(client._llmType()).toBe('kiwa-mock-chat-model');
  });
});
