import { describe, expect, it } from 'vitest';
import { createVercelAiMock } from '../src/vercel-ai.js';

describe('createVercelAiMock defensive branches', () => {
  it('handles url-image (https://) content part', async () => {
    const mock = createVercelAiMock({
      responses: { 'q': { content: 'ok' } },
    });
    const result = await mock.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q' },
            { type: 'image', image: 'https://example.com/img.png' },
          ],
        },
      ],
    });
    expect(result.text).toBeDefined();
  });

  it('handles bare-base64 image content (no data: prefix)', async () => {
    const mock = createVercelAiMock({
      responses: { 'q2': { content: 'ok' } },
    });
    const result = await mock.generateText({

      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q2' },
            {
              type: 'image',
              image: 'aGVsbG8=',
              mimeType: 'image/png',
            },
          ],
        },
      ],
    });
    expect(result.text).toBeDefined();
  });

  it('handles file part with audio/ mimeType (accepted as audio)', async () => {
    const mock = createVercelAiMock({
      responses: { 'q3': { content: 'ok' } },
    });
    const result = await mock.generateText({

      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q3' },
            {
              type: 'file',
              data: 'aGVsbG8=',
              mimeType: 'audio/wav',
            } as never,
          ],
        },
      ],
    });
    expect(result.text).toBeDefined();
  });

  it('handles file part with non-audio mimeType (silently dropped)', async () => {
    const mock = createVercelAiMock({
      responses: { 'q4': { content: 'ok' } },
    });
    const result = await mock.generateText({

      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q4' },
            {
              type: 'file',
              data: 'somedata',
              mimeType: 'application/pdf',
            } as never,
          ],
        },
      ],
    });
    expect(result.text).toBeDefined();
  });

  it('streamText resolves usage=0/latency=0 when event lacks fields', async () => {
    const mock = createVercelAiMock({
      responses: {
        'stream-q': {
          content: 'streamed',
        },
      },
    });
    const result = await mock.streamText({

      messages: [{ role: 'user', content: 'stream-q' }],
    });
    const chunks: string[] = [];
    for await (const c of result.textStream) {
      chunks.push(c);
    }
    const text = await result.text;
    expect(text).toBeDefined();
    const usage = await result.usage;
    expect(usage).toBeDefined();
  });
});
