import { describe, expect, it } from 'vitest';
import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
  estimateMultimodalTokens,
  extractTextFromParts,
  hasAudioPart,
  hasImagePart,
  hasMultimodalParts,
  toTranscriptionKey,
  type ImagePart,
  type AudioPart,
  type MessagePart,
  type OpenAiTranscriptionVerboseJson,
} from '../src/index.js';

// -----------------------------------------------------------------------------
// § 1. multimodal helper 単体 (T-AI-MM-HLP-*)
// -----------------------------------------------------------------------------

describe('multimodal helpers', () => {
  it('T-AI-MM-HLP-001 hasMultimodalParts detects image and audio in parts array', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'here is a photo' },
      {
        type: 'image',
        source: { kind: 'url', url: 'https://example.com/cat.jpg' },
      },
    ];
    expect(hasMultimodalParts(parts)).toBe(true);
    expect(hasImagePart(parts)).toBe(true);
    expect(hasAudioPart(parts)).toBe(false);
    expect(hasMultimodalParts([{ type: 'text', text: 'only text' }])).toBe(false);
    expect(hasMultimodalParts(undefined)).toBe(false);
  });

  it('T-AI-MM-HLP-002 extractTextFromParts concatenates text parts and ignores image / audio', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'a ' },
      { type: 'image', source: { kind: 'url', url: 'https://x/y.jpg' } },
      { type: 'text', text: 'b' },
    ];
    expect(extractTextFromParts(parts)).toBe('a b');
  });

  it('T-AI-MM-HLP-003 estimateMultimodalTokens uses default cost (1500 per image, 500 per audio)', () => {
    const parts: MessagePart[] = [
      { type: 'image', source: { kind: 'url', url: 'https://x/1.jpg' } },
      { type: 'audio', source: { kind: 'url', url: 'https://x/a.wav' }, durationSeconds: 15 },
    ];
    // image default detail 'auto' → 1500 * 0.8 = 1200、 audio 15s → 500 * 1 = 500
    expect(estimateMultimodalTokens(parts)).toBe(1700);
  });

  it('T-AI-MM-HLP-004 estimateMultimodalTokens applies detail factor (low = 0.5, high = 1, auto = 0.8)', () => {
    const low: MessagePart = { type: 'image', source: { kind: 'url', url: 'x' }, detail: 'low' };
    const high: MessagePart = { type: 'image', source: { kind: 'url', url: 'x' }, detail: 'high' };
    const auto: MessagePart = { type: 'image', source: { kind: 'url', url: 'x' }, detail: 'auto' };
    expect(estimateMultimodalTokens([low])).toBe(750); // 1500 * 0.5
    expect(estimateMultimodalTokens([high])).toBe(1500); // 1500 * 1
    expect(estimateMultimodalTokens([auto])).toBe(1200); // 1500 * 0.8
  });

  it('T-AI-MM-HLP-005 estimateMultimodalTokens scales audio cost for durationSeconds > 30', () => {
    const short: AudioPart = { type: 'audio', source: { kind: 'url', url: 'x' }, durationSeconds: 20 };
    const long: AudioPart = { type: 'audio', source: { kind: 'url', url: 'x' }, durationSeconds: 60 };
    expect(estimateMultimodalTokens([short])).toBe(500); // 20s <= 30 => 500
    // 60s / 30 = 2 → floor(500 * 2) = 1000
    expect(estimateMultimodalTokens([long])).toBe(1000);
  });

  it('T-AI-MM-HLP-006 estimateMultimodalTokens honors custom imageTokenCost / audioTokenCost', () => {
    const parts: MessagePart[] = [
      { type: 'image', source: { kind: 'url', url: 'x' }, detail: 'high' },
      { type: 'audio', source: { kind: 'url', url: 'y' } },
    ];
    // custom cost image 100, audio 40
    expect(estimateMultimodalTokens(parts, { imageTokenCost: 100, audioTokenCost: 40 })).toBe(140);
  });

  it('T-AI-MM-HLP-007 toTranscriptionKey builds stable keys for base64 and url sources', () => {
    const key1 = toTranscriptionKey({ kind: 'url', url: 'https://a/b.wav' });
    expect(key1).toBe('url:https://a/b.wav');
    const key2 = toTranscriptionKey({
      kind: 'base64',
      mediaType: 'audio/wav',
      data: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHH0000',
    });
    // 先頭 32 文字 fingerprint
    expect(key2).toBe('base64:AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHH');
  });
});

// -----------------------------------------------------------------------------
// § 2. Anthropic multimodal (T-AI-MM-ANT-*)
// -----------------------------------------------------------------------------

describe('Anthropic multimodal', () => {
  it('T-AI-MM-ANT-001 accepts image content block (base64 source) and returns text response', async () => {
    const client = createAnthropicMock({
      responses: { 'what is this': { content: 'a cat sitting on a mat' } },
    });
    const res = await client.messages.create({
      model: 'claude-3-5-sonnet',
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
                data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
              },
            },
            { type: 'text', text: 'what is this' },
          ],
        },
      ],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'a cat sitting on a mat' }]);
    // image は prompt tokens に加算される (default 1500 * 0.8 = 1200 + text 数トークン)
    expect(res.usage.input_tokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-ANT-002 accepts image content block (url source)', async () => {
    const client = createAnthropicMock({
      responses: { 'describe image': { content: 'a red apple' } },
    });
    const res = await client.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: 'https://example.com/apple.jpg' },
            },
            { type: 'text', text: 'describe image' },
          ],
        },
      ],
    });
    expect(res.content[0]).toMatchObject({ type: 'text', text: 'a red apple' });
    expect(res.usage.input_tokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-ANT-003 preserves text-only content shape (backward compat)', async () => {
    const client = createAnthropicMock({ responses: { hi: { content: 'hello' } } });
    const res = await client.messages.create({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.content).toEqual([{ type: 'text', text: 'hello' }]);
    // text only なので prompt tokens は小さい
    expect(res.usage.input_tokens).toBeLessThan(100);
  });

  it('T-AI-MM-ANT-004 supports multiple image blocks in a single message', async () => {
    const client = createAnthropicMock({
      responses: { compare: { content: 'they look similar' } },
    });
    const res = await client.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: 'https://a/1.jpg' } },
            { type: 'image', source: { type: 'url', url: 'https://a/2.jpg' } },
            { type: 'text', text: 'compare' },
          ],
        },
      ],
    });
    expect(res.content[0]).toMatchObject({ type: 'text' });
    // 2 image → 2400 base + text
    expect(res.usage.input_tokens).toBeGreaterThan(2000);
  });
});

// -----------------------------------------------------------------------------
// § 3. OpenAI vision + audio (T-AI-MM-OAI-*)
// -----------------------------------------------------------------------------

describe('OpenAI multimodal', () => {
  it('T-AI-MM-OAI-001 accepts vision message with image_url (data URL)', async () => {
    const client = createOpenAIMock({
      responses: { 'ocr this': { content: 'HELLO WORLD' } },
    });
    const res = (await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'ocr this' },
            {
              type: 'image_url',
              image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'high' },
            },
          ],
        },
      ],
    })) as import('../src/index.js').OpenAiChatCompletionsResponse;
    expect(res.choices[0]?.message.content).toBe('HELLO WORLD');
    // detail high → 1500 * 1 = 1500 + text
    expect(res.usage.prompt_tokens).toBeGreaterThanOrEqual(1500);
  });

  it('T-AI-MM-OAI-002 accepts vision message with image_url (public URL)', async () => {
    const client = createOpenAIMock({
      responses: { 'describe scene': { content: 'a beach at sunset' } },
    });
    const res = (await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'describe scene' },
            {
              type: 'image_url',
              image_url: { url: 'https://example.com/beach.jpg' },
            },
          ],
        },
      ],
    })) as import('../src/index.js').OpenAiChatCompletionsResponse;
    expect(res.choices[0]?.message.content).toBe('a beach at sunset');
    expect(res.usage.prompt_tokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-OAI-003 accepts input_audio in chat completion messages', async () => {
    const client = createOpenAIMock({
      responses: { 'summarize audio': { content: 'quick brown fox' } },
    });
    const res = (await client.chat.completions.create({
      model: 'gpt-4o-audio',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'summarize audio' },
            { type: 'input_audio', input_audio: { data: 'BASE64AUDIO==', format: 'wav' } },
          ],
        },
      ],
    })) as import('../src/index.js').OpenAiChatCompletionsResponse;
    expect(res.choices[0]?.message.content).toBe('quick brown fox');
    // audio default 10s → 500 + text
    expect(res.usage.prompt_tokens).toBeGreaterThan(500);
  });

  it('T-AI-MM-OAI-004 Whisper transcription returns json format', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'url:https://example.com/hello.wav': { text: 'hello world from audio' },
      },
    });
    const result = await client.audio.transcriptions.create({
      file: 'https://example.com/hello.wav',
      model: 'whisper-1',
    });
    expect(result.text).toBe('hello world from audio');
    expect(result._kiwa.costUsd).toBeGreaterThan(0);
    expect(result._kiwa.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('T-AI-MM-OAI-005 Whisper transcription verbose_json includes segments and language', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'url:https://example.com/talk.wav': {
          text: 'a b c',
          language: 'ja',
          segments: [
            { id: 0, start: 0, end: 2, text: 'a' },
            { id: 1, start: 2, end: 4, text: 'b' },
            { id: 2, start: 4, end: 6, text: 'c' },
          ],
        },
      },
    });
    const result = (await client.audio.transcriptions.create({
      file: 'https://example.com/talk.wav',
      response_format: 'verbose_json',
    })) as OpenAiTranscriptionVerboseJson;
    expect(result.text).toBe('a b c');
    expect(result.language).toBe('ja');
    expect(result.segments.length).toBe(3);
    expect(result.duration).toBe(6);
  });

  it('T-AI-MM-OAI-006 Whisper transcription falls back to defaultTranscription on cache miss', async () => {
    const client = createOpenAIMock({
      defaultTranscription: 'unknown audio content',
    });
    const result = await client.audio.transcriptions.create({
      file: 'https://example.com/nomatch.wav',
    });
    expect(result.text).toBe('unknown audio content');
  });

  it('T-AI-MM-OAI-007 transcribeAudio unified API returns TranscriptionResult', async () => {
    const client = createOpenAIMock({
      transcriptions: {
        'base64:XYZ12345678901234567890123456789': { text: 'unified api works' },
      },
    });
    const result = await client.transcribeAudio({
      kind: 'base64',
      mediaType: 'audio/wav',
      data: 'XYZ12345678901234567890123456789ABCDEF',
    });
    expect(result.text).toBe('unified api works');
    expect(result.language).toBe('en');
  });
});

// -----------------------------------------------------------------------------
// § 4. Vercel AI SDK multimodal (T-AI-MM-VER-*)
// -----------------------------------------------------------------------------

describe('Vercel AI SDK multimodal', () => {
  it('T-AI-MM-VER-001 generateText accepts image content part (URL)', async () => {
    const client = createVercelAiMock({
      responses: { 'what is this': { content: 'a mountain landscape' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'what is this' },
            { type: 'image', image: 'https://example.com/mountain.jpg' },
          ],
        },
      ],
    });
    expect(res.text).toBe('a mountain landscape');
    expect(res.usage.promptTokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-VER-002 generateText accepts image content part (base64 data URI)', async () => {
    const client = createVercelAiMock({
      responses: { 'ocr': { content: 'KIWA' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'ocr' },
            { type: 'image', image: 'data:image/png;base64,iVBORw0KGgo=' },
          ],
        },
      ],
    });
    expect(res.text).toBe('KIWA');
    expect(res.usage.promptTokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-VER-003 generateText accepts audio file content part', async () => {
    const client = createVercelAiMock({
      responses: { 'transcribe this': { content: 'transcribed content' } },
    });
    const res = await client.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'transcribe this' },
            { type: 'file', data: 'BASE64WAV==', mimeType: 'audio/wav' },
          ],
        },
      ],
    });
    expect(res.text).toBe('transcribed content');
    expect(res.usage.promptTokens).toBeGreaterThan(500);
  });

  it('T-AI-MM-VER-004 streamText multimodal input yields text chunks', async () => {
    const client = createVercelAiMock({
      responses: {
        vision: { content: 'red car', chunks: ['red ', 'car'] },
      },
    });
    const res = client.streamText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'vision' },
            { type: 'image', image: 'https://example.com/car.jpg' },
          ],
        },
      ],
    });
    const collected: string[] = [];
    for await (const c of res.textStream) collected.push(c);
    expect(collected.join('')).toBe('red car');
    const usage = await res.usage;
    expect(usage.promptTokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-VER-005 preserves string content shape (backward compat)', async () => {
    const client = createVercelAiMock({ responses: { hi: { content: 'hello' } } });
    const res = await client.generateText({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.text).toBe('hello');
    // text only、 promptTokens 小
    expect(res.usage.promptTokens).toBeLessThan(100);
  });
});

// -----------------------------------------------------------------------------
// § 5. LangChain multimodal (T-AI-MM-LC-*)
// -----------------------------------------------------------------------------

describe('LangChain multimodal', () => {
  it('T-AI-MM-LC-001 invoke accepts image_url content block (string form)', async () => {
    const client = createLangchainMock({
      responses: { 'describe': { content: 'blue ocean' } },
    });
    const msg = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'describe' },
          { type: 'image_url', image_url: 'https://example.com/ocean.jpg' },
        ],
      },
    ]);
    expect(msg.content).toBe('blue ocean');
    expect(msg.usage_metadata.input_tokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-LC-002 invoke accepts image_url content block (object form with detail)', async () => {
    const client = createLangchainMock({
      responses: { 'ocr': { content: 'KIWA' } },
    });
    const msg = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'ocr' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/png;base64,iVBOR=', detail: 'high' },
          },
        ],
      },
    ]);
    expect(msg.content).toBe('KIWA');
    // detail high → 1500
    expect(msg.usage_metadata.input_tokens).toBeGreaterThanOrEqual(1500);
  });

  it('T-AI-MM-LC-003 invoke accepts media block (audio)', async () => {
    const client = createLangchainMock({
      responses: { 'audio q': { content: 'audio answer' } },
    });
    const msg = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'audio q' },
          { type: 'media', data: 'B64AUDIO==', mimeType: 'audio/wav' },
        ],
      },
    ]);
    expect(msg.content).toBe('audio answer');
    expect(msg.usage_metadata.input_tokens).toBeGreaterThan(500);
  });

  it('T-AI-MM-LC-004 invoke accepts media block (image mime)', async () => {
    const client = createLangchainMock({
      responses: { 'photo': { content: 'photo of tree' } },
    });
    const msg = await client.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'photo' },
          { type: 'media', data: 'B64IMG==', mimeType: 'image/jpeg' },
        ],
      },
    ]);
    expect(msg.content).toBe('photo of tree');
    expect(msg.usage_metadata.input_tokens).toBeGreaterThan(1000);
  });

  it('T-AI-MM-LC-005 preserves string content (backward compat)', async () => {
    const client = createLangchainMock({ responses: { hi: { content: 'hello' } } });
    const msg = await client.invoke([{ role: 'human', content: 'hi' }]);
    expect(msg.content).toBe('hello');
    expect(msg.usage_metadata.input_tokens).toBeLessThan(100);
  });

  it('T-AI-MM-LC-006 stream propagates multimodal input to usage_metadata', async () => {
    const client = createLangchainMock({
      responses: { 'vs': { content: 'ok', chunks: ['o', 'k'] } },
    });
    const iter = client.stream([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'vs' },
          { type: 'image_url', image_url: 'https://example.com/x.jpg' },
        ],
      },
    ]);
    let terminal: import('../src/index.js').LangchainAIMessageChunk | null = null;
    for await (const chunk of iter) {
      if (chunk.response_metadata) terminal = chunk;
    }
    expect(terminal?.usage_metadata?.input_tokens).toBeGreaterThan(1000);
  });
});

// -----------------------------------------------------------------------------
// § 6. 4 SDK 統一性 (T-AI-MM-CROSS-*)
// -----------------------------------------------------------------------------

describe('4 SDK unified multimodal (fidelity)', () => {
  it('T-AI-MM-CROSS-001 all 4 SDK reach same completion text for identical image + prompt', async () => {
    const cfg = { responses: { 'shared prompt': { content: 'same answer' } } };
    const anthropic = createAnthropicMock(cfg);
    const openai = createOpenAIMock(cfg);
    const vercel = createVercelAiMock(cfg);
    const langchain = createLangchainMock(cfg);

    const imageUrl = 'https://example.com/shared.jpg';

    const antRes = await anthropic.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text', text: 'shared prompt' },
          ],
        },
      ],
    });
    const oaiRes = (await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'shared prompt' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    })) as import('../src/index.js').OpenAiChatCompletionsResponse;
    const verRes = await vercel.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'shared prompt' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });
    const lcRes = await langchain.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'shared prompt' },
          { type: 'image_url', image_url: imageUrl },
        ],
      },
    ]);

    // 4 SDK 全部で同じ answer に到達
    expect(antRes.content).toEqual([{ type: 'text', text: 'same answer' }]);
    expect(oaiRes.choices[0]?.message.content).toBe('same answer');
    expect(verRes.text).toBe('same answer');
    expect(lcRes.content).toBe('same answer');
  });

  it('T-AI-MM-CROSS-002 image token cost is consistent across 4 SDK (default 1200 auto)', async () => {
    const cfg = { responses: { q: { content: 'a' } } };
    const anthropic = createAnthropicMock(cfg);
    const openai = createOpenAIMock(cfg);
    const vercel = createVercelAiMock(cfg);
    const langchain = createLangchainMock(cfg);

    const url = 'https://example.com/x.jpg';

    const ant = await anthropic.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url } },
            { type: 'text', text: 'q' },
          ],
        },
      ],
    });
    const oai = (await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q' },
            { type: 'image_url', image_url: { url } },
          ],
        },
      ],
    })) as import('../src/index.js').OpenAiChatCompletionsResponse;
    const ver = await vercel.generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'q' },
            { type: 'image', image: url },
          ],
        },
      ],
    });
    const lc = await langchain.invoke([
      {
        role: 'human',
        content: [
          { type: 'text', text: 'q' },
          { type: 'image_url', image_url: url },
        ],
      },
    ]);

    // image + 1 char text ≈ 1200 + 1 char / 4 = 1200~1201
    const antTok = ant.usage.input_tokens;
    const oaiTok = oai.usage.prompt_tokens;
    const verTok = ver.usage.promptTokens;
    const lcTok = lc.usage_metadata.input_tokens;

    // 4 SDK で prompt token が ±5 以内で揃うことを確認 (adapter 差は最小)
    const values = [antTok, oaiTok, verTok, lcTok];
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(max - min).toBeLessThanOrEqual(10);
    expect(min).toBeGreaterThanOrEqual(1200);
  });

  it('T-AI-MM-CROSS-003 multimodal messages preserve metrics accumulation across calls', async () => {
    const client = createAnthropicMock({ responses: { q: { content: 'a' } } });
    await client.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: 'https://a/1.jpg' } },
            { type: 'text', text: 'q' },
          ],
        },
      ],
    });
    await client.messages.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: 'https://a/2.jpg' } },
            { type: 'text', text: 'q' },
          ],
        },
      ],
    });
    const m = client.getMetrics();
    expect(m.requests).toBe(2);
    // image token 2 回加算されているので promptTokens 累計は 2400 超
    expect(m.totalTokens.promptTokens).toBeGreaterThanOrEqual(2400);
    expect(m.totalCostUsd).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// § 7. type narrowing sanity (T-AI-MM-TYPE-*)
// -----------------------------------------------------------------------------

describe('multimodal type narrowing', () => {
  it('T-AI-MM-TYPE-001 ImagePart narrows to detail field access', () => {
    const p: ImagePart = {
      type: 'image',
      source: { kind: 'url', url: 'https://x/y.jpg' },
      detail: 'high',
    };
    expect(p.detail).toBe('high');
  });

  it('T-AI-MM-TYPE-002 AudioPart narrows to purpose default', () => {
    const p: AudioPart = {
      type: 'audio',
      source: { kind: 'url', url: 'https://x/y.wav' },
    };
    // purpose optional、 default chat
    expect(p.purpose ?? 'chat').toBe('chat');
  });
});
