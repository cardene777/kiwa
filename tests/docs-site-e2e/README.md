# kiwa docs site E2E tests

Playwright end-to-end tests that verify the VitePress-built kiwa documentation site (`docs/.vitepress/dist/`) renders correctly across the 5 canonical pages, and that the full-text search widget works.

Run manually after `pnpm docs:build`:

```bash
pnpm playwright test tests/docs-site-e2e
```

## Pages under test

### Canonical (v1.11 baseline)

- `/` — landing hero + feature grid
- `/tutorials/` — tutorial index
- `/tutorials/01-supabase-auth-first-test` — first tutorial body
- `/migrations/v1.10-to-v1.11` — v1.10 → v1.11 migration guide
- `/quality/release-gate` — release-gate SSOT

### v1.12 additions (Issue #700)

- `/tutorials/06-anthropic-chatbot-streaming` — Anthropic streaming + tool_use
- `/tutorials/07-openai-tool-agent` — OpenAI function calling + parallel tool calls
- `/tutorials/08-vercel-ai-rag` — Vercel AI SDK + LangChain RAG
- `/concepts/ai-llm-testing` — non-determinism SSOT
- `/migrations/v1.11-to-v1.12` — v1.11 → v1.12 migration guide

## Assertions

Each page test asserts:

1. HTTP 200 (via `page.goto`)
2. Presence of the kiwa nav bar (`nav.VPNav`)
3. Meaningful main content (`main` element with non-empty innerText)
4. No 404 links (`main a[href^="/kiwa"]` all return 200 on `page.request.get`)

The search widget test opens the search modal (`kbd` shortcut `⌘K` / `Ctrl+K`), types `Supabase`, and asserts at least one hit is returned.
