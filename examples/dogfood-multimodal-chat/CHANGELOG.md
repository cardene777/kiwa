# dogfood-multimodal-chat

## 0.0.2

### Patch Changes

- 454588a: v1.15-4: dogfood-multimodal-chat — Anthropic vision (image upload + streaming + cost tracking + multi-image compare)

  - `examples/dogfood-multimodal-chat/` を新設。 v1.15-1 で lands した `@kiwa/ai-llm` v0.2 multimodal を dogfood で実測、 real Anthropic Messages API (`image` content blocks + `type: base64` / `type: url`) と kiwa mock adapter の fidelity を 4 flow (describeImage / streamDescribeImage / compareImages 3 ops) で突合する。
  - `src/adapters/interface.ts` に provider-neutral vision contract (`VisionChatAdapter` + `ImageRef` + `VisionResult` + `StreamedVisionResult`)、 3 op (`describeImage` / `streamDescribeImage` / `compareImages`) + metrics + traces を SSOT 化。 image kind (base64 / url) と detail hint (low / auto / high) はどちらも adapter 経路に流れる。
  - `src/adapters/mock.ts` は `createAnthropicMock` + `MessagePart` image parts で動く。 `estimateMultimodalTokens` で pre-flight image token 数を計算 (default `auto` = 1500 × 0.8 = 1200、 `high` = 1500、 `low` = 750)、 `imageTokenEstimate` field で response に添付。 deterministic response bank + `costPer1kTokens` は Sonnet 相当。
  - `src/adapters/real.ts` は Anthropic Messages API を fetch で直叩き (`x-api-key` + `anthropic-version: 2023-06-01`)、 `image` content block を `{ type: base64, media_type, data }` / `{ type: url, url }` の 2 shape で送出。 `ANTHROPIC_API_KEY` 不在時は SkippedError で `ANTHROPIC_ENV_MISSING` を trace 記録し、 fidelity harness が divergence として拾う。
  - `src/flows/chat-flows.ts` に 4 flow (chatWithUploadedImage / streamVisionDescription / ocrImageWithHighDetail / compareTwoImages)、 `src/flows/fidelity.ts` は既存 dogfood-anthropic-chatbot と同 shape の 11-axis release gate harness。
  - test 11 件追加 (mock e2e 7 / fidelity 3 / emit 1) + perf 2 file (`.perf.ts` serial 60 iter / `.live.perf.ts` env-skip guard)、 全 mock test pass、 typecheck clean。

- Updated dependencies [93758e0]
  - @kiwa/ai-llm@0.3.0

## 0.0.1

### Patch Changes

- Updated dependencies
  - @kiwa/quality-metrics@0.2.0
  - @kiwa/ai-llm@0.2.0
