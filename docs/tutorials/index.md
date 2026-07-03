---
title: kiwa tutorials
---

# kiwa tutorials

Step-by-step tutorials that take a fresh reader from "no kiwa installed" to a runnable test in under 10 minutes. Each tutorial is self-contained — the code samples paste directly into an empty repo and pass.

## Tutorial index

| # | Tutorial | Runtime | Time |
|---|---|---|---|
| 1 | [Your first Supabase Auth test in 5 min](./01-supabase-auth-first-test) | Node.js / vitest | 5 min |
| 2 | [RabbitMQ DLX test recipe](./02-rabbitmq-dlx-recipe) | Node.js / vitest | 8 min |
| 3 | [Rust contract test from zero](./03-rust-contract-from-zero) | Rust / cargo | 10 min |
| 4 | [Testing Next.js Server Actions with @kiwa-test/nextjs](./04-nextjs-server-actions) | Node.js / vitest | 6 min |
| 5 | [Multi-provider auth (NextAuth + Clerk + Auth0)](./05-multi-provider-auth) | Node.js / vitest | 12 min |
| 6 | [Anthropic chatbot streaming + tool_use](./06-anthropic-chatbot-streaming) | Node.js / vitest | 10 min |
| 7 | [OpenAI tool-use agent (function calling + parallel)](./07-openai-tool-agent) | Node.js / vitest | 10 min |
| 8 | [Vercel AI SDK + LangChain RAG pipeline](./08-vercel-ai-rag) | Node.js / vitest | 12 min |
| 9 | [Supabase Realtime chat + presence + typing debounce](./09-supabase-realtime-chat) | Node.js / vitest | 10 min |
| 10 | [Ably shared cursor + 60 fps throttle + history rewind](./10-ably-collab-cursor) | Node.js / vitest | 10 min |
| 11 | [Socket.io notification + reconnect + backpressure](./11-socketio-notification) | Node.js / vitest | 12 min |
| 12 | [Payment webhook mock (Stripe / Paddle / Lemon Squeezy)](./12-payment) | Node.js / vitest | 10 min |
| 13 | [Search mock (Meilisearch / Algolia / Typesense)](./13-search) | Node.js / vitest | 10 min |
| 14 | [Telemetry mock (OpenTelemetry / Datadog / Sentry)](./14-observability) | Node.js / vitest | 10 min |
| 15 | [kiwa-test-go v0.5 Iris + Chi](./15-go-iris-chi) | Go / go test | 10 min |
| 16 | [Multimodal chat (image + audio + Whisper)](./16-multimodal-chat) | Node.js / vitest | 12 min |
| 17 | [MCP tool-use agent (JSON-RPC 2.0 chain)](./17-mcp-tool-agent) | Node.js / vitest | 12 min |
| 18 | [Agent orchestration (LangGraph + Assistants v2)](./18-agent-orchestration) | Node.js / vitest | 12 min |
| 19 | [Storybook 8 design system](./19-storybook-design-system) | Node.js / vitest | 12 min |
| 20 | [Playwright CT for 5 form patterns](./20-playwright-ct) | Node.js / vitest | 12 min |
| 21 | [Visual regression baseline / diff / accept](./21-visual-regression) | Node.js / vitest | 12 min |

## AI-LLM tutorials (v1.12)

Tutorials 06 – 08 exercise the [`@kiwa-test/ai-llm`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/README.md) harness — one for each of Anthropic Messages API, OpenAI Chat Completions, and Vercel AI SDK + LangChain. See [`docs/concepts/ai-llm-testing.md`](../concepts/ai-llm-testing) for why AI-LLM providers need extra fidelity / cost / accuracy axes.

## Realtime tutorials (v1.13)

Tutorials 09 – 11 exercise the new [`@kiwa-test/realtime`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/README.md) harness — one for each of Supabase Realtime, Ably, and Socket.io / SSE (Pusher shares the same engine but is not called out as a dedicated tutorial in v1.13). See [`docs/concepts/realtime-testing.md`](../concepts/realtime-testing) for the 5 time-axis semantics (order / timing / drop / reconnect / backpressure) that realtime tests need beyond the request/response mocks of v1.11 + v1.12.

## Component test tutorials (v1.16)

Tutorials 19 – 21 exercise the new [`@kiwa-test/component`](https://github.com/cardene777/kiwa/blob/main/packages/component/README.md) harness — one for each of Storybook 8 (story registration + args + play + a11y), Playwright Component Testing (mount + interact + assert), and Chromatic (baseline / diff / accept / reject). See [`docs/concepts/component-testing.md`](../concepts/component-testing) for the 3 surfaces + 6 semantic axes that component tests need beyond the request/response mocks of v1.11 + v1.12 + v1.13.
