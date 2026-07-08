import type { ImageRef, VisionChatAdapter } from '../adapters/interface.js';

/**
 * User-facing vision flows the multimodal chat app exposes. Each flow
 * talks only through {@link VisionChatAdapter} so the same code powers
 * both `KIWA_MODE=real` (Anthropic Messages API with vision content
 * blocks) and `KIWA_MODE=mock` (`@kiwa/ai-llm`
 * `createAnthropicMock` with `MessagePart` image).
 *
 * The 4 flows below mirror the AC in Issue #749 —
 * image upload (Task 1), streaming response (Task 2),
 * cost tracking (Task 3) and multi-image comparison (Task 4).
 */

/** A tiny 1x1 pixel PNG so tests can pass a valid base64 payload. */
export const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const SAMPLE_CAT_IMAGE: ImageRef = {
  kind: 'base64',
  mediaType: 'image/png',
  data: TINY_PNG_BASE64,
};

export const SAMPLE_BEACH_IMAGE: ImageRef = {
  kind: 'url',
  url: 'https://example.com/beach.jpg',
};

export const SAMPLE_OCR_IMAGE: ImageRef = {
  kind: 'base64',
  mediaType: 'image/png',
  data: TINY_PNG_BASE64,
};

/**
 * Flow 1 (Task 1) — the user uploads a single image and asks a question.
 * The chat handler passes the base64 payload straight through to the
 * adapter, which encodes it as an Anthropic `image` content block.
 */
export async function chatWithUploadedImage(
  adapter: VisionChatAdapter,
): Promise<{
  text: string;
  costUsd: number;
  imageTokenEstimate: number;
}> {
  const result = await adapter.describeImage({
    image: SAMPLE_CAT_IMAGE,
    prompt: 'What is in this image?',
  });
  return {
    text: result.text,
    costUsd: result.costUsd,
    imageTokenEstimate: result.imageTokenEstimate,
  };
}

/**
 * Flow 2 (Task 2) — streaming vision. The handler passes the image +
 * prompt to the adapter's streaming method and returns the SSE chunks
 * so the UI can render them token-by-token.
 */
export async function streamVisionDescription(
  adapter: VisionChatAdapter,
): Promise<{
  chunks: string[];
  full: string;
  costUsd: number;
  imageTokenEstimate: number;
}> {
  const result = await adapter.streamDescribeImage({
    image: SAMPLE_BEACH_IMAGE,
    prompt: 'Describe this scene in vivid detail.',
  });
  return {
    chunks: result.chunks,
    full: result.full,
    costUsd: result.costUsd,
    imageTokenEstimate: result.imageTokenEstimate,
  };
}

/**
 * Flow 3 (Task 3) — cost tracking with a `detail: 'high'` hint that
 * bumps the image token estimate. The response captures the pre-flight
 * estimate plus the settled cost so downstream analytics can chart the
 * "cost dominated by vision" pattern.
 */
export async function ocrImageWithHighDetail(
  adapter: VisionChatAdapter,
): Promise<{
  text: string;
  costUsd: number;
  imageTokenEstimate: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  const result = await adapter.describeImage({
    image: SAMPLE_OCR_IMAGE,
    prompt: 'Read the text visible in this image.',
    detail: 'high',
  });
  return {
    text: result.text,
    costUsd: result.costUsd,
    imageTokenEstimate: result.imageTokenEstimate,
    usage: result.usage,
  };
}

/**
 * Flow 4 (Task 4) — multi-image comparison. Two images travel in one
 * message so the request grows in image tokens roughly linearly (each
 * image adds ~1500 base × detail factor). This flow drives the multi-
 * image scaling assertion in the fidelity harness.
 */
export async function compareTwoImages(
  adapter: VisionChatAdapter,
): Promise<{
  text: string;
  costUsd: number;
  imageTokenEstimate: number;
}> {
  const result = await adapter.compareImages({
    images: [SAMPLE_CAT_IMAGE, SAMPLE_BEACH_IMAGE],
    prompt: 'Which image has a cat?',
  });
  return {
    text: result.text,
    costUsd: result.costUsd,
    imageTokenEstimate: result.imageTokenEstimate,
  };
}
