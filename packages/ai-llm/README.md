# `@kiwa-test/ai-llm`

AI-LLM test harness for kiwa — a unified mock across 4 SDKs (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain) with streaming, tool-use, system-prompt support, cost / latency / token / accuracy tracking, and a real-vs-mock fidelity harness.

Feeds the v1.12 dogfood app suite (`examples/dogfood-anthropic-chatbot`, `examples/dogfood-openai-tool-agent`, `examples/dogfood-vercel-ai-rag`) and the 11-axis release gate in `@kiwa-test/quality-metrics` (v0.2+).

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

Each mock exposes `getMetrics()` (cumulative cost / token / latency / requests), `reset()`, and low-level `chat` / `stream` matching the shared `AiLlmMock` interface — same API across all 4 SDKs.

## Release gate SSOT

See `docs/quality/release-gate.md` for the 11-axis thresholds. AI-LLM axes are only enforced when `provider.startsWith("@kiwa-test/ai-")`.

## Version

v0.1.0 (Issue #695, v1.12 milestone). See `.changeset/` for the release note.

## License

MIT
