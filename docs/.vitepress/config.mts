import { defineConfig } from 'vitepress';

/**
 * VitePress configuration for the kiwa documentation site.
 *
 * v1.11-6 (Issue #686) introduces the site skeleton. VitePress itself is an
 * opt-in devDependency — install with `pnpm add -D vitepress` at the repo
 * root when you want to build locally. The `/docs-publish` skill wires up
 * the full generation → build → gh-pages push chain.
 *
 * Documentation lives under `docs/`:
 * - `docs/index.md` — landing page
 * - `docs/tutorials/*.md` — hands-on tutorials (v1.11-5)
 * - `docs/migrations/*.md` — per-milestone migration guides (v1.11-5)
 * - `docs/quality/release-gate.md` — release-gate SSOT (v1.11-1)
 * - `docs/quality-reports/*` — provider quality reports
 * - `docs/api/{typescript,rust,solidity}/**` — generated API references
 *
 * The theme is the default VitePress theme; brand colour follows the kiwa
 * "gentle green" (#5ba75b) used across the announcement banners.
 */

export default defineConfig({
  title: 'kiwa',
  description:
    'OSS test framework for dApps + web apps + full-stack frameworks — Solidity contract / e2e / a11y / visual / api / ui / data / cli / auth / queue / cache / Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Edge / Rust / Go / Python.',
  lang: 'en-US',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/kiwa/',
  head: [['link', { rel: 'icon', href: '/kiwa/favicon.svg' }]],

  themeConfig: {
    logo: '/kiwa-logo.svg',
    siteTitle: 'kiwa',
    outline: [2, 3],

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'Concepts', link: '/concepts/ai-llm-testing' },
      { text: 'Migrations', link: '/migrations/' },
      { text: 'Quality', link: '/quality/release-gate' },
      { text: 'API Reference', link: '/api/' },
      {
        text: 'Roadmap',
        link: 'https://github.com/cardene777/kiwa#roadmap',
      },
    ],

    sidebar: {
      '/tutorials/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Overview', link: '/tutorials/' },
            {
              text: '01 — Your first Supabase Auth test',
              link: '/tutorials/01-supabase-auth-first-test',
            },
            { text: '02 — RabbitMQ DLX test recipe', link: '/tutorials/02-rabbitmq-dlx-recipe' },
            { text: '03 — Rust contract test from zero', link: '/tutorials/03-rust-contract-from-zero' },
            { text: '04 — Next.js Server Actions', link: '/tutorials/04-nextjs-server-actions' },
            { text: '05 — Multi-provider auth', link: '/tutorials/05-multi-provider-auth' },
          ],
        },
        {
          text: 'AI-LLM (v1.12)',
          items: [
            { text: '06 — Anthropic chatbot streaming + tool_use', link: '/tutorials/06-anthropic-chatbot-streaming' },
            { text: '07 — OpenAI tool-use agent', link: '/tutorials/07-openai-tool-agent' },
            { text: '08 — Vercel AI SDK + LangChain RAG', link: '/tutorials/08-vercel-ai-rag' },
          ],
        },
        {
          text: 'Realtime (v1.13)',
          items: [
            { text: '09 — Supabase Realtime chat + presence + typing debounce', link: '/tutorials/09-supabase-realtime-chat' },
            { text: '10 — Ably shared cursor + 60 fps throttle + history rewind', link: '/tutorials/10-ably-collab-cursor' },
            { text: '11 — Socket.io notification + reconnect + backpressure', link: '/tutorials/11-socketio-notification' },
          ],
        },
        {
          text: '横軸拡張 (v1.14)',
          items: [
            { text: '12 — Payment webhook mock (Stripe / Paddle / Lemon Squeezy)', link: '/tutorials/12-payment' },
            { text: '13 — Search mock (Meilisearch / Algolia / Typesense)', link: '/tutorials/13-search' },
            { text: '14 — Telemetry mock (OpenTelemetry / Datadog / Sentry)', link: '/tutorials/14-observability' },
            { text: '15 — kiwa-test-go v0.5 Iris + Chi', link: '/tutorials/15-go-iris-chi' },
          ],
        },
        {
          text: 'AI-LLM 深化 (v1.15)',
          items: [
            { text: '16 — Multimodal chat (image + audio + Whisper)', link: '/tutorials/16-multimodal-chat' },
            { text: '17 — MCP tool-use agent (JSON-RPC 2.0 chain)', link: '/tutorials/17-mcp-tool-agent' },
            { text: '18 — Agent orchestration (LangGraph + Assistants v2)', link: '/tutorials/18-agent-orchestration' },
          ],
        },
      ],
      '/concepts/': [
        {
          text: 'Concepts',
          items: [
            { text: 'AI-LLM testing (non-determinism SSOT)', link: '/concepts/ai-llm-testing' },
            { text: 'AI-LLM multimodal testing (image + audio + MCP + agent SSOT)', link: '/concepts/ai-llm-multimodal-testing' },
            { text: 'Realtime testing (time-axis mock SSOT)', link: '/concepts/realtime-testing' },
            { text: 'Payment testing (webhook signature SSOT)', link: '/concepts/payment-testing' },
            { text: 'Search testing (ranking + typo tolerance SSOT)', link: '/concepts/search-testing' },
            { text: 'Telemetry testing (span + metric + log aggregation SSOT)', link: '/concepts/telemetry-testing' },
          ],
        },
      ],
      '/migrations/': [
        {
          text: 'Migration guides',
          items: [
            { text: 'Overview', link: '/migrations/' },
            { text: 'v1.9 → v1.10', link: '/migrations/v1.9-to-v1.10' },
            { text: 'v1.10 → v1.11', link: '/migrations/v1.10-to-v1.11' },
            { text: 'v1.11 → v1.12', link: '/migrations/v1.11-to-v1.12' },
            { text: 'v1.12 → v1.13', link: '/migrations/v1.12-to-v1.13' },
            { text: 'v1.13 → v1.14', link: '/migrations/v1.13-to-v1.14' },
            { text: 'v1.14 → v1.15', link: '/migrations/v1.14-to-v1.15' },
          ],
        },
      ],
      '/quality/': [
        {
          text: 'Quality',
          items: [
            { text: 'Release gate SSOT', link: '/quality/release-gate' },
            { text: 'Quality reports', link: '/quality-reports/' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'TypeScript (typedoc)', link: '/api/typescript/' },
            { text: 'Rust (cargo doc)', link: '/api/rust/kiwa/' },
            { text: 'Solidity (forge doc)', link: '/api/solidity/dogfood-foundry-dapp/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cardene777/kiwa' },
      { icon: 'x', link: 'https://x.com/cardene777' },
    ],

    editLink: {
      pattern: 'https://github.com/cardene777/kiwa/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: `© ${new Date().getFullYear()} cardene`,
    },

    search: {
      // MiniSearch — bundled with VitePress. Free-tier friendly.
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: 'Search kiwa docs' },
        },
      },
    },
  },
});
