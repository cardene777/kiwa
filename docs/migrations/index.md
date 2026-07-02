---
title: kiwa migration guides
---

# kiwa migration guides

Per-milestone migration guides that walk you through the code changes needed to consume a new kiwa release.

## Milestone index

| Milestone | Guide | Breaking? | Focus |
|---|---|---|---|
| [v1.9 → v1.10](./v1.9-to-v1.10) | ✅ | Additive-only | Supabase Auth + RabbitMQ + Rust contract layer |
| [v1.10 → v1.11](./v1.10-to-v1.11) | ✅ | Additive-only | Quality metrics harness + dogfood app pattern + GitHub Pages |
| [v1.11 → v1.12](./v1.11-to-v1.12) | ⚠️ AI-LLM only | 7 → 11 axis release gate + `@kiwa-test/ai-llm` v0.1 (Anthropic + OpenAI + Vercel AI SDK + LangChain mocks) + 3 dogfood apps |

See [`docs/migrations/README.md`](./README) for the style guide and legacy migration content.
