---
'@kiwa-test/ai-llm': minor
---

v1.15-1: multimodal input mock (image + audio、 4 SDK 全対応) + Whisper transcription mock

- `packages/ai-llm/src/multimodal.ts` を新設。 `MessagePart` union (`TextPart` / `ImagePart` / `AudioPart`)、 `MediaSource` (base64 / URL)、 `TranscriptionResult`、 `estimateMultimodalTokens` / `hasImagePart` / `hasAudioPart` / `toTranscriptionKey` の helper 群を SSOT 化。
- 4 SDK adapter (Anthropic / OpenAI / Vercel AI SDK / LangChain) を全て multimodal 対応に拡張。 Anthropic は content blocks (`type: 'image'`)、 OpenAI は `image_url` + `input_audio`、 Vercel AI SDK は `image` / `file`、 LangChain は `image_url` / `media` を受け付ける。
- OpenAI adapter に Whisper transcription mock 追加 (`client.audio.transcriptions.create` + `client.transcribeAudio` の 2 経路)。 `verbose_json` mode で segments / language / duration を返す。
- `MockConfig` に `transcriptions` / `defaultTranscription` / `imageTokenCost` / `audioTokenCost` を追加。 image は default 1500 token (detail high = 1500、 auto = 1200、 low = 750)、 audio は default 500 token / 30s (30s 超は比例増分)。
- multimodal test 34 件追加 (`tests/multimodal.test.ts`)、 4 SDK 横断 fidelity 検証 (`T-AI-MM-CROSS-*`) で 4 SDK 全部が同じ prompt に対し同じ answer + prompt token ±5 以内で揃うことを検証。
- 既存 48 test 全 pass (regression 0)、 typecheck clean、 build clean。
