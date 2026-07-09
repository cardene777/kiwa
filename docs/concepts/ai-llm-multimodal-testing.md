# AI-LLM multimodal testing — image, audio, MCP handshake, agent state

v1.12 established the non-determinism SSOT for AI-LLM providers ([`ai-llm-testing.md`](./ai-llm-testing)): the mock is deterministic on purpose, and the release gate measures how far real drifts from the mock per axis. v1.15 extends that stance to three shapes v1.12 did not cover — **multimodal inputs** (image + audio), **MCP protocol handshakes**, and **agent state machines**.

Each of these opens new failure modes that a purely text-only 11-axis release gate cannot catch. This document is the SSOT for the design decisions kiwa took to keep those failure modes testable.

## The three shapes v1.15 adds

| shape | v1.12 coverage | v1.15 coverage |
|---|---|---|
| text-only chat + streaming + tool_use | 4 SDK mocks + 11-axis gate | unchanged |
| multimodal input (image + audio) | not supported | `@kiwa-lab/ai-llm` v0.2 across all 4 SDKs |
| tool provisioning via process boundary | app-internal function tools only | `@kiwa-lab/mcp` v0.1 (JSON-RPC 2.0) |
| stateful multi-turn agent orchestration | text-only Anthropic/OpenAI/Vercel/LangChain loops | `@kiwa-lab/agent` v0.1 (LangGraph + Assistants v2) |

All three land as **additive** — v1.12 test suites keep passing on their v0.1 configuration.

## Concept 1 — image tokens are prompt tokens, but the byte content is not the key

Real Anthropic and OpenAI vision APIs charge image tokens against the prompt-token budget. A 1024×1024 image at `detail: 'high'` costs roughly 1500 prompt tokens on Anthropic and 1105–1445 on OpenAI, depending on tile count. The kiwa mock rounds this to a single knob — `imageTokenCost` — and multiplies by the detail hint (0.5 / 0.8 / 1.0) so the numbers stay close enough for release-gate assertions to be meaningful.

The reason the mock's response-bank lookup **does not key on image bytes** is not simplification for its own sake. It is a deliberate consequence of how real LLM behaviour differs across image content:

- The **same image** submitted twice against a `temperature > 0` model returns **different text** each time.
- The **image bytes** never appear in the reply; only their interpretation does.
- Tests assert on the **text output** and the **prompt-token accounting**, not on the pixels.

Keying the response bank on the last text-carrying user block preserves the v1.12 shape (deterministic replies against a canned bank) while letting the mock still count image tokens correctly. If a test needs to prove "OCR was requested against a receipt", the assertion is on the reply text ("Total: $12.30") and the `usage.input_tokens` count, never on the image bytes themselves.

```ts
// v1.15 style — deterministic reply against canned bank + prompt-token assertion
expect(res.content[0].text).toContain('Total: $12.30');
expect(res.usage.input_tokens).toBeGreaterThan(1500); // proves the image was counted
expect(res._kiwa.costUsd).toBeGreaterThan(0);         // proves cost tracking picked it up
```

## Concept 2 — audio has a duration axis but no wall-clock in the mock

Whisper transcription costs $0.006 per minute in real OpenAI. The kiwa mock represents this as `audioTokenCost` (default 500 base tokens) that scales linearly per 30 s of duration. Tests specify the duration in the source metadata; the mock never fetches or plays audio.

Two design consequences follow.

- **URLs are not resolved.** The mock keys transcription lookups via `toTranscriptionKey({ url })`. A `404` on the URL cannot break a test because no HTTP request happens.
- **`defaultTranscription` is a safety net, not a bug.** Production code always deals with unfamiliar audio; the mock refuses to throw when a source is unknown. Assertions that a specific source was hit are text-equality assertions against the known transcription.

The pattern to prove "audio was processed and yielded segments" is text + segment count:

```ts
expect(trans.text).toBe('hello kiwa');
expect(trans.segments).toHaveLength(2);
```

The pattern to prove "audio was billed correctly" is duration-scaled cost against the mock's known cost table.

## Concept 3 — MCP handshake order is a first-class invariant

The Model Context Protocol wraps tool exchange in JSON-RPC 2.0 with a hard-coded op order:

1. `initialize` (client → server, sync)
2. `notifications/initialized` (client → server, notification)
3. `tools/list` (client → server, sync)
4. `tools/call` (client → server, sync)

Real MCP clients enforce this order because a `tools/list` before `initialize` gives the server no chance to negotiate protocol version + capabilities. The kiwa mock enforces the same order **explicitly** — a `tools/list` call before `initialize` returns `-32002 NotInitialized`. A mock that skipped this check would let bugs slip through.

The `-32002` code, along with the other three MCP-specific extensions (`-32000` ToolExecutionError, `-32001` ToolSchemaError, `-32003` ToolNotFound), is part of the mock's contract. Tests that assert on these codes will keep passing when the `InMemoryTransport` is swapped for a stdio child process transport, because the wire format is identical.

The response-bank pattern from v1.12 does not apply directly to MCP because MCP tool calls are function invocations, not chat replies. Instead, `@kiwa-lab/mcp` uses a **tool registry**: each tool has a name, description, JSONSchema input schema, and handler. The handler is a plain function that runs synchronously in the mock and returns a `ToolResult` (`content: [{ type: 'text', text: '...' }]` in the common case).

## Concept 4 — agent state machines are graphs, not chat logs

`@kiwa-lab/agent` covers two orchestration styles under one API:

- **LangGraph-style `StateGraph`** — declarative dataflow. Nodes are pure state → patch functions; edges are unconditional (v0.1). The graph is validated on `.compile()` with 6 fail-fast checks (see [Tutorial 18](../tutorials/18-agent-orchestration) for the list).
- **OpenAI Assistants v2** — stateful multi-turn. Runs move through 5 statuses (`queued` / `in_progress` / `requires_action` / `completed` / `failed`); tool outputs are submitted asynchronously via `submitToolOutputs`.

Both styles share a common failure mode: **runaway loops**. A conditional edge that never terminates, or an assistant handler that emits `tool_calls` on every turn without ever emitting `message`, blows the token budget in production. The mock guards this with a `maxSteps` cap (default 100 for LangGraph, 50 for Assistants v2 polling); tests that exceed the cap fail with a clear error, not a hang.

The mock's Assistants v2 client resolves handlers synchronously so the `in_progress` step is folded into the initial `poll` call. Real Assistants v2 exposes `in_progress` when polling during handler execution; tests do not need to sleep-poll the mock to observe it. This is the same trade-off as the multimodal mock: the mock is deterministic on purpose, and the release gate measures how far real diverges.

## Concept 5 — MCP + agent + multimodal roll into the 11-axis gate, but only when combined with `@kiwa-lab/ai-*`

The `evaluateReleaseGate` 11-axis branch triggers on the provider prefix `@kiwa-lab/ai-*`. `@kiwa-lab/mcp` and `@kiwa-lab/agent` on their own are not AI-LLM providers — they are protocol + orchestration wrappers. A dogfood app that uses `@kiwa-lab/mcp` to expose tools **plus** `@kiwa-lab/ai-llm` to drive a Claude client rolls into the 11-axis gate because the provider string is `@kiwa-lab/ai-llm/<subpath>`; the MCP overhead shows up in latency + token counts, not as separate axes.

Concretely, the dogfood app `examples/dogfood-mcp-tool-agent` reports its provider as `@kiwa-lab/ai-llm/mcp-tool-agent`. This means:

- `cost.perRequestUsd` counts the full Anthropic + MCP roundtrip on the real side, and the mock cost of both on the mock side.
- `latency.p95Ms` counts the full JSON-RPC + Claude latency.
- `token.totalTokens` counts the full prompt + completion tokens including any tool-schema material Claude sees.
- `accuracy.score` compares the final Claude reply (post-tool-loop) against the real system.

No new axes are needed. The MCP handshake + tool-call shape is a **fidelity ratio contribution** — a mock that skipped the handshake would fail the 7-axis fidelity check, which is the existing v1.11 axis.

## Concept 6 — agent-state gotchas that only appear in multi-turn tests

Two failure modes are specific to agent orchestration and only show up in tests that walk 3+ turns.

- **The response bank turn-0 lookup collision.** Anthropic Claude's tool-use loop delivers follow-up turns as user messages whose content is a list of `tool_result` blocks. The mock's response-bank lookup keys on the last text-carrying user block, which for turn 2+ is still the original prompt. If tests reuse a single mock instance across turns without preparing distinct bank entries for each turn, the mock returns the turn-0 reply on every turn — an infinite tool-use loop. The pattern that avoids this is to construct a **fresh mock instance per iteration** with a distinct response bank keyed by the ordered tool state (turn 0 = tool A, turn 1 = tool B, turn 2 = finalisation). `examples/dogfood-mcp-tool-agent/src/adapters/mock.ts` implements this pattern; copy it for any multi-turn tool-loop test.
- **The Assistants v2 `poll` after `cancel`.** Cancelling a queued run flips it to `failed` with `lastError.code = 'cancelled'`. Polling that run afterwards returns the same terminal step, not an error. Tests that expect `poll` to throw on a cancelled run will fail against the mock — this matches real Assistants v2 behaviour.

## Where the code lives

- **Multimodal mocks** — [`packages/ai-llm/src/multimodal.ts`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/multimodal.ts)
- **Whisper mock** — [`packages/ai-llm/src/openai.ts`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/openai.ts) (`audio.transcriptions.create`)
- **MCP server** — [`packages/mcp/src/server.ts`](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/server.ts)
- **MCP client + transport** — [`packages/mcp/src/client.ts`](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/client.ts)
- **MCP fixture tools** — [`packages/mcp/src/fixture.ts`](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts) (`registerAllFixtureTools`)
- **LangGraph state machine** — [`packages/agent/src/langgraph.ts`](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/langgraph.ts) + [`packages/agent/src/state-machine.ts`](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/state-machine.ts)
- **Assistants v2 client** — [`packages/agent/src/openai-assistants.ts`](https://github.com/cardene777/kiwa/blob/main/packages/agent/src/openai-assistants.ts)
- **Dogfood app — multimodal** — [`examples/dogfood-multimodal-chat/`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-multimodal-chat)
- **Dogfood app — MCP + agent** — [`examples/dogfood-mcp-tool-agent/`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-mcp-tool-agent)

## When to reach for each shape

- **Text-only chat** — v1.12 patterns still apply. Do not adopt multimodal / MCP / agent unless the app actually needs them.
- **Vision or OCR** — v1.15 multimodal on the appropriate SDK. Anthropic vision for classification / description, OpenAI vision with `detail: 'high'` for OCR / small-text answers.
- **Audio input** — v1.15 Whisper on `@kiwa-lab/ai-llm` OpenAI mock. Keep audio-duration assertions in the test to prove the cost path.
- **Tools behind a process boundary** — v1.15 MCP. Direct app-internal tools should still use native Claude / OpenAI tool-use to avoid a JSON-RPC hop that provides no benefit.
- **Multi-turn stateful conversation** — v1.15 agent. Pick LangGraph for declarative dataflow, Assistants v2 for OpenAI-shaped stateful multi-turn.

## What is deliberately not in scope for v1.15

- **Image generation** (Anthropic image output / DALL·E / Imagen) — the multimodal mock covers input only. Output-side image generation is a separate mock surface and lands in a future release.
- **Text-to-speech** — mirror of image generation. Whisper covers speech-to-text; TTS is out of scope for v1.15.
- **MCP resources / prompts / sampling / logging ops** — v0.1 covers the tool-use half. The remaining ops are additive and land in `@kiwa-lab/mcp` v0.2.
- **LangGraph conditional edges / channels reducers / interrupts / checkpointers** — v0.1 covers unconditional dataflow. Advanced graph shapes are additive and land in `@kiwa-lab/agent` v0.2.
- **Live streaming for Assistants v2 runs (SSE)** — v0.1 exposes synchronous `poll`. SSE streaming is on the v0.2 roadmap.

## Reading list

- [AI-LLM testing (v1.12 SSOT)](./ai-llm-testing) — non-determinism + 11-axis gate, unchanged
- [Realtime testing (v1.13 SSOT)](./realtime-testing) — time-axis mock; the mock-time-line pattern applies to Assistants v2 polling too
- [Tutorial 16 — Multimodal chat](../tutorials/16-multimodal-chat)
- [Tutorial 17 — MCP tool-use agent](../tutorials/17-mcp-tool-agent)
- [Tutorial 18 — Agent orchestration](../tutorials/18-agent-orchestration)
- [`@kiwa-lab/ai-llm` README](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/README.md)
- [`@kiwa-lab/mcp` README](https://github.com/cardene777/kiwa/blob/main/packages/mcp/README.md)
- [`@kiwa-lab/agent` README](https://github.com/cardene777/kiwa/blob/main/packages/agent/README.md)

## Takeaways

- Multimodal inputs cost prompt tokens, not response tokens. The mock counts them; the response bank keys on text so replies stay deterministic.
- Whisper URLs are never resolved by the mock. Duration is metadata; assertions are on transcribed text + segment count.
- MCP handshake order is a first-class invariant. The mock enforces it — a `tools/list` before `initialize` returns `-32002`.
- Agent orchestration adds two new failure modes: **response-bank turn-0 collision** on Anthropic tool-use loops (mitigated by fresh mock per iteration) and **poll-after-cancel** returning the terminal step instead of throwing.
- v1.15 mocks roll into the existing 11-axis gate through the `@kiwa-lab/ai-*` provider prefix. No new axes; MCP + agent overhead is fidelity + latency + token spend that the existing axes already measure.
