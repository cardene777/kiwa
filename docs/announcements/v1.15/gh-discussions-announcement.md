# kiwa v1.15 released — Multimodal + MCP + Agent orchestration (AI-LLM 深化)

v1.15 is out. After v1.14's 横軸拡張 (payment / search / telemetry / Go Iris/Chi), v1.15 pivots back to the **AI-LLM vertical** and covers the three shapes v1.12 did not — multimodal input, Model Context Protocol, and agent orchestration.

## What shipped

- **`@kiwa-lab/ai-llm` v0.2** — multimodal (image + audio) input mock across all 4 SDKs (Anthropic Messages API + OpenAI Chat Completions + Vercel AI SDK + LangChain), plus Whisper transcription mock. Image tokens flow into prompt-token accounting; the `detail` hint scales base cost (0.5× / 0.8× / 1.0× for low / auto / high). Text-only v0.1 tests keep passing.
- **`@kiwa-lab/mcp` v0.1** — Model Context Protocol server + client mock with `InMemoryTransport`. Covers the 4 ops MCP-aware tool-use clients need (`initialize` / `notifications/initialized` / `tools/list` / `tools/call`), 8 JSON-RPC error codes (including MCP extensions -32000 / -32001 / -32002 / -32003), and 5 fixture tools (echo / calc / weather / search / db-query).
- **`@kiwa-lab/agent` v0.1** — LangGraph-style `StateGraph` + OpenAI Assistants v2 client under one API. 6-item compile validation (fail-fast), deterministic run ids, run-status transitions (`queued` → `requires_action` → `submitToolOutputs` → `completed`) match real Assistants v2 shape.
- **dogfood-multimodal-chat + dogfood-mcp-tool-agent** — 2 new dogfood apps that measure the mocks against real Anthropic + real MCP endpoints. Both roll into the 11-axis release gate via the `@kiwa-lab/ai-*` provider prefix.
- **docs** — 3 new tutorials (multimodal / MCP / agent) + additive migration guide v1.14 → v1.15 + concept doc `ai-llm-multimodal-testing.md` covering the 6 design decisions behind these mocks. VitePress sidebar refreshed; gh-pages published.

## Numbers

- **6 sub-Issues resolved** (#746-#751)
- **6 PRs merged** (#752-#756 + this docs PR)
- **3 new / expanded packages** (`@kiwa-lab/ai-llm` v0.2 + `@kiwa-lab/mcp` v0.1 + `@kiwa-lab/agent` v0.1)
- **2 new dogfood apps** with fidelity reports feeding the 11-axis gate

## v2.0 candidates

- Storybook integration (component-level visual regression across the 8-framework matrix)
- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Framework depth (SolidJS / Fresh / HonoJS)

Feedback welcome on which of these should land next.
