# kiwa tutorials

Step-by-step tutorials that take a fresh reader from "no kiwa installed" to a runnable test in under 10 minutes. Each tutorial is self-contained — the code samples paste directly into an empty repo and pass.

## Tutorial index

| # | Tutorial | Runtime | Time |
|---|---|---|---|
| 1 | [Your first Supabase Auth test in 5 min](./01-supabase-auth-first-test.md) | Node.js / vitest | 5 min |
| 2 | [RabbitMQ DLX test recipe](./02-rabbitmq-dlx-recipe.md) | Node.js / vitest | 8 min |
| 3 | [Rust contract test from zero](./03-rust-contract-from-zero.md) | Rust / cargo | 10 min |
| 4 | [Testing Next.js Server Actions with @kiwa-test/nextjs](./04-nextjs-server-actions.md) | Node.js / vitest | 6 min |
| 5 | [Multi-provider auth (NextAuth + Clerk + Auth0)](./05-multi-provider-auth.md) | Node.js / vitest | 12 min |
| 16 | [Multimodal chat — image + audio + Whisper](./16-multimodal-chat.md) | Node.js / vitest | 10 min |
| 17 | [MCP tool-use agent — JSON-RPC 2.0 chain](./17-mcp-tool-agent.md) | Node.js / vitest | 12 min |
| 18 | [Agent orchestration — LangGraph + Assistants v2](./18-agent-orchestration.md) | Node.js / vitest | 12 min |

## Style

- Each tutorial opens with **"What you'll build"** so the reader can decide in 30 s if they want to continue
- Every code block is complete — no `...` placeholders, no "install dependencies as needed"
- After every code block, an **Explanation** section says why the code looks this way (SSOT: `docs/writing-style.md`)
- End with a **Troubleshoot** section covering the 3–5 real failure modes we've seen

## Contributing

New tutorials should follow the same 5-section template:

1. What you'll build
2. Prerequisites
3. Step-by-step build
4. Explanation
5. Troubleshoot
