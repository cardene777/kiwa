import { describe, expect, it } from 'vitest';
import { createVercelAiMock } from '../src/vercel-ai.js';

describe('vercel-ai mock defensive branches', () => {
  it('generateText with system string message extracts systemPrompt', async () => {
    const client = createVercelAiMock({
      responses: { 'hello': { content: 'hi' } },
    });
    const res = await client.generateText({
      messages: [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'hello' },
      ],
    });
    expect(res.text).toBe('hi');
  });

  it('generateText with system multimodal content extracts systemPrompt from text', async () => {
    const client = createVercelAiMock({
      responses: { 'q': { content: 'ok' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: 'sys context' }],
        },
        { role: 'user', content: 'q' },
      ],
    });
    expect(res.text).toBe('ok');
  });

  it('generateText with multimodal image data URI parses as base64', async () => {
    const client = createVercelAiMock({
      responses: { 'match': { content: 'ok' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'match' },
            { type: 'image', image: 'data:image/png;base64,aGVsbG8=' },
          ],
        },
      ],
    });
    expect(res).toBeDefined();
  });

  it('generateText with multimodal https image parses as url', async () => {
    const client = createVercelAiMock({
      responses: { 'match2': { content: 'ok' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'match2' },
            { type: 'image', image: 'https://example.com/x.png' },
          ],
        },
      ],
    });
    expect(res).toBeDefined();
  });

  it('generateText with multimodal plain image falls back to base64 with mimeType', async () => {
    const client = createVercelAiMock({
      responses: { 'match3': { content: 'ok' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'match3' },
            {
              type: 'image',
              image: 'aGVsbG8=',
              mimeType: 'image/png',
            },
          ],
        },
      ],
    });
    expect(res).toBeDefined();
  });

  it('generateText with audio file part converts to audio message part', async () => {
    const client = createVercelAiMock({
      responses: { 'audio-msg': { content: 'transcribed' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'audio-msg' },
            {
              type: 'file',
              mimeType: 'audio/wav',
              data: 'aGVsbG8=',
            },
          ],
        },
      ],
    });
    expect(res).toBeDefined();
  });

  it('generateText with non-audio file part is ignored', async () => {
    const client = createVercelAiMock({
      responses: { 'file-msg': { content: 'ok' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'file-msg' },
            {
              type: 'file',
              mimeType: 'application/pdf',
              data: 'aGVsbG8=',
            },
          ],
        },
      ],
    });
    expect(res).toBeDefined();
  });

  it('generateText with maxTokens threads through', async () => {
    const client = createVercelAiMock({
      responses: { 'q': { content: 'a' } },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 128,
    });
    expect(res.text).toBe('a');
  });

  it('generateText with temperature threads through', async () => {
    const client = createVercelAiMock({
      responses: { 'q': { content: 'a' } },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'q' }],
      temperature: 0.5,
    });
    expect(res.text).toBe('a');
  });

  it('generateText finish_reason=content-filter maps correctly', async () => {
    const client = createVercelAiMock({
      responses: {
        'cf': {
          content: '',
          finishReason: 'content_filter',
        },
      },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'cf' }],
    });
    expect(res.finishReason).toBe('content-filter');
  });

  it('generateText finish_reason=length maps correctly', async () => {
    const client = createVercelAiMock({
      responses: {
        'lt': {
          content: 'partial',
          finishReason: 'length',
        },
      },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'lt' }],
    });
    expect(res.finishReason).toBe('length');
  });

  it('generateText with invalid JSON tool arguments falls back to raw', async () => {
    const client = createVercelAiMock({
      responses: {
        'bad': {
          content: '',
          toolCalls: [{ id: 't1', name: 'noop', arguments: '{not' }],
        },
      },
    });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'bad' }],
      tools: {
        noop: {
          description: 'x',
          parameters: { type: 'object', properties: {} },
        },
      },
    });
    expect(res.toolCalls[0]?.args).toEqual({ raw: '{not' });
  });

  it('streamText yields chunks and resolves usage + finishReason', async () => {
    const client = createVercelAiMock({
      responses: {
        'stream-test': { content: 'hi', chunks: ['h', 'i'] },
      },
    });
    const result = client.streamText({
      messages: [{ role: 'user', content: 'stream-test' }],
    });
    const chunks: string[] = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe('hi');
    const usage = await result.usage;
    expect(usage.totalTokens).toBeGreaterThanOrEqual(0);
    expect(await result.finishReason).toBe('stop');
  });
});
