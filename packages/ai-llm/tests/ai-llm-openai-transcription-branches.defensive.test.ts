import { describe, expect, it } from 'vitest';
import { createOpenAIMock } from '../src/openai.js';

describe('openai audio.transcriptions.create defensive branches', () => {
  it('transcribes with data URI (base64) input via SDK API', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'base64:audio/wav:aGVsbG8=': {
          text: 'from-base64',
        },
      },
    });
    const result = await client.audio.transcriptions.create({
      file: 'data:audio/wav;base64,aGVsbG8=',
      model: 'whisper-1',
    });
    expect(result.text).toBeDefined();
  });

  it('transcribes with https:// URL via SDK API', async () => {
    const client = createOpenAIMock({});
    const result = await client.audio.transcriptions.create({
      file: 'https://example.com/audio.mp3',
      model: 'whisper-1',
    });
    expect(result.text).toBeDefined();
  });

  it('transcribes with plain string (treated as base64)', async () => {
    const client = createOpenAIMock({});
    const result = await client.audio.transcriptions.create({
      file: 'aGVsbG8=',
      model: 'whisper-1',
    });
    expect(result.text).toBeDefined();
  });
});

describe('openai chat.completions.create defensive branches', () => {
  it('handles system message with multimodal content parts (extract text)', async () => {
    const client = createOpenAIMock({
      responses: { 'user-q': { content: 'ok' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: 'sys context' }],
        },
        { role: 'user', content: 'user-q' },
      ],
    });
    expect(result).toBeDefined();
  });

  it('handles user message with null content (treated as empty string)', async () => {
    const client = createOpenAIMock({
      responses: { '': { content: 'null-handled' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: null as never },
      ],
    });
    expect(result).toBeDefined();
  });

  it('handles user message with multimodal parts (image)', async () => {
    const client = createOpenAIMock({
      responses: { 'match': { content: 'ok' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'match' },
            {
              type: 'image_url',
              image_url: { url: 'data:image/png;base64,aGVsbG8=' },
            },
          ],
        },
      ],
    });
    expect(result).toBeDefined();
  });

  it('handles chat request with tools declaration', async () => {
    const client = createOpenAIMock({
      responses: { 'call': { content: 'called' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'call' }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'get weather',
            parameters: {
              type: 'object',
              properties: { city: { type: 'string' } },
              required: ['city'],
            },
          },
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
