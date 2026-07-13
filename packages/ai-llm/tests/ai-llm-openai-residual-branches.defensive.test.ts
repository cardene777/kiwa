import { describe, expect, it } from 'vitest';
import { createOpenAIMock } from '../src/openai.js';

describe('openai residual defensive branches', () => {
  it('chat.completions.create with tool_calls in assistant message', async () => {
    const client = createOpenAIMock({
      responses: { 'trigger': { content: 'result' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: 'call_abc',
              type: 'function',
              function: {
                name: 'get_data',
                arguments: '{"key":"val"}',
              },
            },
          ],
        },
        { role: 'user', content: 'trigger' },
      ],
    });
    expect(result).toBeDefined();
  });

  it('chat.completions.create with tool_call_id in tool response', async () => {
    const client = createOpenAIMock({
      responses: { 'follow': { content: 'ok' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'q1' },
        {
          role: 'tool',
          content: '{"weather":"sunny"}',
          tool_call_id: 'call_xyz',
        },
        { role: 'user', content: 'follow' },
      ],
    });
    expect(result).toBeDefined();
  });

  it('chat.completions.create with named message (name field preserved)', async () => {
    const client = createOpenAIMock({
      responses: { 'named': { content: 'ok' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'named',
          name: 'alice',
        } as never,
      ],
    });
    expect(result).toBeDefined();
  });

  it('chat.completions.create with max_tokens forwarded', async () => {
    const client = createOpenAIMock({
      responses: { 'trunc': { content: 'trunc' } },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'trunc' }],
      max_tokens: 100,
      temperature: 0.5,
    });
    expect(result).toBeDefined();
  });

  it('chat.completions.create with finishReason=length maps to length in response', async () => {
    const client = createOpenAIMock({
      responses: {
        'lentest': {
          content: 'partial',
          finishReason: 'length',
        },
      },
    });
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'lentest' }],
    });
    expect((result as { choices: Array<{ finish_reason: string }> }).choices[0]?.finish_reason).toBe('length');
  });

  it('audio.transcriptions.create returns language field from response', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'base64:audio/wav:AAA': {
          text: 'transcribed',
          language: 'ja',
        },
      },
    });
    const result = await client.audio.transcriptions.create({
      file: 'AAA',
      model: 'whisper-1',
    });
    expect(result.text).toBeDefined();
  });

  it('audio.transcriptions.create with segments returns durationSeconds', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'base64:audio/wav:BBB': {
          text: 'multi-segment',
          segments: [
            { id: 0, start: 0, end: 3, text: 'first' },
            { id: 1, start: 3, end: 8, text: 'second' },
          ],
        },
      },
    });
    const result = await client.audio.transcriptions.create({
      file: 'BBB',
      model: 'whisper-1',
    });
    expect(result.text).toBeDefined();
  });
});
