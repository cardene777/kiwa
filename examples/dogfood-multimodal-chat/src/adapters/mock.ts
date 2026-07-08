import {
  createAnthropicMock,
  estimateMultimodalTokens,
  type AnthropicContentBlock,
  type AnthropicMessagesRequest,
  type MessagePart,
  type MockResponse,
} from '@kiwa/ai-llm';
import type {
  ImageRef,
  StreamedVisionResult,
  TraceEvent,
  VisionChatAdapter,
  VisionResult,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa/ai-llm` Anthropic mock with
 * `image` content blocks so the same app code exercises multimodal
 * without touching the network. The mock returns deterministic responses
 * so fidelity tests can assert on the shape of vision request encoding,
 * streaming, cost tracking and multi-image scaling.
 *
 * The response bank below is intentionally close to the shape a Claude
 * 3.5 Sonnet vision reply would take — the fidelity harness compares
 * mock vs real behaviour (SSE chunk count, cost order-of-magnitude,
 * multi-image token growth) rather than exact text.
 *
 * Image token accounting matches the shared multimodal helper: each
 * image contributes ~1500 base tokens times a detail factor (low = 0.5,
 * high = 1, auto = 0.8). The `imageTokenEstimate` field on the result
 * lets the UI render a "vision cost dominates" hint without re-parsing
 * the raw usage.
 */
export function makeMockAdapter(): VisionChatAdapter {
  const client = createAnthropicMock({
    model: 'claude-3-5-sonnet-mock',
    defaultResponse:
      'This is a deterministic mock vision reply produced by @kiwa/ai-llm createAnthropicMock. The dogfood harness diffs this against a real Anthropic vision response.',
    responses: buildResponseBank(),
    artificialLatencyMs: 8,
    // Sonnet-style pricing so cost tracking has realistic magnitudes
    costPer1kTokens: { prompt: 0.003, completion: 0.015 },
  });
  const trace: TraceEvent[] = [];
  let totalImageTokens = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async describeImage(input) {
      const parts = imageRefsToParts([input.image], input.detail);
      const imageTokenEstimate = estimateMultimodalTokens(parts);

      const req: AnthropicMessagesRequest = {
        model: 'claude-3-5-sonnet-mock',
        messages: [
          { role: 'user', content: buildContentBlocks([input.image], input.prompt) },
        ],
        max_tokens: input.maxTokens ?? 1024,
      };
      if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
      const res = await client.messages.create(req);
      const text = res.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('');
      totalImageTokens += imageTokenEstimate;
      record('describeImage', true, {
        detail: {
          hasSystemPrompt: input.systemPrompt !== undefined,
          imageKind: input.image.kind,
          detail: input.detail ?? 'auto',
        },
      });
      return {
        text,
        usage: {
          promptTokens: res.usage.input_tokens,
          completionTokens: res.usage.output_tokens,
          totalTokens: res.usage.input_tokens + res.usage.output_tokens,
        },
        costUsd: res._kiwa.costUsd,
        latencyMs: res._kiwa.latencyMs,
        finishReason: toFinishReason(res.stop_reason),
        imageTokenEstimate,
      };
    },

    async streamDescribeImage(input) {
      const parts = imageRefsToParts([input.image], input.detail);
      const imageTokenEstimate = estimateMultimodalTokens(parts);

      const req: AnthropicMessagesRequest = {
        model: 'claude-3-5-sonnet-mock',
        messages: [
          { role: 'user', content: buildContentBlocks([input.image], input.prompt) },
        ],
        stream: true,
        max_tokens: input.maxTokens ?? 1024,
      };
      if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
      const start = performance.now();
      const chunks: string[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      let costUsd = 0;
      let latencyMs = 0;
      for await (const ev of client.messages.stream(req)) {
        if (ev.type === 'content_block_delta' && ev.delta && 'text' in ev.delta) {
          chunks.push(ev.delta.text);
        }
        if (ev.type === 'message_delta' && ev.usage) {
          promptTokens = ev.usage.input_tokens;
          completionTokens = ev.usage.output_tokens;
        }
        if (ev.type === 'message_stop' && ev._kiwa) {
          costUsd = ev._kiwa.costUsd;
          latencyMs = ev._kiwa.latencyMs;
        }
      }
      // Fallback to wall clock when the mock event stream did not carry
      // a _kiwa latency (older responses / non-streaming paths).
      if (latencyMs === 0) latencyMs = performance.now() - start;
      totalImageTokens += imageTokenEstimate;
      record('streamDescribeImage', true, {
        detail: {
          chunkCount: chunks.length,
          imageKind: input.image.kind,
          detail: input.detail ?? 'auto',
        },
      });
      return {
        chunks,
        full: chunks.join(''),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        costUsd,
        latencyMs,
        imageTokenEstimate,
      };
    },

    async compareImages(input) {
      const parts = imageRefsToParts(input.images, input.detail);
      const imageTokenEstimate = estimateMultimodalTokens(parts);

      const req: AnthropicMessagesRequest = {
        model: 'claude-3-5-sonnet-mock',
        messages: [
          { role: 'user', content: buildContentBlocks(input.images, input.prompt) },
        ],
        max_tokens: input.maxTokens ?? 1024,
      };
      if (input.systemPrompt !== undefined) req.system = input.systemPrompt;
      const res = await client.messages.create(req);
      const text = res.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('');
      totalImageTokens += imageTokenEstimate;
      record('compareImages', true, {
        detail: {
          imageCount: input.images.length,
          detail: input.detail ?? 'auto',
        },
      });
      return {
        text,
        usage: {
          promptTokens: res.usage.input_tokens,
          completionTokens: res.usage.output_tokens,
          totalTokens: res.usage.input_tokens + res.usage.output_tokens,
        },
        costUsd: res._kiwa.costUsd,
        latencyMs: res._kiwa.latencyMs,
        finishReason: toFinishReason(res.stop_reason),
        imageTokenEstimate,
      };
    },

    metrics() {
      const m = client.getMetrics();
      return {
        totalCostUsd: m.totalCostUsd,
        totalPromptTokens: m.totalTokens.promptTokens,
        totalCompletionTokens: m.totalTokens.completionTokens,
        totalTokens: m.totalTokens.totalTokens,
        totalImageTokens,
        latencySamplesMs: [...m.latencySamplesMs],
        requests: m.requests,
      };
    },

    async reset() {
      client.reset();
      trace.length = 0;
      totalImageTokens = 0;
    },
  };
}

function imageRefsToParts(
  images: ImageRef[],
  detail: 'low' | 'high' | 'auto' | undefined,
): MessagePart[] {
  return images.map((img) => {
    if (img.kind === 'url') {
      return {
        type: 'image' as const,
        source: { kind: 'url' as const, url: img.url },
        detail: detail ?? 'auto',
      };
    }
    return {
      type: 'image' as const,
      source: {
        kind: 'base64' as const,
        mediaType: img.mediaType,
        data: img.data,
      },
      detail: detail ?? 'auto',
    };
  });
}

function imageBlock(img: ImageRef): AnthropicContentBlock {
  if (img.kind === 'url') {
    return { type: 'image', source: { type: 'url', url: img.url } };
  }
  return {
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType, data: img.data },
  };
}

function buildContentBlocks(
  images: ImageRef[],
  prompt: string,
): AnthropicContentBlock[] {
  return [...images.map(imageBlock), { type: 'text', text: prompt }];
}

function toFinishReason(
  stop: 'end_turn' | 'tool_use' | 'max_tokens',
): VisionResult['finishReason'] {
  if (stop === 'max_tokens') return 'length';
  // tool_use is not expected in vision flows; treat as stop.
  return 'stop';
}

/**
 * Deterministic response bank — prompt text → mock reply. Keys mirror
 * the prompts driven by the vision flows so every test path hits a
 * canonical, inspectable response instead of the default fallback.
 *
 * The engine matches on the trailing `text` block of the user message
 * (the vision message concatenates blocks in order), so the response
 * bank is keyed on the exact prompt.
 */
function buildResponseBank(): Record<string, MockResponse> {
  return {
    'What is in this image?': {
      content:
        'The image shows a small orange tabby cat sitting on a green cushion, looking directly at the camera. The lighting is soft and warm.',
      usage: { promptTokens: 1220, completionTokens: 28 },
    },
    'Describe this scene in vivid detail.': {
      content:
        'A quiet beach at sunset with pastel orange and pink hues across the horizon.',
      chunks: [
        'A ',
        'quiet ',
        'beach ',
        'at ',
        'sunset ',
        'with ',
        'pastel ',
        'orange ',
        'and ',
        'pink ',
        'hues ',
        'across ',
        'the ',
        'horizon.',
      ],
      usage: { promptTokens: 1218, completionTokens: 22 },
    },
    'Read the text visible in this image.': {
      content: 'The image shows the words "HELLO WORLD" in bold sans-serif type.',
      usage: { promptTokens: 1216, completionTokens: 14 },
    },
    'Which image has a cat?': {
      content:
        'The first image contains a cat sitting on a cushion. The second image shows a beach at sunset with no visible cat.',
      usage: { promptTokens: 2420, completionTokens: 24 },
    },
  };
}
