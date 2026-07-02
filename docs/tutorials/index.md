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

## AI-LLM tutorials (v1.12)

Tutorials 06 – 08 exercise the new [`@kiwa-test/ai-llm`](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/README.md) harness — one for each of Anthropic Messages API, OpenAI Chat Completions, and Vercel AI SDK + LangChain. See [`docs/concepts/ai-llm-testing.md`](../concepts/ai-llm-testing) for why AI-LLM providers need extra fidelity / cost / accuracy axes.
