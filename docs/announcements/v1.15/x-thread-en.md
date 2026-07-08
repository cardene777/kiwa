1/ kiwa v1.15 is out — AI-LLM depth milestone. After v1.14's horizontal SaaS provider push (payment / search / telemetry / Go Iris/Chi), v1.15 goes back to the AI-LLM vertical and covers the three shapes v1.12 did not: multimodal input, Model Context Protocol, and agent orchestration.

2/ `@kiwa/ai-llm` v0.2 — multimodal (image + audio) input mock across all 4 SDKs (Anthropic / OpenAI / Vercel AI / LangChain) + Whisper transcription mock. Image tokens roll into prompt-token accounting; detail=low/auto/high scales 0.5x/0.8x/1.0x. Text-only v0.1 tests keep passing.

3/ `@kiwa/mcp` v0.1 — Model Context Protocol server + client mock with in-process transport. JSON-RPC 2.0 handshake + tools/list + tools/call, 5 fixture tools (echo / calc / weather / search / db-query). Enforces the same tools-list-before-initialize check as real MCP (-32002 NotInitialized).

4/ `@kiwa/agent` v0.1 — LangGraph-style StateGraph + OpenAI Assistants v2 client under one API. 6-item compile validation, deterministic run ids, requires_action → submitToolOutputs → completed transitions match real Assistants v2 shape.

5/ dogfood-multimodal-chat + dogfood-mcp-tool-agent — 2 new dogfood apps that measure the mocks against real Anthropic + real MCP endpoints. Both roll into the 11-axis release gate through the @kiwa/ai-* provider prefix.

6/ docs — 3 new tutorials (multimodal / MCP / agent) + migration guide v1.14 → v1.15 (additive-only) + concept doc `ai-llm-multimodal-testing.md` covering the 6 design decisions behind these mocks. VitePress sidebar + gh-pages already published.

7/ Roadmap: https://github.com/cardene777/kiwa/issues/745 — v1.15 sub-Issues #746-#750 all resolved. Next: v2.0 candidates include Storybook integration, multi-version Vitest matrix, desktop (Electron / Tauri) + mobile adapters, framework depth (SolidJS / Fresh / HonoJS).
