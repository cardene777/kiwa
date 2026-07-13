import { describe, expect, it } from 'vitest';
import { createOpenAIMock } from '../src/openai.js';

describe('openai mock defensive branches', () => {
  it('transcribeAudio via url falls back to default when key missing', async () => {
    const client = createOpenAIMock({});
    const result = await client.transcribeAudio({
      kind: 'url',
      url: 'https://example.com/audio.wav',
    });
    expect(result.text).toBe('transcribed audio');
    expect(result.language).toBe('en');
  });

  it('transcribeAudio via base64 falls back to default when key missing', async () => {
    const client = createOpenAIMock({});
    const result = await client.transcribeAudio({
      kind: 'base64',
      mediaType: 'audio/mp3',
      data: 'aGVsbG8=',
    });
    expect(result.text).toBe('transcribed audio');
  });

  it('transcribeAudio uses configured transcription when key matches', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'url:https://example.com/hi.wav': {
          text: 'hello world',
          language: 'ja',
          segments: [
            { id: 0, start: 0, end: 3, text: 'hello world' },
          ],
        },
      },
    });
    const result = await client.transcribeAudio({
      kind: 'url',
      url: 'https://example.com/hi.wav',
    });
    expect(result.text).toBe('hello world');
    expect(result.language).toBe('ja');
    expect(result.durationSeconds).toBe(3);
  });

  it('transcribeAudio with defaultTranscription config uses that value', async () => {
    const client = createOpenAIMock({
      defaultTranscription: 'custom-default',
    });
    const result = await client.transcribeAudio({
      kind: 'url',
      url: 'https://example.com/none.wav',
    });
    expect(result.text).toBe('custom-default');
  });

  it('transcribeAudio base64 without data uses empty-string fallback in key', async () => {
    const client = createOpenAIMock({});
    const result = await client.transcribeAudio({
      kind: 'base64',
    });
    expect(result).toBeDefined();
    expect(result.text).toBe('transcribed audio');
  });

  it('transcribeAudio url without url uses empty-string fallback in key', async () => {
    const client = createOpenAIMock({});
    const result = await client.transcribeAudio({
      kind: 'url',
    });
    expect(result).toBeDefined();
    expect(result.text).toBe('transcribed audio');
  });
});
