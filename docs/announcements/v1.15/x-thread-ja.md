1/ kiwa v1.15 released。 AI-LLM 深化 milestone です。 v1.14 (横軸拡張、 payment / search / telemetry / Go Iris/Chi) の後、 v1.15 は AI-LLM 縦軸に戻り v1.12 が cover しなかった 3 領域 (multimodal / MCP / agent orchestration) を land しました。

2/ `@kiwa-test/ai-llm` v0.2 — multimodal (image + audio) input mock 4 SDK (Anthropic + OpenAI + Vercel AI + LangChain) 全対応 + Whisper transcription mock。 image は prompt token 会計に組込、 detail=low/auto/high で 0.5x/0.8x/1.0x scale。 text-only v0.1 test は無変更で pass。

3/ `@kiwa-test/mcp` v0.1 — Model Context Protocol server + client mock (in-process transport)。 JSON-RPC 2.0 handshake + tools/list + tools/call + 5 fixture tool (echo / calc / weather / search / db-query)。 real MCP と同じ handshake order (tools/list を initialize 前に呼ぶと -32002 NotInitialized) を強制。

4/ `@kiwa-test/agent` v0.1 — LangGraph 型 StateGraph + OpenAI Assistants v2 client を 1 API に統一。 compile 検証 6 項目 fail-fast + deterministic run id + requires_action → submitToolOutputs → completed の status 遷移が real Assistants v2 と一致。

5/ dogfood-multimodal-chat + dogfood-mcp-tool-agent — 新 dogfood app 2 種、 mock vs real Anthropic + real MCP endpoint の突合。 provider prefix `@kiwa-test/ai-*` で 11 軸 release gate に載る。

6/ docs — tutorial 3 本 (multimodal / MCP / agent) + migration guide v1.14 → v1.15 (additive-only) + concept doc `ai-llm-multimodal-testing.md` (6 design 判断 SSOT)。 VitePress sidebar + gh-pages 反映済。

7/ Roadmap: https://github.com/cardene777/kiwa/issues/745 — v1.15 sub-Issue #746-#750 全 resolve。 次 v2.0 候補 = Storybook integration / multi-version Vitest matrix / desktop (Electron / Tauri) + mobile adapter / framework 深化 (SolidJS / Fresh / HonoJS)。
