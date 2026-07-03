# `@kiwa-test/ai-llm`

AI-LLM test harness for kiwa — a unified mock across 4 SDKs (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain) with streaming, tool-use, system-prompt, **multimodal (image + audio)** support, cost / latency / token / accuracy tracking, and a real-vs-mock fidelity harness.

Feeds the v1.12 dogfood app suite (`examples/dogfood-anthropic-chatbot`, `examples/dogfood-openai-tool-agent`, `examples/dogfood-vercel-ai-rag`) and the 11-axis release gate in `@kiwa-test/quality-metrics` (v0.2+).

**v0.2 (v1.15-1, Issue #746)** — multimodal input mock (image + audio、 4 SDK 全対応) + Whisper transcription mock。

## Install

```sh
pnpm add -D @kiwa-test/ai-llm @kiwa-test/quality-metrics
```

## Quick start — 4 SDK mocks

### Anthropic

```ts
import { createAnthropicMock } from '@kiwa-test/ai-llm';

const client = createAnthropicMock({
  responses: {
    'What is kiwa?': { content: 'kiwa is a testing harness for provider mocks.' },
  },
});

const res = await client.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 200,
  messages: [{ role: 'user', content: 'What is kiwa?' }],
});
console.log(res.content); // [{ type: 'text', text: '...' }]
console.log(res._kiwa);   // { costUsd, latencyMs }
```

### OpenAI

```ts
import { createOpenAIMock } from '@kiwa-test/ai-llm';

const client = createOpenAIMock({
  responses: {
    'ping': { content: 'pong' },
  },
});

// non-streaming
const res = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'ping' }],
});

// streaming
const stream = client.chat.completions.create({
  stream: true,
  messages: [{ role: 'user', content: 'ping' }],
});
for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta.content);
}
```

### Vercel AI SDK

```ts
import { createVercelAiMock } from '@kiwa-test/ai-llm';

const client = createVercelAiMock({
  responses: {
    'greet': { content: 'hello world', chunks: ['hello ', 'world'] },
  },
});

// generateText
const gen = await client.generateText({
  messages: [{ role: 'user', content: 'greet' }],
});

// streamText
const stream = client.streamText({
  messages: [{ role: 'user', content: 'greet' }],
});
for await (const chunk of stream.textStream) console.log(chunk);
console.log(await stream.text);
```

### LangChain

```ts
import { createLangchainMock } from '@kiwa-test/ai-llm';

const chatModel = createLangchainMock({
  responses: {
    'summarize kiwa': { content: 'kiwa provides mocks for testing.' },
  },
});

const msg = await chatModel.invoke([
  { role: 'system', content: 'you are helpful' },
  { role: 'human', content: 'summarize kiwa' },
]);
console.log(msg.content, msg.usage_metadata, msg._kiwa);
```

## Multimodal input (v0.2)

Image + audio を 4 SDK 全部で統一 mock。 `parts` field (`content: string` に加えて optional) に `MessagePart[]` を渡す。

### Anthropic vision

```ts
const res = await client.messages.create({
  model: 'claude-3-5-sonnet',
  max_tokens: 200,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '...base64...' } },
        { type: 'text', text: 'What is in this image?' },
      ],
    },
  ],
});
```

### OpenAI vision + audio

```ts
// vision
await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'OCR this' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,...', detail: 'high' } },
      ],
    },
  ],
});

// input_audio (gpt-4o-audio)
await client.chat.completions.create({
  model: 'gpt-4o-audio',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'summarize' },
        { type: 'input_audio', input_audio: { data: '...base64...', format: 'wav' } },
      ],
    },
  ],
});

// Whisper transcription
const trans = await client.audio.transcriptions.create({
  file: 'https://example.com/audio.wav',
  model: 'whisper-1',
  response_format: 'verbose_json',
});
console.log(trans.text, trans.language, trans.segments);
```

### Vercel AI SDK multimodal

```ts
await client.generateText({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'describe' },
        { type: 'image', image: 'https://example.com/x.jpg' },
      ],
    },
  ],
});
```

### LangChain multimodal

```ts
await chatModel.invoke([
  {
    role: 'human',
    content: [
      { type: 'text', text: 'describe' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,...', detail: 'high' } },
    ],
  },
]);
```

### Multimodal token cost

Mock は image を fixed cost で prompt token に加算 (Anthropic ~1600 / 1024×1024、 OpenAI vision 1105 detail=high 相当の近似)。 audio は 500 token / 30 s、 30 s 超は比例増分。

- `imageTokenCost` — default `1500` (detail=high → 1500、 auto → 1200、 low → 750)
- `audioTokenCost` — default `500` (durationSeconds ≤ 30 → 500、 60 s → 1000 等)
- `transcriptions` — Whisper 用 dict、 key は `toTranscriptionKey(source)` 経由 (`base64:{hash}` or `url:{url}`)
- `defaultTranscription` — Whisper dict miss 時 fallback (default `'transcribed audio'`)

## Fidelity harness (real vs mock)

Real API vs mock diff for 4 metrics (cost / latency / token / accuracy).

```ts
import { runFidelityCheck, createAnthropicMock } from '@kiwa-test/ai-llm';

const mock = createAnthropicMock({
  responses: {
    'What is TDD?': { content: 'Test-driven development.' },
  },
});

const report = await runFidelityCheck({
  mock,
  real: async (input) => {
    // real Anthropic SDK call here (dogfood app wraps this)
    return realAnthropicCompletion(input);
  },
  prompts: [
    { messages: [{ role: 'user', content: 'What is TDD?' }] },
  ],
});

console.log(report.summary);
// { avgCostDiffUsd, avgLatencyDiffMs, avgTokenDiffTotal, avgAccuracyScore, prompts, accuracyMethod }
```

## `QualityReport` adapter (11-axis release gate)

Aggregate fidelity records into a `QualityReport` for `@kiwa-test/quality-metrics`.

```ts
import { buildAiLlmReport } from '@kiwa-test/ai-llm';
import { evaluateReleaseGate, emitMarkdown } from '@kiwa-test/quality-metrics';

const report = buildAiLlmReport({
  provider: '@kiwa-test/ai-llm',
  version: '0.1.0',
  fidelity,             // from runFidelityCheck
  testCount: { behavior: 20, integration: 5, e2e: 3 },
  coverageV8Summary: c8Summary.total,
  mutation: { mutations: 200, killed: 160 },
  perfSamplesMs: benchSamples,
});
const verdict = evaluateReleaseGate(report);
if (!verdict.passed) {
  console.error('blockers:', verdict.blockers);
  process.exit(1);
}
console.log(emitMarkdown({ report, verdict }));
```

The gate uses the SSOT `docs/quality/release-gate.md` thresholds — 11 axes (7 common + 4 AI-LLM). AI-LLM providers (any package whose name starts with `@kiwa-test/ai-`) are the only ones that need the 4 AI-LLM axes.

## Mock configuration surface

| field | meaning | default |
|---|---|---|
| `responses` | `prompt → { content, toolCalls, chunks, usage, finishReason }` dict, keyed by last user-role message content | `undefined` |
| `defaultResponse` | fallback content when prompt is unmatched | `"mock default response"` |
| `artificialLatencyMs` | simulated response latency | `10` |
| `costPer1kTokens` | `{ prompt, completion }` USD per 1k tokens | Claude Haiku rate `{ prompt: 0.00025, completion: 0.00125 }` |
| `model` | model identifier stitched into responses | `"mock-model"` |
| `transcriptions` (v0.2) | Whisper 用 dict `key → { text, language?, segments? }` | `undefined` |
| `defaultTranscription` (v0.2) | Whisper dict miss 時 fallback | `"transcribed audio"` |
| `imageTokenCost` (v0.2) | image 1 個の base prompt token 換算 (detail で係数調整) | `1500` |
| `audioTokenCost` (v0.2) | audio 1 個の base prompt token 換算 (30 s 超は比例増分) | `500` |

Each mock exposes `getMetrics()` (cumulative cost / token / latency / requests), `reset()`, and low-level `chat` / `stream` matching the shared `AiLlmMock` interface — same API across all 4 SDKs.

## Release gate SSOT

See `docs/quality/release-gate.md` for the 11-axis thresholds. AI-LLM axes are only enforced when `provider.startsWith("@kiwa-test/ai-")`.

## Version

- v0.1.0 (Issue #695, v1.12 milestone) — 4 SDK 統一 mock 初 land
- v0.2.0 (Issue #746, v1.15-1 milestone) — multimodal (image + audio) 対応 + Whisper transcription mock

See `.changeset/` for the release notes.

## License

MIT
