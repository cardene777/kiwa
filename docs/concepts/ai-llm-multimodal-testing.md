Each of these opens new failure modes that a purely text-only 11-axis release gate cannot catch. This document is the SSOT for the design decisions kiwa took to keep those failure modes testable.

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

The Model Context Protocol wraps tool exchange in JSON-RPC 2.0 with a hard-coded op order:

1. `initialize` (client → server, sync)
2. `notifications/initialized` (client → server, notification)
3. `tools/list` (client → server, sync)
4. `tools/call` (client → server, sync)

## Concept 4 — agent state machines are graphs, not chat logs

- **OpenAI Assistants v2** — stateful multi-turn. Runs move through 5 statuses (`queued` / `in_progress` / `requires_action` / `completed` / `failed`); tool outputs are submitted asynchronously via `submitToolOutputs`.

Both styles share a common failure mode: **runaway loops**. A conditional edge that never terminates, or an assistant handler that emits `tool_calls` on every turn without ever emitting `message`, blows the token budget in production. The mock guards this with a `maxSteps` cap (default 100 for LangGraph, 50 for Assistants v2 polling); tests that exceed the cap fail with a clear error, not a hang.

The mock's Assistants v2 client resolves handlers synchronously so the `in_progress` step is folded into the initial `poll` call. Real Assistants v2 exposes `in_progress` when polling during handler execution; tests do not need to sleep-poll the mock to observe it. This is the same trade-off as the multimodal mock: the mock is deterministic on purpose, and the release gate measures how far real diverges.

## Concept 6 — agent-state gotchas that only appear in multi-turn tests

Two failure modes are specific to agent orchestration and only show up in tests that walk 3+ turns.

- **The response bank turn-0 lookup collision.** Anthropic Claude's tool-use loop delivers follow-up turns as user messages whose content is a list of `tool_result` blocks. The mock's response-bank lookup keys on the last text-carrying user block, which for turn 2+ is still the original prompt. If tests reuse a single mock instance across turns without preparing distinct bank entries for each turn, the mock returns the turn-0 reply on every turn — an infinite tool-use loop. The pattern that avoids this is to construct a **fresh mock instance per iteration** with a distinct response bank keyed by the ordered tool state (turn 0 = tool A, turn 1 = tool B, turn 2 = finalisation). `examples/dogfood-mcp-tool-agent/src/adapters/mock.ts` implements this pattern; copy it for any multi-turn tool-loop test.
- **The Assistants v2 `poll` after `cancel`.** Cancelling a queued run flips it to `failed` with `lastError.code = 'cancelled'`. Polling that run afterwards returns the same terminal step, not an error. Tests that expect `poll` to throw on a cancelled run will fail against the mock — this matches real Assistants v2 behaviour.

## Where the code lives

## When to reach for each shape

## Takeaways