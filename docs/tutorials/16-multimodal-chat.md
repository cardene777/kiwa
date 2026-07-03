# Multimodal chat — image + audio + Whisper transcription in 10 min

## What you'll build

A vitest test file that exercises **four multimodal Anthropic + OpenAI + Vercel AI + LangChain flows** — an Anthropic vision reply against a base64 image, an OpenAI vision reply against a data-URL image with `detail: 'high'`, an OpenAI Whisper transcription against a URL-hosted audio file, and a Vercel AI SDK multimodal `generateText` against a hosted image — using `@kiwa-test/ai-llm` v0.2 multimodal mocks. Every reply is deterministic against a canned response bank, so tests stay flake-free while still measuring cost + token accounting shaped like the real APIs.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-multimodal-chat && cd kiwa-multimodal-chat
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/ai-llm
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/mocks.ts` — the 4 mocks the tests drive:

```ts
import {
  createAnthropicMock,
  createOpenAIMock,
  createVercelAiMock,
  toTranscriptionKey,
} from '@kiwa-test/ai-llm';

const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgID';
const TINY_JPEG_DATA_URL = `data:image/jpeg;base64,${TINY_JPEG_BASE64}`;

const AUDIO_URL = 'https://example.com/hello.wav';

export function makeAnthropicVisionMock() {
  return createAnthropicMock({
    model: 'claude-3-5-sonnet-mock',
    imageTokenCost: 1500,
    responses: {
      'What is in this image?': {
        content: 'A small red maple leaf on a white background.',
        usage: { promptTokens: 1526, completionTokens: 12 },
      },
    },
  });
}

export function makeOpenAIVisionMock() {
  return createOpenAIMock({
    model: 'gpt-4o-mock',
    imageTokenCost: 1500,
    responses: {
      'OCR this receipt.': {
        content: 'Total: $12.30\nDate: 2026-04-08\nMerchant: kiwa cafe',
        usage: { promptTokens: 1512, completionTokens: 22 },
      },
    },
  });
}

export function makeOpenAIWhisperMock() {
  return createOpenAIMock({
    model: 'whisper-1-mock',
    transcriptions: {
      [toTranscriptionKey({ kind: 'url', url: AUDIO_URL })]: {
        text: 'hello kiwa',
        language: 'en',
        segments: [
          { id: 0, start: 0, end: 0.8, text: 'hello' },
          { id: 1, start: 0.8, end: 1.4, text: 'kiwa' },
        ],
      },
    },
    defaultTranscription: 'transcribed audio',
  });
}

export function makeVercelAiVisionMock() {
  return createVercelAiMock({
    model: 'claude-3-5-sonnet-mock',
    imageTokenCost: 1200,
    responses: {
      'describe the picture': {
        content: 'A quiet forest trail lined with young pines.',
        usage: { promptTokens: 1216, completionTokens: 10 },
      },
    },
  });
}

export const fixtures = {
  TINY_JPEG_BASE64,
  TINY_JPEG_DATA_URL,
  AUDIO_URL,
};
```

## Test — 4 flows, 1 file

Create `tests/multimodal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  fixtures,
  makeAnthropicVisionMock,
  makeOpenAIVisionMock,
  makeOpenAIWhisperMock,
  makeVercelAiVisionMock,
} from '../src/mocks';

describe('multimodal — Anthropic vision (base64 image)', () => {
  it('returns text + tallies image tokens against prompt', async () => {
    const client = makeAnthropicVisionMock();

    const res = await client.messages.create({
      model: 'claude-3-5-sonnet-mock',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: fixtures.TINY_JPEG_BASE64,
              },
            },
            { type: 'text', text: 'What is in this image?' },
          ],
        },
      ],
    });

    const firstBlock = res.content[0];
    if (firstBlock?.type !== 'text') throw new Error('expected text block');
    expect(firstBlock.text).toMatch(/maple leaf/);
    expect(res.usage.input_tokens).toBeGreaterThan(1500);
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
  });
});

describe('multimodal — OpenAI vision (data URL, detail=high)', () => {
  it('returns OCR text and counts high-detail image cost', async () => {
    const client = makeOpenAIVisionMock();

    const res = await client.chat.completions.create({
      model: 'gpt-4o-mock',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'OCR this receipt.' },
            {
              type: 'image_url',
              image_url: { url: fixtures.TINY_JPEG_DATA_URL, detail: 'high' },
            },
          ],
        },
      ],
    });

    expect(res.choices[0]?.message.content).toContain('Total: $12.30');
    expect(res.usage?.prompt_tokens).toBeGreaterThan(1500);
    expect(res._kiwa.costUsd).toBeGreaterThan(0);
  });
});

describe('multimodal — Whisper transcription (URL audio)', () => {
  it('returns verbose_json with segments', async () => {
    const client = makeOpenAIWhisperMock();

    const trans = (await client.audio.transcriptions.create({
      file: fixtures.AUDIO_URL,
      model: 'whisper-1-mock',
      response_format: 'verbose_json',
    })) as import('@kiwa-test/ai-llm').OpenAiTranscriptionVerboseJson;

    expect(trans.text).toBe('hello kiwa');
    expect(trans.language).toBe('en');
    expect(trans.segments).toHaveLength(2);
    expect(trans.segments[0]?.text).toBe('hello');
  });

  it('falls back to defaultTranscription on unknown source', async () => {
    const client = makeOpenAIWhisperMock();
    const trans = await client.audio.transcriptions.create({
      file: 'https://example.com/unknown.wav',
      model: 'whisper-1-mock',
    });
    expect(trans.text).toBe('transcribed audio');
  });
});

describe('multimodal — Vercel AI SDK generateText with image', () => {
  it('threads MessagePart image through generateText', async () => {
    const client = makeVercelAiVisionMock();

    const gen = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'describe the picture' },
            { type: 'image', image: 'https://example.com/trail.jpg' },
          ],
        },
      ],
    });

    expect(gen.text).toMatch(/forest trail/);
    expect(gen.usage.promptTokens).toBeGreaterThan(1200);
  });
});
```

Run:

```bash
pnpm test
```

You should see 5 passing tests across the 4 multimodal flows.

## What the mock actually counts

Multimodal token accounting mirrors real provider rate cards so mock cost tracking stays useful for release-gate assertions.

| provider | image base cost | detail multiplier | audio base cost |
|---|---|---|---|
| Anthropic | `imageTokenCost` (default 1500) | fixed | not supported (yet) |
| OpenAI vision | `imageTokenCost` (default 1500) | `low` × 0.5 / `auto` × 0.8 / `high` × 1 | not applicable |
| OpenAI audio (`input_audio`) | not applicable | not applicable | `audioTokenCost` (default 500), ×2 per 30 s |
| Vercel AI SDK | `imageTokenCost` (default 1500) | same as OpenAI vision when `providerOptions.openai.imageDetail` is set | not supported (yet) |
| LangChain | `imageTokenCost` (default 1500) | same as OpenAI vision | not supported (yet) |

`defaultTranscription` is the safety net when the Whisper dictionary misses — production code always deals with unfamiliar audio, so the mock refuses to throw when a source is unknown. Assertions that `text === '...'` are the recommended way to prove a specific source was hit.

## When to use each modality

- **Anthropic vision (base64 image)** — pass classified images directly through the Messages API. The response bank keys on the last text-carrying user block, so image bytes never enter the lookup.
- **OpenAI vision (data URL / URL image)** — pick this for OCR / diagram interpretation. Use `detail: 'high'` when the answer depends on small text (receipts, screenshots).
- **OpenAI Whisper** — use this when the input is audio you own the URL for; the mock never fetches, so URL 404s cannot break tests.
- **Vercel AI SDK `generateText` with image** — the SDK's cross-provider abstraction; keep the same `messages` shape and swap the model / provider as the app moves between Anthropic and OpenAI vision.

## Related

- [Tutorial 06 — Anthropic chatbot streaming + tool_use](./06-anthropic-chatbot-streaming) — same test shape without multimodal
- [Tutorial 07 — OpenAI tool-use agent](./07-openai-tool-agent) — non-multimodal tool loop
- [Concept — AI-LLM multimodal testing SSOT](../concepts/ai-llm-multimodal-testing)
- [Migration guide v1.14 → v1.15](../migrations/v1.14-to-v1.15)
- [`@kiwa-test/ai-llm` on npm](https://www.npmjs.com/package/@kiwa-test/ai-llm)
