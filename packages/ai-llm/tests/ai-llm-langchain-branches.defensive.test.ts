import { describe, expect, it } from 'vitest';
import { createLangchainMock } from '../src/langchain.js';

describe('langchain mock defensive branches', () => {
  it('invoke with system + human string messages extracts system prompt', async () => {
    const client = createLangchainMock({
      responses: { 'hello': { content: 'hi' } },
    });
    const res = await client.invoke([
      { role: 'system', content: 'be helpful' },
      { role: 'human', content: 'hello' },
    ]);
    expect(res.content).toBe('hi');
  });

  it('invoke with tool message (tool_call_id + name) preserves fields', async () => {
    const client = createLangchainMock({
      responses: { 'ok': { content: 'ok' } },
    });
    const res = await client.invoke([
      { role: 'human', content: 'q' },
      {
        role: 'tool',
        content: '{"weather":"sunny"}',
        tool_call_id: 'toolu_1',
        name: 'get_weather',
      },
      { role: 'human', content: 'ok' },
    ]);
    expect(res.content).toBe('ok');
  });

  it('invoke with multimodal image_url data URI is parsed as base64', async () => {
    const client = createLangchainMock({
      responses: { 'match': { content: 'ok' } },
    });
    const res = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'match' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/png;base64,aGVsbG8=' },
          },
        ],
      },
    ]);
    expect(res).toBeDefined();
  });

  it('invoke with multimodal https image_url is parsed as url', async () => {
    const client = createLangchainMock({
      responses: { 'match2': { content: 'ok' } },
    });
    const res = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'match2' },
          {
            type: 'image_url',
            image_url: { url: 'https://example.com/x.png', detail: 'high' },
          },
        ],
      },
    ]);
    expect(res).toBeDefined();
  });

  it('invoke with multimodal plain-string image_url falls back to base64 image/jpeg', async () => {
    const client = createLangchainMock({
      responses: { 'match3': { content: 'ok' } },
    });
    const res = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'match3' },
          {
            type: 'image_url',
            image_url: 'aGVsbG8=',
          },
        ],
      },
    ]);
    expect(res).toBeDefined();
  });

  it('invoke with multimodal system message extracts converted text as systemPrompt', async () => {
    const client = createLangchainMock({
      responses: { 'sys-mm': { content: 'ok' } },
    });
    const res = await client.invoke([
      {
        role: 'system',
        content: [{ type: 'text', text: 'be helpful' }],
      },
      { role: 'human', content: 'sys-mm' },
    ]);
    expect(res).toBeDefined();
  });

  it('invoke returns finish_reason=length when engine reports length', async () => {
    const client = createLangchainMock({
      responses: {
        'lentest': {
          content: 'partial',
          finishReason: 'length',
        },
      },
    });
    const res = await client.invoke([
      { role: 'human', content: 'lentest' },
    ]);
    expect(res.response_metadata.finish_reason).toBe('length');
  });

  it('invoke handles tool call with invalid JSON args (falls back to raw)', async () => {
    const client = createLangchainMock({
      responses: {
        'bad-json': {
          content: '',
          toolCalls: [
            { id: 't1', name: 'noop', arguments: '{not-valid' },
          ],
        },
      },
    });
    const res = await client.invoke([
      { role: 'human', content: 'bad-json' },
    ]);
    expect(res.tool_calls).toBeDefined();
    expect(res.tool_calls?.[0]?.args).toEqual({ raw: '{not-valid' });
  });

  it('batch invokes multiple message groups sequentially', async () => {
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
    expect(results).toHaveLength(2);
    expect(results[0]?.content).toBe('a1');
    expect(results[1]?.content).toBe('a2');
  });
});
